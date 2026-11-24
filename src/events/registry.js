import { EVENT_ISSUE, EventConfigError, validateEvent } from './eventConfig';
import { isReservedSlug, isValidSlug, normalizeSlug } from './slug';

/** Outcome of asking whether a slug can be used for a new event. */
export const SLUG_STATUS = Object.freeze({
  AVAILABLE: 'available',
  INVALID:   'invalid',
  RESERVED:  'reserved',
  TAKEN:     'taken',
});

const EVENTS_PATH = 'events';

/**
 * @typedef {import('./eventConfig').EventConfig} EventConfig
 *
 * @typedef {Object} EventRegistry
 * @property {(slug: unknown) => EventConfig | null} findBySlug
 *   Case-insensitive, whitespace-tolerant lookup. Never throws.
 * @property {(slug: unknown) => string} getSlugStatus
 *   A SLUG_STATUS value; precedence invalid → reserved → taken → available.
 * @property {(slug: unknown) => boolean} isSlugAvailable
 *   True only when getSlugStatus() is SLUG_STATUS.AVAILABLE.
 * @property {() => EventConfig[]} listEvents
 *   All events in registration order, as a new array.
 * @property {() => EventConfig[]} listPublicEvents
 *   Events with `public === true` in registration order, as a new array.
 */

/**
 * Builds a registry from a list of events. The list is copied; the event
 * objects are kept by reference.
 *
 * @param {EventConfig[]} events
 * @returns {EventRegistry}
 * @throws {EventConfigError} Listing every issue found: an invalid event, a
 *   reserved slug, or a slug that duplicates an earlier one (ignoring case).
 */
export function createEventRegistry(events) {
  if (!Array.isArray(events)) {
    throw new EventConfigError([{
      path:    EVENTS_PATH,
      code:    EVENT_ISSUE.INVALID_TYPE,
      message: 'The event list must be an array.',
    }]);
  }

  const registered = [...events];
  const bySlugKey = new Map();
  const issues = [];

  registered.forEach((event, index) => {
    const eventPath = `${EVENTS_PATH}[${index}]`;
    for (const issue of validateEvent(event)) {
      issues.push({ ...issue, path: issue.path ? `${eventPath}.${issue.path}` : eventPath });
    }

    const slug = event?.slug;
    if (!isValidSlug(slug)) return;

    const slugPath = `${eventPath}.slug`;
    const slugKey = normalizeSlug(slug);
    if (isReservedSlug(slug)) {
      issues.push({
        path:    slugPath,
        code:    EVENT_ISSUE.RESERVED_SLUG,
        message: `"${slug}" is reserved for the site and cannot be an event slug.`,
      });
    } else if (bySlugKey.has(slugKey)) {
      issues.push({
        path:    slugPath,
        code:    EVENT_ISSUE.DUPLICATE_SLUG,
        message: `"${slug}" duplicates the slug of an earlier event.`,
      });
    } else {
      bySlugKey.set(slugKey, event);
    }
  });

  if (issues.length > 0) throw new EventConfigError(issues);

  const findBySlug = (slug) => bySlugKey.get(normalizeSlug(slug)) ?? null;

  const getSlugStatus = (slug) => {
    const trimmed = typeof slug === 'string' ? slug.trim() : '';
    if (!isValidSlug(trimmed)) return SLUG_STATUS.INVALID;
    if (isReservedSlug(trimmed)) return SLUG_STATUS.RESERVED;
    if (findBySlug(trimmed)) return SLUG_STATUS.TAKEN;
    return SLUG_STATUS.AVAILABLE;
  };

  return {
    findBySlug,
    getSlugStatus,
    isSlugAvailable:  (slug) => getSlugStatus(slug) === SLUG_STATUS.AVAILABLE,
    listEvents:       () => [...registered],
    listPublicEvents: () => registered.filter((event) => event.public === true),
  };
}
