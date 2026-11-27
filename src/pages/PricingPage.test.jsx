import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import App from '../App';
import PricingPage from './PricingPage';
import { pricing } from '../content';
import { formatPrice } from '../content/format.js';
import { ROUTE_ID, SITE_ROUTES } from '../routes';

const PRICING_ROUTE = SITE_ROUTES.find((route) => route.id === ROUTE_ID.PRICING);
const PRICING_PATH = '/pricing';
const NAV_NAME = 'Site';

const LIVE = { ...pricing, pricesArePlaceholder: false };
const FLAGGED = { ...pricing, pricesArePlaceholder: true };

const TIER_IDS = ['basic', 'custom', 'premium'];
const ADDON_IDS = ['rush', 'qr', 'hosting'];
const TERM_IDS = ['delivery', 'hosting', 'payment'];
const PRICE_COUNT = TIER_IDS.length + ADDON_IDS.length;

const NOTICE_TITLE = 'Example pricing.';
const PRICE_TAG = 'Example price';
const TERMS_TAG = 'Example terms';
const PRICE_NOTE = 'one-time, per event';
const PLACEHOLDER_TEXT = 'Coming soon.';
const SHEKEL = '₪';

const section = (id) => document.querySelector(`section[data-section="${id}"]`);
const tierCard = (id) => document.querySelector(`[data-tier="${id}"]`);
const addonCard = (id) => document.querySelector(`[data-addon="${id}"]`);
const termItem = (id) => document.querySelector(`[data-term="${id}"]`);
const priceOf = (card) => card.querySelector('[data-price]');
const dataValues = (root, attribute) =>
  [...root.querySelectorAll(`[${attribute}]`)].map((element) => element.getAttribute(attribute));
const headingTexts = (level) => screen.getAllByRole('heading', { level }).map((heading) => heading.textContent);
const countOf = (text, pattern) => text.split(pattern).length - 1;

const renderPage = (content) =>
  render(content ? <PricingPage route={PRICING_ROUTE} content={content} /> : <PricingPage route={PRICING_ROUTE} />);

/** Renders the whole app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('PricingPage (component)', () => {
  it('test_sections_in_order', () => {
    renderPage();

    expect(dataValues(document, 'data-section')).toEqual(['intro', 'tiers', 'addons', 'terms', 'cta']);
    expect(headingTexts(1)).toEqual(['Pricing']);
    expect(headingTexts(2)).toEqual(['Packages', 'Add-ons', 'Delivery and hosting', 'Not sure which one?']);
  });

  it('test_renders_every_tier', () => {
    renderPage();

    expect(dataValues(section('tiers'), 'data-tier')).toEqual(pricing.tiers.map((tier) => tier.id));
    expect(pricing.tiers.map((tier) => tier.id)).toEqual(TIER_IDS);

    for (const tier of pricing.tiers) {
      const card = tierCard(tier.id);
      const inCard = within(card);

      expect(inCard.getByRole('heading', { level: 3 }).textContent).toBe(tier.name);
      expect(inCard.getByText(tier.tagline)).toBeInTheDocument();
      expect(inCard.getByText(PRICE_NOTE)).toBeInTheDocument();

      const features = [...card.querySelectorAll('[data-feature]')];
      expect(features.map((feature) => [feature.getAttribute('data-feature'), feature.textContent]))
        .toEqual(tier.features.map((feature) => [feature.id, feature.text]));
    }
  });

  it('test_tier_prices', () => {
    renderPage();

    for (const tier of pricing.tiers) {
      const price = priceOf(tierCard(tier.id));

      expect(price.textContent).toBe(formatPrice(tier.price, pricing.currency));
      expect(price).toHaveAttribute('data-amount', String(tier.price));
      expect(price).toHaveAttribute('data-currency', pricing.currency);
    }
  });

  it('test_tier_prices: the currency is read from the content', () => {
    renderPage({ ...pricing, currency: 'ILS' });

    const price = priceOf(tierCard('basic'));
    expect(price.textContent.startsWith(SHEKEL)).toBe(true);
    expect(price).toHaveAttribute('data-currency', 'ILS');
  });

  it.each([
    ['basic', 'Choose Basic'],
    ['custom', 'Choose Custom'],
    ['premium', 'Choose Premium'],
  ])('test_tier_cta_links: %s', (id, name) => {
    renderPage();

    const links = within(tierCard(id)).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toBe(name);
    expect(links[0]).toHaveAttribute('href', `/order?package=${id}`);
  });

  it('test_tier_cta_click', () => {
    window.history.replaceState(null, '', PRICING_PATH);
    renderPage();

    fireEvent.click(within(tierCard('custom')).getByRole('link', { name: 'Choose Custom' }));

    expect(window.location.pathname).toBe('/order');
    expect(window.location.search).toBe('?package=custom');
  });

  it('test_renders_every_addon', () => {
    renderPage();

    expect(dataValues(section('addons'), 'data-addon')).toEqual(ADDON_IDS);
    expect(addonCard('rush')).toHaveTextContent('Your game ready in 3 days instead of 7.');
    expect(addonCard('hosting')).toHaveTextContent('another 12 months');

    for (const addon of pricing.addons) {
      const card = addonCard(addon.id);

      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(addon.name);
      expect(priceOf(card).textContent).toBe(formatPrice(addon.price, pricing.currency));
      expect(priceOf(card)).toHaveAttribute('data-amount', String(addon.price));
    }
  });

  it('test_terms', () => {
    const { container } = renderPage();

    expect(dataValues(section('terms'), 'data-term')).toEqual(TERM_IDS);
    expect(termItem('delivery')).toHaveTextContent('about 7 days');
    expect(termItem('hosting')).toHaveTextContent('12 months');
    expect(termItem('payment')).toHaveTextContent('No online payment.');
    expect(container.textContent).not.toMatch(/[{}]/);
  });

  it('test_placeholder_on', () => {
    const { container } = renderPage(FLAGGED);

    const notices = screen.getAllByRole('note');
    expect(notices).toHaveLength(1);
    expect(notices[0]).toHaveAttribute('data-testid', 'pricing-placeholder-notice');
    expect(section('intro')).toContainElement(notices[0]);
    expect(notices[0]).toHaveTextContent(NOTICE_TITLE);
    expect(notices[0]).toHaveTextContent(pricing.notice.body);

    expect(countOf(container.textContent, PRICE_TAG)).toBe(PRICE_COUNT);
    for (const card of [...TIER_IDS.map(tierCard), ...ADDON_IDS.map(addonCard)]) {
      expect(countOf(card.textContent, PRICE_TAG)).toBe(1);
    }

    const termsTag = screen.getByTestId('pricing-terms-tag');
    expect(termsTag.textContent).toBe(TERMS_TAG);
    expect(section('terms')).toContainElement(termsTag);
  });

  it('test_placeholder_off', () => {
    const { container } = renderPage(LIVE);

    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByTestId('pricing-placeholder-notice')).toBeNull();
    expect(screen.queryByTestId('pricing-terms-tag')).toBeNull();
    expect(container.textContent).not.toContain(PRICE_TAG);
    expect(container.textContent).not.toContain(TERMS_TAG);
    expect(container.textContent).not.toContain(NOTICE_TITLE);

    const prices = [...container.querySelectorAll('[data-price]')];
    expect(prices).toHaveLength(PRICE_COUNT);
    expect(prices.map((price) => price.textContent)).toEqual(
      [...pricing.tiers, ...pricing.addons].map((entry) => formatPrice(entry.price, pricing.currency)),
    );
  });

  it('test_notice_follows_content_flag', () => {
    renderPage();

    expect(screen.queryAllByRole('note')).toHaveLength(pricing.pricesArePlaceholder ? 1 : 0);
  });

  it('test_closing_cta', () => {
    renderPage();

    const links = within(section('cta')).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['See what can be customized', '/customize'],
      ['Try the demo', '/demo'],
    ]);
  });

  it('test_routed', () => {
    renderAt(PRICING_PATH);

    expect(document.querySelector('main')).toHaveAttribute('data-route', 'pricing');
    expect(screen.queryByText(PLACEHOLDER_TEXT)).toBeNull();
    expect(dataValues(document, 'data-tier')).toEqual(TIER_IDS);

    const nav = screen.getByRole('navigation', { name: NAV_NAME });
    expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page');
  });

  it('test_routed: a query string does not change the page', () => {
    renderAt(`${PRICING_PATH}?utm=x`);

    expect(document.querySelector('main')).toHaveAttribute('data-route', 'pricing');
    expect(dataValues(document, 'data-tier')).toEqual(TIER_IDS);
  });
});
