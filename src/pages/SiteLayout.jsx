import Link from '../Link';
import { NAV_ROUTES, ROUTE_ID } from '../routes';

const NAV_LABEL = 'Site';
const HOME_NAV_LABEL = 'Home';
const CURRENT_PAGE = 'page';

/**
 * Shared frame of every main-site page: the site navigation and the page's `<main>`.
 *
 * @param {{ routeId: string, children: import('react').ReactNode }} props
 */
export default function SiteLayout({ routeId, children }) {
  return (
    <div className="site">
      <nav aria-label={NAV_LABEL}>
        {NAV_ROUTES.map((route) => (
          <Link
            key={route.id}
            to={route.path}
            aria-current={route.id === routeId ? CURRENT_PAGE : undefined}
          >
            {route.id === ROUTE_ID.HOME ? HOME_NAV_LABEL : route.title}
          </Link>
        ))}
      </nav>
      <main data-route={routeId}>{children}</main>
    </div>
  );
}
