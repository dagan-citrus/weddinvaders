import { useEffect, useRef, useState } from 'react';

/**
 * Preloads an event's three character images.
 * Returns a ref whose `.current` always has the latest state:
 *   { bride, groom, couple, loaded }
 * Using a ref (not state) so the renderer can read it each frame
 * without triggering React re-renders.
 *
 * @param {import('./events/eventConfig').EventImages} images  image URLs
 */
export function useAssets(images) {
  const assetsRef = useRef({ bride: null, groom: null, couple: null, loaded: false });
  const [, forceUpdate] = useState(0);
  const { bride: brideSrc, groom: groomSrc, couple: coupleSrc } = images;

  useEffect(() => {
    assetsRef.current.loaded = false;
    let done = 0;
    const onLoad = () => {
      done++;
      if (done === 3) {
        assetsRef.current.loaded = true;
        forceUpdate(n => n + 1);
      }
    };

    const bride  = new Image(); bride.onload  = onLoad; bride.src  = brideSrc;
    const groom  = new Image(); groom.onload  = onLoad; groom.src  = groomSrc;
    const couple = new Image(); couple.onload = onLoad; couple.src = coupleSrc;

    assetsRef.current.bride  = bride;
    assetsRef.current.groom  = groom;
    assetsRef.current.couple = couple;
  }, [brideSrc, groomSrc, coupleSrc]);

  return assetsRef;
}
