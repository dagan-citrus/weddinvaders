import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultEvent } from './defaultEvent';
import { validateEvent } from './eventConfig';
import { isValidSlug, isReservedSlug } from './slug';
import { WEDDING_ITEMS } from '../constants';
import { LEVELS } from '../levels';
import brideImage from '../assets/bride-nobg.png';
import groomImage from '../assets/groom-nobg.png';
import coupleImage from '../assets/couple-nobg.png';

// `new URL()` is jsdom's in this environment, which `fileURLToPath` rejects; pass the string.
const RENDERER_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'renderer.js');

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

  it('test_default_items_same_reference', () => {
    expect(defaultEvent.items).toBe(WEDDING_ITEMS);
  });

  it('test_default_levels_same_reference', () => {
    expect(defaultEvent.levels).toBe(LEVELS);
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

  // Guards the temporary second copy of the literals (design DD4); remove in T3.
  it('test_default_messages_match_renderer', () => {
    const rendererSource = readFileSync(RENDERER_FILE, 'utf8');
    for (const message of Object.values(EXPECTED_MESSAGES)) {
      expect(rendererSource).toContain(message);
    }
    for (const message of Object.values(defaultEvent.messages)) {
      expect(rendererSource).toContain(message);
    }
  });
});
