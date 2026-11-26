import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import App from './App';
import { navigate } from './navigation';

const HOME_PATH = '/';
const EVENT_PATH = '/DemoWedding';
const SITE_NAME = "Weddin'Vaders";
const CANVAS_SELECTOR = 'canvas.game-canvas';
const NAV_NAME = 'Site';
const CURRENT_PAGE = 'page';

const NOT_FOUND_HEADING = 'Event not found';
const NOT_FOUND_ROUTE_ID = 'not-found';
const HOME_LINK_NAME = 'Go to the main site';
const PLACEHOLDER_TEXT = 'Coming soon.';

/** The nav links, in order: accessible name and href. */
const NAV_LINKS = [
  ['Home', '/'],
  ['Demo', '/demo'],
  ['Customize', '/customize'],
  ['Pricing', '/pricing'],
  ['How it works', '/how-it-works'],
  ['Order', '/order'],
  ['Showcase', '/showcase'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
];

/** The site pages that are still placeholders: slug and title. */
const PLACEHOLDER_PAGES = [
  ['customize', 'Customize'],
  ['how-it-works', 'How it works'],
  ['showcase', 'Showcase'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
];

/** Renders the app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

afterEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

const mainHeading = () => screen.getByRole('heading', { level: 1 });
const siteNav = () => screen.getByRole('navigation', { name: NAV_NAME });
const navLink = (name) => within(siteNav()).getByRole('link', { name });
const gameCanvas = () => document.querySelector(CANVAS_SELECTOR);
const mainElement = () => document.querySelector('main');

describe('App routing (component)', () => {
  it('test_home', () => {
    renderAt(HOME_PATH);

    expect(mainHeading()).toHaveTextContent(SITE_NAME);
    expect(mainHeading().textContent).toBe(SITE_NAME);
    expect(mainElement()).toHaveAttribute('data-route', 'home');
    expect(gameCanvas()).toBeNull();

    const links = within(siteNav()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(NAV_LINKS);

    expect(navLink('Home')).toHaveAttribute('aria-current', CURRENT_PAGE);
    for (const link of links.slice(1)) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it.each(PLACEHOLDER_PAGES)('test_placeholder_pages: /%s', (slug, title) => {
    renderAt(`/${slug}`);

    expect(mainHeading().textContent).toBe(title);
    expect(screen.getByText(PLACEHOLDER_TEXT)).toBeInTheDocument();
    expect(mainElement()).toHaveAttribute('data-route', slug);
    expect(gameCanvas()).toBeNull();

    const links = within(siteNav()).getAllByRole('link');
    const current = links.filter((link) => link.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe(title);
    expect(current[0]).toHaveAttribute('aria-current', CURRENT_PAGE);
  });

  it('test_site_page_case_insensitive', () => {
    renderAt('/Pricing/');

    expect(mainHeading().textContent).toBe('Pricing');
    expect(mainElement()).toHaveAttribute('data-route', 'pricing');
  });

  it('test_demo', () => {
    renderAt('/demo');

    expect(gameCanvas()).toBeInTheDocument();
    expect(mainElement()).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it.each([EVENT_PATH, '/demowedding', '/DemoWedding/'])('test_event: %s', (path) => {
    renderAt(path);

    expect(gameCanvas()).toBeInTheDocument();
    expect(mainElement()).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it.each(['/NoSuchEvent', '/DemoWedding/extra', '/about'])('test_not_found: %s', (path) => {
    renderAt(path);

    expect(mainHeading().textContent).toBe(NOT_FOUND_HEADING);
    expect(mainElement()).toHaveAttribute('data-route', NOT_FOUND_ROUTE_ID);
    expect(gameCanvas()).toBeNull();

    const homeLink = within(mainElement()).getByRole('link', { name: HOME_LINK_NAME });
    expect(homeLink).toHaveAttribute('href', HOME_PATH);

    for (const link of within(siteNav()).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('test_not_found_link_goes_home', () => {
    renderAt('/NoSuchEvent');

    fireEvent.click(screen.getByRole('link', { name: HOME_LINK_NAME }));

    expect(mainHeading().textContent).toBe(SITE_NAME);
    expect(window.location.pathname).toBe(HOME_PATH);
    expect(mainElement()).toHaveAttribute('data-route', 'home');
  });

  it('test_nav_click_switches_page', () => {
    renderAt(HOME_PATH);

    fireEvent.click(navLink('Pricing'));

    expect(mainHeading().textContent).toBe('Pricing');
    expect(window.location.pathname).toBe('/pricing');
    expect(navLink('Pricing')).toHaveAttribute('aria-current', CURRENT_PAGE);
    expect(navLink('Home')).not.toHaveAttribute('aria-current');
  });

  it('test_site_to_event_and_back', () => {
    renderAt('/pricing');
    expect(gameCanvas()).toBeNull();

    expect(() => act(() => navigate(EVENT_PATH))).not.toThrow();
    expect(gameCanvas()).toBeInTheDocument();
    expect(mainElement()).toBeNull();

    expect(() => act(() => navigate('/pricing'))).not.toThrow();
    expect(gameCanvas()).toBeNull();
    expect(mainHeading().textContent).toBe('Pricing');
  });

  it('test_query_and_hash_ignored', () => {
    renderAt('/pricing?x=1#y');

    expect(mainHeading().textContent).toBe('Pricing');
    expect(window.location.search).toBe('?x=1');
    expect(window.location.hash).toBe('#y');
  });

  it.each([
    [HOME_PATH, SITE_NAME],
    ['/pricing', "Pricing | Weddin'Vaders"],
    [EVENT_PATH, "Bride & Groom | Weddin'Vaders"],
    ['/nope', "Event not found | Weddin'Vaders"],
  ])('test_document_title: %s', (path, title) => {
    renderAt(path);

    expect(document.title).toBe(title);
  });

  it('test_document_title: follows navigation', () => {
    renderAt(HOME_PATH);
    expect(document.title).toBe(SITE_NAME);

    act(() => navigate('/order'));

    expect(document.title).toBe("Order | Weddin'Vaders");
  });
});
