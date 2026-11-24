// Event config: the shape that carries everything specific to one couple's
// game, and its validation. Validation here covers one event in isolation;
// reserved and duplicate slugs are the registry's concern.
import { AMMO_ORDER } from '../constants';
import { isValidSlug } from './slug';

/**
 * @typedef {Object} EventNames
 * @property {string} bride
 * @property {string} groom
 *
 * @typedef {Object} EventImages  Image URLs (a bundler asset import, a public path or a data URL).
 * @property {string} bride
 * @property {string} groom
 * @property {string} couple
 *
 * @typedef {Object} EventMessages
 * @property {string} title         Big heading on the title screen.
 * @property {string} tagline       Line under the title.
 * @property {string} finalMeeting  Headline in the meeting scene after the last level.
 * @property {string} gameComplete  Headline on the game-complete overlay.
 * @property {string} lost          Headline on the lost overlay.
 *
 * @typedef {Object} EventItem
 * @property {string}  id            Unique within the event; levels refer to items by it.
 * @property {string}  emoji
 * @property {string}  label
 * @property {number}  price         Base price before the level's priceScale; >= 0.
 * @property {boolean} essential
 * @property {('bride'|'groom'|null)} [exclusiveTo]  Only this player can hit it; null = either.
 * @property {('income'|'discount'|'mine'|'time'|null)} [incomeType]  Special effect; null = plain purchase.
 * @property {('cash'|'invite'|'heart'|null)} [ammoRequired]  Only this ammo affects it; null = none.
 * @property {number}  [incomeAmount]  Required when incomeType is 'income'; >= 0.
 * @property {number}  [discountPct]   Required when incomeType is 'discount'; strictly between 0 and 1.
 * @property {number}  [spawnWeight]   Relative spawn probability; > 0. The engine defaults to 1.
 *
 * @typedef {Object} EventLevel
 * @property {number}   id            1-based position in the level list.
 * @property {string}   name
 * @property {string}   subtitle
 * @property {string[]} required      Item ids to acquire; repeats mean several of the same item.
 * @property {string[]} optional      Item ids that may also appear; may be empty.
 * @property {number}   money         Starting cash; a multiple of the cash-shot cost.
 * @property {number}   priceScale    Multiplier on item prices; > 0.
 * @property {number}   itemSpeed     Pixels per frame; > 0.
 * @property {number}   rowAdvance    Seconds between row steps; > 0.
 * @property {number}   gameDuration  Seconds; > 0.
 * @property {number}   invites       Starting invite ammo; integer >= 0.
 * @property {number}   hearts        Starting heart ammo; integer >= 0.
 * @property {boolean}  hasMines      Whether mine items can appear.
 *
 * @typedef {Object} EventConfig
 * @property {string}        slug    URL name of the event, in display case.
 * @property {boolean}       public  Whether the event may be listed in the showcase.
 * @property {EventNames}    names
 * @property {EventImages}   images
 * @property {EventMessages} messages
 * @property {EventItem[]}   items
 * @property {EventLevel[]}  levels
 *
 * @typedef {Object} EventIssue
 * @property {string} path     Dot/bracket path from the event root, e.g. 'items[2].price'; '' for the root.
 * @property {string} code     One of the EVENT_ISSUE values.
 * @property {string} message  Human-readable description; its wording is not part of the contract.
 */

export const PLAYER_ROLES = Object.freeze(['bride', 'groom']);
export const ITEM_EFFECTS = Object.freeze(['income', 'discount', 'mine', 'time']);

/** Machine-readable codes of validation issues. */
export const EVENT_ISSUE = Object.freeze({
  MISSING:        'missing',
  INVALID_TYPE:   'invalid-type',
  EMPTY:          'empty',
  INVALID_SLUG:   'invalid-slug',
  INVALID_NUMBER: 'invalid-number',
  NOT_ALLOWED:    'not-allowed',
  DUPLICATE_ID:   'duplicate-id',
  UNKNOWN_ITEM:   'unknown-item',
  NO_MINE_ITEM:   'no-mine-item',
  RESERVED_SLUG:  'reserved-slug',  // emitted only by createEventRegistry
  DUPLICATE_SLUG: 'duplicate-slug', // emitted only by createEventRegistry
});

const ROOT_PATH = '';
const ROOT_LABEL = '(root)'; // how the root path is shown in an error message

/** Thrown when an event config, or a list of them, is not valid. */
export class EventConfigError extends Error {
  /** @param {EventIssue[]} issues */
  constructor(issues) {
    const details = issues.map(({ path, message }) => `${path || ROOT_LABEL}: ${message}`).join('; ');
    const noun = issues.length === 1 ? 'issue' : 'issues';
    super(`Invalid event config (${issues.length} ${noun}): ${details}`);
    this.name = 'EventConfigError';
    /** @type {EventIssue[]} */
    this.issues = issues;
  }
}

const NAME_KEYS   = ['bride', 'groom'];
const IMAGE_KEYS   = ['bride', 'groom', 'couple'];
const MESSAGE_KEYS = ['title', 'tagline', 'finalMeeting', 'gameComplete', 'lost'];

const EFFECT_INCOME   = 'income';
const EFFECT_DISCOUNT = 'discount';
const EFFECT_MINE     = 'mine';

// Cash ammo costs $100 a shot, so starting money must be a whole number of shots.
const MONEY_STEP = 100;

// Constraints a numeric field can carry, each with the wording used in its issue message.
const NON_NEGATIVE         = { test: (n) => n >= 0,                         label: 'zero or more' };
const POSITIVE             = { test: (n) => n > 0,                          label: 'greater than zero' };
const NON_NEGATIVE_INTEGER = { test: (n) => Number.isInteger(n) && n >= 0,  label: 'a whole number, zero or more' };
const FRACTION             = { test: (n) => n > 0 && n < 1,                 label: 'strictly between 0 and 1' };
const MONEY                = { test: (n) => n >= 0 && n % MONEY_STEP === 0, label: `zero or more, in steps of ${MONEY_STEP}` };

const LEVEL_NUMBER_RULES = [
  ['money',        MONEY],
  ['priceScale',   POSITIVE],
  ['itemSpeed',    POSITIVE],
  ['rowAdvance',   POSITIVE],
  ['gameDuration', POSITIVE],
  ['invites',      NON_NEGATIVE_INTEGER],
  ['hearts',       NON_NEGATIVE_INTEGER],
];

const isAbsent = (value) => value === undefined || value === null;
const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isMineItem = (item) => isPlainObject(item) && item.incomeType === EFFECT_MINE;

// ── field checks ─────────────────────────────────────────────────────────────
// Each check reports at most one issue for its path and returns whether the
// value passed, so a caller can skip the children of a failed container.

/** Reports `missing` for an absent required value. Returns whether the value is present. */
function checkPresent(issues, path, value) {
  if (!isAbsent(value)) return true;
  issues.push({ path, code: EVENT_ISSUE.MISSING, message: 'This field is required.' });
  return false;
}

/** Reports `invalid-type`. Always returns false, for use as a check's result. */
function reportType(issues, path, expected) {
  issues.push({ path, code: EVENT_ISSUE.INVALID_TYPE, message: `Must be ${expected}.` });
  return false;
}

function checkString(issues, path, value) {
  if (!checkPresent(issues, path, value)) return false;
  if (typeof value !== 'string') return reportType(issues, path, 'a string');
  if (value.trim() === '') {
    issues.push({ path, code: EVENT_ISSUE.EMPTY, message: 'Must not be empty.' });
    return false;
  }
  return true;
}

function checkBoolean(issues, path, value) {
  if (!checkPresent(issues, path, value)) return false;
  if (typeof value !== 'boolean') return reportType(issues, path, 'true or false');
  return true;
}

function checkNumber(issues, path, value, constraint) {
  if (!checkPresent(issues, path, value)) return false;
  if (typeof value !== 'number') return reportType(issues, path, 'a number');
  if (!Number.isFinite(value) || !constraint.test(value)) {
    issues.push({
      path,
      code:    EVENT_ISSUE.INVALID_NUMBER,
      message: `Must be ${constraint.label}; got ${value}.`,
    });
    return false;
  }
  return true;
}

/** A nullable field: absent means "none"; otherwise it must be one of the allowed values. */
function checkOptionalEnum(issues, path, value, allowed) {
  if (isAbsent(value) || allowed.includes(value)) return;
  issues.push({
    path,
    code:    EVENT_ISSUE.NOT_ALLOWED,
    message: `Must be one of ${allowed.join(', ')}, or null.`,
  });
}

function checkObject(issues, path, value) {
  if (!checkPresent(issues, path, value)) return false;
  if (!isPlainObject(value)) return reportType(issues, path, 'an object');
  return true;
}

function checkArray(issues, path, value, { allowEmpty }) {
  if (!checkPresent(issues, path, value)) return false;
  if (!Array.isArray(value)) return reportType(issues, path, 'a list');
  if (!allowEmpty && value.length === 0) {
    issues.push({ path, code: EVENT_ISSUE.EMPTY, message: 'Must contain at least one entry.' });
    return false;
  }
  return true;
}

/** An object whose listed keys must all be non-empty strings. */
function checkStringGroup(issues, path, value, keys) {
  if (!checkObject(issues, path, value)) return;
  for (const key of keys) checkString(issues, `${path}.${key}`, value[key]);
}

// ── sections ─────────────────────────────────────────────────────────────────

function checkSlug(issues, slug) {
  const path = 'slug';
  if (!checkPresent(issues, path, slug)) return;
  if (typeof slug !== 'string') {
    reportType(issues, path, 'a string');
  } else if (!isValidSlug(slug)) {
    issues.push({
      path,
      code:    EVENT_ISSUE.INVALID_SLUG,
      message: `"${slug}" is not a valid slug: use letters and digits, optionally separated by single hyphens.`,
    });
  }
}

function checkItem(issues, path, item, seenIds) {
  if (!isPlainObject(item)) {
    reportType(issues, path, 'an object');
    return;
  }

  const idPath = `${path}.id`;
  if (checkString(issues, idPath, item.id)) {
    if (seenIds.has(item.id)) {
      issues.push({
        path:    idPath,
        code:    EVENT_ISSUE.DUPLICATE_ID,
        message: `Item id "${item.id}" is already used by an earlier item.`,
      });
    }
    seenIds.add(item.id);
  }

  checkString(issues, `${path}.emoji`, item.emoji);
  checkString(issues, `${path}.label`, item.label);
  checkNumber(issues, `${path}.price`, item.price, NON_NEGATIVE);
  checkBoolean(issues, `${path}.essential`, item.essential);
  checkOptionalEnum(issues, `${path}.exclusiveTo`, item.exclusiveTo, PLAYER_ROLES);
  checkOptionalEnum(issues, `${path}.incomeType`, item.incomeType, ITEM_EFFECTS);
  checkOptionalEnum(issues, `${path}.ammoRequired`, item.ammoRequired, AMMO_ORDER);

  // Required by the effect that reads them; validated whenever present.
  if (item.incomeType === EFFECT_INCOME || !isAbsent(item.incomeAmount)) {
    checkNumber(issues, `${path}.incomeAmount`, item.incomeAmount, NON_NEGATIVE);
  }
  if (item.incomeType === EFFECT_DISCOUNT || !isAbsent(item.discountPct)) {
    checkNumber(issues, `${path}.discountPct`, item.discountPct, FRACTION);
  }
  if (!isAbsent(item.spawnWeight)) {
    checkNumber(issues, `${path}.spawnWeight`, item.spawnWeight, POSITIVE);
  }
}

/** Checks a level's list of item ids. `knownItemIds` is null when the item list itself is unusable. */
function checkItemRefs(issues, path, refs, knownItemIds, { allowEmpty }) {
  if (!checkArray(issues, path, refs, { allowEmpty })) return;
  refs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;
    if (typeof ref !== 'string') {
      reportType(issues, refPath, 'an item id (a string)');
    } else if (knownItemIds && !knownItemIds.has(ref)) {
      issues.push({
        path:    refPath,
        code:    EVENT_ISSUE.UNKNOWN_ITEM,
        message: `"${ref}" is not the id of any item in this event.`,
      });
    }
  });
}

function checkLevel(issues, path, level, index, itemInfo) {
  if (!isPlainObject(level)) {
    reportType(issues, path, 'an object');
    return;
  }

  const expectedId = index + 1;
  checkNumber(issues, `${path}.id`, level.id, {
    test:  (id) => id === expectedId,
    label: `${expectedId} (levels are numbered from 1, in order)`,
  });
  checkString(issues, `${path}.name`, level.name);
  checkString(issues, `${path}.subtitle`, level.subtitle);
  checkItemRefs(issues, `${path}.required`, level.required, itemInfo?.ids, { allowEmpty: false });
  checkItemRefs(issues, `${path}.optional`, level.optional, itemInfo?.ids, { allowEmpty: true });
  for (const [field, constraint] of LEVEL_NUMBER_RULES) {
    checkNumber(issues, `${path}.${field}`, level[field], constraint);
  }

  const hasMinesPath = `${path}.hasMines`;
  if (checkBoolean(issues, hasMinesPath, level.hasMines) && level.hasMines && itemInfo && !itemInfo.hasMine) {
    issues.push({
      path:    hasMinesPath,
      code:    EVENT_ISSUE.NO_MINE_ITEM,
      message: `Mines are enabled but no item has incomeType "${EFFECT_MINE}".`,
    });
  }
}

/** What levels need to know about the item list, or null when `items` is not a list at all. */
function describeItems(items) {
  if (!Array.isArray(items)) return null;
  const ids = new Set();
  for (const item of items) {
    if (isPlainObject(item) && typeof item.id === 'string') ids.add(item.id);
  }
  return { ids, hasMine: items.some(isMineItem) };
}

/**
 * Checks a candidate event config in isolation. Pure; never throws.
 * Slug format is checked here; whether the slug is reserved or taken is not.
 *
 * @param {unknown} candidate
 * @returns {EventIssue[]} Every issue found — at most one per path — or [] when valid.
 */
export function validateEvent(candidate) {
  const issues = [];
  if (!isPlainObject(candidate)) {
    reportType(issues, ROOT_PATH, 'an object');
    return issues;
  }

  checkSlug(issues, candidate.slug);
  checkBoolean(issues, 'public', candidate.public);
  checkStringGroup(issues, 'names', candidate.names, NAME_KEYS);
  checkStringGroup(issues, 'images', candidate.images, IMAGE_KEYS);
  checkStringGroup(issues, 'messages', candidate.messages, MESSAGE_KEYS);

  if (checkArray(issues, 'items', candidate.items, { allowEmpty: false })) {
    const seenIds = new Set();
    candidate.items.forEach((item, index) => checkItem(issues, `items[${index}]`, item, seenIds));
  }

  if (checkArray(issues, 'levels', candidate.levels, { allowEmpty: false })) {
    const itemInfo = describeItems(candidate.items);
    candidate.levels.forEach((level, index) => {
      checkLevel(issues, `levels[${index}]`, level, index, itemInfo);
    });
  }

  return issues;
}

/**
 * @template T
 * @param {T} candidate
 * @returns {T} The same object, when it is a valid event config.
 * @throws {EventConfigError} Carrying every issue validateEvent() found.
 */
export function assertValidEvent(candidate) {
  const issues = validateEvent(candidate);
  if (issues.length > 0) throw new EventConfigError(issues);
  return candidate;
}
