import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import App from './App';
import { navigate } from './navigation';

// The site shell around every main-site page, and the surface attribute that
// keeps the game's page-level CSS and the site's CSS apart.

const HOME_PATH = '/';
const EVENT_PATH = '/DemoWedding';
const SAMPLE_EVENT_PATH = '/MayaAndNoah';
const DEMO_PATH = '/demo';
const SITE_NAME = "Weddin'Vaders";
const SITE_NAV_NAME = 'Site';
const FOOTER_NAV_NAME = 'Footer';
const SITE_SURFACE = 'site';
const GAME_SURFACE = 'game';
const CANVAS_SELECTOR = 'canvas.game-canvas';

/** Renders the app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

const surface = () => document.documentElement.dataset.surface;
const mainHeading = () => screen.getByRole('heading', { level: 1 });
const mainElement = () => document.querySelector('main');
const siteNav = () => screen.getByRole('navigation', { name: SITE_NAV_NAME });
const footerNav = () => screen.getByRole('navigation', { name: FOOTER_NAV_NAME });

beforeEach(() => {
  delete document.documentElement.dataset.surface;
});

afterEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

describe('App shell and surface (component)', () => {
  it.each([HOME_PATH, '/pricing', '/NoSuchEvent', DEMO_PATH])('test_surface_site: %s', (path) => {
    renderAt(path);

    expect(surface()).toBe(SITE_SURFACE);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it.each([SAMPLE_EVENT_PATH, EVENT_PATH])('test_surface_game: %s', (path) => {
    renderAt(path);

    expect(surface()).toBe(GAME_SURFACE);
    expect(document.querySelector(CANVAS_SELECTOR)).toBeInTheDocument();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(mainElement()).toBeNull();
    expect(document.querySelector('.site')).toBeNull();
  });

  it('test_surface_follows_navigation', () => {
    renderAt(HOME_PATH);
    expect(surface()).toBe(SITE_SURFACE);

    act(() => navigate(EVENT_PATH));
    expect(surface()).toBe(GAME_SURFACE);

    act(() => navigate('/pricing'));
    expect(surface()).toBe(SITE_SURFACE);
  });

  it.each([
    ['/terms', 'Terms'],
    ['/nope', 'Event not found'],
  ])('test_shell_on_placeholder_and_not_found: %s', (path, heading) => {
    renderAt(path);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(siteNav()).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(mainHeading().textContent).toBe(heading);
    expect(mainElement()).toContainElement(mainHeading());
  });

  it('test_focus_after_nav_click', () => {
    renderAt(HOME_PATH);
    expect(document.activeElement).not.toBe(mainElement());

    fireEvent.click(within(siteNav()).getByRole('link', { name: 'Pricing' }));

    expect(mainHeading().textContent).toBe('Pricing');
    expect(document.activeElement).toBe(mainElement());
  });

  it('test_footer_link_navigates', () => {
    renderAt(HOME_PATH);
    expect(mainHeading().textContent).toBe(SITE_NAME);

    fireEvent.click(within(footerNav()).getByRole('link', { name: 'Privacy policy' }));

    expect(mainHeading().textContent).toBe('Privacy');
    expect(window.location.pathname).toBe('/privacy');
  });
});
