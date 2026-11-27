import { describe, it, expect } from 'vitest';
import * as content from './index.js';
import * as en from './en/index.js';
import { NAV_ROUTES, ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';

// All site copy is plain frozen data in src/content, so it can be edited or
// translated without touching a component (requirement G9).

const { common, home } = content;

const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;
const HOME_NAV_LABEL = 'Home';

/** Every nested object and array of `value`, the root included. */
function containers(value, found = []) {
  if (value !== null && typeof value === 'object') {
    found.push(value);
    for (const child of Object.values(value)) containers(child, found);
  }
  return found;
}

/** Every non-container value of `value`, with its dot path. */
function leaves(value, path = '', found = []) {
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) leaves(child, path ? `${path}.${key}` : key, found);
  } else {
    found.push([path, value]);
  }
  return found;
}

describe('site content', () => {
  it('test_content_exports', () => {
    expect(common).toBeDefined();
    expect(home).toBeDefined();
    expect(common).toBe(en.common);
    expect(home).toBe(en.home);
  });

  it.each([['common', common], ['home', home]])('test_content_frozen: %s', (_name, module) => {
    const all = containers(module);

    expect(all.length).toBeGreaterThan(1);
    for (const container of all) {
      expect(Object.isFrozen(container)).toBe(true);
    }
  });

  it.each([['common', common], ['home', home]])('test_content_plain_strings: %s', (_name, module) => {
    const all = leaves(module);

    expect(all.length).toBeGreaterThan(0);
    for (const [path, leaf] of all) {
      expect(typeof leaf, path).toBe('string');
      expect(leaf.trim(), path).not.toBe('');
      expect(leaf, path).not.toContain('<');
      expect(leaf, path).not.toContain(SITE_HOST);
      expect(leaf, path).not.toContain(SITE_CONFIG.contactEmail);
    }
  });

  it('test_nav_labels_cover_routes', () => {
    const expected = Object.fromEntries(
      NAV_ROUTES.map((route) => [route.id, route.id === ROUTE_ID.HOME ? HOME_NAV_LABEL : route.title]),
    );

    expect(common.nav.labels).toEqual(expected);
    expect(Object.keys(common.nav.labels)).toHaveLength(NAV_ROUTES.length);
    expect(common.nav.ariaLabel).toBe('Site');
  });

  it('test_footer_copy', () => {
    expect(common.footer.linkLabels).toEqual({
      privacy: 'Privacy policy',
      terms: 'Terms of service',
      order: 'Contact us',
    });
    expect(common.footer.contactLabel).toBe('Email us');
    expect(common.footer.copyright).toBe('© {year} {name}. All rights reserved.');
    expect(common.footer.navAriaLabel).toBe('Footer');
    expect(common.footer.tagline).toBe('Custom two-player wedding games, built one couple at a time.');
    expect(common.skipToContent).toBe('Skip to content');
  });

  it('test_home_copy', () => {
    expect(home.hero.headline).toBe('Your wedding, as a two-player arcade game.');
    expect(home.hero.primaryCta).toBe('Try the demo');
    expect(home.hero.secondaryCta).toBe('Get your game');
    expect(home.hero.facts).toHaveLength(4);

    expect(home.pitch.heading).toBe('A wedding you have to earn');
    expect(home.pitch.features.map((feature) => feature.id)).toEqual(['coop', 'budget', 'yours']);

    expect(home.steps.heading).toBe('Three steps to your own game');
    expect(home.steps.items.map((step) => step.id)).toEqual(['play', 'tell', 'share']);
    expect(home.steps.items.map((step) => step.title.slice(0, 3))).toEqual(['1. ', '2. ', '3. ']);
    expect(home.steps.items.find((step) => step.id === 'share').body).toContain('{host}');

    expect(home.cta.heading).toBe('Ready to play your wedding?');
    expect(home.cta.primaryCta).toBe('Try the demo');
    expect(home.cta.secondaryCta).toBe('Get your game');
  });
});
