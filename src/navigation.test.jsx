import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { usePathname, useLocationSearch, navigate } from './navigation';

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

const SEARCH_TEST_ID = 'search';

function SearchProbe() {
  return <span data-testid={SEARCH_TEST_ID}>{useLocationSearch()}</span>;
}

const shownSearch = () => screen.getByTestId(SEARCH_TEST_ID).textContent;

beforeEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it('test_navigate_scrolls_top', () => {
    renderAt('/pricing');
    const scrollTo = vi.spyOn(window, 'scrollTo');

    act(() => navigate('/order'));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('test_navigate_replace_scrolls_top', () => {
    renderAt('/pricing');
    const scrollTo = vi.spyOn(window, 'scrollTo');

    act(() => navigate('/terms', { replace: true }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('test_navigate_hash_does_not_scroll', () => {
    renderAt(HOME_PATH);
    const scrollTo = vi.spyOn(window, 'scrollTo');

    act(() => navigate('/pricing#faq'));

    expect(window.location.hash).toBe('#faq');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('test_search_hook', () => {
    window.history.replaceState(null, '', '/demo');
    render(<SearchProbe />);
    expect(shownSearch()).toBe('');

    act(() => navigate('/demo?event=garden'));
    expect(shownSearch()).toBe('?event=garden');

    act(() => navigate('/demo'));
    expect(shownSearch()).toBe('');
  });

  it('test_search_hook: follows back and forward', () => {
    window.history.replaceState(null, '', '/demo');
    render(<SearchProbe />);

    act(() => {
      window.history.replaceState(null, '', '/demo?event=garden');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(shownSearch()).toBe('?event=garden');
  });

  it('test_navigate_no_scroll_option', () => {
    renderAt('/demo');
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const lengthBefore = window.history.length;

    act(() => navigate('/demo?event=garden', { replace: true, scroll: false }));

    expect(window.location.search).toBe('?event=garden');
    expect(scrollTo).not.toHaveBeenCalled();
    expect(window.history.length).toBe(lengthBefore);
  });

  it('test_navigate_no_scroll_option: scrolling stays the default', () => {
    renderAt('/demo');
    const scrollTo = vi.spyOn(window, 'scrollTo');

    act(() => navigate('/demo?event=garden', { replace: true }));

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
