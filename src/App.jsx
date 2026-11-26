import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from './navigation';
import { ROUTE_ID, getDocumentTitle, matchRoute } from './routes';
import SiteLayout from './pages/SiteLayout';
import HomePage from './pages/HomePage';
import CustomizePage from './pages/CustomizePage';
import PricingPage from './pages/PricingPage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';
import DemoPage from './pages/DemoPage';
import EventPage from './pages/EventPage';

// Page component per site route id; routes without an entry render PlaceholderPage.
const PAGE_COMPONENTS = {
  [ROUTE_ID.HOME]: HomePage,
  [ROUTE_ID.CUSTOMIZE]: CustomizePage,
  [ROUTE_ID.PRICING]: PricingPage,
  [ROUTE_ID.DEMO]: DemoPage,
};

// Which page-level CSS applies: the game's own (index.css, Game.css) or the site's.
const SURFACE = Object.freeze({ GAME: 'game', SITE: 'site' });

export default function App() {
  const match = matchRoute(usePathname());
  const { route, event } = match;
  const title = getDocumentTitle(match);

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Only event pages are the game alone; the demo embeds it inside the site.
  const surface = route.id === ROUTE_ID.EVENT ? SURFACE.GAME : SURFACE.SITE;
  // Before paint, so a page never shows with the other surface's styles.
  useLayoutEffect(() => {
    document.documentElement.dataset.surface = surface;
  }, [surface]);

  // An event page renders the game alone, without the site layout.
  if (route.id === ROUTE_ID.EVENT) return <EventPage event={event} />;

  const Page = route.id === ROUTE_ID.NOT_FOUND
    ? NotFoundPage
    : PAGE_COMPONENTS[route.id] ?? PlaceholderPage;
  return (
    <SiteLayout routeId={route.id}>
      <Page route={route} />
    </SiteLayout>
  );
}
