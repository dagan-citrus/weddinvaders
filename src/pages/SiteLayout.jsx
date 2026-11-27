import { useEffect, useRef } from 'react';
import Link from '../Link';
import { HOME_ROUTE, NAV_ROUTES, ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';
import { common } from '../content';
import { fillTemplate } from '../content/format.js';
import '../styles/tokens.css';
import '../styles/site.css';

const MAIN_ID = 'main';
const CURRENT_PAGE = 'page';

/** Footer links, in order; each is one of the site's routes. */
const FOOTER_ROUTES = [ROUTE_ID.PRIVACY, ROUTE_ID.TERMS, ROUTE_ID.ORDER]
  .map((id) => NAV_ROUTES.find((route) => route.id === id));

/**
 * Shared frame of every main-site page: skip link, header with the site
 * navigation, the page's `<main>`, and the footer.
 *
 * @param {{ routeId: string, children: import('react').ReactNode }} props
 */
export default function SiteLayout({ routeId, children }) {
  const mainRef = useRef(null);
  const previousRouteId = useRef(routeId);

  // After in-app navigation, move focus to the new page's content. Comparing
  // with the previous id (not a first-render flag) leaves the initial load alone.
  useEffect(() => {
    if (previousRouteId.current === routeId) return;
    previousRouteId.current = routeId;
    mainRef.current.focus({ preventScroll: true });
  }, [routeId]);

  const { nav, footer } = common;
  const copyright = fillTemplate(footer.copyright, {
    year: new Date().getFullYear(),
    name: SITE_CONFIG.name,
  });

  return (
    <div className="site">
      <a className="site-skip" href={`#${MAIN_ID}`}>{common.skipToContent}</a>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link className="site-brand" to={HOME_ROUTE.path}>{SITE_CONFIG.name}</Link>
          <nav className="site-nav" aria-label={nav.ariaLabel}>
            {NAV_ROUTES.map((route) => (
              <Link
                key={route.id}
                className="site-nav-link"
                to={route.path}
                aria-current={route.id === routeId ? CURRENT_PAGE : undefined}
              >
                {nav.labels[route.id]}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id={MAIN_ID} className="site-main" data-route={routeId} tabIndex={-1} ref={mainRef}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-container">
          <p className="site-footer-tagline">{footer.tagline}</p>
          <nav className="site-footer-nav" aria-label={footer.navAriaLabel}>
            {FOOTER_ROUTES.map((route) => (
              <Link key={route.id} to={route.path}>{footer.linkLabels[route.id]}</Link>
            ))}
          </nav>
          <a className="site-footer-contact" href={`mailto:${SITE_CONFIG.contactEmail}`}>
            {footer.contactLabel}
          </a>
          <p className="site-footer-copyright">{copyright}</p>
        </div>
      </footer>
    </div>
  );
}
