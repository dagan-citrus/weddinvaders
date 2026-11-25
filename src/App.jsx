import { useEffect } from 'react';
import { usePathname } from './navigation';
import { ROUTE_ID, getDocumentTitle, matchRoute } from './routes';
import SiteLayout from './pages/SiteLayout';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';
import DemoPage from './pages/DemoPage';
import EventPage from './pages/EventPage';

// Page component per site route id; routes without an entry render PlaceholderPage.
const PAGE_COMPONENTS = {
  [ROUTE_ID.HOME]: HomePage,
};

export default function App() {
  const match = matchRoute(usePathname());
  const { route, event } = match;
  const title = getDocumentTitle(match);

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Game pages render the game alone, without the site layout.
  if (route.id === ROUTE_ID.EVENT) return <EventPage event={event} />;
  if (route.id === ROUTE_ID.DEMO) return <DemoPage />;

  const Page = route.id === ROUTE_ID.NOT_FOUND
    ? NotFoundPage
    : PAGE_COMPONENTS[route.id] ?? PlaceholderPage;
  return (
    <SiteLayout routeId={route.id}>
      <Page route={route} />
    </SiteLayout>
  );
}
