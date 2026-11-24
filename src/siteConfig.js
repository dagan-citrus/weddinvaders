// Site-wide configuration — the ONLY place the site's hostname and contact
// details may appear (requirement G8). Change the domain here and nowhere else.

/** Stand-in contact address. Must be replaced with a real one before the order form ships. */
export const PLACEHOLDER_CONTACT_EMAIL = 'contact@example.com';

/**
 * @typedef {Object} SiteConfig
 * @property {string} name          Product name as shown to visitors.
 * @property {string} baseUrl       Site origin, without a trailing slash.
 * @property {string} contactEmail  Address that orders and enquiries go to.
 */

/** @type {Readonly<SiteConfig>} */
export const SITE_CONFIG = Object.freeze({
  name:         "Weddin'Vaders",
  baseUrl:      'https://weddinvaders.barvazone.com', // origin only, no trailing slash
  contactEmail: PLACEHOLDER_CONTACT_EMAIL,
});

/**
 * Builds an absolute URL on the site. Slashes between base and path are
 * normalised to exactly one; the path is neither encoded nor validated.
 *
 * @param {string} [path]     Site path, with or without a leading slash.
 * @param {string} [baseUrl]  Origin to build on; defaults to the configured site.
 * @returns {string}
 */
export function buildSiteUrl(path = '', baseUrl = SITE_CONFIG.baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');
  const relativePath = path.replace(/^\/+/, '');
  return `${base}/${relativePath}`;
}
