// Public entry point of the event model. Code outside src/events imports from here.
import { defaultEvent } from './defaultEvent';
import { createEventRegistry } from './registry';

/** Every bundled event, in registration order. Later events are appended here. */
export const ALL_EVENTS = [defaultEvent];

/** The app-wide registry. Building it throws if any bundled event is invalid. */
export const eventRegistry = createEventRegistry(ALL_EVENTS);

export { defaultEvent };
export { createEventRegistry, SLUG_STATUS } from './registry';
export { validateEvent, assertValidEvent, EventConfigError, EVENT_ISSUE } from './eventConfig';
export {
  normalizeSlug, isValidSlug, isReservedSlug,
  RESERVED_SLUGS, SITE_PAGE_SLUGS, SLUG_MIN_LENGTH, SLUG_MAX_LENGTH,
} from './slug';
export { getEventPath, buildEventUrl } from './eventUrl';
