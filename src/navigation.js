// Client-side navigation on the History API: the current pathname and query
// string as React state, and a way to change them without reloading the document.
import { useSyncExternalStore } from 'react';

const LOCATION_CHANGE_EVENT = 'popstate';
const HASH_MARK = '#';

function subscribe(onChange) {
  window.addEventListener(LOCATION_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
}

function getPathname() {
  return window.location.pathname;
}

/**
 * The current `window.location.pathname`; re-renders the caller when it changes
 * (navigate(), back/forward).
 *
 * @returns {string}
 */
export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname);
}

function getSearch() {
  return window.location.search;
}

/**
 * The current `window.location.search` (`''` or `?…`); re-renders the caller
 * when it changes (navigate(), back/forward).
 *
 * @returns {string}
 */
export function useLocationSearch() {
  return useSyncExternalStore(subscribe, getSearch);
}

/**
 * Goes to a same-origin path without reloading the document, and scrolls to
 * the top unless the target carries a `#hash` or `scroll` is off.
 *
 * @param {string} to  Path, optionally with `?query#hash`.
 * @param {{ replace?: boolean, scroll?: boolean }} [options]
 *   `replace` swaps the current history entry instead of adding one;
 *   `scroll: false` keeps the scroll position.
 */
export function navigate(to, { replace = false, scroll = true } = {}) {
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  // pushState/replaceState fire no event of their own.
  window.dispatchEvent(new PopStateEvent(LOCATION_CHANGE_EVENT));
  if (scroll && !to.includes(HASH_MARK)) window.scrollTo(0, 0);
}
