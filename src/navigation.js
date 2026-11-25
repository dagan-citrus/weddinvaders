// Client-side navigation on the History API: the current pathname as React
// state, and a way to change it without reloading the document.
import { useSyncExternalStore } from 'react';

const LOCATION_CHANGE_EVENT = 'popstate';

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

/**
 * Goes to a same-origin path without reloading the document.
 *
 * @param {string} to  Path, optionally with `?query#hash`.
 * @param {{ replace?: boolean }} [options]  `replace` swaps the current history entry instead of adding one.
 */
export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  // pushState/replaceState fire no event of their own.
  window.dispatchEvent(new PopStateEvent(LOCATION_CHANGE_EVENT));
}
