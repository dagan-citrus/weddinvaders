// The site's route table and the pure path → route matcher. No JSX here.
// Site pages are derived from SITE_PAGE_SLUGS, so navigation, reserved slugs
// and routing share one source of truth.
import { SITE_CONFIG } from './siteConfig';
import { SITE_PAGE_SLUGS, eventRegistry, normalizeSlug } from './events';

/**
 * @typedef {Object} RouteDef
 * @property {string}      id     Stable route id; a site page's id is its slug.
 * @property {string|null} path   Fixed path, or null when the route has none (event, not-found).
 * @property {string}      title  Page title: heading, nav label and document-title prefix.
 */

/**
 * @typedef {Object} RouteMatch
 * @property {RouteDef} route
 * @property {import('./events/eventConfig').EventConfig|null} event  Set only for the event route.
 */

export const ROUTE_ID = Object.freeze({
  HOME:      'home',
  EVENT:     'event',
  NOT_FOUND: 'not-found',
  ...SITE_PAGE_SLUGS, // a site route's id IS its slug
});

const HOME_PATH = '/';
const TITLE_SEPARATOR = ' | ';

/** Title of each site page, keyed by slug. */
const SITE_PAGE_TITLES = Object.freeze({
  [SITE_PAGE_SLUGS.DEMO]:         'Demo',
  [SITE_PAGE_SLUGS.CUSTOMIZE]:    'Customize',
  [SITE_PAGE_SLUGS.PRICING]:      'Pricing',
  [SITE_PAGE_SLUGS.HOW_IT_WORKS]: 'How it works',
  [SITE_PAGE_SLUGS.ORDER]:        'Order',
  [SITE_PAGE_SLUGS.SHOWCASE]:     'Showcase',
  [SITE_PAGE_SLUGS.PRIVACY]:      'Privacy',
  [SITE_PAGE_SLUGS.TERMS]:        'Terms',
});

/** @type {Readonly<RouteDef>} */
export const HOME_ROUTE = Object.freeze({ id: ROUTE_ID.HOME, path: HOME_PATH, title: SITE_CONFIG.name });

/** @type {Readonly<RouteDef>} */
export const EVENT_ROUTE = Object.freeze({ id: ROUTE_ID.EVENT, path: null, title: '' });

/** @type {Readonly<RouteDef>} */
export const NOT_FOUND_ROUTE = Object.freeze({ id: ROUTE_ID.NOT_FOUND, path: null, title: 'Event not found' });

/** The main-site pages, in SITE_PAGE_SLUGS order. @type {ReadonlyArray<Readonly<RouteDef>>} */
export const SITE_ROUTES = Object.freeze(Object.values(SITE_PAGE_SLUGS).map((slug) => {
  const title = SITE_PAGE_TITLES[slug];
  if (!title) throw new Error(`Site page "${slug}" has no title in routes.js`);
  return Object.freeze({ id: slug, path: `/${slug}`, title });
}));

/** Routes shown in the site navigation, in order. @type {ReadonlyArray<Readonly<RouteDef>>} */
export const NAV_ROUTES = Object.freeze([HOME_ROUTE, ...SITE_ROUTES]);

/**
 * @param {RouteDef} route
 * @param {RouteMatch['event']} [event]
 * @returns {RouteMatch}
 */
function toMatch(route, event = null) {
  return { route, event };
}

/**
 * Resolves a URL pathname to a route. Only the pathname is matched (pass no
 * query or hash). Empty segments are dropped, so trailing and doubled slashes
 * are tolerated; site pages and event slugs match case-insensitively; a site
 * page always wins over an event. Never throws.
 *
 * @param {unknown} pathname  e.g. `window.location.pathname`.
 * @param {{ findBySlug: (slug: string) => object|null }} [registry]  Event lookup; defaults to the app registry.
 * @returns {RouteMatch}
 */
export function matchRoute(pathname, registry = eventRegistry) {
  if (typeof pathname !== 'string') return toMatch(NOT_FOUND_ROUTE);

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return toMatch(NOT_FOUND_ROUTE);
  }

  const segments = decoded.split('/').filter(Boolean);
  if (segments.length === 0) return toMatch(HOME_ROUTE);
  if (segments.length > 1) return toMatch(NOT_FOUND_ROUTE);

  const [segment] = segments;
  const pageId = normalizeSlug(segment);
  const siteRoute = SITE_ROUTES.find((route) => route.id === pageId);
  if (siteRoute) return toMatch(siteRoute);

  const event = registry.findBySlug(segment);
  return event ? toMatch(EVENT_ROUTE, event) : toMatch(NOT_FOUND_ROUTE);
}

/**
 * The document title for a matched route.
 *
 * @param {RouteMatch} match
 * @returns {string}
 */
export function getDocumentTitle({ route, event }) {
  if (route.id === ROUTE_ID.HOME) return SITE_CONFIG.name;
  const pageTitle = route.id === ROUTE_ID.EVENT
    ? `${event.names.bride} & ${event.names.groom}`
    : route.title;
  return `${pageTitle}${TITLE_SEPARATOR}${SITE_CONFIG.name}`;
}
