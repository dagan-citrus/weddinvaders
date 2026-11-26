import Link from '../Link';
import { ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';
import { defaultEvent, getEventPath } from '../events';
import { customize } from '../content';
import { fillTemplate } from '../content/format.js';
import './CustomizePage.css';

const DEMO_PATH = `/${ROUTE_ID.DEMO}`;
const ORDER_PATH = `/${ROUTE_ID.ORDER}`;
const LIST_SEPARATOR = ', ';

/**
 * A row of an example: one field, as the standard game has it and as it could be.
 *
 * @typedef {{ id: string, label?: string, before: import('react').ReactNode, after: import('react').ReactNode }} ExampleRow
 */

const findDefaultItem = (id) => defaultEvent.items.find((item) => item.id === id);

/** An item as the game shows it: emoji, label and base price. */
function ItemValue({ item, priceTemplate }) {
  return (
    <span className="customize-item">
      <span className="customize-item-emoji" data-part="emoji">{item.emoji}</span>
      <span data-part="label">{item.label}</span>
      <span className="customize-item-price" data-part="price">
        {fillTemplate(priceTemplate, { price: item.price })}
      </span>
    </span>
  );
}

/** Item ids as "emoji label" pairs; ids the standard game does not have are skipped. */
function describeItems(ids) {
  return ids
    .map(findDefaultItem)
    .filter(Boolean)
    .map((item) => `${item.emoji} ${item.label}`)
    .join(LIST_SEPARATOR);
}

/**
 * Builds the example rows of one option. The "before" side always comes from
 * the default event; the "after" side comes from the option's content.
 */
const ROW_BUILDERS = {
  names(option) {
    const host = new URL(SITE_CONFIG.baseUrl).host;
    const before = { ...defaultEvent.names, address: host + getEventPath(defaultEvent.slug) };
    const after = { ...option.example, address: host + getEventPath(option.example.slug) };
    return option.fields.map(({ id, label }) => ({ id, label, before: before[id], after: after[id] }));
  },

  photos(option) {
    return option.fields.map(({ id, label, alt }) => ({
      id,
      label,
      before: <img className="customize-photo" src={defaultEvent.images[id]} alt={alt} loading="lazy" />,
      after: <span className="customize-photo-slot">{option.slotText}</span>,
    }));
  },

  messages(option) {
    return option.fields.map(({ id, label }) => ({
      id, label, before: defaultEvent.messages[id], after: option.example[id],
    }));
  },

  items(option) {
    return option.examples
      .map((example) => ({ example, standard: findDefaultItem(example.id) }))
      .filter(({ standard }) => standard)
      .map(({ example, standard }) => ({
        id: example.id,
        before: <ItemValue item={standard} priceTemplate={option.priceTemplate} />,
        after: <ItemValue item={example} priceTemplate={option.priceTemplate} />,
      }));
  },

  levels(option) {
    const { example } = option;
    const level = defaultEvent.levels.find((candidate) => candidate.id === example.levelId);
    if (!level) return [];
    const format = {
      required: (value) => describeItems(value),
      money: (value) => fillTemplate(option.moneyTemplate, { amount: value }),
      gameDuration: (value) => fillTemplate(option.durationTemplate, { seconds: value }),
    };
    return option.fields.map(({ id, label }) => {
      const show = format[id] ?? ((value) => value);
      return { id, label, before: show(level[id]), after: show(example[id]) };
    });
  },
};

/**
 * One before/after pair.
 *
 * @param {{ row: ExampleRow }} props
 */
function ExampleRowView({ row }) {
  const { pairLabels } = customize;
  return (
    <div className="customize-row" data-field={row.id}>
      {row.label && <p className="customize-row-label">{row.label}</p>}
      <div className="customize-variant" data-variant="before">
        <span className="customize-caption">{pairLabels.before}</span>
        {row.before}
      </div>
      <div className="customize-variant" data-variant="after">
        <span className="customize-caption">{pairLabels.after}</span>
        {row.after}
      </div>
    </div>
  );
}

/**
 * The customization page: what can be changed, each shown next to the standard game.
 *
 * @param {{ route: import('../routes').RouteDef }} props
 */
export default function CustomizePage({ route }) {
  const { intro, options, fixed, cta } = customize;

  return (
    <>
      <section className="site-section customize-intro" data-section="intro">
        <div className="site-container">
          <h1>{route.title}</h1>
          <p className="customize-headline">{intro.headline}</p>
          <p>{intro.body}</p>
        </div>
      </section>

      <section className="site-section customize-options-section" data-section="options">
        <div className="site-container customize-options">
          {options.map((option) => (
            <article key={option.id} className="site-card customize-option" data-option={option.id}>
              <h2>{option.title}</h2>
              <p>{option.body}</p>
              <div className="customize-example" data-example={option.id}>
                {ROW_BUILDERS[option.id](option).map((row) => (
                  <ExampleRowView key={row.id} row={row} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section customize-fixed-section" data-section="fixed">
        <div className="site-container">
          <h2>{fixed.heading}</h2>
          <p>{fixed.body}</p>
          <ul className="customize-fixed">
            {fixed.items.map((item) => (
              <li key={item.id} className="site-card" data-fixed={item.id}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="customize-fixed-note">{fixed.note}</p>
        </div>
      </section>

      <section className="site-section customize-cta" data-section="cta">
        <div className="site-container">
          <h2>{cta.heading}</h2>
          <p>{cta.body}</p>
          <div className="customize-actions">
            <Link className="site-btn site-btn-primary" to={DEMO_PATH}>{cta.primaryCta}</Link>
            <Link className="site-btn site-btn-secondary" to={ORDER_PATH}>{cta.secondaryCta}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
