import { describe, it, expect } from 'vitest';
import {
  EVENT_ISSUE,
  EventConfigError,
  validateEvent,
  assertValidEvent,
} from './eventConfig';
import { makeEvent, ITEM_INDEX } from './eventFixtures';

const { RINGS, GUEST, DISCOUNT, MINE } = ITEM_INDEX;

/** Marks a field to be deleted rather than assigned. */
const DELETED = Symbol('deleted');

/** Assigns `value` to `target[key]`, or deletes the key when `value` is DELETED. */
function setField(target, key, value) {
  if (value === DELETED) delete target[key];
  else target[key] = value;
}

/** Builds the fixture, lets `mutate` break it, and returns the validation issues. */
function issuesAfter(mutate) {
  const event = makeEvent();
  mutate(event);
  return validateEvent(event);
}

const issueAt = (path, code) => expect.objectContaining({ path, code });

/** Asserts that `issues` is exactly one issue with the given path and code. */
function expectOnlyIssue(issues, path, code) {
  expect(issues).toHaveLength(1);
  expect(issues).toContainEqual(issueAt(path, code));
}

/** A valid fifth item that no level references. */
function makeExtraItem(overrides = {}) {
  return {
    id: 'extra',
    emoji: '🎈',
    label: 'Extra',
    price: 100,
    essential: false,
    exclusiveTo: null,
    incomeType: null,
    ...overrides,
  };
}

/** A valid level with the given 1-based id, built from the fixture's first level. */
function makeLevel(id) {
  return { ...makeEvent().levels[0], id };
}

describe('validateEvent — baseline and API', () => {
  it('test_fixture_valid', () => {
    expect(validateEvent(makeEvent())).toEqual([]);
  });

  it('test_issue_shape', () => {
    const issues = validateEvent(makeEvent({ slug: 'x' }));

    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(typeof issue.path).toBe('string');
      expect(typeof issue.code).toBe('string');
      expect(typeof issue.message).toBe('string');
      expect(issue.message).not.toBe('');
    }
  });

  it('test_issue_codes_values', () => {
    expect(EVENT_ISSUE).toEqual({
      MISSING: 'missing',
      INVALID_TYPE: 'invalid-type',
      EMPTY: 'empty',
      INVALID_SLUG: 'invalid-slug',
      INVALID_NUMBER: 'invalid-number',
      NOT_ALLOWED: 'not-allowed',
      DUPLICATE_ID: 'duplicate-id',
      UNKNOWN_ITEM: 'unknown-item',
      NO_MINE_ITEM: 'no-mine-item',
      RESERVED_SLUG: 'reserved-slug',
      DUPLICATE_SLUG: 'duplicate-slug',
    });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['string', 'x'],
    ['array', []],
    ['function', () => {}],
  ])('test_validate_never_throws: %s', (_label, candidate) => {
    let issues;
    expect(() => {
      issues = validateEvent(candidate);
    }).not.toThrow();
    expectOnlyIssue(issues, '', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_validate_pure', () => {
    const original = makeEvent();
    const input = structuredClone(original);

    validateEvent(input);

    expect(input).toEqual(original);
  });

  it('test_unknown_keys_ignored', () => {
    const event = makeEvent({ theme: { x: 1 } });
    event.items[RINGS].sparkle = true;
    event.levels[0].mood = 'festive';

    expect(validateEvent(event)).toEqual([]);
  });

  it('test_collects_all_issues', () => {
    const event = makeEvent({ slug: 'a b', public: 'yes' });
    event.items[RINGS].price = -1;

    const issues = validateEvent(event);

    expect(issues).toHaveLength(3);
    expect(issues).toContainEqual(issueAt('slug', EVENT_ISSUE.INVALID_SLUG));
    expect(issues).toContainEqual(issueAt('public', EVENT_ISSUE.INVALID_TYPE));
    expect(issues).toContainEqual(issueAt('items[0].price', EVENT_ISSUE.INVALID_NUMBER));
  });
});

describe('assertValidEvent and EventConfigError', () => {
  it('test_assert_returns_same_object', () => {
    const event = makeEvent();

    expect(assertValidEvent(event)).toBe(event);
  });

  it('test_assert_throws_event_config_error', () => {
    let thrown;
    try {
      assertValidEvent(makeEvent({ slug: 'x' }));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(EventConfigError);
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.name).toBe('EventConfigError');
    expectOnlyIssue(thrown.issues, 'slug', EVENT_ISSUE.INVALID_SLUG);
  });

  it('test_error_message_format', () => {
    const slugIssue = { path: 'slug', code: 'invalid-slug', message: 'bad' };
    const rootIssue = { path: '', code: 'invalid-type', message: 'nope' };

    expect(new EventConfigError([slugIssue, rootIssue]).message).toBe(
      'Invalid event config (2 issues): slug: bad; (root): nope',
    );
    expect(new EventConfigError([slugIssue]).message).toBe('Invalid event config (1 issue): slug: bad');
    expect(new EventConfigError([slugIssue]).issues).toEqual([slugIssue]);
  });
});

describe('validateEvent — top-level fields', () => {
  it('test_slug_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.slug), 'slug', EVENT_ISSUE.MISSING);
  });

  it('test_slug_null', () => {
    expectOnlyIssue(validateEvent(makeEvent({ slug: null })), 'slug', EVENT_ISSUE.MISSING);
  });

  it('test_slug_wrong_type', () => {
    expectOnlyIssue(validateEvent(makeEvent({ slug: 42 })), 'slug', EVENT_ISSUE.INVALID_TYPE);
  });

  it.each([[''], ['ab'], ['Dan Shelly'], [' DanAndShelly'], ['a'.repeat(41)]])(
    'test_slug_bad_format: %o',
    (slug) => {
      expectOnlyIssue(validateEvent(makeEvent({ slug })), 'slug', EVENT_ISSUE.INVALID_SLUG);
    },
  );

  it('test_slug_reserved_is_format_valid', () => {
    expect(validateEvent(makeEvent({ slug: 'demo' }))).toEqual([]);
  });

  it('test_public_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.public), 'public', EVENT_ISSUE.MISSING);
  });

  it.each([['true'], [1], [0]])('test_public_wrong_type: %o', (value) => {
    expectOnlyIssue(validateEvent(makeEvent({ public: value })), 'public', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_public_true_valid', () => {
    expect(validateEvent(makeEvent({ public: true }))).toEqual([]);
  });

  it('test_names_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.names), 'names', EVENT_ISSUE.MISSING);
  });

  it.each([['string', 'Dan'], ['array', []]])('test_names_wrong_type: %s', (_label, names) => {
    expectOnlyIssue(validateEvent(makeEvent({ names })), 'names', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_names_child_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.names.bride), 'names.bride', EVENT_ISSUE.MISSING);
  });

  it('test_names_child_wrong_type', () => {
    expectOnlyIssue(
      issuesAfter((e) => { e.names.groom = 5; }),
      'names.groom',
      EVENT_ISSUE.INVALID_TYPE,
    );
  });

  it.each([[''], ['   ']])('test_names_child_empty: %o', (value) => {
    expectOnlyIssue(
      issuesAfter((e) => { e.names.bride = value; }),
      'names.bride',
      EVENT_ISSUE.EMPTY,
    );
  });

  it.each(['bride', 'groom', 'couple'])('test_images_each_key_missing: %s', (key) => {
    expectOnlyIssue(issuesAfter((e) => delete e.images[key]), `images.${key}`, EVENT_ISSUE.MISSING);
  });

  it('test_images_empty', () => {
    expectOnlyIssue(
      issuesAfter((e) => { e.images.couple = ''; }),
      'images.couple',
      EVENT_ISSUE.EMPTY,
    );
  });

  it('test_images_wrong_type', () => {
    expectOnlyIssue(
      issuesAfter((e) => { e.images.bride = {}; }),
      'images.bride',
      EVENT_ISSUE.INVALID_TYPE,
    );
  });

  it('test_images_container_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.images), 'images', EVENT_ISSUE.MISSING);
  });

  it.each(['title', 'tagline', 'finalMeeting', 'gameComplete', 'lost'])(
    'test_messages_each_key_missing: %s',
    (key) => {
      expectOnlyIssue(issuesAfter((e) => delete e.messages[key]), `messages.${key}`, EVENT_ISSUE.MISSING);
    },
  );

  it('test_messages_empty', () => {
    expectOnlyIssue(
      issuesAfter((e) => { e.messages.title = ' '; }),
      'messages.title',
      EVENT_ISSUE.EMPTY,
    );
  });

  it('test_messages_container_wrong_type', () => {
    expectOnlyIssue(validateEvent(makeEvent({ messages: 'hi' })), 'messages', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_items_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.items), 'items', EVENT_ISSUE.MISSING);
  });

  it('test_items_wrong_type', () => {
    expectOnlyIssue(validateEvent(makeEvent({ items: {} })), 'items', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_items_empty', () => {
    // Length is not asserted: the level's item references then fail too.
    expect(validateEvent(makeEvent({ items: [] }))).toContainEqual(issueAt('items', EVENT_ISSUE.EMPTY));
  });

  it('test_levels_missing', () => {
    expectOnlyIssue(issuesAfter((e) => delete e.levels), 'levels', EVENT_ISSUE.MISSING);
  });

  it('test_levels_wrong_type', () => {
    expectOnlyIssue(validateEvent(makeEvent({ levels: 'x' })), 'levels', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_levels_empty', () => {
    expectOnlyIssue(validateEvent(makeEvent({ levels: [] })), 'levels', EVENT_ISSUE.EMPTY);
  });
});

describe('validateEvent — items', () => {
  /** Sets one field of one fixture item and returns the issues. */
  const itemIssues = (index, field, value) =>
    issuesAfter((e) => setField(e.items[index], field, value));

  it('test_item_not_object', () => {
    expectOnlyIssue(
      issuesAfter((e) => e.items.push('rings')),
      'items[4]',
      EVENT_ISSUE.INVALID_TYPE,
    );
  });

  it('test_item_id_missing', () => {
    const extra = makeExtraItem();
    delete extra.id;

    expectOnlyIssue(issuesAfter((e) => e.items.push(extra)), 'items[4].id', EVENT_ISSUE.MISSING);
  });

  it('test_item_id_duplicate', () => {
    expectOnlyIssue(
      issuesAfter((e) => e.items.push({ ...e.items[RINGS] })),
      'items[4].id',
      EVENT_ISSUE.DUPLICATE_ID,
    );
  });

  it.each([
    ['emoji', 'empty string', '', EVENT_ISSUE.EMPTY],
    ['emoji', 'number', 7, EVENT_ISSUE.INVALID_TYPE],
    ['emoji', 'deleted', DELETED, EVENT_ISSUE.MISSING],
    ['label', 'empty string', '', EVENT_ISSUE.EMPTY],
    ['label', 'number', 7, EVENT_ISSUE.INVALID_TYPE],
    ['label', 'deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_item_string_fields: %s %s', (field, _label, value, code) => {
    expectOnlyIssue(itemIssues(RINGS, field, value), `items[0].${field}`, code);
  });

  it.each([
    ['-1', -1, EVENT_ISSUE.INVALID_NUMBER],
    ['NaN', NaN, EVENT_ISSUE.INVALID_NUMBER],
    ['Infinity', Infinity, EVENT_ISSUE.INVALID_NUMBER],
    ["'500'", '500', EVENT_ISSUE.INVALID_TYPE],
    ['deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_item_price_invalid: %s', (_label, value, code) => {
    expectOnlyIssue(itemIssues(RINGS, 'price', value), 'items[0].price', code);
  });

  it('test_item_price_zero_valid', () => {
    expect(itemIssues(RINGS, 'price', 0)).toEqual([]);
  });

  it.each([
    ["'yes'", 'yes', EVENT_ISSUE.INVALID_TYPE],
    ['deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_item_essential_wrong_type: %s', (_label, value, code) => {
    expectOnlyIssue(itemIssues(RINGS, 'essential', value), 'items[0].essential', code);
  });

  it.each([['bride'], ['groom'], [null], [undefined]])('test_item_exclusive_to_valid: %o', (value) => {
    expect(itemIssues(RINGS, 'exclusiveTo', value)).toEqual([]);
  });

  it.each([['both'], ['Bride'], [1]])('test_item_exclusive_to_not_allowed: %o', (value) => {
    expectOnlyIssue(itemIssues(RINGS, 'exclusiveTo', value), 'items[0].exclusiveTo', EVENT_ISSUE.NOT_ALLOWED);
  });

  it('test_item_income_type_not_allowed', () => {
    expectOnlyIssue(itemIssues(RINGS, 'incomeType', 'bonus'), 'items[0].incomeType', EVENT_ISSUE.NOT_ALLOWED);
  });

  it('test_item_income_type_time_valid', () => {
    expect(itemIssues(RINGS, 'incomeType', 'time')).toEqual([]);
  });

  it.each([['cash'], ['invite'], ['heart'], [null], [undefined]])(
    'test_item_ammo_required_valid: %o',
    (value) => {
      expect(itemIssues(RINGS, 'ammoRequired', value)).toEqual([]);
    },
  );

  it('test_item_ammo_required_not_allowed', () => {
    expectOnlyIssue(
      itemIssues(GUEST, 'ammoRequired', 'laser'),
      'items[1].ammoRequired',
      EVENT_ISSUE.NOT_ALLOWED,
    );
  });

  it('test_item_income_amount_required', () => {
    expectOnlyIssue(itemIssues(GUEST, 'incomeAmount', DELETED), 'items[1].incomeAmount', EVENT_ISSUE.MISSING);
  });

  it.each([
    ['-5', -5, EVENT_ISSUE.INVALID_NUMBER],
    ["'150'", '150', EVENT_ISSUE.INVALID_TYPE],
  ])('test_item_income_amount_invalid: %s', (_label, value, code) => {
    expectOnlyIssue(itemIssues(GUEST, 'incomeAmount', value), 'items[1].incomeAmount', code);
  });

  it('test_item_income_amount_optional_for_non_income', () => {
    const event = makeEvent();

    expect(event.items[RINGS]).not.toHaveProperty('incomeAmount');
    expect(event.items[RINGS].incomeType).toBeNull();
    expect(validateEvent(event)).toEqual([]);
  });

  it('test_item_discount_pct_required', () => {
    expectOnlyIssue(
      itemIssues(DISCOUNT, 'discountPct', DELETED),
      'items[2].discountPct',
      EVENT_ISSUE.MISSING,
    );
  });

  it.each([[0], [1], [1.5], [-0.1]])('test_item_discount_pct_bounds: %d is out of range', (value) => {
    expectOnlyIssue(
      itemIssues(DISCOUNT, 'discountPct', value),
      'items[2].discountPct',
      EVENT_ISSUE.INVALID_NUMBER,
    );
  });

  it.each([[0.01], [0.99]])('test_item_discount_pct_bounds: %d is in range', (value) => {
    expect(itemIssues(DISCOUNT, 'discountPct', value)).toEqual([]);
  });

  it('test_item_spawn_weight_optional', () => {
    expect(itemIssues(RINGS, 'spawnWeight', DELETED)).toEqual([]);
  });

  it.each([
    ['0', 0, EVENT_ISSUE.INVALID_NUMBER],
    ['-1', -1, EVENT_ISSUE.INVALID_NUMBER],
    ['NaN', NaN, EVENT_ISSUE.INVALID_NUMBER],
    ["'10'", '10', EVENT_ISSUE.INVALID_TYPE],
  ])('test_item_spawn_weight_invalid: %s', (_label, value, code) => {
    expectOnlyIssue(itemIssues(RINGS, 'spawnWeight', value), 'items[0].spawnWeight', code);
  });
});

describe('validateEvent — levels', () => {
  /** Sets one field of the fixture's only level and returns the issues. */
  const levelIssues = (field, value) => issuesAfter((e) => setField(e.levels[0], field, value));

  it('test_level_not_object', () => {
    expectOnlyIssue(validateEvent(makeEvent({ levels: [null] })), 'levels[0]', EVENT_ISSUE.INVALID_TYPE);
  });

  it.each([
    ['2', 2, EVENT_ISSUE.INVALID_NUMBER],
    ['0', 0, EVENT_ISSUE.INVALID_NUMBER],
    ['1.5', 1.5, EVENT_ISSUE.INVALID_NUMBER],
    ["'1'", '1', EVENT_ISSUE.INVALID_TYPE],
    ['deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_level_id_not_sequential: %s', (_label, value, code) => {
    expectOnlyIssue(levelIssues('id', value), 'levels[0].id', code);
  });

  it('test_level_second_id: ids [1, 2] are valid', () => {
    expect(validateEvent(makeEvent({ levels: [makeLevel(1), makeLevel(2)] }))).toEqual([]);
  });

  it.each([[1], [3]])('test_level_second_id: ids [1, %d] are rejected', (secondId) => {
    expectOnlyIssue(
      validateEvent(makeEvent({ levels: [makeLevel(1), makeLevel(secondId)] })),
      'levels[1].id',
      EVENT_ISSUE.INVALID_NUMBER,
    );
  });

  it.each([
    ['name', 'empty string', '', EVENT_ISSUE.EMPTY],
    ['name', 'number', 3, EVENT_ISSUE.INVALID_TYPE],
    ['name', 'deleted', DELETED, EVENT_ISSUE.MISSING],
    ['subtitle', 'empty string', '', EVENT_ISSUE.EMPTY],
    ['subtitle', 'number', 3, EVENT_ISSUE.INVALID_TYPE],
    ['subtitle', 'deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_level_string_fields: %s %s', (field, _label, value, code) => {
    expectOnlyIssue(levelIssues(field, value), `levels[0].${field}`, code);
  });

  it('test_level_required_missing', () => {
    expectOnlyIssue(levelIssues('required', DELETED), 'levels[0].required', EVENT_ISSUE.MISSING);
  });

  it('test_level_required_wrong_type', () => {
    expectOnlyIssue(levelIssues('required', 'rings'), 'levels[0].required', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_level_required_empty', () => {
    expectOnlyIssue(levelIssues('required', []), 'levels[0].required', EVENT_ISSUE.EMPTY);
  });

  it('test_level_required_unknown_item', () => {
    expectOnlyIssue(
      levelIssues('required', ['rings', 'unicorn']),
      'levels[0].required[1]',
      EVENT_ISSUE.UNKNOWN_ITEM,
    );
  });

  it('test_level_required_non_string_element', () => {
    expectOnlyIssue(levelIssues('required', [42]), 'levels[0].required[0]', EVENT_ISSUE.INVALID_TYPE);
  });

  it('test_level_required_duplicates_allowed', () => {
    expect(levelIssues('required', ['rings', 'rings'])).toEqual([]);
  });

  it('test_level_optional_empty_valid', () => {
    expect(levelIssues('optional', [])).toEqual([]);
  });

  it('test_level_optional_unknown_item', () => {
    expectOnlyIssue(
      levelIssues('optional', ['guest', 'nope']),
      'levels[0].optional[1]',
      EVENT_ISSUE.UNKNOWN_ITEM,
    );
  });

  it('test_level_optional_missing', () => {
    expectOnlyIssue(levelIssues('optional', DELETED), 'levels[0].optional', EVENT_ISSUE.MISSING);
  });

  it.each([
    ['1050', 1050, EVENT_ISSUE.INVALID_NUMBER],
    ['-100', -100, EVENT_ISSUE.INVALID_NUMBER],
    ['NaN', NaN, EVENT_ISSUE.INVALID_NUMBER],
    ["'1000'", '1000', EVENT_ISSUE.INVALID_TYPE],
  ])('test_level_money_invalid: %s', (_label, value, code) => {
    expectOnlyIssue(levelIssues('money', value), 'levels[0].money', code);
  });

  it.each([[0], [100], [9900]])('test_level_money_valid: %d', (value) => {
    expect(levelIssues('money', value)).toEqual([]);
  });

  describe.each(['priceScale', 'itemSpeed', 'rowAdvance', 'gameDuration'])(
    'test_level_positive_numbers: %s',
    (field) => {
      it.each([
        ['0', 0, EVENT_ISSUE.INVALID_NUMBER],
        ['-1', -1, EVENT_ISSUE.INVALID_NUMBER],
        ["'2'", '2', EVENT_ISSUE.INVALID_TYPE],
        ['deleted', DELETED, EVENT_ISSUE.MISSING],
      ])('%s is rejected', (_label, value, code) => {
        expectOnlyIssue(levelIssues(field, value), `levels[0].${field}`, code);
      });

      it('0.1 is valid', () => {
        expect(levelIssues(field, 0.1)).toEqual([]);
      });
    },
  );

  describe.each(['invites', 'hearts'])('test_level_ammo_counts: %s', (field) => {
    it.each([
      ['-1', -1, EVENT_ISSUE.INVALID_NUMBER],
      ['2.5', 2.5, EVENT_ISSUE.INVALID_NUMBER],
      ["'4'", '4', EVENT_ISSUE.INVALID_TYPE],
    ])('%s is rejected', (_label, value, code) => {
      expectOnlyIssue(levelIssues(field, value), `levels[0].${field}`, code);
    });

    it('0 is valid', () => {
      expect(levelIssues(field, 0)).toEqual([]);
    });
  });

  it.each([
    ["'no'", 'no', EVENT_ISSUE.INVALID_TYPE],
    ['deleted', DELETED, EVENT_ISSUE.MISSING],
  ])('test_level_has_mines_wrong_type: %s', (_label, value, code) => {
    expectOnlyIssue(levelIssues('hasMines', value), 'levels[0].hasMines', code);
  });

  it('test_level_has_mines_without_mine_item', () => {
    expectOnlyIssue(
      issuesAfter((e) => e.items.splice(MINE, 1)),
      'levels[0].hasMines',
      EVENT_ISSUE.NO_MINE_ITEM,
    );
  });

  it('test_level_no_mines_without_mine_item_valid', () => {
    const issues = issuesAfter((e) => {
      e.items.splice(MINE, 1);
      e.levels[0].hasMines = false;
    });

    expect(issues).toEqual([]);
  });
});
