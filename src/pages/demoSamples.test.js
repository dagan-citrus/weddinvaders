import { describe, it, expect } from 'vitest';
import { DEMO_EVENT_PARAM, DEMO_SAMPLES, getDemoSample, getDemoSamplePath } from './demoSamples';
import { defaultEvent, mayaAndNoahEvent } from '../events';

// Which sample game the demo page shows, as read from and written to the URL.

const CLASSIC_ID = 'classic';
const GARDEN_ID = 'garden';
const DEMO_PATH = '/demo';
const GARDEN_PATH = '/demo?event=garden';

const sampleById = (id) => DEMO_SAMPLES.find((sample) => sample.id === id);
const queryOf = (path) => path.slice(DEMO_PATH.length);

describe('demo samples', () => {
  it('test_samples', () => {
    expect(DEMO_SAMPLES.map((sample) => sample.id)).toEqual([CLASSIC_ID, GARDEN_ID]);
    expect(DEMO_SAMPLES[0].event).toBe(defaultEvent);
    expect(DEMO_SAMPLES[1].event).toBe(mayaAndNoahEvent);
    expect(Object.isFrozen(DEMO_SAMPLES)).toBe(true);
    expect(DEMO_EVENT_PARAM).toBe('event');
  });

  it.each(['', '?', '?event=', '?event=nope', '?other=garden'])('test_get_sample_default: %j', (search) => {
    expect(getDemoSample(search)).toBe(sampleById(CLASSIC_ID));
  });

  it.each([undefined, null])('test_get_sample_default: %j does not throw', (search) => {
    expect(getDemoSample(search)).toBe(sampleById(CLASSIC_ID));
  });

  it.each(['?event=garden', '?event=GARDEN', '?x=1&event=garden', '?event=%20garden%20'])(
    'test_get_sample_param: %j',
    (search) => {
      expect(getDemoSample(search)).toBe(sampleById(GARDEN_ID));
    },
  );

  it('test_sample_paths', () => {
    expect(getDemoSamplePath(sampleById(CLASSIC_ID))).toBe(DEMO_PATH);
    expect(getDemoSamplePath(sampleById(GARDEN_ID))).toBe(GARDEN_PATH);

    for (const sample of DEMO_SAMPLES) {
      expect(getDemoSample(queryOf(getDemoSamplePath(sample)))).toBe(sample);
    }
  });
});
