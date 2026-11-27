import { useEffect } from 'react';
import Game from '../Game';
import Link from '../Link';
import { navigate, useLocationSearch } from '../navigation';
import { ROUTE_ID } from '../routes';
import { getEventPath } from '../events';
import { demo } from '../content';
import { DEMO_SAMPLES, getDemoSample, getDemoSamplePath } from './demoSamples';
import './DemoPage.css';

const ORDER_PATH = `/${ROUTE_ID.ORDER}`;
const CUSTOMIZE_PATH = `/${ROUTE_ID.CUSTOMIZE}`;
const PRIMARY_BUTTON = 0;
const CURRENT_SAMPLE = 'true';

// Keys that move focus or only modify other keys. The game starts on any
// keydown, so these must not reach it while it shares a page with site links.
const KEYS_KEPT_FROM_GAME = ['Tab', 'Shift', 'Control', 'Alt', 'Meta'];

function keepKeyFromGame(event) {
  if (KEYS_KEPT_FROM_GAME.includes(event.key)) event.stopPropagation();
}

/** Copy (label, summary) of a sample, by its id. */
function getSampleCopy(sample) {
  return demo.switcher.samples.find((entry) => entry.id === sample.id);
}

/**
 * The demo: the real game embedded in the site, with a switcher between the
 * sample events. The selected sample lives in the URL's query string.
 */
export default function DemoPage() {
  const activeSample = getDemoSample(useLocationSearch());
  const { controls, differences, cta } = demo;

  // The game listens on window (bubble phase); a capture listener on document runs first.
  useEffect(() => {
    document.addEventListener('keydown', keepKeyFromGame, true);
    return () => document.removeEventListener('keydown', keepKeyFromGame, true);
  }, []);

  const selectSample = (event, sample) => {
    // Modified clicks (new tab…) are left to Link and the browser.
    if (event.button !== PRIMARY_BUTTON) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (sample === activeSample) return; // keep the running game
    // Switching is not a new page: no history entry, no jump to the top.
    navigate(getDemoSamplePath(sample), { replace: true, scroll: false });
  };

  return (
    <>
      <section className="site-section demo-intro" data-section="intro">
        <div className="site-container">
          <h1>{demo.heading}</h1>
          <p>{demo.intro}</p>
        </div>
      </section>

      <section className="site-section demo-play" data-section="play">
        <div className="site-container">
          <nav className="demo-switcher" aria-label={demo.switcher.ariaLabel}>
            {DEMO_SAMPLES.map((sample) => (
              <Link
                key={sample.id}
                className="demo-sample-link"
                data-sample={sample.id}
                to={getDemoSamplePath(sample)}
                aria-current={sample === activeSample ? CURRENT_SAMPLE : undefined}
                onClick={(event) => selectSample(event, sample)}
              >
                {getSampleCopy(sample).label}
              </Link>
            ))}
          </nav>
          <div
            className="demo-stage"
            data-testid="demo-stage"
            data-surface="game"
            data-sample={activeSample.id}
            data-event-slug={activeSample.event.slug}
          >
            <Game event={activeSample.event} />
          </div>
          <p className="demo-sample-summary" data-testid="demo-sample-summary">
            {getSampleCopy(activeSample).summary}
          </p>
          <p className="demo-photo-note">{demo.photoNote}</p>
          <p>
            <Link className="demo-own-page-link" to={getEventPath(activeSample.event.slug)}>
              {demo.ownPage.link}
            </Link>
            {' '}
            {demo.ownPage.hint}
          </p>
        </div>
      </section>

      <section className="site-section" data-section="controls">
        <div className="site-container">
          <h2>{controls.heading}</h2>
          <div className="demo-controls">
            {controls.groups.map((group) => (
              <div key={group.id} className="site-card" data-controls={group.id}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="demo-ammo-note">{controls.ammoNote}</p>
        </div>
      </section>

      <section className="site-section demo-differences-section" data-section="differences">
        <div className="site-container">
          <h2>{differences.heading}</h2>
          <ul className="demo-differences">
            {differences.items.map((item) => (
              <li key={item.id} className="site-card" data-difference={item.id}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section" data-section="cta">
        <div className="site-container">
          <h2>{cta.heading}</h2>
          <p>{cta.body}</p>
          <div className="demo-actions">
            <Link className="site-btn site-btn-primary" to={ORDER_PATH}>{cta.primaryCta}</Link>
            <Link className="site-btn site-btn-secondary" to={CUSTOMIZE_PATH}>{cta.secondaryCta}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
