import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

// jsdom has no canvas implementation: getContext() returns null, so the game's
// render loop would throw on the first frame. Stand in a 2D context that
// accepts every call and property write and draws nothing.
const noop = () => {};
const gradientStub = () => ({ addColorStop: noop });
const CONTEXT_METHODS_WITH_RESULTS = {
  measureText: () => ({ width: 0 }),
  createLinearGradient: gradientStub,
  createRadialGradient: gradientStub,
  createPattern: gradientStub,
};

const contextStub = new Proxy({}, {
  get: (_target, prop) => CONTEXT_METHODS_WITH_RESULTS[prop] ?? noop,
  set: () => true,
});

HTMLCanvasElement.prototype.getContext = () => contextStub;

// jsdom does not implement scrolling; navigate() scrolls to the top after a page change.
window.scrollTo = () => {};
