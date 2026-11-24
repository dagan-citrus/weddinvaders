import { describe, it, expect } from 'vitest';
import * as events from './index';
import { ALL_EVENTS, eventRegistry, defaultEvent, SLUG_STATUS } from './index';

const BARREL_EXPORTS = [
  'defaultEvent', 'eventRegistry', 'ALL_EVENTS',
  'createEventRegistry', 'SLUG_STATUS',
  'validateEvent', 'assertValidEvent', 'EventConfigError', 'EVENT_ISSUE',
  'normalizeSlug', 'isValidSlug', 'isReservedSlug', 'RESERVED_SLUGS', 'SITE_PAGE_SLUGS',
  'SLUG_MIN_LENGTH', 'SLUG_MAX_LENGTH',
  'getEventPath', 'buildEventUrl',
];

describe('events barrel and app-wide registry', () => {
  it('test_registry_contains_default', () => {
    expect(eventRegistry.findBySlug('demowedding')).toBe(defaultEvent);
  });

  it('test_all_events_registered', () => {
    expect(eventRegistry.listEvents()).toEqual(ALL_EVENTS);
    expect(ALL_EVENTS).toContain(defaultEvent);
  });

  it('test_registry_public_list', () => {
    expect(eventRegistry.listPublicEvents()).toContain(defaultEvent);
  });

  it('test_registry_status_integration', () => {
    expect(eventRegistry.getSlugStatus('DemoWedding')).toBe(SLUG_STATUS.TAKEN);
    expect(eventRegistry.getSlugStatus('demo')).toBe(SLUG_STATUS.RESERVED);
    expect(eventRegistry.getSlugStatus('TomAndAnna')).toBe(SLUG_STATUS.AVAILABLE);
  });

  it.each(BARREL_EXPORTS)('test_barrel_exports: %s', (name) => {
    expect(events[name]).toBeDefined();
  });
});
