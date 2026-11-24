/**
 * A fake 2D canvas context that records what the renderer draws.
 * Not a test file: imported by renderer and component tests.
 */

const noop = () => {};
const gradient = () => ({ addColorStop: noop });

/**
 * @returns {{ ctx: object, texts: string[], images: object[], reset: () => void }}
 *   `texts` collects the first argument of every `fillText` call and `images`
 *   the first argument of every `drawImage` call, both in call order.
 */
export function createRecordingContext() {
  const texts = [];
  const images = [];
  const recorders = {
    fillText: (text) => { texts.push(text); },
    drawImage: (img) => { images.push(img); },
    createLinearGradient: gradient,
  };
  const ctx = new Proxy({}, {
    get: (_target, prop) => recorders[prop] ?? noop,
    set: () => true,
  });
  const reset = () => {
    texts.length = 0;
    images.length = 0;
  };
  return { ctx, texts, images, reset };
}
