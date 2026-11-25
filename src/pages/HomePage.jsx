import { SITE_CONFIG } from '../siteConfig';

/** Placeholder home page; the landing page replaces it. */
export default function HomePage() {
  return (
    <>
      <h1>{SITE_CONFIG.name}</h1>
      <p>The main site is coming soon.</p>
    </>
  );
}
