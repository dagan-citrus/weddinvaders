import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as constants from './constants';
import { defaultEvent as D } from './events/defaultEvent';

// Static scan: the game engine must hold no couple-specific data (it all comes
// from the event it is given), and the default data must live in one place.

// `new URL()` is jsdom's in this environment, which `fileURLToPath` rejects; pass the string.
const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const readSource = (name) => readFileSync(join(SRC_DIR, name), 'utf8');

const GAME_FILES = ['Game.jsx', 'useGameState.js', 'renderer.js', 'levels.js', 'useAssets.js', 'constants.js'];

const EVENTS_IMPORT = /from\s+['"]\.{1,2}\/events/;

const FORBIDDEN_PATTERNS = [
  /\bWEDDING_ITEMS\b/,
  /\bLEVELS\b/,
  /defaultEvent/,
  /\.png/,
  /parent_bride/,
  /parent_groom/,
];

const FORBIDDEN_STRINGS = [
  ...Object.values(D.messages),
  ...D.levels.map((level) => level.name),
];

const DEFAULT_IMAGE_MARKER = '-nobg.png';
const DEFAULT_EVENT_FILE = join('events', 'defaultEvent.js');
const TEST_HELPER_DIR = `test${sep}`;

/** Every non-test `*.js` / `*.jsx` file under `src/`, as a path relative to it. */
function productionSources(dir = SRC_DIR) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return productionSources(path);
    const name = relative(SRC_DIR, path);
    const isSource = /\.jsx?$/.test(name) && !/\.test\.jsx?$/.test(name);
    return isSource && !name.startsWith(TEST_HELPER_DIR) ? [name] : [];
  });
}

describe('game engine sources', () => {
  it('scans the default data it is meant to forbid', () => {
    expect(Object.values(D.messages)).toHaveLength(5);
    expect(D.levels).toHaveLength(5);
    expect(FORBIDDEN_STRINGS.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
  });

  it.each(GAME_FILES)('test_game_files_do_not_import_events: %s', (file) => {
    expect(readSource(file)).not.toMatch(EVENTS_IMPORT);
  });

  describe.each(GAME_FILES)('test_game_files_have_no_default_data: %s', (file) => {
    it.each(FORBIDDEN_PATTERNS)('does not match %s', (pattern) => {
      expect(readSource(file)).not.toMatch(pattern);
    });

    it.each(FORBIDDEN_STRINGS)('does not contain %j', (text) => {
      expect(readSource(file)).not.toContain(text);
    });
  });

  it('test_constants_exports_removed', () => {
    for (const removed of [
      'WEDDING_ITEMS', 'ITEM_SPEED', 'INITIAL_MONEY', 'INITIAL_INVITE', 'INITIAL_HEART',
      'GAME_DURATION', 'ROW_ADVANCE_INTERVAL',
    ]) {
      expect(constants).not.toHaveProperty(removed);
    }
    for (const kept of [
      'AMMO_ORDER', 'AMMO_META', 'AMMO_DAMAGE', 'CANVAS_WIDTH', 'GAME_HEIGHT',
      'ROW_ADVANCE_SPEEDUP', 'HOURGLASS_SLOW_SECONDS',
    ]) {
      expect(constants).toHaveProperty(kept);
    }
  });

  it('test_default_images_only_in_default_event', () => {
    const sources = productionSources();
    const withDefaultImages = sources.filter((name) => readSource(name).includes(DEFAULT_IMAGE_MARKER));

    expect(sources).toContain(DEFAULT_EVENT_FILE);
    expect(sources).toContain('Game.jsx');
    expect(withDefaultImages).toEqual([DEFAULT_EVENT_FILE]);
  });

  it('test_app_passes_default_event', () => {
    expect(readSource('App.jsx')).toContain('defaultEvent');
  });
});
