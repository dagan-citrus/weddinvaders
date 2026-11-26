// The sample games offered on the demo page, and how the page's URL selects one. No JSX here.
import { defaultEvent, mayaAndNoahEvent } from '../events';
import { ROUTE_ID } from '../routes';

/** Query parameter of the demo page that names the selected sample. */
export const DEMO_EVENT_PARAM = 'event';

const DEMO_PATH = `/${ROUTE_ID.DEMO}`;

/**
 * @typedef {Object} DemoSample
 * @property {string} id  Stable id: the query-parameter value and the key of the sample's copy.
 * @property {import('../events/eventConfig').EventConfig} event
 */

/** The samples, in display order. The first one is the default. */
export const DEMO_SAMPLES = Object.freeze([
  Object.freeze({ id: 'classic', event: defaultEvent }),
  Object.freeze({ id: 'garden',  event: mayaAndNoahEvent }),
]);

const [DEFAULT_SAMPLE] = DEMO_SAMPLES;

/**
 * The sample a query string selects; the default sample when the parameter is
 * missing, empty or unknown. Matching ignores case and surrounding spaces.
 *
 * @param {string} search  A `location.search` value (`''` or `?…`).
 * @returns {DemoSample}
 */
export function getDemoSample(search) {
  const requested = new URLSearchParams(search).get(DEMO_EVENT_PARAM);
  const id = (requested ?? '').trim().toLowerCase();
  return DEMO_SAMPLES.find((sample) => sample.id === id) ?? DEFAULT_SAMPLE;
}

/**
 * The demo-page path that shows a sample.
 *
 * @param {DemoSample} sample
 * @returns {string}
 */
export function getDemoSamplePath(sample) {
  return sample === DEFAULT_SAMPLE
    ? DEMO_PATH
    : `${DEMO_PATH}?${DEMO_EVENT_PARAM}=${sample.id}`;
}
