import { describe, it, expect } from 'vitest';
import * as content from './index.js';
import * as en from './en/index.js';
import { defaultEvent, isReservedSlug, isValidSlug } from '../events';
import { SITE_CONFIG } from '../siteConfig';

// The customization page's copy and example data (T7). The page may only claim
// what the event config supports, and its examples must be valid config values.

const { customize } = content;

const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;
const OPTION_IDS = ['names', 'photos', 'messages', 'items', 'levels'];
const FIXED_IDS = ['theme', 'sound', 'language', 'controls'];
const UNSUPPORTED_CLAIM = /theme|colou?r|music|sound|language|translat|leaderboard|analytics|domain/i;
const MAX_ITEM_LABEL_LENGTH = 10;   // item labels are drawn at bold 7px
const MAX_LEVEL_NAME_LENGTH = 14;   // longer names are cut in the side panel
const CASH_SHOT = 100;              // level money must be a multiple of one cash shot

const option = (id) => customize.options.find((entry) => entry.id === id);
const ids = (entries) => entries.map((entry) => entry.id);
const defaultItem = (id) => defaultEvent.items.find((item) => item.id === id);

/** Every nested object and array of `value`, the root included. */
function containers(value, found = []) {
  if (value !== null && typeof value === 'object') {
    found.push(value);
    for (const child of Object.values(value)) containers(child, found);
  }
  return found;
}

/** Every string leaf of `value`, with its dot path. */
function stringLeaves(value, path = '', found = []) {
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) stringLeaves(child, path ? `${path}.${key}` : key, found);
  } else if (typeof value === 'string') {
    found.push([path, value]);
  }
  return found;
}

describe('customize content', () => {
  it('test_exported_and_frozen', () => {
    expect(customize).toBeDefined();
    expect(customize).toBe(en.customize);

    const all = containers(customize);
    expect(all.length).toBeGreaterThan(1);
    for (const container of all) {
      expect(Object.isFrozen(container)).toBe(true);
    }
  });

  it('test_option_ids', () => {
    expect(ids(customize.options)).toEqual(OPTION_IDS);
  });

  it('test_leaves_plain', () => {
    const all = stringLeaves(customize);

    expect(all.length).toBeGreaterThan(0);
    for (const [path, leaf] of all) {
      expect(leaf.trim(), path).not.toBe('');
      expect(leaf, path).not.toContain('<');
      expect(leaf, path).not.toContain(SITE_HOST);
      expect(leaf, path).not.toContain(SITE_CONFIG.contactEmail);
    }
  });

  it('test_no_unsupported_claims', () => {
    const claims = [
      ...stringLeaves(customize.intro, 'intro'),
      ...stringLeaves(customize.options, 'options'),
    ];

    expect(claims.length).toBeGreaterThan(0);
    for (const [path, leaf] of claims) {
      expect(leaf, path).not.toMatch(UNSUPPORTED_CLAIM);
    }
  });

  it('test_fixed_ids', () => {
    expect(ids(customize.fixed.items)).toEqual(FIXED_IDS);
    expect(customize.fixed.heading).toBe('What stays the same');
    for (const item of customize.fixed.items) {
      expect(item.title.trim(), item.id).not.toBe('');
      expect(item.body.trim(), item.id).not.toBe('');
    }
    expect(customize.fixed.note.trim()).not.toBe('');
  });

  it('test_message_fields_match_config', () => {
    const messages = option('messages');
    const keys = Object.keys(defaultEvent.messages);

    expect(ids(messages.fields)).toEqual(keys);
    expect(Object.keys(messages.example)).toEqual(keys);
    for (const key of keys) {
      expect(typeof messages.example[key], key).toBe('string');
      expect(messages.example[key].trim(), key).not.toBe('');
    }
  });

  it('test_photo_fields_match_config', () => {
    expect(ids(option('photos').fields)).toEqual(Object.keys(defaultEvent.images));
  });

  it('test_item_examples_valid', () => {
    const { examples } = option('items');

    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      const original = defaultItem(example.id);
      expect(original, example.id).toBeDefined();
      expect(example.emoji.trim(), example.id).not.toBe('');
      expect(example.label.trim(), example.id).not.toBe('');
      expect(example.label.length, example.id).toBeLessThanOrEqual(MAX_ITEM_LABEL_LENGTH);
      expect(Number.isFinite(example.price), example.id).toBe(true);
      expect(example.price, example.id).toBeGreaterThanOrEqual(0);

      const differs = example.emoji !== original.emoji
        || example.label !== original.label
        || example.price !== original.price;
      expect(differs, example.id).toBe(true);
    }
  });

  it('test_level_example_valid', () => {
    const { example } = option('levels');

    expect(defaultEvent.levels.map((level) => level.id)).toContain(example.levelId);
    expect(example.required.length).toBeGreaterThan(0);
    for (const id of example.required) {
      expect(defaultItem(id), id).toBeDefined();
    }
    expect(example.money % CASH_SHOT).toBe(0);
    expect(example.gameDuration).toBeGreaterThan(0);
    expect(example.name.length).toBeLessThanOrEqual(MAX_LEVEL_NAME_LENGTH);
  });

  it('test_names_example_valid', () => {
    const { example } = option('names');

    expect(isValidSlug(example.slug)).toBe(true);
    expect(isReservedSlug(example.slug)).toBe(false);
    expect(example.bride).not.toBe(defaultEvent.names.bride);
    expect(example.groom).not.toBe(defaultEvent.names.groom);
  });

  it('test_cta_copy', () => {
    expect(customize.cta.primaryCta).toBe('Try the demo');
    expect(customize.cta.secondaryCta).toBe('Get your game');
  });
});
