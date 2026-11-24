import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { usePathname, navigate } from './navigation';

const HOME_PATH = '/';
const PATH_TEST_ID = 'path';

function PathProbe() {
  return <span data-testid={PATH_TEST_ID}>{usePathname()}</span>;
}

/** Renders the probe with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<PathProbe />);
}

const shownPath = () => screen.getByTestId(PATH_TEST_ID).textContent;

beforeEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

afterEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

describe('navigation', () => {
  it('test_pathname_initial', () => {
    renderAt('/pricing');

    expect(shownPath()).toBe('/pricing');
  });

  it('test_navigate_push', () => {
    renderAt('/pricing');
    const lengthBefore = window.history.length;

    act(() => navigate('/order'));

    expect(shownPath()).toBe('/order');
    expect(window.location.pathname).toBe('/order');
    expect(window.history.length).toBe(lengthBefore + 1);
  });

  it('test_navigate_replace', () => {
    renderAt('/pricing');
    const lengthBefore = window.history.length;

    act(() => navigate('/terms', { replace: true }));

    expect(shownPath()).toBe('/terms');
    expect(window.location.pathname).toBe('/terms');
    expect(window.history.length).toBe(lengthBefore);
  });

  it('test_navigate_keeps_query_hash', () => {
    renderAt(HOME_PATH);

    act(() => navigate('/pricing?plan=a#top'));

    expect(shownPath()).toBe('/pricing');
    expect(window.location.pathname).toBe('/pricing');
    expect(window.location.search).toBe('?plan=a');
    expect(window.location.hash).toBe('#top');
  });

  it('test_popstate_rerenders', () => {
    renderAt('/pricing');

    act(() => {
      window.history.replaceState(null, '', '/showcase');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(shownPath()).toBe('/showcase');
  });

  it('test_unsubscribes', () => {
    const { unmount } = renderAt('/pricing');
    unmount();

    expect(() => navigate(HOME_PATH)).not.toThrow();
    expect(window.location.pathname).toBe(HOME_PATH);
  });
});
