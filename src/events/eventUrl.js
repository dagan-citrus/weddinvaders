import { SITE_CONFIG, buildSiteUrl } from '../siteConfig';
import { isValidSlug } from './slug';

/**
 * Route path of an event page. Takes the slug string (not an event) so a URL
 * can be previewed before the event exists. Case is preserved; reserved slugs
 * are not rejected here.
 *
 * @param {string} slug
 * @returns {string} e.g. '/DanAndShelly'
 * @throws {TypeError} When the slug is not well-formed.
 */
export function getEventPath(slug) {
  if (!isValidSlug(slug)) {
    throw new TypeError(`Invalid event slug: ${JSON.stringify(slug)}`);
  }
  return `/${slug}`;
}

/**
 * Absolute URL of an event page.
 *
 * @param {string} slug
 * @param {string} [baseUrl]  Origin to build on; defaults to the configured site.
 * @returns {string} e.g. 'https://example.org/DanAndShelly'
 * @throws {TypeError} When the slug is not well-formed.
 */
export function buildEventUrl(slug, baseUrl = SITE_CONFIG.baseUrl) {
  return buildSiteUrl(getEventPath(slug), baseUrl);
}
