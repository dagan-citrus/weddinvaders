import Link from '../Link';
import { ROUTE_ID } from '../routes';
import { pricing } from '../content';
import { fillTemplate, formatPrice } from '../content/format.js';
import { getOrderPath } from './orderLink';
import './PricingPage.css';

const CUSTOMIZE_PATH = `/${ROUTE_ID.CUSTOMIZE}`;
const DEMO_PATH = `/${ROUTE_ID.DEMO}`;

/**
 * A formatted price, tagged as an example while the prices are placeholders.
 *
 * @param {{ amount: number, currency: string, exampleTag: string|null }} props
 */
function Price({ amount, currency, exampleTag }) {
  return (
    <p className="pricing-price">
      <span className="pricing-amount" data-price data-amount={amount} data-currency={currency}>
        {formatPrice(amount, currency)}
      </span>
      {exampleTag && <span className="pricing-example-tag">{exampleTag}</span>}
    </p>
  );
}

/**
 * Packages, add-ons and terms, rendered from the pricing content.
 *
 * @param {{ route: import('../routes').RouteDef, content?: typeof pricing }} props
 *   `content` defaults to the site's pricing content; it exists so both states
 *   of `pricesArePlaceholder` can be rendered.
 */
export default function PricingPage({ route, content = pricing }) {
  const { intro, notice, tiers, addons, terms, cta, currency } = content;
  const isExample = content.pricesArePlaceholder;
  const priceTag = isExample ? notice.priceTag : null;
  const fill = (text) => fillTemplate(text, content.termValues);

  return (
    <>
      <section className="site-section pricing-intro" data-section="intro">
        <div className="site-container">
          <h1>{route.title}</h1>
          <p className="pricing-headline">{intro.headline}</p>
          <p>{intro.body}</p>
          {isExample && (
            <p className="pricing-notice" role="note" data-testid="pricing-placeholder-notice">
              <strong>{notice.title}</strong> {notice.body}
            </p>
          )}
        </div>
      </section>

      <section className="site-section pricing-tiers-section" data-section="tiers">
        <div className="site-container">
          <h2>{content.tiersHeading}</h2>
          <ul className="pricing-tiers">
            {tiers.map((tier) => (
              <li key={tier.id} className="site-card pricing-tier" data-tier={tier.id}>
                <h3>{tier.name}</h3>
                <p className="pricing-tagline">{tier.tagline}</p>
                <Price amount={tier.price} currency={currency} exampleTag={priceTag} />
                <p className="pricing-price-note">{content.priceNote}</p>
                <ul className="pricing-features">
                  {tier.features.map((feature) => (
                    <li key={feature.id} data-feature={feature.id}>{feature.text}</li>
                  ))}
                </ul>
                <Link className="site-btn site-btn-primary pricing-tier-cta" to={getOrderPath(tier.id)}>
                  {fillTemplate(content.tierCta, { name: tier.name })}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section pricing-addons-section" data-section="addons">
        <div className="site-container">
          <h2>{content.addonsHeading}</h2>
          <p>{content.addonsBody}</p>
          <ul className="pricing-addons">
            {addons.map((addon) => (
              <li key={addon.id} className="site-card pricing-addon" data-addon={addon.id}>
                <h3>{addon.name}</h3>
                <p>{fill(addon.description)}</p>
                <Price amount={addon.price} currency={currency} exampleTag={priceTag} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section pricing-terms-section" data-section="terms">
        <div className="site-container">
          <h2>{terms.heading}</h2>
          {isExample && (
            <p className="pricing-example-tag" data-testid="pricing-terms-tag">{notice.termsTag}</p>
          )}
          <ul className="pricing-terms">
            {terms.items.map((term) => (
              <li key={term.id} data-term={term.id}>{fill(term.text)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-section pricing-cta" data-section="cta">
        <div className="site-container">
          <h2>{cta.heading}</h2>
          <p>{cta.body}</p>
          <div className="pricing-actions">
            <Link className="site-btn site-btn-secondary" to={CUSTOMIZE_PATH}>{cta.customizeCta}</Link>
            <Link className="site-btn site-btn-secondary" to={DEMO_PATH}>{cta.demoCta}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
