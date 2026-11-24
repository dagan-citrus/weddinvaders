import { describe, it, expect } from 'vitest';
import {
  SLUG_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  SITE_PAGE_SLUGS,
  RESERVED_SLUGS,
  normalizeSlug,
  isValidSlug,
  isReservedSlug,
} from './slug';

const PLAN_PAGE_PATHS = ['demo', 'customize', 'pricing', 'how-it-works', 'order', 'showcase', 'privacy', 'terms'];
const EXTRA_RESERVED = [
  'assets', 'index', '404', 'home', 'about', 'contact', 'faq',
  'packages', 'events', 'admin', 'api', 'help', 'legal',
];

describe('normalizeSlug', () => {
  it('test_normalize_lowercases', () => {
    expect(normalizeSlug('DanAndShelly')).toBe('danandshelly');
  });

  it('test_normalize_trims', () => {
    expect(normalizeSlug('  Dan-And-Shelly ')).toBe('dan-and-shelly');
  });

  it('test_normalize_idempotent', () => {
    expect(normalizeSlug(normalizeSlug(' AbC '))).toBe('abc');
  });

  it.each([[undefined], [null], [42], [{}]])('test_normalize_non_string: %o', (input) => {
    expect(normalizeSlug(input)).toBe('');
  });

  it('test_normalize_empty', () => {
    expect(normalizeSlug('')).toBe('');
  });
});

describe('isValidSlug', () => {
  it('test_slug_length_constants', () => {
    expect(SLUG_MIN_LENGTH).toBe(3);
    expect(SLUG_MAX_LENGTH).toBe(40);
  });

  it.each([
    ['DanAndShelly'],
    ['dan-and-shelly'],
    ['abc'],
    ['2026Wedding'],
    ['a'.repeat(40)],
    ['A1-b2-C3'],
  ])('test_valid_slugs: %o', (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    ['ab'],
    ['a'.repeat(41)],
    [''],
    [' Dan'],
    ['Dan '],
    ['Dan Shelly'],
    ['dan_shelly'],
    ['-dan'],
    ['dan-'],
    ['dan--shelly'],
    ['dan/shelly'],
    ['dan.shelly'],
    ['café'],
    ['דן-ושלי'],
    [null],
    [undefined],
    [42],
  ])('test_invalid_slugs: %o', (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });
});

describe('reserved slugs', () => {
  it.each(PLAN_PAGE_PATHS)('test_reserved_contains_plan_paths: %s', (path) => {
    expect(RESERVED_SLUGS).toContain(path);
  });

  it.each(EXTRA_RESERVED)('test_reserved_contains_extras: %s', (path) => {
    expect(RESERVED_SLUGS).toContain(path);
  });

  it('test_reserved_normalised_unique_frozen', () => {
    expect(RESERVED_SLUGS.length).toBeGreaterThan(0);
    for (const entry of RESERVED_SLUGS) {
      expect(entry).toBe(normalizeSlug(entry));
    }
    expect(new Set(RESERVED_SLUGS).size).toBe(RESERVED_SLUGS.length);
    expect(Object.isFrozen(RESERVED_SLUGS)).toBe(true);
  });

  it('test_site_page_slugs', () => {
    expect(SITE_PAGE_SLUGS).toEqual({
      DEMO: 'demo',
      CUSTOMIZE: 'customize',
      PRICING: 'pricing',
      HOW_IT_WORKS: 'how-it-works',
      ORDER: 'order',
      SHOWCASE: 'showcase',
      PRIVACY: 'privacy',
      TERMS: 'terms',
    });
    for (const value of Object.values(SITE_PAGE_SLUGS)) {
      expect(RESERVED_SLUGS).toContain(value);
    }
  });

  it.each([['Demo'], [' PRICING '], ['How-It-Works'], ['404']])(
    'test_is_reserved_case_insensitive: %o',
    (slug) => {
      expect(isReservedSlug(slug)).toBe(true);
    },
  );

  it.each([['DanAndShelly'], ['demos'], [''], [undefined]])('test_is_reserved_false: %o', (slug) => {
    expect(isReservedSlug(slug)).toBe(false);
  });
});
