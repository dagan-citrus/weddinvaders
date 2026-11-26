import { describe, it, expect } from 'vitest';
import {
  EMPTY_ORDER, FIELD_ORDER, MAILTO_MAX_LENGTH, NAME_MAX_LENGTH, NOTES_MAX_LENGTH, ORDER_ERROR,
  UNSURE_PACKAGE_ID,
  buildMailtoUrl, buildOrderMessage, composeOrder, getInitialPackageId, isOrderingOpen,
  suggestSlug, toIsoDate, validateOrder,
} from './orderForm';
import { order } from '../content';
import { eventRegistry, isValidSlug, SLUG_MAX_LENGTH } from '../events';
import { PLACEHOLDER_CONTACT_EMAIL, SITE_CONFIG } from '../siteConfig';
import {
  HEBREW_NOTES, ORDER_ADDON_NAMES, ORDER_BODY, ORDER_BODY_LINES, ORDER_EVENT_URL, ORDER_MAILTO_URL,
  ORDER_PACKAGE_NAME, ORDER_SITE_NAME, ORDER_SUBJECT, ORDER_TO, makeOrder,
} from '../test/orderFixtures';

// The order form's pure logic (T9): the address suggestion, validation codes,
// the exact email an order becomes, and the switch that keeps ordering closed
// while the contact address is still the placeholder.

const PACKAGE_IDS = ['basic', 'custom', 'premium'];
const TODAY = '2026-01-01';
const OPTS = { today: TODAY, getSlugStatus: eventRegistry.getSlugStatus, packageIds: PACKAGE_IDS };
const CTX = {
  template: order.message,
  siteName: ORDER_SITE_NAME,
  eventUrl: ORDER_EVENT_URL,
  packageName: ORDER_PACKAGE_NAME,
  addonNames: ORDER_ADDON_NAMES,
};

const REQUIRED_FIELDS = ['brideName', 'groomName', 'weddingDate', 'slug', 'package', 'email'];
const HEBREW_LETTER = 'א';

/**
 * The whole email link for the fixture order, as one literal (557 characters).
 * Derived independently from the rules: `encodeURIComponent` on subject and
 * body, CRLF line breaks, a literal `@` in the recipient.
 */
const EXACT_MAILTO_URL = "mailto:orders@weddinvaders.test?subject=Weddin'Vaders%20order%3A%20Dan%20%26%20Shelly%20(DanAndShelly)&body=New%20order%20from%20the%20Weddin'Vaders%20order%20form%0D%0A%0D%0ABride%3A%20Shelly%0D%0AGroom%3A%20Dan%0D%0AWedding%20date%3A%202027-06-12%0D%0ARequested%20address%3A%20https%3A%2F%2Fweddinvaders.barvazone.com%2FDanAndShelly%0D%0APackage%3A%20Custom%0D%0AAdd-ons%3A%20Rush%20delivery%2C%20Printable%20QR%20code%0D%0AReply%20to%3A%20dan%40example.org%0D%0A%0D%0ANotes%3A%0D%0AWe%20met%20at%20a%20taco%20truck.%0D%0AMake%20level%201%20about%20tacos!";
const EXACT_MAILTO_URL_LENGTH = 557;
const EXACT_ADDRESS_LINE = 'Requested address: https://weddinvaders.barvazone.com/DanAndShelly';

const validate = (overrides) => validateOrder(makeOrder(overrides), OPTS);

/** The `subject` and `body` a mail client would read out of a mailto URL. */
function parseMailto(url) {
  const query = url.slice(url.indexOf('?') + 1);
  const params = new URLSearchParams(query);
  return { subject: params.get('subject'), body: params.get('body') };
}

describe('order form: opening and preselection', () => {
  it('test_ordering_open: a real contact address opens ordering', () => {
    expect(isOrderingOpen(ORDER_TO)).toBe(true);
  });

  it.each([
    ['the placeholder address', PLACEHOLDER_CONTACT_EMAIL],
    ['an empty string', ''],
    ['text that is not an address', 'nope'],
    ['null', null],
  ])('test_ordering_open: %s keeps ordering closed', (_label, contactEmail) => {
    expect(isOrderingOpen(contactEmail)).toBe(false);
  });

  it('test_ordering_open: the default follows the site config', () => {
    expect(isOrderingOpen()).toBe(SITE_CONFIG.contactEmail !== PLACEHOLDER_CONTACT_EMAIL);
  });

  it('test_initial_package: a known tier id is taken from the query', () => {
    expect(getInitialPackageId('?package=custom', PACKAGE_IDS)).toBe('custom');
    expect(getInitialPackageId('?x=1&package=premium', PACKAGE_IDS)).toBe('premium');
  });

  it.each(['?package=Custom', '?package=gold', '', '?x=1', '?package='])(
    'test_initial_package: %j selects nothing',
    (search) => {
      expect(getInitialPackageId(search, PACKAGE_IDS)).toBe('');
    },
  );

  it('test_iso_date: local date parts, zero-padded', () => {
    expect(toIsoDate(new Date(2027, 5, 2))).toBe('2027-06-02');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(toIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('order form: address suggestion', () => {
  it.each([
    ['Dan', 'Shelly', 'DanAndShelly'],
    ['dan', ' shelly ', 'DanAndShelly'],
    ['Mary Jane', 'O’Brien', 'MaryJaneAndOBrien'],
    ['Zoë', 'José', 'ZoeAndJose'],
    ['Jean-Luc', 'McKay', 'JeanLucAndMcKay'],
  ])('test_suggest_slug: %j + %j gives %s', (first, second, expected) => {
    expect(suggestSlug(first, second)).toBe(expected);
    expect(isValidSlug(expected)).toBe(true);
  });

  it.each([
    ['דן', 'שלי'],
    ['Søren', 'Anna'],
    ['Dan', ''],
    [undefined, 'x'],
    ['Dan', '!!!'],
  ])('test_suggest_slug: %j + %j gives no suggestion', (first, second) => {
    expect(suggestSlug(first, second)).toBe('');
  });

  it('test_suggest_slug_valid: a long suggestion is cut to the slug limit and stays valid', () => {
    const suggestion = suggestSlug('A'.repeat(SLUG_MAX_LENGTH), 'B'.repeat(SLUG_MAX_LENGTH));

    expect(suggestion).toHaveLength(SLUG_MAX_LENGTH);
    expect(isValidSlug(suggestion)).toBe(true);
  });
});

describe('order form: validation', () => {
  it('test_validate_ok', () => {
    expect(validate()).toEqual({});
  });

  it('test_validate_empty: every required field is reported, in field order', () => {
    const errors = validateOrder(EMPTY_ORDER, OPTS);

    expect(errors).toEqual(Object.fromEntries(REQUIRED_FIELDS.map((field) => [field, ORDER_ERROR.REQUIRED])));
    expect(Object.keys(errors)).toEqual(FIELD_ORDER.filter((field) => REQUIRED_FIELDS.includes(field)));
    expect(errors).not.toHaveProperty('notes');
    expect(errors).not.toHaveProperty('addons');
  });

  it('test_validate_empty: whitespace counts as empty', () => {
    expect(validate({ brideName: '   ', email: ' ' })).toEqual({
      brideName: ORDER_ERROR.REQUIRED,
      email: ORDER_ERROR.REQUIRED,
    });
  });

  it.each([
    ['2027-02-30', ORDER_ERROR.INVALID],
    ['12/06/2027', ORDER_ERROR.INVALID],
    ['2025-12-31', ORDER_ERROR.PAST],
  ])('test_validate_date: %s is %s', (weddingDate, code) => {
    expect(validate({ weddingDate })).toEqual({ weddingDate: code });
  });

  it('test_validate_date: today is allowed', () => {
    expect(validate({ weddingDate: TODAY })).toEqual({});
  });

  it.each([
    ['Dan & Shelly', ORDER_ERROR.INVALID],
    ['pricing', ORDER_ERROR.RESERVED],
    ['demowedding', ORDER_ERROR.TAKEN],
  ])('test_validate_slug: %j is %s', (slug, code) => {
    expect(validate({ slug })).toEqual({ slug: code });
  });

  it('test_validate_slug: surrounding spaces are ignored', () => {
    expect(validate({ slug: ' DanAndShelly ' })).toEqual({});
  });

  it('test_validate_slug: the status comes from the injected lookup', () => {
    const statuses = { invalid: ORDER_ERROR.INVALID, reserved: ORDER_ERROR.RESERVED, taken: ORDER_ERROR.TAKEN };
    for (const [status, code] of Object.entries(statuses)) {
      expect(validateOrder(makeOrder(), { ...OPTS, getSlugStatus: () => status })).toEqual({ slug: code });
    }
    expect(validateOrder(makeOrder({ slug: 'pricing' }), { ...OPTS, getSlugStatus: () => 'available' })).toEqual({});
  });

  it('test_validate_package: an unknown package is missing', () => {
    expect(validate({ package: 'gold' })).toEqual({ package: ORDER_ERROR.REQUIRED });
  });

  it('test_validate_package: "not sure yet" is a valid choice', () => {
    expect(UNSURE_PACKAGE_ID).toBe('unsure');
    expect(validate({ package: UNSURE_PACKAGE_ID })).toEqual({});
  });

  it.each(['dan@', 'dan example@x.org', `${'a'.repeat(250)}@x.org`])(
    'test_validate_email: %j is invalid',
    (email) => {
      expect(validate({ email })).toEqual({ email: ORDER_ERROR.INVALID });
    },
  );

  it('test_validate_email: surrounding spaces are ignored', () => {
    expect(validate({ email: ' dan@example.org ' })).toEqual({});
  });

  it('test_validate_lengths: names and notes have limits', () => {
    expect(NAME_MAX_LENGTH).toBe(40);
    expect(NOTES_MAX_LENGTH).toBe(600);

    expect(validate({ brideName: 'a'.repeat(NAME_MAX_LENGTH + 1) })).toEqual({ brideName: ORDER_ERROR.TOO_LONG });
    expect(validate({ groomName: 'a'.repeat(NAME_MAX_LENGTH + 1) })).toEqual({ groomName: ORDER_ERROR.TOO_LONG });
    expect(validate({ brideName: 'a'.repeat(NAME_MAX_LENGTH) })).toEqual({});
    expect(validate({ notes: 'a'.repeat(NOTES_MAX_LENGTH + 1) })).toEqual({ notes: ORDER_ERROR.TOO_LONG });
    expect(validate({ notes: 'a'.repeat(NOTES_MAX_LENGTH) })).toEqual({});
  });

  it('test_validate_ok: unknown add-ons are never an error', () => {
    expect(validate({ addons: ['nope'] })).toEqual({});
  });
});

describe('order form: message and mailto', () => {
  it('test_message_exact', () => {
    const message = buildOrderMessage(makeOrder(), CTX);

    expect(message.subject).toBe(ORDER_SUBJECT);
    expect(message.body.split('\n')).toEqual(ORDER_BODY_LINES);
    expect(message.body.split('\n')[5]).toBe(EXACT_ADDRESS_LINE);
    expect(message.body).toBe(ORDER_BODY);
  });

  it('test_message_empty_optionals', () => {
    const { body } = buildOrderMessage(makeOrder({ notes: '' }), { ...CTX, addonNames: [] });
    const lines = body.split('\n');

    expect(lines).toContain('Add-ons: None');
    expect(lines.at(-2)).toBe('Notes:');
    expect(lines.at(-1)).toBe('None');
  });

  it('test_message_no_template_injection', () => {
    const { subject, body } = buildOrderMessage(
      makeOrder({ brideName: '{site}', notes: '{site} {value}' }),
      CTX,
    );

    expect(body.endsWith('{site} {value}')).toBe(true);
    expect(body.split('\n')).toContain('Bride: {site}');
    expect(subject).toBe("Weddin'Vaders order: Dan & {site} (DanAndShelly)");
  });

  it('test_mailto_exact', () => {
    const composed = composeOrder(makeOrder(), CTX, ORDER_TO);

    expect(composed.mailtoUrl).toBe(EXACT_MAILTO_URL);
    expect(composed.mailtoUrl).toHaveLength(EXACT_MAILTO_URL_LENGTH);
    // The shared fixture other tests compare against is the same string.
    expect(ORDER_MAILTO_URL).toBe(EXACT_MAILTO_URL);
    expect(composed.notesOmitted).toBe(false);
    expect(composed.subject).toBe(ORDER_SUBJECT);
    expect(composed.body).toBe(ORDER_BODY);
  });

  it('test_mailto_round_trip', () => {
    const { mailtoUrl } = composeOrder(makeOrder(), CTX, ORDER_TO);

    expect(mailtoUrl.startsWith(`mailto:${ORDER_TO}?`)).toBe(true);
    expect(parseMailto(mailtoUrl)).toEqual({
      subject: ORDER_SUBJECT,
      body: ORDER_BODY.replaceAll('\n', '\r\n'),
    });
    expect(mailtoUrl).not.toContain('+');
    expect(mailtoUrl).not.toMatch(/[\r\n ]/);
  });

  it('test_mailto_no_header_injection: form values cannot add recipients or headers (R7, R15)', () => {
    const hostile = makeOrder({
      brideName: 'Shelly&bcc=evil@example.net',
      groomName: 'Dan?subject=Hi&cc=evil@example.net',
      email: 'dan@example.org&to=evil@example.net',
      notes: 'x&bcc=evil@example.net\r\nBcc: evil@example.net\n?body=y#frag',
    });
    const { mailtoUrl } = composeOrder(hostile, CTX, ORDER_TO);

    // One recipient, one "?", exactly the two headers we set, nothing raw.
    expect(mailtoUrl.startsWith(`mailto:${ORDER_TO}?subject=`)).toBe(true);
    expect(mailtoUrl.split('?')).toHaveLength(2);
    expect(mailtoUrl.split('&')).toHaveLength(2);
    expect(mailtoUrl).not.toMatch(/[\r\n #]/);
    const params = new URLSearchParams(mailtoUrl.slice(mailtoUrl.indexOf('?') + 1));
    expect([...params.keys()]).toEqual(['subject', 'body']);
    expect(params.get('body')).toContain('Bride: Shelly&bcc=evil@example.net');
  });

  it('test_message_single_line_fields: a line break in a one-line field cannot forge a line (R7)', () => {
    const { subject, body } = buildOrderMessage(
      makeOrder({ brideName: 'Shelly\r\nBcc: evil@example.net', email: 'dan@example.org\nPackage: Premium' }),
      CTX,
    );

    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe("Weddin'Vaders order: Dan & Shelly Bcc: evil@example.net (DanAndShelly)");
    const lines = body.split('\n');
    expect(lines).toContain('Bride: Shelly Bcc: evil@example.net');
    expect(lines).toContain('Reply to: dan@example.org Package: Premium');
    expect(lines.filter((text) => text.startsWith('Package: '))).toEqual(['Package: Custom']);
  });

  it('test_mailto_crlf_input', () => {
    const withLf = buildMailtoUrl({ to: ORDER_TO, subject: 's', body: 'a\nb' });
    const withCrLf = buildMailtoUrl({ to: ORDER_TO, subject: 's', body: 'a\r\nb' });

    expect(withLf).toBe(`mailto:${ORDER_TO}?subject=s&body=a%0D%0Ab`);
    expect(withCrLf).toBe(withLf);
  });

  it('test_mailto_crlf_input: notes typed with CRLF give the same order', () => {
    const lf = composeOrder(makeOrder(), CTX, ORDER_TO);
    const crlf = composeOrder(makeOrder({ notes: makeOrder().notes.replace('\n', '\r\n') }), CTX, ORDER_TO);

    expect(crlf.mailtoUrl).toBe(lf.mailtoUrl);
    expect(crlf.body).toBe(ORDER_BODY);
  });

  it('test_mailto_too_long', () => {
    expect(MAILTO_MAX_LENGTH).toBe(2000);

    const composed = composeOrder(makeOrder({ notes: HEBREW_NOTES }), CTX, ORDER_TO);
    const sent = parseMailto(composed.mailtoUrl);

    expect(composed.notesOmitted).toBe(true);
    expect(composed.mailtoUrl.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH);
    expect(sent.body).toContain(order.message.notesOmitted);
    expect(sent.body).not.toContain(HEBREW_LETTER);
    expect(sent.body).toContain('Bride: Shelly');
    expect(composed.body).toContain(HEBREW_NOTES);
    expect(composed.subject).toBe(ORDER_SUBJECT);
  });

  it('test_mailto_ascii_notes_fit', () => {
    const notes = 'lorem ipsu '.repeat(60).slice(0, NOTES_MAX_LENGTH);
    expect(notes).toHaveLength(NOTES_MAX_LENGTH);

    const composed = composeOrder(makeOrder({ notes }), CTX, ORDER_TO);

    expect(composed.notesOmitted).toBe(false);
    expect(composed.mailtoUrl.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH);
    expect(parseMailto(composed.mailtoUrl).body).toContain(notes.trim());
  });
});
