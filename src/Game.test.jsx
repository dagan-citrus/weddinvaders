import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Game from './Game';
import { defaultEvent as D } from './events/defaultEvent';
import { createRecordingContext } from './test/recordingContext';
import { installFrameDriver } from './test/frameDriver';
import { makeAltEvent, DEFAULT_TITLE_TEXTS } from './test/gameFixtures';

const CANVAS_SELECTOR = 'canvas.game-canvas';

let driver;
let recording;

beforeEach(() => {
  driver = installFrameDriver();
  recording = createRecordingContext();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(recording.ctx);
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Runs exactly one frame and returns only what that frame drew. */
function lastFrame() {
  recording.reset();
  driver.step(1);
  return [...recording.texts];
}

const keyDown = (code) => fireEvent.keyDown(window, { code });

const containing = (texts, fragment) => texts.filter((text) => String(text).includes(fragment));

describe('Game: draws and plays the event it is given', () => {
  it('test_game_title_from_event', () => {
    render(<Game event={makeAltEvent()} />);
    const texts = lastFrame();

    expect(texts[0]).toBe('TOM & ANNA');
    expect(texts[1]).toBe('Alt tagline');
    expect(texts).toContain('Alt One');
    expect(texts).toContain('Chuppah');
  });

  it('test_game_title_default', () => {
    render(<Game event={D} />);

    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
  });

  it('test_game_legend_names', () => {
    const { unmount } = render(<Game event={makeAltEvent()} />);
    expect(screen.getByText('👰 Anna — A/D move · S ammo · W shoot')).toBeInTheDocument();
    expect(screen.getByText('🤵 Tom — ←/→ move · ↑/↓ ammo · Space shoot')).toBeInTheDocument();
    unmount();

    render(<Game event={D} />);
    expect(screen.getByText('👰 Bride — A/D move · S ammo · W shoot')).toBeInTheDocument();
    expect(screen.getByText('🤵 Groom — ←/→ move · ↑/↓ ammo · Space shoot')).toBeInTheDocument();
  });

  it('test_game_buttons_unchanged', () => {
    render(<Game event={makeAltEvent()} />);

    expect(screen.getAllByRole('button', { name: '👰 SHOOT' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '🤵 SHOOT' })).toHaveLength(1);
    expect(screen.queryByText(/Anna SHOOT/)).toBeNull();
  });

  it('test_game_plays_event_level', () => {
    render(<Game event={makeAltEvent()} />);

    keyDown('KeyX');
    const texts = lastFrame();

    for (const expected of ['💰 $1000', '1:00', '💌×5  💕×2', 'LEVEL 1', 'Alt One']) {
      expect(texts).toContain(expected);
    }
    expect(texts).not.toContain('TOM & ANNA');
  });

  it('test_game_canvas_click_starts', () => {
    const { container } = render(<Game event={makeAltEvent()} />);

    fireEvent.click(container.querySelector(CANVAS_SELECTOR));

    expect(lastFrame()).toContain('💰 $1000');
  });
});

describe('Game: a new event starts a fresh session', () => {
  /** Default event, started and two frames in; then switched to the alternative event. */
  function playDefaultThenSwitchToAlt() {
    const view = render(<Game event={D} />);
    keyDown('KeyX');
    driver.step(2);
    expect(lastFrame()).toContain('💰 $9900');

    view.rerender(<Game event={makeAltEvent()} />);
    return view;
  }

  it('test_game_resets_on_event_change', () => {
    playDefaultThenSwitchToAlt();

    expect(driver.pending()).toBe(1);

    const title = lastFrame();
    expect(title[0]).toBe('TOM & ANNA');
    expect(title).toContain('Alt One');
    expect(containing(title, "WEDDIN'VADERS")).toEqual([]);
    expect(containing(title, '$9900')).toEqual([]);

    keyDown('KeyX');
    expect(lastFrame()).toContain('💰 $1000');
  });

  it('test_game_switch_back_is_fresh', () => {
    const { rerender } = playDefaultThenSwitchToAlt();
    keyDown('KeyX');
    expect(lastFrame()).toContain('💰 $1000');

    rerender(<Game event={D} />);

    expect(lastFrame()).toEqual(DEFAULT_TITLE_TEXTS);
  });

  it('test_game_same_event_rerender_keeps_state', () => {
    const { rerender } = render(<Game event={D} />);
    keyDown('KeyX');
    driver.step(1);

    rerender(<Game event={D} />);

    const texts = lastFrame();
    expect(texts).toContain('💰 $9900');
    expect(texts).not.toContain("WEDDIN'VADERS");
    expect(driver.pending()).toBe(1);
  });

  it('test_game_unmount_stops_loop', () => {
    const { unmount } = render(<Game event={D} />);
    expect(driver.pending()).toBe(1);

    unmount();

    expect(driver.pending()).toBe(0);
    expect(() => keyDown('Space')).not.toThrow();
  });
});
