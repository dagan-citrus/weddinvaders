import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import HomePage from './HomePage';
import { home } from '../content';
import { defaultEvent } from '../events';
import { SITE_CONFIG } from '../siteConfig';

const SITE_NAME = "Weddin'Vaders";
const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;
const DEMO_PATH = '/demo';
const ORDER_PATH = '/order';
const DEMO_CTA = 'Try the demo';
const ORDER_CTA = 'Get your game';
const PREVIEW_ITEM_IDS = ['rings', 'cake', 'flowers', 'guest', 'catering', 'officiant'];

const section = (id) => document.querySelector(`section[data-section="${id}"]`);
const namesAndHrefs = (links) => links.map((link) => [link.textContent, link.getAttribute('href')]);
const dataValues = (root, attribute) =>
  [...root.querySelectorAll(`[${attribute}]`)].map((element) => element.getAttribute(attribute));
const defaultItem = (id) => defaultEvent.items.find((item) => item.id === id);

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('HomePage (component)', () => {
  it('test_sections_in_order', () => {
    render(<HomePage />);

    expect(dataValues(document, 'data-section')).toEqual(['hero', 'pitch', 'steps', 'cta']);
    for (const element of document.querySelectorAll('[data-section]')) {
      expect(element.tagName).toBe('SECTION');
    }
  });

  it('test_hero_copy', () => {
    render(<HomePage />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(SITE_NAME);
    expect(section('hero')).toContainElement(headings[0]);

    const hero = within(section('hero'));
    expect(hero.getByText('Your wedding, as a two-player arcade game.')).toBeInTheDocument();
    expect(hero.getByText(home.hero.subhead)).toBeInTheDocument();

    const facts = hero.getAllByRole('listitem');
    expect(facts.map((fact) => fact.textContent)).toEqual([
      'Two players, one team',
      'Five levels',
      'Keyboard or touchscreen',
      'Plays in the browser',
    ]);
  });

  it('test_hero_ctas', () => {
    render(<HomePage />);

    const links = within(section('hero')).getAllByRole('link');
    expect(namesAndHrefs(links)).toEqual([
      [DEMO_CTA, DEMO_PATH],
      [ORDER_CTA, ORDER_PATH],
    ]);
  });

  it('test_preview', () => {
    render(<HomePage />);

    const preview = within(section('hero')).getByRole('img', { name: home.hero.previewLabel });
    expect(preview).toHaveAttribute('data-testid', 'gameplay-preview');
    expect(preview).toHaveAttribute(
      'aria-label',
      'Illustration of the game: the groom at the top and the bride at the bottom of an arcade screen, with wedding items flying between them.',
    );

    const items = [...preview.querySelectorAll('[data-item]')];
    expect(items.map((item) => item.getAttribute('data-item'))).toEqual(PREVIEW_ITEM_IDS);
    for (const item of items) {
      expect(item.textContent).toBe(defaultItem(item.getAttribute('data-item')).emoji);
    }

    expect(preview.children).toHaveLength(1);
    expect(preview.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(preview.firstElementChild).toContainElement(items[0]);

    expect(within(section('hero')).getByText('An illustration. The demo is the real game.')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('test_pitch', () => {
    render(<HomePage />);

    const pitch = section('pitch');
    expect(within(pitch).getByRole('heading', { level: 2 }).textContent).toBe('A wedding you have to earn');

    expect(dataValues(pitch, 'data-feature')).toEqual(['coop', 'budget', 'yours']);
    for (const feature of home.pitch.features) {
      const card = pitch.querySelector(`[data-feature="${feature.id}"]`);
      expect(card.tagName).toBe('LI');
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(feature.title);
      expect(within(card).getByText(feature.body)).toBeInTheDocument();
    }
  });

  it('test_steps', () => {
    render(<HomePage />);

    const steps = section('steps');
    expect(within(steps).getByRole('heading', { level: 2 }).textContent).toBe('Three steps to your own game');

    const list = steps.querySelector('ol');
    expect(list).not.toBeNull();
    expect(dataValues(list, 'data-step')).toEqual(['play', 'tell', 'share']);
    for (const step of home.steps.items) {
      const card = list.querySelector(`[data-step="${step.id}"]`);
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(step.title);
    }
    expect(within(list.querySelector('[data-step="play"]')).getByText(home.steps.items[0].body)).toBeInTheDocument();

    const share = list.querySelector('[data-step="share"]');
    expect(share.textContent).toContain(`${SITE_HOST}/YourNames`);
    expect(share.textContent).not.toContain('{host}');
    expect(steps.textContent).not.toMatch(/[{}]/);
  });

  it('test_closing_cta', () => {
    render(<HomePage />);

    const cta = section('cta');
    expect(within(cta).getByRole('heading', { level: 2 }).textContent).toBe('Ready to play your wedding?');
    expect(within(cta).getByText(home.cta.body)).toBeInTheDocument();
    expect(namesAndHrefs(within(cta).getAllByRole('link'))).toEqual([
      [DEMO_CTA, DEMO_PATH],
      [ORDER_CTA, ORDER_PATH],
    ]);
  });

  it('test_cta_click_navigates', () => {
    window.history.replaceState(null, '', '/');
    render(<HomePage />);

    fireEvent.click(within(section('hero')).getByRole('link', { name: ORDER_CTA }));

    expect(window.location.pathname).toBe(ORDER_PATH);
  });
});
