import { describe, it, expect } from 'vitest';
import { SLUG_STATUS, createEventRegistry } from './registry';
import { EVENT_ISSUE, EventConfigError } from './eventConfig';
import { makeEvent } from './eventFixtures';

const TAKEN_SLUG = 'DanAndShelly';

/** A valid event with the given slug. */
const ev = (slug, extra = {}) => makeEvent({ slug, ...extra });

const issueAt = (path, code) => expect.objectContaining({ path, code });
const slugsOf = (events) => events.map((event) => event.slug);

/** Runs `createEventRegistry(events)` and returns the EventConfigError it throws. */
function creationError(events) {
  let thrown;
  try {
    createEventRegistry(events);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(EventConfigError);
  return thrown;
}

describe('createEventRegistry', () => {
  it('test_slug_status_values', () => {
    expect(SLUG_STATUS).toEqual({
      AVAILABLE: 'available',
      INVALID: 'invalid',
      RESERVED: 'reserved',
      TAKEN: 'taken',
    });
  });

  it('test_create_empty', () => {
    let registry;
    expect(() => {
      registry = createEventRegistry([]);
    }).not.toThrow();

    expect(registry.listEvents()).toEqual([]);
    expect(registry.findBySlug('x')).toBeNull();
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['object', {}],
    ['string', 'x'],
  ])('test_create_non_array: %s', (_label, events) => {
    expect(creationError(events).issues).toContainEqual(issueAt('events', EVENT_ISSUE.INVALID_TYPE));
  });

  it('test_create_invalid_event', () => {
    const error = creationError([ev(TAKEN_SLUG), ev('Bad Slug')]);

    expect(error.issues).toContainEqual(issueAt('events[1].slug', EVENT_ISSUE.INVALID_SLUG));
  });

  it('test_create_invalid_event_nested_path', () => {
    const second = ev('TomAndAnna');
    second.items[0].price = -1;

    const error = creationError([ev(TAKEN_SLUG), second]);

    expect(error.issues).toContainEqual(issueAt('events[1].items[0].price', EVENT_ISSUE.INVALID_NUMBER));
  });

  it('test_create_non_object_event', () => {
    expect(creationError([null]).issues).toContainEqual(issueAt('events[0]', EVENT_ISSUE.INVALID_TYPE));
  });

  it.each([['demo'], ['Pricing'], ['HOW-IT-WORKS'], ['assets']])(
    'test_create_reserved_slug: %s',
    (slug) => {
      expect(creationError([ev(slug)]).issues).toContainEqual(
        issueAt('events[0].slug', EVENT_ISSUE.RESERVED_SLUG),
      );
    },
  );

  it('test_create_duplicate_slug_exact', () => {
    const { issues } = creationError([ev(TAKEN_SLUG), ev(TAKEN_SLUG)]);

    expect(issues).toContainEqual(issueAt('events[1].slug', EVENT_ISSUE.DUPLICATE_SLUG));
    expect(issues.filter((issue) => issue.path === 'events[0].slug')).toEqual([]);
  });

  it('test_create_duplicate_slug_case_insensitive', () => {
    const { issues } = creationError([ev(TAKEN_SLUG), ev('danandshelly')]);

    expect(issues).toContainEqual(issueAt('events[1].slug', EVENT_ISSUE.DUPLICATE_SLUG));
  });

  it('test_create_collects_across_events', () => {
    const { issues } = creationError([ev('demo'), ev('Bad Slug')]);

    expect(issues).toContainEqual(issueAt('events[0].slug', EVENT_ISSUE.RESERVED_SLUG));
    expect(issues).toContainEqual(issueAt('events[1].slug', EVENT_ISSUE.INVALID_SLUG));
  });

  it('test_create_copies_input', () => {
    const events = [ev(TAKEN_SLUG)];
    const registry = createEventRegistry(events);

    events.push(ev('Later'));

    expect(registry.listEvents()).toHaveLength(1);
    expect(registry.findBySlug('Later')).toBeNull();
  });

  it('test_registries_independent', () => {
    const first = createEventRegistry([ev('Aaa')]);
    const second = createEventRegistry([ev('Bbb')]);

    expect(first.findBySlug('Bbb')).toBeNull();
    expect(second.findBySlug('Aaa')).toBeNull();
    expect(slugsOf(first.listEvents())).toEqual(['Aaa']);
    expect(slugsOf(second.listEvents())).toEqual(['Bbb']);
  });
});

describe('registry.findBySlug', () => {
  const event = ev(TAKEN_SLUG);
  const registry = createRegistryOrNull([event]);

  it('test_find_exact', () => {
    expect(registry.findBySlug(TAKEN_SLUG)).toBe(event);
  });

  it.each([['danandshelly'], ['DANANDSHELLY'], ['dAnAnDsHeLlY']])(
    'test_find_case_insensitive: %s',
    (slug) => {
      expect(registry.findBySlug(slug)).toBe(event);
    },
  );

  it('test_find_trims', () => {
    expect(registry.findBySlug('  DanAndShelly  ')).toBe(event);
  });

  it('test_find_unknown', () => {
    expect(registry.findBySlug('NoSuchEvent')).toBeNull();
  });

  it.each([[''], [undefined], [null], [42], [{}]])('test_find_bad_input: %o', (input) => {
    let found;
    expect(() => {
      found = registry.findBySlug(input);
    }).not.toThrow();
    expect(found).toBeNull();
  });

  it('test_find_reserved', () => {
    expect(registry.findBySlug('demo')).toBeNull();
  });

  it.each([['DanAndShell'], ['DanAndShellyX']])('test_find_no_partial_match: %s', (slug) => {
    expect(registry.findBySlug(slug)).toBeNull();
  });
});

describe('registry.getSlugStatus and isSlugAvailable', () => {
  const registry = createRegistryOrNull([ev(TAKEN_SLUG)]);

  it.each([[''], ['ab'], ['Dan Shelly'], ['dan_shelly'], [undefined], [null], ['a'.repeat(41)]])(
    'test_status_invalid: %o',
    (slug) => {
      expect(registry.getSlugStatus(slug)).toBe(SLUG_STATUS.INVALID);
    },
  );

  it.each([['demo'], ['Demo'], ['order'], ['404']])('test_status_reserved: %s', (slug) => {
    expect(registry.getSlugStatus(slug)).toBe(SLUG_STATUS.RESERVED);
  });

  it.each([['DanAndShelly'], ['danandshelly'], [' DanAndShelly ']])('test_status_taken: %o', (slug) => {
    expect(registry.getSlugStatus(slug)).toBe(SLUG_STATUS.TAKEN);
  });

  it.each([['TomAndAnna'], ['tom-and-anna'], [' TomAndAnna ']])('test_status_available: %o', (slug) => {
    expect(registry.getSlugStatus(slug)).toBe(SLUG_STATUS.AVAILABLE);
  });

  it('test_is_slug_available', () => {
    expect(registry.isSlugAvailable('TomAndAnna')).toBe(true);
    expect(registry.isSlugAvailable(TAKEN_SLUG)).toBe(false);
    expect(registry.isSlugAvailable('demo')).toBe(false);
    expect(registry.isSlugAvailable('x')).toBe(false);
    expect(registry.isSlugAvailable(undefined)).toBe(false);
  });
});

describe('registry.listEvents and listPublicEvents', () => {
  it('test_list_events_order', () => {
    const registry = createEventRegistry([ev('Bbb'), ev('Aaa'), ev('Ccc')]);

    expect(slugsOf(registry.listEvents())).toEqual(['Bbb', 'Aaa', 'Ccc']);
  });

  it('test_list_events_fresh_array', () => {
    const registry = createEventRegistry([ev('Aaa'), ev('Bbb')]);
    const first = registry.listEvents();
    const second = registry.listEvents();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);

    first.pop();

    expect(slugsOf(registry.listEvents())).toEqual(['Aaa', 'Bbb']);
  });

  it('test_list_public', () => {
    const registry = createEventRegistry([
      ev('Aaa', { public: true }),
      ev('Bbb', { public: false }),
      ev('Ccc', { public: true }),
    ]);

    expect(slugsOf(registry.listPublicEvents())).toEqual(['Aaa', 'Ccc']);
    expect(registry.listPublicEvents()).not.toBe(registry.listPublicEvents());
  });

  it('test_list_public_none', () => {
    const registry = createEventRegistry([ev('Aaa'), ev('Bbb')]);

    expect(registry.listPublicEvents()).toEqual([]);
  });
});

/**
 * Builds a registry at describe time without aborting collection when
 * `createEventRegistry` is broken: the tests then fail individually instead.
 */
function createRegistryOrNull(events) {
  try {
    return createEventRegistry(events);
  } catch {
    return null;
  }
}
