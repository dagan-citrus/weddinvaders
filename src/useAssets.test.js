import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAssets } from './useAssets';
import { defaultEvent as D } from './events/defaultEvent';
import { makeEvent } from './events/eventFixtures';
import { makeAltEvent } from './test/gameFixtures';

const mountAssets = (images) =>
  renderHook(({ images: current }) => useAssets(current), { initialProps: { images } });

/** The `src` attribute each of the three image elements was given. */
const sources = (assets) => ({
  bride: assets.bride.getAttribute('src'),
  groom: assets.groom.getAttribute('src'),
  couple: assets.couple.getAttribute('src'),
});

describe('useAssets', () => {
  it('test_assets_load_event_images', () => {
    const { result } = mountAssets(makeAltEvent().images);

    expect(sources(result.current.current)).toEqual({
      bride: '/alt/bride.png', groom: '/alt/groom.png', couple: '/alt/couple.png',
    });
  });

  it('test_assets_default_images', () => {
    const { result } = mountAssets(D.images);

    expect(sources(result.current.current)).toEqual({
      bride: D.images.bride, groom: D.images.groom, couple: D.images.couple,
    });
  });

  it('test_assets_ref_shape', () => {
    const { result } = mountAssets(D.images);

    expect(Object.keys(result.current.current).sort()).toEqual(['bride', 'couple', 'groom', 'loaded']);
    // jsdom never loads images, so the hook cannot have reported them as loaded.
    expect(result.current.current.loaded).toBe(false);
  });

  it('test_assets_reload_on_change', () => {
    const { result, rerender } = mountAssets(makeAltEvent().images);
    const ref = result.current;

    rerender({ images: makeEvent().images });

    expect(result.current).toBe(ref);
    expect(sources(result.current.current)).toEqual({
      bride: '/img/bride.png', groom: '/img/groom.png', couple: '/img/couple.png',
    });
  });

  it('test_assets_stable_on_same_urls', () => {
    const { result, rerender } = mountAssets(makeAltEvent().images);
    const brideElement = result.current.current.bride;

    rerender({ images: { ...makeAltEvent().images } });

    expect(result.current.current.bride).toBe(brideElement);
  });
});
