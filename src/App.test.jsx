import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { CANVAS_WIDTH, GAME_HEIGHT, AMMO_ORDER } from './constants';

const CANVAS_SELECTOR = 'canvas.game-canvas';
const SHOOT_BUTTONS_PER_GAME = 2; // one per player
const PLAYER_COUNT = 2;

describe('App smoke (component)', () => {
  it('C1: mounts the game canvas with the configured dimensions', () => {
    const { container } = render(<App />);
    const canvas = container.querySelector(CANVAS_SELECTOR);

    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', String(CANVAS_WIDTH));
    expect(canvas).toHaveAttribute('height', String(GAME_HEIGHT));
    expect(canvas.getAttribute('width')).toBe('910');
    expect(canvas.getAttribute('height')).toBe('600');
  });

  it('C2: renders ammo buttons for both players plus one shoot button each', () => {
    render(<App />);

    expect(screen.getAllByRole('button')).toHaveLength(
      PLAYER_COUNT * AMMO_ORDER.length + SHOOT_BUTTONS_PER_GAME,
    );
    expect(screen.getAllByRole('button', { name: '👰 SHOOT' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '🤵 SHOOT' })).toHaveLength(1);
  });

  it('C3: shows the key legend for bride and groom', () => {
    render(<App />);

    expect(screen.getByText(/Bride — A\/D move/)).toBeInTheDocument();
    expect(screen.getByText(/Groom — ←\/→ move/)).toBeInTheDocument();
  });

  it('C4: survives keyboard input and a canvas click', () => {
    const { container } = render(<App />);
    const canvas = container.querySelector(CANVAS_SELECTOR);

    expect(() => {
      for (const code of ['Space', 'KeyS', 'ArrowUp', 'KeyW']) {
        fireEvent.keyDown(window, { code });
      }
      fireEvent.click(canvas);
    }).not.toThrow();

    expect(container.querySelector(CANVAS_SELECTOR)).toBeInTheDocument();
  });

  it('C5: unmounts cleanly and removes the canvas', () => {
    const { unmount } = render(<App />);
    expect(document.querySelector('canvas')).not.toBeNull();

    expect(() => unmount()).not.toThrow();
    expect(document.querySelector('canvas')).toBeNull();
  });
});
