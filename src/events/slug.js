// Event slugs — the `<EventName>` in `/<EventName>`.
// A slug keeps its display case (`DanAndShelly`); matching uses normalizeSlug().

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

// ASCII letters/digits, with single hyphens only between alphanumeric runs.
const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/**
 * Returns the key used to compare slugs: trimmed and lowercased.
 * Does not validate, strip slashes or URL-decode.
 *
 * @param {unknown} input
 * @returns {string} The normalised slug, or '' when input is not a string.
 */
export function normalizeSlug(input) {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

/**
 * Whether a value is a well-formed slug. Checks format only — it says nothing
 * about the slug being reserved or already taken. The value is not trimmed.
 *
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidSlug(slug) {
  return typeof slug === 'string'
    && slug.length >= SLUG_MIN_LENGTH
    && slug.length <= SLUG_MAX_LENGTH
    && SLUG_PATTERN.test(slug);
}

/** Paths of the main-site pages (without the leading slash). */
export const SITE_PAGE_SLUGS = Object.freeze({
  DEMO:         'demo',
  CUSTOMIZE:    'customize',
  PRICING:      'pricing',
  HOW_IT_WORKS: 'how-it-works',
  ORDER:        'order',
  SHOWCASE:     'showcase',
  PRIVACY:      'privacy',
  TERMS:        'terms',
});

/**
 * Slugs no event may use: the site pages, paths the host serves itself
 * (`assets` is Vite's output directory), and names kept for future pages.
 * All lowercase.
 *
 * @type {ReadonlyArray<string>}
 */
export const RESERVED_SLUGS = Object.freeze([
  ...Object.values(SITE_PAGE_SLUGS),
  'assets', 'index', '404',
  'home', 'about', 'contact', 'faq', 'packages', 'events', 'admin', 'api', 'help', 'legal',
]);

/**
 * Whether a slug collides with a reserved path, ignoring case and outer whitespace.
 *
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isReservedSlug(slug) {
  return RESERVED_SLUGS.includes(normalizeSlug(slug));
}
