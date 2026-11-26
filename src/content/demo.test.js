import { describe, it, expect } from 'vitest';
import * as content from './index.js';
import * as en from './en/index.js';
import { DEMO_SAMPLES } from '../pages/demoSamples';
import { defaultEvent, mayaAndNoahEvent } from '../events';
import { SITE_CONFIG } from '../siteConfig';

// The demo page's copy: plain frozen data like the rest of src/content, and
// in step with the two sample events it describes.

const { demo } = content;

const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;

const LEVEL_COUNT_WORDS = { 3: 'three', 5: 'five' };

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

const difference = (id) => demo.differences.items.find((item) => item.id === id);

describe('demo page content', () => {
  it('test_content_exports: demo', () => {
    expect(demo).toBeDefined();
    expect(demo).toBe(en.demo);
  });

  it('test_content_frozen: demo', () => {
    const all = containers(demo);

    expect(all.length).toBeGreaterThan(1);
    for (const container of all) {
      expect(Object.isFrozen(container)).toBe(true);
    }
  });

  it('test_content_plain_strings: demo', () => {
    const all = leaves(demo);

    expect(all.length).toBeGreaterThan(0);
    for (const [path, leaf] of all) {
      expect(typeof leaf, path).toBe('string');
      expect(leaf.trim(), path).not.toBe('');
      expect(leaf, path).not.toContain('<');
      expect(leaf, path).not.toContain(SITE_HOST);
      expect(leaf, path).not.toContain(SITE_CONFIG.contactEmail);
    }
  });

  it('test_demo_copy', () => {
    expect(demo.heading).toBe('Play the demo');
    expect(demo.switcher.ariaLabel).toBe('Sample games');
    expect(demo.switcher.samples.map((sample) => sample.label)).toEqual([
      'Classic wedding',
      "Maya & Noah's garden party",
    ]);
    expect(demo.ownPage.link).toBe('Open this sample on its own page');
    expect(demo.cta.primaryCta).toBe('Get your game');
    expect(demo.cta.secondaryCta).toBe('See what you can customize');

    expect(demo.controls.heading).toBe('How to play');
    expect(demo.controls.groups.map((group) => group.id)).toEqual(['keyboard', 'touch']);
    for (const group of demo.controls.groups) {
      expect(group.items, group.id).toHaveLength(3);
    }

    expect(demo.differences.heading).toBe('What changes between the samples');
    expect(demo.differences.items.map((item) => item.id)).toEqual([
      'names', 'messages', 'items', 'levels', 'photos',
    ]);
  });

  it('test_demo_samples_match', () => {
    expect(demo.switcher.samples.map((sample) => sample.id)).toEqual(DEMO_SAMPLES.map((sample) => sample.id));
  });

  it('test_copy_matches_events', () => {
    const events = [defaultEvent, mayaAndNoahEvent];

    // The level counts the copy states are the real ones.
    expect(events.map((event) => event.levels.length)).toEqual([5, 3]);
    for (const event of events) {
      expect(difference('levels').body).toContain(LEVEL_COUNT_WORDS[event.levels.length]);
    }

    for (const event of events) {
      expect(difference('names').body).toContain(event.names.bride);
      expect(difference('names').body).toContain(event.names.groom);
      expect(difference('messages').body).toContain(event.messages.title);
    }
  });

  it('test_copy_matches_events: the touch copy admits there is no sideways movement', () => {
    const touch = demo.controls.groups.find((group) => group.id === 'touch');

    expect(touch.items.join(' ')).toMatch(/do not move sideways/);
  });

  it('test_copy_matches_events: the photo note says the artwork is shared', () => {
    expect(mayaAndNoahEvent.images).toEqual(defaultEvent.images);
    expect(demo.photoNote).toMatch(/same stand-in artwork/);
    expect(difference('photos').body).toMatch(/same stand-in artwork/);
  });
});
