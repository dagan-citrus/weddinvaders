import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SiteLayout from './SiteLayout';
import { SITE_CONFIG } from '../siteConfig';

const SITE_NAME = "Weddin'Vaders";
const SITE_NAV_NAME = 'Site';
const FOOTER_NAV_NAME = 'Footer';
const CURRENT_PAGE = 'page';
const FOOTER_TAGLINE = 'Custom two-player wedding games, built one couple at a time.';

/** The site nav links, in order: accessible name and href (unchanged from the router task). */
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

const FOOTER_LINKS = [
  ['Privacy policy', '/privacy'],
  ['Terms of service', '/terms'],
  ['Contact us', '/order'],
];

const layout = (routeId) => (
  <SiteLayout routeId={routeId}>
    <h1>X</h1>
  </SiteLayout>
);

const renderLayout = (routeId = 'pricing') => render(layout(routeId));

const banner = () => screen.getByRole('banner');
const main = () => screen.getByRole('main');
const footer = () => screen.getByRole('contentinfo');
const siteNav = () => screen.getByRole('navigation', { name: SITE_NAV_NAME });
const footerNav = () => screen.getByRole('navigation', { name: FOOTER_NAV_NAME });
const namesAndHrefs = (links) => links.map((link) => [link.textContent, link.getAttribute('href')]);

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('SiteLayout (component)', () => {
  it('test_landmarks', () => {
    renderLayout();

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(siteNav()).toBeInTheDocument();
    expect(footerNav()).toBeInTheDocument();
    expect(screen.getAllByRole('navigation')).toHaveLength(2);

    expect(main()).toHaveAttribute('id', 'main');
    expect(main()).toHaveAttribute('data-route', 'pricing');
    expect(main()).toHaveAttribute('tabindex', '-1');
    expect(within(main()).getByRole('heading', { level: 1 })).toHaveTextContent('X');
  });

  it('test_skip_link', () => {
    renderLayout();

    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toHaveAttribute('href', '#main');
    expect(screen.getAllByRole('link')[0]).toBe(skipLink);
  });

  it('test_brand_link', () => {
    renderLayout();

    const brand = within(banner()).getByRole('link', { name: SITE_NAME });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand).not.toHaveAttribute('aria-current');
    expect(siteNav()).not.toContainElement(brand);
    expect(footerNav()).not.toContainElement(brand);
  });

  it('test_brand_link: never marked current, even on the home page', () => {
    renderLayout('home');

    expect(within(banner()).getByRole('link', { name: SITE_NAME })).not.toHaveAttribute('aria-current');
  });

  it('test_site_nav', () => {
    renderLayout();

    expect(banner()).toContainElement(siteNav());
    const links = within(siteNav()).getAllByRole('link');
    expect(namesAndHrefs(links)).toEqual(NAV_LINKS);

    const current = links.filter((link) => link.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Pricing');
    expect(current[0]).toHaveAttribute('aria-current', CURRENT_PAGE);
  });

  it('test_footer_nav', () => {
    renderLayout('privacy');

    expect(footer()).toContainElement(footerNav());
    const links = within(footerNav()).getAllByRole('link');
    expect(namesAndHrefs(links)).toEqual(FOOTER_LINKS);
    for (const link of links) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('test_footer_contact', () => {
    renderLayout();

    const contact = within(footer()).getByRole('link', { name: 'Email us' });
    expect(contact).toHaveAttribute('href', `mailto:${SITE_CONFIG.contactEmail}`);
    expect(footerNav()).not.toContainElement(contact);
    expect(document.body.textContent).not.toContain(SITE_CONFIG.contactEmail);
  });

  it('test_footer_copyright', () => {
    renderLayout();

    const copyright = `© ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.`;
    expect(within(footer()).getByText(copyright)).toBeInTheDocument();
    expect(within(footer()).getByText(FOOTER_TAGLINE)).toBeInTheDocument();
  });

  it('test_focus_not_moved_on_mount', () => {
    renderLayout();

    expect(document.activeElement).toBe(document.body);
  });

  it('test_focus_moves_on_route_change', () => {
    const { rerender } = renderLayout('pricing');

    rerender(layout('order'));
    expect(main()).toHaveAttribute('data-route', 'order');
    expect(document.activeElement).toBe(main());

    main().blur();
    expect(document.activeElement).toBe(document.body);

    rerender(layout('order'));
    expect(document.activeElement).toBe(document.body);
  });
});
