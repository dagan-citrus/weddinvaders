import { describe, it, expect } from 'vitest';
import { defaultEvent } from './defaultEvent';
import { validateEvent } from './eventConfig';
import { isValidSlug, isReservedSlug } from './slug';
import { GOLDEN_DEFAULT_ITEMS, GOLDEN_DEFAULT_LEVELS } from '../test/gameFixtures';
import brideImage from '../assets/bride-nobg.png';
import groomImage from '../assets/groom-nobg.png';
import coupleImage from '../assets/couple-nobg.png';

const EXPECTED_MESSAGES = {
  title: "WEDDIN'VADERS",
  tagline: 'Buy the wedding of your dreams!',
  finalMeeting: '🎉  MARRIED!  🎉', // two spaces on each side of MARRIED!
  gameComplete: "🎉 YOU'RE MARRIED! 🎉",
  lost: '💔 Wedding Failed!',
};

describe('defaultEvent', () => {
  it('test_default_valid', () => {
    expect(validateEvent(defaultEvent)).toEqual([]);
  });

  it('test_default_slug', () => {
    expect(defaultEvent.slug).toBe('DemoWedding');
    expect(isValidSlug(defaultEvent.slug)).toBe(true);
    expect(isReservedSlug(defaultEvent.slug)).toBe(false);
  });

  it('test_default_public', () => {
    expect(defaultEvent.public).toBe(true);
  });

  it('test_default_names', () => {
    expect(defaultEvent.names).toEqual({ bride: 'Bride', groom: 'Groom' });
  });

  // The default event owns the game's original data: same order, keys and values.
  it('test_default_items_golden', () => {
    expect(defaultEvent.items).toStrictEqual(GOLDEN_DEFAULT_ITEMS);
  });

  it('test_default_levels_golden', () => {
    expect(defaultEvent.levels).toStrictEqual(GOLDEN_DEFAULT_LEVELS);
  });

  it('test_default_items_snapshot_guard', () => {
    expect(defaultEvent.items.map((item) => item.id)).toEqual([
      'rings', 'officiant', 'catering', 'guest', 'parent_bride', 'parent_groom',
      'discount', 'mine', 'hourglass', 'flowers', 'suit', 'cake',
    ]);
  });

  it('test_default_levels_snapshot_guard', () => {
    expect(defaultEvent.levels).toHaveLength(5);
    expect(defaultEvent.levels.map((level) => level.name)).toEqual([
      'Save the Date', 'The Ceremony', 'The Reception', 'The Full Wedding', 'Dream Wedding',
    ]);
    expect(defaultEvent.levels.map((level) => level.money)).toEqual([9900, 3000, 2500, 2000, 1800]);
  });

  it('test_default_images', () => {
    expect(defaultEvent.images.bride).toBe(brideImage);
    expect(defaultEvent.images.groom).toBe(groomImage);
    expect(defaultEvent.images.couple).toBe(coupleImage);
    for (const url of [defaultEvent.images.bride, defaultEvent.images.groom, defaultEvent.images.couple]) {
      expect(typeof url).toBe('string');
      expect(url).not.toBe('');
    }
  });

  it('test_default_messages', () => {
    expect(defaultEvent.messages).toEqual(EXPECTED_MESSAGES);
  });
});
