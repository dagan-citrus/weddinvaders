import { describe, it, expect, vi } from 'vitest';
import {
  HOME_ROUTE,
  EVENT_ROUTE,
  NOT_FOUND_ROUTE,
  SITE_ROUTES,
  NAV_ROUTES,
  ROUTE_ID,
  matchRoute,
  getDocumentTitle,
} from './routes';
import { SITE_PAGE_SLUGS, isReservedSlug } from './events/slug';
import { createEventRegistry } from './events/registry';
import { defaultEvent } from './events/defaultEvent';
import { makeEvent } from './events/eventFixtures';

const SITE_NAME = "Weddin'Vaders";

/** Page titles by slug, as fixed by the design (also headings and nav labels). */
const TITLES = {
  demo: 'Demo',
  customize: 'Customize',
  pricing: 'Pricing',
  'how-it-works': 'How it works',
  order: 'Order',
  showcase: 'Showcase',
  privacy: 'Privacy',
  terms: 'Terms',
};
const SITE_SLUGS = Object.keys(TITLES);

const REGISTERED_SLUG = 'DanAndShelly';
const registeredEvent = makeEvent({ slug: REGISTERED_SLUG });
const REG = createEventRegistry([registeredEvent]);

describe('route table', () => {
  it('test_site_routes_derive_from_slugs', () => {
    expect(SITE_ROUTES.map((route) => route.id)).toEqual(Object.values(SITE_PAGE_SLUGS));
    expect(SITE_ROUTES.map((route) => route.id)).toEqual(SITE_SLUGS);
    expect(SITE_ROUTES).toHaveLength(8);
    for (const route of SITE_ROUTES) {
      expect(route.path).toBe(`/${route.id}`);
      expect(route.title).toBe(TITLES[route.id]);
    }
    expect(Object.isFrozen(SITE_ROUTES)).toBe(true);
  });

  it('test_nav_routes', () => {
    expect(NAV_ROUTES).toEqual([HOME_ROUTE, ...SITE_ROUTES]);
    expect(NAV_ROUTES[0]).toBe(HOME_ROUTE);
    expect(HOME_ROUTE.path).toBe('/');
    expect(HOME_ROUTE.id).toBe('home');
    expect(HOME_ROUTE.title).toBe(SITE_NAME);
  });

  it('test_site_route_ids_are_reserved', () => {
    for (const route of SITE_ROUTES) {
      expect(isReservedSlug(route.id)).toBe(true);
    }
  });

  it('test_route_ids', () => {
    expect(ROUTE_ID.HOME).toBe('home');
    expect(ROUTE_ID.EVENT).toBe('event');
    expect(ROUTE_ID.NOT_FOUND).toBe('not-found');
    expect(ROUTE_ID.DEMO).toBe('demo');
    expect(ROUTE_ID.HOW_IT_WORKS).toBe('how-it-works');
    expect(EVENT_ROUTE.id).toBe(ROUTE_ID.EVENT);
    expect(NOT_FOUND_ROUTE.id).toBe(ROUTE_ID.NOT_FOUND);
    expect(NOT_FOUND_ROUTE.title).toBe('Event not found');
  });
});

describe('matchRoute', () => {
  it.each(['', '/', '//'])('test_match_home: %j', (pathname) => {
    const match = matchRoute(pathname, REG);
    expect(match.route).toBe(HOME_ROUTE);
    expect(match.event).toBeNull();
  });

  it.each(SITE_SLUGS)('test_match_site_page: /%s', (slug) => {
    const match = matchRoute(`/${slug}`, REG);
    expect(match.route.id).toBe(slug);
    expect(match.route).toBe(SITE_ROUTES.find((route) => route.id === slug));
    expect(match.event).toBeNull();
  });

  it.each([
    ['/Pricing', 'pricing'],
    ['/PRICING/', 'pricing'],
    ['/How-It-Works', 'how-it-works'],
    ['//pricing//', 'pricing'],
  ])('test_match_site_page_case_and_slash: %s → %s', (pathname, id) => {
    const match = matchRoute(pathname, REG);
    expect(match.route.id).toBe(id);
    expect(match.event).toBeNull();
  });

  it('test_match_event', () => {
    const match = matchRoute(`/${REGISTERED_SLUG}`, REG);
    expect(match.route).toBe(EVENT_ROUTE);
    expect(match.event).toBe(registeredEvent);
  });

  it.each(['/danandshelly', '/DANANDSHELLY', '/DanAndShelly/'])(
    'test_match_event_case_and_slash: %s',
    (pathname) => {
      const match = matchRoute(pathname, REG);
      expect(match.route).toBe(EVENT_ROUTE);
      expect(match.event).toBe(registeredEvent);
    },
  );

  it.each(['/DemoWedding', '/demowedding'])('test_match_default_registry: %s', (pathname) => {
    const match = matchRoute(pathname);
    expect(match.route).toBe(EVENT_ROUTE);
    expect(match.event).toBe(defaultEvent);
  });

  it.each(['/NoSuchEvent', '/about', '/assets', '/index.html', '/404.html'])(
    'test_match_unknown: %s',
    (pathname) => {
      const match = matchRoute(pathname, REG);
      expect(match.route).toBe(NOT_FOUND_ROUTE);
      expect(match.event).toBeNull();
    },
  );

  it.each(['/DanAndShelly/extra', '/pricing/extra', '/a/b/c'])('test_match_nested: %s', (pathname) => {
    const match = matchRoute(pathname, REG);
    expect(match.route).toBe(NOT_FOUND_ROUTE);
    expect(match.event).toBeNull();
  });

  it.each([['/%E0%A4%A'], [undefined], [null], [42]])('test_match_bad_input: %j', (pathname) => {
    let match;
    expect(() => {
      match = matchRoute(pathname, REG);
    }).not.toThrow();
    expect(match.route).toBe(NOT_FOUND_ROUTE);
    expect(match.event).toBeNull();
  });

  it('test_match_encoded', () => {
    const match = matchRoute('/Dan%41ndShelly', REG);
    expect(match.route).toBe(EVENT_ROUTE);
    expect(match.event).toBe(registeredEvent);
  });

  it('test_match_site_page_wins', () => {
    const greedyRegistry = { findBySlug: vi.fn(() => registeredEvent) };

    const match = matchRoute('/pricing', greedyRegistry);

    expect(match.route.id).toBe('pricing');
    expect(match.event).toBeNull();
    expect(greedyRegistry.findBySlug).not.toHaveBeenCalled();

    // The stub does answer for a non-page segment, so the assertion above is meaningful.
    expect(matchRoute('/Anything', greedyRegistry).event).toBe(registeredEvent);
    expect(greedyRegistry.findBySlug).toHaveBeenCalledTimes(1);
  });
});

describe('getDocumentTitle', () => {
  it('test_title_home', () => {
    expect(getDocumentTitle(matchRoute('/', REG))).toBe(SITE_NAME);
  });

  it.each(SITE_SLUGS)('test_title_page: /%s', (slug) => {
    expect(getDocumentTitle(matchRoute(`/${slug}`, REG))).toBe(`${TITLES[slug]} | ${SITE_NAME}`);
  });

  it('test_title_page: pricing literal', () => {
    expect(getDocumentTitle(matchRoute('/pricing', REG))).toBe("Pricing | Weddin'Vaders");
  });

  it('test_title_event', () => {
    expect(getDocumentTitle(matchRoute('/DemoWedding'))).toBe("Bride & Groom | Weddin'Vaders");
    expect(getDocumentTitle(matchRoute(`/${REGISTERED_SLUG}`, REG))).toBe("Shelly & Dan | Weddin'Vaders");
  });

  it('test_title_not_found', () => {
    expect(getDocumentTitle(matchRoute('/NoSuchEvent', REG))).toBe("Event not found | Weddin'Vaders");
  });
});
