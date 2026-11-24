/**
 * Manual `requestAnimationFrame` for tests that drive the game loop frame by frame.
 * Not a test file. Callers undo the stubs with `vi.unstubAllGlobals()` in `afterEach`.
 */
import { vi } from 'vitest';

/**
 * @returns {{ step: (n?: number) => void, pending: () => number }}
 *   `step(n)` runs n frames: each frame calls the callbacks scheduled so far.
 *   `pending()` is the number of scheduled, not yet run or cancelled callbacks.
 */
export function installFrameDriver() {
  const callbacks = new Map();
  let nextId = 1;

  vi.stubGlobal('requestAnimationFrame', (callback) => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    callbacks.delete(id);
  });

  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      const due = [...callbacks.values()];
      callbacks.clear();
      for (const callback of due) callback();
    }
  };
  const pending = () => callbacks.size;

  return { step, pending };
}
