import { describe, it, expect } from 'vitest';
import { getEventPath, buildEventUrl } from './eventUrl';
import { SITE_CONFIG } from '../siteConfig';

const INVALID_SLUG_MESSAGE = /^Invalid event slug: /;

describe('getEventPath', () => {
  it('test_event_path', () => {
    expect(getEventPath('DanAndShelly')).toBe('/DanAndShelly');
  });

  it('test_event_path_hyphen', () => {
    expect(getEventPath('dan-and-shelly')).toBe('/dan-and-shelly');
  });

  it.each([[''], ['a b'], ['ab'], [undefined], [null], ['/DanAndShelly']])(
    'test_event_path_invalid: %o',
    (slug) => {
      expect(() => getEventPath(slug)).toThrow(TypeError);
      expect(() => getEventPath(slug)).toThrow(INVALID_SLUG_MESSAGE);
    },
  );
});

describe('buildEventUrl', () => {
  it('test_event_url_default_base', () => {
    expect(buildEventUrl('DanAndShelly')).toBe('https://weddinvaders.barvazone.com/DanAndShelly');
  });

  it('test_event_url_uses_site_config', () => {
    expect(buildEventUrl('DanAndShelly')).toBe(`${SITE_CONFIG.baseUrl}/DanAndShelly`);
  });

  it.each([['https://example.org'], ['https://example.org/']])(
    'test_event_url_custom_base: %s',
    (baseUrl) => {
      expect(buildEventUrl('DanAndShelly', baseUrl)).toBe('https://example.org/DanAndShelly');
    },
  );

  it('test_event_url_invalid', () => {
    expect(() => buildEventUrl('a b')).toThrow(TypeError);
  });
});
