import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { navigate } from '../navigation';
import { demo } from '../content';
import { createRecordingContext } from '../test/recordingContext';
import { installFrameDriver } from '../test/frameDriver';
import { DEFAULT_TITLE_TEXTS, ENGINE_TITLE_LINES } from '../test/gameFixtures';

// The demo page: a site page with the real game embedded, a switcher between
// the two sample events, and a guard that keeps page-navigation keys away from
// the game.

const HOME_PATH = '/';
const DEMO_PATH = '/demo';
const GARDEN_PATH = '/demo?event=garden';
const GARDEN_SEARCH = '?event=garden';

const SITE_NAV_NAME = 'Site';
const SWITCHER_NAME = 'Sample games';
const CLASSIC_LABEL = 'Classic wedding';
const GARDEN_LABEL = "Maya & Noah's garden party";
const CLASSIC_SLUG = 'DemoWedding';
const GARDEN_SLUG = 'MayaAndNoah';

const CANVAS_SELECTOR = 'canvas.game-canvas';
const STAGE_TEST_ID = 'demo-stage';
const SUMMARY_TEST_ID = 'demo-sample-summary';

const DEFAULT_TITLE = "WEDDIN'VADERS";
const DEFAULT_LEVEL_1_AMMO = '💌×12  💕×4';
const DEFAULT_LEVEL_1_MONEY = '💰 $9900';
const MONEY_PREFIX = '💰';

/** Every string the title screen draws for the garden-party sample, in draw order. */
const GARDEN_TITLE_TEXTS = [
  'MAYA & NOAH',
  'Throw the garden party of the year!',
  '👰 Maya  —  A/D move   ·   S ammo   ·   W shoot',
  '🤵 Noah  —  ←/→ move   ·   ↑/↓ ammo   ·   Space shoot',
  ...ENGINE_TITLE_LINES,
  'LEVEL 1', 'The Backyard', 'SCORE', '0', '🏡', 'Garden', 'EXTRAS', '✨', 'Fairy Lights',
];

const DEFAULT_LEGEND = [
  '👰 Bride — A/D move · S ammo · W shoot',
  '🤵 Groom — ←/→ move · ↑/↓ ammo · Space shoot',
];
const GARDEN_LEGEND = [
  '👰 Maya — A/D move · S ammo · W shoot',
  '🤵 Noah — ←/→ move · ↑/↓ ammo · Space shoot',
];

/** Keys that move focus or only modify other keys: they must never reach the game. */
const GUARDED_KEYS = [
  ['Tab', 'Tab'],
  ['Shift', 'ShiftLeft'],
  ['Control', 'ControlLeft'],
  ['Alt', 'AltLeft'],
  ['Meta', 'MetaLeft'],
];
const START_KEY = { key: 'x', code: 'KeyX' };

let driver;
let recording;
let scrollTo;

beforeEach(() => {
  driver = installFrameDriver();
  recording = createRecordingContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(recording.ctx);
  vi.spyOn(Math, 'random').mockReturnValue(0);
  scrollTo = vi.spyOn(window, 'scrollTo');
  delete document.documentElement.dataset.surface;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', HOME_PATH);
});

/** Renders the app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

/** Runs exactly one frame and returns only what that frame drew. */
function lastFrame() {
  recording.reset();
  driver.step(1);
  return [...recording.texts];
}

/** A key press as a real one arrives: on the focused element, bubbling up to `window`. */
const pressKey = (init) => fireEvent.keyDown(document.body, init);

const stage = () => screen.getByTestId(STAGE_TEST_ID);
const section = (id) => document.querySelector(`section[data-section="${id}"]`);
const mainElement = () => document.querySelector('main');
const surface = () => document.documentElement.dataset.surface;
const siteNav = () => screen.getByRole('navigation', { name: SITE_NAV_NAME });
const switcher = () => screen.getByRole('navigation', { name: SWITCHER_NAME });
const sampleLink = (name) => within(switcher()).getByRole('link', { name });
const dataValues = (root, attribute) =>
  [...root.querySelectorAll(`[${attribute}]`)].map((element) => element.getAttribute(attribute));
const withPrefix = (texts, prefix) => texts.filter((text) => String(text).startsWith(prefix));

describe('DemoPage: a site page with the game embedded', () => {
  it('test_demo_in_shell', () => {
    renderAt(DEMO_PATH);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(siteNav()).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(within(siteNav()).getByRole('link', { name: 'Demo' })).toHaveAttribute('aria-current', 'page');

    expect(mainElement()).toHaveAttribute('data-route', 'demo');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe('Play the demo');
    expect(surface()).toBe('site');

    const canvases = document.querySelectorAll(CANVAS_SELECTOR);
    expect(canvases).toHaveLength(1);
    expect(stage()).toHaveAttribute('data-surface', 'game');
    expect(stage()).toContainElement(canvases[0]);
    expect(mainElement()).toContainElement(stage());

    expect(dataValues(document, 'data-section')).toEqual(['intro', 'play', 'controls', 'differences', 'cta']);
    expect(section('intro')).toHaveTextContent(demo.intro);
  });

  it('test_demo_default_event', () => {
    renderAt(DEMO_PATH);

    expect(stage()).toHaveAttribute('data-event-slug', CLASSIC_SLUG);
    expect(stage()).toHaveAttribute('data-sample', 'classic');
    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
    for (const line of DEFAULT_LEGEND) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(screen.getByTestId(SUMMARY_TEST_ID).textContent).toBe(demo.switcher.samples[0].summary);
  });
});

describe('DemoPage: switching between the sample games', () => {
  it('test_switcher_links', () => {
    renderAt(DEMO_PATH);

    const links = within(switcher()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      [CLASSIC_LABEL, DEMO_PATH],
      [GARDEN_LABEL, GARDEN_PATH],
    ]);
    expect(dataValues(switcher(), 'data-sample')).toEqual(['classic', 'garden']);

    expect(sampleLink(CLASSIC_LABEL)).toHaveAttribute('aria-current', 'true');
    expect(sampleLink(GARDEN_LABEL)).not.toHaveAttribute('aria-current');
  });

  it('test_switch_to_sample', () => {
    renderAt(DEMO_PATH);

    fireEvent.click(sampleLink(GARDEN_LABEL));

    const frame = lastFrame();
    expect(frame[0]).toBe('MAYA & NOAH');
    expect(frame).toEqual(GARDEN_TITLE_TEXTS);
    for (const expected of ['The Backyard', 'Garden', 'Fairy Lights']) {
      expect(frame).toContain(expected);
    }
    expect(frame).not.toContain(DEFAULT_TITLE);

    for (const line of GARDEN_LEGEND) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(screen.queryByText(DEFAULT_LEGEND[0])).toBeNull();

    expect(stage()).toHaveAttribute('data-event-slug', GARDEN_SLUG);
    expect(stage()).toHaveAttribute('data-sample', 'garden');
    expect(sampleLink(GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
    expect(sampleLink(CLASSIC_LABEL)).not.toHaveAttribute('aria-current');
    expect(window.location.pathname).toBe(DEMO_PATH);
    expect(window.location.search).toBe(GARDEN_SEARCH);
    expect(screen.getByTestId(SUMMARY_TEST_ID).textContent).toBe(demo.switcher.samples[1].summary);
    expect(document.querySelectorAll(CANVAS_SELECTOR)).toHaveLength(1);
  });

  it('test_switch_resets_and_stops_old_loop', () => {
    renderAt(DEMO_PATH);
    pressKey(START_KEY);
    driver.step(2);
    expect(lastFrame()).toContain(DEFAULT_LEVEL_1_MONEY);

    fireEvent.click(sampleLink(GARDEN_LABEL));

    // One loop only: the classic game's loop was cancelled, the sample's started.
    expect(driver.pending()).toBe(1);
    const sampleTitle = lastFrame();
    expect(sampleTitle).toEqual(GARDEN_TITLE_TEXTS);
    expect(withPrefix(sampleTitle, MONEY_PREFIX)).toEqual([]);

    fireEvent.click(sampleLink(CLASSIC_LABEL));

    expect(driver.pending()).toBe(1);
    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
  });

  it('test_switch_replaces_history', () => {
    renderAt(DEMO_PATH);
    const lengthBefore = window.history.length;

    fireEvent.click(sampleLink(GARDEN_LABEL));
    expect(window.location.search).toBe(GARDEN_SEARCH);
    fireEvent.click(sampleLink(CLASSIC_LABEL));
    expect(window.location.search).toBe('');

    expect(window.history.length).toBe(lengthBefore);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('test_same_sample_click_keeps_game', () => {
    renderAt(DEMO_PATH);
    pressKey(START_KEY);
    expect(lastFrame()).toContain(DEFAULT_LEVEL_1_AMMO);

    fireEvent.click(sampleLink(CLASSIC_LABEL));

    const frame = lastFrame();
    expect(frame).toContain(DEFAULT_LEVEL_1_AMMO);
    expect(frame).not.toContain(DEFAULT_TITLE);
    expect(driver.pending()).toBe(1);
  });

  it('test_modified_click_does_not_switch', () => {
    renderAt(DEMO_PATH);
    // The browser would open the link in a new tab; jsdom cannot, so cancel it afterwards.
    const cancel = (event) => event.preventDefault();
    document.addEventListener('click', cancel);

    try {
      fireEvent.click(sampleLink(GARDEN_LABEL), { ctrlKey: true });
    } finally {
      document.removeEventListener('click', cancel);
    }

    expect(stage()).toHaveAttribute('data-event-slug', CLASSIC_SLUG);
    expect(window.location.search).toBe('');
    expect(sampleLink(CLASSIC_LABEL)).toHaveAttribute('aria-current', 'true');
  });

  it.each([GARDEN_PATH, '/demo?event=GARDEN'])('test_deep_link: %s shows the sample', (path) => {
    renderAt(path);

    expect(lastFrame()[0]).toBe('MAYA & NOAH');
    expect(stage()).toHaveAttribute('data-event-slug', GARDEN_SLUG);
    expect(sampleLink(GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
    expect(sampleLink(CLASSIC_LABEL)).not.toHaveAttribute('aria-current');
  });

  it('test_deep_link: an unknown sample falls back to the classic game', () => {
    renderAt('/demo?event=nope');

    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
    expect(stage()).toHaveAttribute('data-event-slug', CLASSIC_SLUG);
    expect(sampleLink(CLASSIC_LABEL)).toHaveAttribute('aria-current', 'true');
  });

  it('test_nav_demo_returns_to_classic', () => {
    renderAt(GARDEN_PATH);
    expect(stage()).toHaveAttribute('data-event-slug', GARDEN_SLUG);

    fireEvent.click(within(siteNav()).getByRole('link', { name: 'Demo' }));

    expect(stage()).toHaveAttribute('data-event-slug', CLASSIC_SLUG);
    expect(window.location.search).toBe('');
    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
  });
});

describe('DemoPage: keys that belong to the page stay out of the game', () => {
  it.each(GUARDED_KEYS)('test_key_guard: %s does not start the game', (key, code) => {
    renderAt(DEMO_PATH);

    pressKey({ key, code });
    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);

    pressKey(START_KEY);
    const frame = lastFrame();
    expect(frame).toContain(DEFAULT_LEVEL_1_AMMO);
    expect(frame).not.toContain(DEFAULT_TITLE);
  });

  it.each(GUARDED_KEYS)('test_key_guard: %s keeps its default action', (key, code) => {
    renderAt(DEMO_PATH);

    // Focus must still move on Tab: the guard hides the key from the game without cancelling it.
    const notCancelled = pressKey({ key, code });

    expect(notCancelled).toBe(true);
  });

  it('test_key_guard_removed_on_leave', () => {
    renderAt(DEMO_PATH);
    const seen = [];
    const listener = (event) => seen.push(event.key);
    window.addEventListener('keydown', listener);

    try {
      pressKey({ key: 'Tab', code: 'Tab' });
      expect(seen).toEqual([]);

      act(() => navigate('/pricing'));
      pressKey({ key: 'Tab', code: 'Tab' });
      expect(seen).toEqual(['Tab']);
    } finally {
      window.removeEventListener('keydown', listener);
    }
  });
});

describe('DemoPage: copy and links', () => {
  it('test_controls_and_differences', () => {
    renderAt(DEMO_PATH);

    expect(within(section('controls')).getByRole('heading', { level: 2 }).textContent).toBe('How to play');
    expect(dataValues(section('controls'), 'data-controls')).toEqual(['keyboard', 'touch']);
    for (const group of demo.controls.groups) {
      const card = section('controls').querySelector(`[data-controls="${group.id}"]`);
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(group.title);
      expect(within(card).getAllByRole('listitem').map((item) => item.textContent)).toEqual([...group.items]);
    }
    expect(section('controls')).toHaveTextContent(demo.controls.ammoNote);

    expect(within(section('differences')).getByRole('heading', { level: 2 }).textContent)
      .toBe('What changes between the samples');
    expect(dataValues(section('differences'), 'data-difference')).toEqual([
      'names', 'messages', 'items', 'levels', 'photos',
    ]);
    for (const item of demo.differences.items) {
      const card = section('differences').querySelector(`[data-difference="${item.id}"]`);
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(item.title);
      expect(card).toHaveTextContent(item.body);
    }

    expect(screen.getByText(demo.photoNote)).toBeInTheDocument();
    expect(section('play')).toHaveTextContent(demo.ownPage.hint);
  });

  it('test_cta_links', () => {
    renderAt(DEMO_PATH);

    const links = within(section('cta')).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Get your game', '/order'],
      ['See what you can customize', '/customize'],
    ]);
    expect(within(section('cta')).getByRole('heading', { level: 2 }).textContent).toBe(demo.cta.heading);
  });

  it('test_own_page_link', () => {
    renderAt(DEMO_PATH);
    const ownPageLink = () => screen.getByRole('link', { name: 'Open this sample on its own page' });

    expect(ownPageLink()).toHaveAttribute('href', `/${CLASSIC_SLUG}`);

    fireEvent.click(sampleLink(GARDEN_LABEL));
    expect(ownPageLink()).toHaveAttribute('href', `/${GARDEN_SLUG}`);

    fireEvent.click(ownPageLink());

    expect(window.location.pathname).toBe(`/${GARDEN_SLUG}`);
    expect(mainElement()).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(surface()).toBe('game');
    expect(document.querySelectorAll(CANVAS_SELECTOR)).toHaveLength(1);
    expect(lastFrame()).toEqual(GARDEN_TITLE_TEXTS);
  });
});
