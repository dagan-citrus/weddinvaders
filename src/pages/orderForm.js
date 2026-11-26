// Pure logic of the order form: suggestion, validation and the order email.
// Validation returns error *codes*; the messages live in content/en/order.js.
import { PLACEHOLDER_CONTACT_EMAIL, SITE_CONFIG } from '../siteConfig';
import { SLUG_MAX_LENGTH } from '../events';
import { fillTemplate } from '../content/format.js';
import { PACKAGE_QUERY_PARAM } from './orderLink';

export const NAME_MAX_LENGTH = 40;
export const NOTES_MAX_LENGTH = 600;
export const EMAIL_MAX_LENGTH = 254;
/** Longer `mailto:` URLs are cut off or refused by some mail clients. */
export const MAILTO_MAX_LENGTH = 2000;
/** Package value for "Not sure yet"; valid, but not a pricing tier. */
export const UNSURE_PACKAGE_ID = 'unsure';

/** Validated fields, in the order they appear in the form. */
export const FIELD_ORDER = Object.freeze([
  'brideName', 'groomName', 'weddingDate', 'slug', 'package', 'email', 'notes',
]);

export const ORDER_ERROR = Object.freeze({
  REQUIRED: 'required',
  INVALID:  'invalid',
  PAST:     'past',
  RESERVED: 'reserved',
  TAKEN:    'taken',
  TOO_LONG: 'tooLong',
});

/**
 * @typedef {Object} Order
 * @property {string}   brideName
 * @property {string}   groomName
 * @property {string}   weddingDate  `YYYY-MM-DD`.
 * @property {string}   slug         Requested event address.
 * @property {string}   package      A pricing tier id, or `UNSURE_PACKAGE_ID`.
 * @property {string[]} addons       Pricing add-on ids.
 * @property {string}   email        Where we reply.
 * @property {string}   notes
 */

/** @type {Readonly<Order>} */
export const EMPTY_ORDER = Object.freeze({
  brideName: '', groomName: '', weddingDate: '', slug: '',
  package: '', addons: Object.freeze([]), email: '', notes: '',
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// Accents split off by NFD normalisation (U+0300–U+036F).
const COMBINING_MARKS = /[̀-ͯ]/g;
// A letter that is not an ASCII letter: slugs cannot carry it.
const NON_ASCII_LETTER = /(?![A-Za-z])\p{L}/u;
const NON_ALPHANUMERIC_RUN = /[^A-Za-z0-9]+/;
const SLUG_JOINER = 'And';
const LINE_BREAK = /\r?\n/g;
const MAILTO_LINE_BREAK = '\r\n'; // RFC 6068

const trimmed = (value) => String(value ?? '').trim();

/**
 * Whether orders can be sent: only once a real contact address is configured.
 *
 * @param {unknown} [contactEmail]
 * @returns {boolean}
 */
export function isOrderingOpen(contactEmail = SITE_CONFIG.contactEmail) {
  return typeof contactEmail === 'string'
    && EMAIL_PATTERN.test(contactEmail)
    && contactEmail !== PLACEHOLDER_CONTACT_EMAIL;
}

/**
 * The package preselected by the page's query string.
 *
 * @param {string} search        e.g. `'?package=custom'`.
 * @param {ReadonlyArray<string>} packageIds  Known tier ids (matched case-sensitively).
 * @returns {string} The id, or `''` when missing or unknown.
 */
export function getInitialPackageId(search, packageIds) {
  const requested = new URLSearchParams(search).get(PACKAGE_QUERY_PARAM);
  return packageIds.includes(requested) ? requested : '';
}

/**
 * A date as `YYYY-MM-DD` in local time.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function toIsoDate(date = new Date()) {
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** One name as a slug part (`'mary jane'` → `'MaryJane'`), or `''` when it has non-English letters. */
function toSlugPart(name) {
  const plain = String(name ?? '').normalize('NFD').replace(COMBINING_MARKS, '');
  if (NON_ASCII_LETTER.test(plain)) return '';
  return plain
    .split(NON_ALPHANUMERIC_RUN)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Suggests an event address from two names, e.g. `('Dan', 'Shelly')` → `'DanAndShelly'`.
 *
 * @param {unknown} firstName
 * @param {unknown} secondName
 * @returns {string} The suggestion, or `''` when either name gives no usable part.
 */
export function suggestSlug(firstName, secondName) {
  const first = toSlugPart(firstName);
  const second = toSlugPart(secondName);
  if (!first || !second) return '';
  return `${first}${SLUG_JOINER}${second}`.slice(0, SLUG_MAX_LENGTH);
}

function isRealIsoDate(value) {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validateName(name) {
  if (name === '') return ORDER_ERROR.REQUIRED;
  if (name.length > NAME_MAX_LENGTH) return ORDER_ERROR.TOO_LONG;
  return null;
}

/** Per-field checks; each returns an `ORDER_ERROR` code or `null`. */
const FIELD_VALIDATORS = {
  brideName: validateName,
  groomName: validateName,
  weddingDate: (date, { today }) => {
    if (date === '') return ORDER_ERROR.REQUIRED;
    if (!isRealIsoDate(date)) return ORDER_ERROR.INVALID;
    // ISO dates compare correctly as strings.
    return date < today ? ORDER_ERROR.PAST : null;
  },
  slug: (slug, { getSlugStatus }) => {
    if (slug === '') return ORDER_ERROR.REQUIRED;
    const status = getSlugStatus(slug);
    return [ORDER_ERROR.INVALID, ORDER_ERROR.RESERVED, ORDER_ERROR.TAKEN].includes(status)
      ? status
      : null;
  },
  package: (packageId, { packageIds }) => (
    [...packageIds, UNSURE_PACKAGE_ID].includes(packageId) ? null : ORDER_ERROR.REQUIRED
  ),
  email: (email) => {
    if (email === '') return ORDER_ERROR.REQUIRED;
    return !EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX_LENGTH
      ? ORDER_ERROR.INVALID
      : null;
  },
  notes: (notes) => (notes.length > NOTES_MAX_LENGTH ? ORDER_ERROR.TOO_LONG : null),
};

/**
 * Validates an order. Values are trimmed first.
 *
 * @param {Order} order
 * @param {Object} options
 * @param {string} options.today  `YYYY-MM-DD`; earlier wedding dates are rejected.
 * @param {(slug: string) => string} options.getSlugStatus  A registry's `getSlugStatus`.
 * @param {ReadonlyArray<string>} options.packageIds  Known tier ids.
 * @returns {Record<string, string>} Failing fields only, in `FIELD_ORDER`, each with its code.
 */
export function validateOrder(order, options) {
  const errors = {};
  FIELD_ORDER.forEach((field) => {
    const code = FIELD_VALIDATORS[field](trimmed(order[field]), options);
    if (code) errors[field] = code;
  });
  return errors;
}

/**
 * @typedef {Object} OrderMessageContext
 * @property {Record<string, string>} template  `order.message` from the content.
 * @property {string}   siteName
 * @property {string}   eventUrl     Absolute URL of the requested address.
 * @property {string}   packageName  Display name of the chosen package.
 * @property {string[]} addonNames   Display names of the chosen add-ons.
 * @property {boolean}  [omitNotes]  Replace the notes with the "too long" marker.
 */

/**
 * The order as an email subject and plain-text body (lines joined with `\n`).
 * What the customer typed is only ever a template *value*, never a template.
 *
 * @param {Order} order
 * @param {OrderMessageContext} context
 * @returns {{ subject: string, body: string }}
 */
export function buildOrderMessage(order, context) {
  const { template, siteName, eventUrl, packageName, addonNames, omitNotes = false } = context;
  const line = (text, value) => fillTemplate(text, { value });
  const bride = trimmed(order.brideName);
  const groom = trimmed(order.groomName);
  const notes = trimmed(order.notes).replace(LINE_BREAK, '\n');

  let notesText = notes === '' ? template.none : notes;
  if (omitNotes) notesText = template.notesOmitted;

  const subject = fillTemplate(template.subject, {
    site: siteName, groom, bride, slug: trimmed(order.slug),
  });
  const body = [
    fillTemplate(template.intro, { site: siteName }),
    '',
    line(template.bride, bride),
    line(template.groom, groom),
    line(template.date, trimmed(order.weddingDate)),
    line(template.address, eventUrl),
    line(template.package, packageName),
    line(template.addons, addonNames.length > 0 ? addonNames.join(', ') : template.none),
    line(template.email, trimmed(order.email)),
    '',
    template.notesHeading,
    notesText,
  ].join('\n');

  return { subject, body };
}

/**
 * A `mailto:` URL per RFC 6068: percent-encoded, CRLF line breaks, no `+` for spaces.
 *
 * @param {{ to: string, subject: string, body: string }} mail
 * @returns {string}
 */
export function buildMailtoUrl({ to, subject, body }) {
  const encode = (text) => encodeURIComponent(text.replace(LINE_BREAK, MAILTO_LINE_BREAK));
  const recipient = encodeURIComponent(to).replace(/%40/g, '@');
  return `mailto:${recipient}?subject=${encode(subject)}&body=${encode(body)}`;
}

/**
 * The order email, ready to open. When the URL would exceed `MAILTO_MAX_LENGTH`
 * and there are notes, the URL carries a marker instead of the notes; the
 * returned `subject` and `body` are always the full message.
 *
 * @param {Order} order
 * @param {OrderMessageContext} context
 * @param {string} to  Recipient address.
 * @returns {{ subject: string, body: string, mailtoUrl: string, notesOmitted: boolean }}
 */
export function composeOrder(order, context, to) {
  const { subject, body } = buildOrderMessage(order, context);
  const fullUrl = buildMailtoUrl({ to, subject, body });
  const notesOmitted = fullUrl.length > MAILTO_MAX_LENGTH && trimmed(order.notes) !== '';
  const mailtoUrl = notesOmitted
    ? buildMailtoUrl({ to, ...buildOrderMessage(order, { ...context, omitNotes: true }) })
    : fullUrl;
  return { subject, body, mailtoUrl, notesOmitted };
}
