import { describe, it, expect } from 'vitest';
import * as content from './index.js';
import * as en from './en/index.js';
import { formatPrice } from './format.js';

// The pricing page's packages, add-ons and terms are plain frozen data (G9).
// Prices are bare numbers with one currency field, and every number is an
// example until `pricesArePlaceholder` is switched off (D7).

const { pricing } = content;

const TIER_IDS = ['basic', 'custom', 'premium'];
const ADDON_IDS = ['rush', 'qr', 'hosting'];
const MIN_TIER_FEATURES = 3;

const ISO_CURRENCY = /^[A-Z]{3}$/;
const AMOUNT_IN_TEXT = /[$₪€£]|\b(USD|ILS)\b/;
const DIGIT = /\d/;
const UNSUPPORTED_CLAIM = /leaderboard|analytics|domain|theme|colou?r|music|sound|language|translat|refund|guarantee/i;
const TEMPLATE_TOKEN = /\{(\w+)\}/g;

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

const stringLeaves = () => leaves(pricing).filter(([, leaf]) => typeof leaf === 'string');
/** The copy: every string except the `currency` code, the one place the currency is named. */
const copyLeaves = () => stringLeaves().filter(([path]) => path !== 'currency');
const tokensOf = (text) => [...text.matchAll(TEMPLATE_TOKEN)].map(([, key]) => key);
const tier = (id) => pricing.tiers.find((entry) => entry.id === id);
const featureTexts = (id) => tier(id).features.map((feature) => feature.text);

describe('pricing content', () => {
  it('test_exported_and_frozen', () => {
    expect(pricing).toBeDefined();
    expect(pricing).toBe(en.pricing);

    const all = containers(pricing);
    expect(all.length).toBeGreaterThan(1);
    for (const container of all) {
      expect(Object.isFrozen(container)).toBe(true);
    }
  });

  it('test_flag_and_currency', () => {
    expect(typeof pricing.pricesArePlaceholder).toBe('boolean');
    expect(pricing.currency).toMatch(ISO_CURRENCY);
    expect(() => formatPrice(1, pricing.currency)).not.toThrow();
  });

  it('test_tier_ids', () => {
    expect(pricing.tiers.map((entry) => entry.id)).toEqual(TIER_IDS);

    const addonIds = pricing.addons.map((addon) => addon.id);
    expect(addonIds).toEqual(ADDON_IDS);
    expect(new Set(addonIds).size).toBe(addonIds.length);
  });

  it('test_prices_are_numbers', () => {
    const tierPrices = pricing.tiers.map((entry) => entry.price);
    const addonPrices = pricing.addons.map((addon) => addon.price);

    for (const price of [...tierPrices, ...addonPrices]) {
      expect(typeof price).toBe('number');
      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
    for (let index = 1; index < tierPrices.length; index += 1) {
      expect(tierPrices[index]).toBeGreaterThan(tierPrices[index - 1]);
    }
  });

  it('test_no_amounts_in_strings', () => {
    const strings = copyLeaves();

    expect(strings.length).toBeGreaterThan(0);
    for (const [path, text] of strings) {
      expect(text, path).not.toMatch(AMOUNT_IN_TEXT);
      if (!path.startsWith('notice.')) expect(text, path).not.toMatch(DIGIT);
    }
  });

  it('test_no_unsupported_claims', () => {
    for (const [path, text] of stringLeaves()) {
      expect(text, path).not.toMatch(UNSUPPORTED_CLAIM);
    }
  });

  it('test_tokens_resolve', () => {
    const templated = [
      ...pricing.addons.map((addon) => addon.description),
      ...pricing.terms.items.map((term) => term.text),
    ];
    const used = templated.flatMap(tokensOf);

    expect(used.length).toBeGreaterThan(0);
    for (const token of used) {
      expect(Object.keys(pricing.termValues)).toContain(token);
    }
    for (const [key, value] of Object.entries(pricing.termValues)) {
      expect(Number.isInteger(value), key).toBe(true);
      expect(value, key).toBeGreaterThan(0);
    }
    expect(pricing.termValues.rushDeliveryDays).toBeLessThan(pricing.termValues.deliveryDays);
  });

  it('test_tier_features', () => {
    for (const entry of pricing.tiers) {
      const ids = entry.features.map((feature) => feature.id);

      expect(entry.features.length, entry.id).toBeGreaterThanOrEqual(MIN_TIER_FEATURES);
      expect(new Set(ids).size, entry.id).toBe(ids.length);
      for (const feature of entry.features) {
        expect(typeof feature.text).toBe('string');
        expect(feature.text.trim(), `${entry.id}.${feature.id}`).not.toBe('');
      }
    }
    expect(featureTexts('custom')).toContain('Everything in Basic');
    expect(featureTexts('premium')).toContain('Everything in Custom');
  });

  it('test_notice_copy', () => {
    expect(pricing.notice.title).toBe('Example pricing.');
    expect(pricing.notice.priceTag).toBe('Example price');
    expect(pricing.notice.termsTag).toBe('Example terms');
  });
});
