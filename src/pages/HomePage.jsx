import Link from '../Link';
import { ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';
import { home } from '../content';
import { fillTemplate } from '../content/format.js';
import GameplayPreview from './GameplayPreview';
import './HomePage.css';

const DEMO_PATH = `/${ROUTE_ID.DEMO}`;
const ORDER_PATH = `/${ROUTE_ID.ORDER}`;

/**
 * The pair of calls to action used in the hero and at the end of the page.
 *
 * @param {{ primary: string, secondary: string }} props  Button labels.
 */
function Actions({ primary, secondary }) {
  return (
    <div className="home-actions">
      <Link className="site-btn site-btn-primary" to={DEMO_PATH}>{primary}</Link>
      <Link className="site-btn site-btn-secondary" to={ORDER_PATH}>{secondary}</Link>
    </div>
  );
}

/** The landing page: pitch, gameplay illustration, how it works, calls to action. */
export default function HomePage() {
  const { hero, pitch, steps, cta } = home;
  const templateValues = { host: new URL(SITE_CONFIG.baseUrl).host };

  return (
    <>
      <section className="site-section home-hero" data-section="hero">
        <div className="site-container home-hero-inner">
          <div className="home-hero-text">
            <h1 className="home-title">{SITE_CONFIG.name}</h1>
            <p className="home-headline">{hero.headline}</p>
            <p className="home-subhead">{hero.subhead}</p>
            <Actions primary={hero.primaryCta} secondary={hero.secondaryCta} />
            <ul className="home-facts">
              {hero.facts.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
          </div>
          <div className="home-hero-visual">
            <GameplayPreview label={hero.previewLabel} />
            <p className="home-preview-caption">{hero.previewCaption}</p>
          </div>
        </div>
      </section>

      <section className="site-section home-pitch" data-section="pitch">
        <div className="site-container">
          <h2>{pitch.heading}</h2>
          <ul className="home-features">
            {pitch.features.map((feature) => (
              <li key={feature.id} className="site-card" data-feature={feature.id}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section home-steps-section" data-section="steps">
        <div className="site-container">
          <h2>{steps.heading}</h2>
          <ol className="home-steps">
            {steps.items.map((step) => (
              <li key={step.id} className="site-card" data-step={step.id}>
                <h3>{step.title}</h3>
                <p>{fillTemplate(step.body, templateValues)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-section home-cta" data-section="cta">
        <div className="site-container">
          <h2>{cta.heading}</h2>
          <p>{cta.body}</p>
          <Actions primary={cta.primaryCta} secondary={cta.secondaryCta} />
        </div>
      </section>
    </>
  );
}
