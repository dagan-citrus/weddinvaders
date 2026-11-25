import Link from '../Link';
import { HOME_ROUTE, NOT_FOUND_ROUTE } from '../routes';

/** Shown for any path that is neither a site page nor a registered event. */
export default function NotFoundPage() {
  return (
    <>
      <h1>{NOT_FOUND_ROUTE.title}</h1>
      <p>We couldn&apos;t find an event at this address. Check the link you were given.</p>
      <Link to={HOME_ROUTE.path}>Go to the main site</Link>
    </>
  );
}
