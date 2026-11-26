import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from '../App';
import CustomizePage from './CustomizePage';
import { customize } from '../content';
import { defaultEvent } from '../events';
import { ROUTE_ID, SITE_ROUTES } from '../routes';
import { SITE_CONFIG } from '../siteConfig';

// The customization page (T7): every example pairs a value read from the
// default event ("before") with a value from the content module ("after").

const CUSTOMIZE_ROUTE = SITE_ROUTES.find((route) => route.id === ROUTE_ID.CUSTOMIZE);
const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;
const SITE_NAME = "Weddin'Vaders";
const PAGE_HEADING = 'Customize';
const OPTION_IDS = ['names', 'photos', 'messages', 'items', 'levels'];
const FIXED_IDS = ['theme', 'sound', 'language', 'controls'];
const BEFORE_CAPTION = 'Standard game';
const AFTER_CAPTION = 'Example';
const PLACEHOLDER_TEXT = 'Coming soon.';

const section = (id) => document.querySelector(`section[data-section="${id}"]`);
const dataValues = (root, attribute) =>
  [...root.querySelectorAll(`[${attribute}]`)].map((element) => element.getAttribute(attribute));
const option = (id) => customize.options.find((entry) => entry.id === id);
const example = (id) => document.querySelector(`[data-example="${id}"]`);
const row = (optionId, fieldId) => example(optionId).querySelector(`[data-field="${fieldId}"]`);
const variant = (optionId, fieldId, name) => row(optionId, fieldId).querySelector(`[data-variant="${name}"]`);
const part = (root, name) => root.querySelector(`[data-part="${name}"]`).textContent;
const itemParts = (root) => [part(root, 'emoji'), part(root, 'label'), part(root, 'price')];
const defaultItem = (id) => defaultEvent.items.find((item) => item.id === id);
const namesAndHrefs = (links) => links.map((link) => [link.textContent, link.getAttribute('href')]);

const renderPage = () => render(<CustomizePage route={CUSTOMIZE_ROUTE} />);

/** Renders the whole app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('CustomizePage (component)', () => {
  it('test_sections_in_order', () => {
    renderPage();

    expect(dataValues(document, 'data-section')).toEqual(['intro', 'options', 'fixed', 'cta']);
    for (const element of document.querySelectorAll('[data-section]')) {
      expect(element.tagName).toBe('SECTION');
    }

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(PAGE_HEADING);
    expect(section('intro')).toContainElement(headings[0]);
    expect(within(section('intro')).getByText(customize.intro.headline)).toBeInTheDocument();
    expect(within(section('intro')).getByText(customize.intro.body)).toBeInTheDocument();
  });

  it('test_five_options', () => {
    renderPage();

    const options = section('options');
    expect(dataValues(options, 'data-option')).toEqual(OPTION_IDS);
    expect(dataValues(options, 'data-example')).toEqual(OPTION_IDS);

    for (const id of OPTION_IDS) {
      const card = options.querySelector(`[data-option="${id}"]`);
      const headings = within(card).getAllByRole('heading', { level: 2 });
      expect(headings.map((heading) => heading.textContent), id).toEqual([option(id).title]);
      expect(within(card).getByText(option(id).body)).toBeInTheDocument();
      expect(card.querySelectorAll('[data-example]'), id).toHaveLength(1);
      expect(card).toContainElement(example(id));
    }

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      ...OPTION_IDS.map((id) => option(id).title),
      'What stays the same',
      'See it, then make it yours',
    ]);
  });

  it('test_captions', () => {
    renderPage();

    const before = [...document.querySelectorAll('[data-variant="before"]')];
    const after = [...document.querySelectorAll('[data-variant="after"]')];

    expect(before.length).toBeGreaterThan(0);
    expect(after).toHaveLength(before.length);
    for (const element of before) expect(element.textContent).toContain(BEFORE_CAPTION);
    for (const element of after) expect(element.textContent).toContain(AFTER_CAPTION);
    for (const fieldRow of document.querySelectorAll('[data-example] [data-field]')) {
      expect(dataValues(fieldRow, 'data-variant')).toEqual(['before', 'after']);
    }
  });

  it('test_names_example', () => {
    renderPage();

    expect(dataValues(example('names'), 'data-field')).toEqual(['bride', 'groom', 'address']);
    expect(variant('names', 'bride', 'before').textContent).toContain('Bride');
    expect(variant('names', 'bride', 'after').textContent).toContain('Shelly');
    expect(variant('names', 'groom', 'before').textContent).toContain('Groom');
    expect(variant('names', 'groom', 'after').textContent).toContain('Dan');
    expect(variant('names', 'address', 'before').textContent).toContain(`${SITE_HOST}/DemoWedding`);
    expect(variant('names', 'address', 'after').textContent).toContain(`${SITE_HOST}/DanAndShelly`);
    expect(variant('names', 'address', 'after').textContent).not.toContain('DemoWedding');
  });

  it('test_photos_example', () => {
    renderPage();

    const { fields, slotText } = option('photos');
    expect(dataValues(example('photos'), 'data-field')).toEqual(['bride', 'groom', 'couple']);
    for (const field of fields) {
      const images = variant('photos', field.id, 'before').querySelectorAll('img');
      expect(images, field.id).toHaveLength(1);
      expect(images[0].getAttribute('src'), field.id).toBe(defaultEvent.images[field.id]);
      expect(images[0].getAttribute('alt'), field.id).toBe(field.alt);

      const after = variant('photos', field.id, 'after');
      expect(after.textContent, field.id).toContain('Your photo');
      expect(after.textContent, field.id).toContain(slotText);
      expect(after.querySelector('img'), field.id).toBeNull();
    }
  });

  it('test_messages_example', () => {
    renderPage();

    const keys = Object.keys(defaultEvent.messages);
    expect(dataValues(example('messages'), 'data-field')).toEqual(keys);
    expect(keys).toHaveLength(5);
    for (const key of keys) {
      expect(variant('messages', key, 'before').textContent, key).toContain(defaultEvent.messages[key]);
      expect(variant('messages', key, 'after').textContent, key).toContain(option('messages').example[key]);
    }
  });

  it('test_items_example', () => {
    renderPage();

    expect(dataValues(example('items'), 'data-field')).toEqual(['cake', 'catering', 'flowers']);
    expect(itemParts(variant('items', 'cake', 'before'))).toEqual(['🎂', 'Cake', 'Base price $350']);
    expect(itemParts(variant('items', 'cake', 'after'))).toEqual(['🧁', 'Cupcakes', 'Base price $300']);

    for (const itemExample of option('items').examples) {
      const original = defaultItem(itemExample.id);
      expect(itemParts(variant('items', itemExample.id, 'before')), itemExample.id).toEqual([
        original.emoji, original.label, `Base price $${original.price}`,
      ]);
      expect(itemParts(variant('items', itemExample.id, 'after')), itemExample.id).toEqual([
        itemExample.emoji, itemExample.label, `Base price $${itemExample.price}`,
      ]);
    }
  });

  it('test_levels_example', () => {
    renderPage();

    expect(dataValues(example('levels'), 'data-field')).toEqual(['name', 'subtitle', 'required', 'money', 'gameDuration']);
    const texts = (fieldId) => ['before', 'after'].map(
      (name) => variant('levels', fieldId, name).textContent.replace(name === 'before' ? BEFORE_CAPTION : AFTER_CAPTION, '').trim(),
    );

    expect(texts('name')).toEqual(['Save the Date', 'The Proposal']);
    expect(texts('subtitle')).toEqual([defaultEvent.levels[0].subtitle, 'She said yes. Now find a ring!']);
    expect(texts('required')).toEqual(['💍 Rings', '💍 Rings, 🎂 Cake']);
    expect(texts('money')).toEqual(['$9900', '$5000']);
    expect(texts('gameDuration')).toEqual(['300 seconds', '180 seconds']);
  });

  it('test_fixed_section', () => {
    renderPage();

    const fixed = section('fixed');
    expect(dataValues(fixed, 'data-fixed')).toEqual(FIXED_IDS);
    for (const item of customize.fixed.items) {
      const card = fixed.querySelector(`[data-fixed="${item.id}"]`);
      expect(within(card).getByRole('heading', { level: 3 }).textContent, item.id).toBe(item.title);
      expect(within(card).getByText(item.body)).toBeInTheDocument();
    }
    expect(within(fixed).getByText(customize.fixed.body)).toBeInTheDocument();
    expect(within(fixed).getByText(customize.fixed.note)).toBeInTheDocument();
  });

  it('test_cta_links', () => {
    renderPage();

    const links = within(section('cta')).getAllByRole('link');
    expect(namesAndHrefs(links)).toEqual([
      ['Try the demo', '/demo'],
      ['Get your game', '/order'],
    ]);
    expect(within(section('cta')).getByText(customize.cta.body)).toBeInTheDocument();
  });

  it('test_no_canvas', () => {
    renderPage();

    expect(document.querySelector('canvas')).toBeNull();
  });

  it('test_routed', () => {
    renderAt('/customize');

    const main = document.querySelector('main');
    expect(main).toHaveAttribute('data-route', 'customize');
    expect(within(main).getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent)).toEqual([PAGE_HEADING]);
    expect(screen.queryByText(PLACEHOLDER_TEXT)).toBeNull();
    expect(main.querySelectorAll('[data-option]')).toHaveLength(OPTION_IDS.length);

    const nav = screen.getByRole('navigation', { name: 'Site' });
    const current = within(nav).getAllByRole('link').filter((link) => link.hasAttribute('aria-current'));
    expect(current.map((link) => [link.textContent, link.getAttribute('aria-current')])).toEqual([[PAGE_HEADING, 'page']]);
    expect(document.title).toBe(`${PAGE_HEADING} | ${SITE_NAME}`);
  });
});
