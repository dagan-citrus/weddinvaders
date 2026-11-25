/**
 * Stand-in for a site page that has not been built yet.
 *
 * @param {{ route: import('../routes').RouteDef }} props
 */
export default function PlaceholderPage({ route }) {
  return (
    <>
      <h1>{route.title}</h1>
      <p>Coming soon.</p>
    </>
  );
}
