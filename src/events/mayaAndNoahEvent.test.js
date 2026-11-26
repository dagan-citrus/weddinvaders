import { describe, it, expect } from 'vitest';
import { mayaAndNoahEvent as sample } from './mayaAndNoahEvent';
import { defaultEvent } from './defaultEvent';
import { validateEvent } from './eventConfig';
import { isValidSlug, isReservedSlug } from './slug';

// The alternative sample event of the demo page: a fictional couple whose game
// differs from the default in everything a customer can have customized.

const EXPECTED_MESSAGES = {
  title: 'MAYA & NOAH',
  tagline: 'Throw the garden party of the year!',
  finalMeeting: '🌿  JUST MARRIED!  🌿', // two spaces on each side of JUST MARRIED!
  gameComplete: '🥂 WHAT A PARTY! 🥂',
  lost: '🌧️ Party rained out!',
};

const EXPECTED_ITEM_IDS = [
  'venue', 'band', 'tacos',
  'friend', 'grandma', 'grandpa',
  'planner', 'rain', 'slowdance',
  'lights', 'icecream', 'photobooth',
];

const EXPECTED_LEVEL_NAMES = ['The Backyard', 'Sound Check', 'Golden Hour'];
const EXPECTED_LEVEL_MONEY = [5000, 3000, 2400];
const EXPECTED_LEVEL_MINES = [false, false, true];

/** The side panel cuts level names off after this many characters. */
const PANEL_NAME_MAX_LENGTH = 14;
/** One cash shot pays this much. */
const CASH_SHOT_VALUE = 100;
/** Row steps each player takes before the two meet. */
const ROW_STEPS_TO_MEET = 4;
/** The engine draws this discount and this emoji whatever the event says. */
const ENGINE_DISCOUNT_PCT = 0.3;
const ENGINE_DISCOUNT_EMOJI = '🎀';

const itemsWithEffect = (effect) => sample.items.filter((item) => item.incomeType === effect);

describe('mayaAndNoahEvent', () => {
  it('test_sample_valid', () => {
    expect(validateEvent(sample)).toEqual([]);
  });

  it('test_sample_identity', () => {
    expect(sample.slug).toBe('MayaAndNoah');
    expect(isValidSlug(sample.slug)).toBe(true);
    expect(isReservedSlug(sample.slug)).toBe(false);
    expect(sample.public).toBe(false);
    expect(sample.names).toEqual({ bride: 'Maya', groom: 'Noah' });
  });

  it('test_sample_messages', () => {
    expect(sample.messages).toEqual(EXPECTED_MESSAGES);

    for (const [key, text] of Object.entries(sample.messages)) {
      expect(text, key).not.toBe(defaultEvent.messages[key]);
    }
    expect(Object.keys(sample.messages).sort()).toEqual(Object.keys(defaultEvent.messages).sort());
  });

  it('test_sample_items_differ', () => {
    expect(sample.items).toHaveLength(12);
    expect(sample.items.map((item) => item.id)).toEqual(EXPECTED_ITEM_IDS);

    const defaultIds = defaultEvent.items.map((item) => item.id);
    const defaultLabels = defaultEvent.items.map((item) => item.label);
    for (const item of sample.items) {
      expect(defaultIds, item.id).not.toContain(item.id);
      expect(defaultLabels, item.label).not.toContain(item.label);
    }
  });

  it('test_sample_levels', () => {
    expect(sample.levels.map((level) => level.name)).toEqual(EXPECTED_LEVEL_NAMES);
    expect(sample.levels.map((level) => level.money)).toEqual(EXPECTED_LEVEL_MONEY);
    expect(sample.levels.map((level) => level.hasMines)).toEqual(EXPECTED_LEVEL_MINES);
    expect(sample.levels.length).not.toBe(defaultEvent.levels.length);

    const defaultNames = defaultEvent.levels.map((level) => level.name);
    for (const level of sample.levels) {
      expect(defaultNames, level.name).not.toContain(level.name);
      expect(level.name.length, level.name).toBeLessThanOrEqual(PANEL_NAME_MAX_LENGTH);
    }
  });

  it('test_sample_level1_easy', () => {
    const [level] = sample.levels;
    const venue = sample.items.find((item) => item.id === 'venue');

    expect(level.required).toEqual(['venue']);
    // One cash shot buys the only required item …
    expect(Math.ceil(venue.price * level.priceScale)).toBeLessThanOrEqual(CASH_SHOT_VALUE);
    // … and the two players meet well before the clock runs out.
    expect(ROW_STEPS_TO_MEET * level.rowAdvance).toBeLessThan(level.gameDuration);
  });

  it('test_sample_engine_text_consistent', () => {
    const discounts = itemsWithEffect('discount');
    expect(discounts).toHaveLength(1);
    expect(discounts[0].discountPct).toBe(ENGINE_DISCOUNT_PCT);
    expect(discounts[0].emoji).toBe(ENGINE_DISCOUNT_EMOJI);

    expect(itemsWithEffect('mine')).toHaveLength(1);
    expect(itemsWithEffect('time')).toHaveLength(1);
  });

  it('test_sample_images_shared', () => {
    expect(sample.images).toEqual(defaultEvent.images);
    for (const url of Object.values(sample.images)) {
      expect(typeof url).toBe('string');
      expect(url).not.toBe('');
    }
  });
});
