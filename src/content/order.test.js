import { describe, it, expect } from 'vitest';
import * as content from './index.js';
import * as en from './en/index.js';
import { FIELD_ORDER, ORDER_ERROR } from '../pages/orderForm';
import { SLUG_STATUS } from '../events';
import { ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';

// The order page's copy is plain frozen data (G9). It must stay truthful: the
// page sends and stores nothing, photos cannot be attached, the address is a
// request, and prices and terms live on the pricing page only (D7).

const { order } = content;

const SITE_HOST = new URL(SITE_CONFIG.baseUrl).host;
const FAQ_IDS = ['payment', 'next', 'address', 'photos', 'timing', 'changes', 'devices', 'data'];
const FAQ_LINK_ROUTES = [ROUTE_ID.PRICING, ROUTE_ID.CUSTOMIZE];

const DIGIT = /\d/;
const CURRENCY_SYMBOL = /[$₪€£]/;
const UNSUPPORTED_CLAIM = /leaderboard|analytics|music/i;

/** Every nested object and array of `value`, the root included. */
function containers(value, found = []) {
  if (value !== null && typeof value === 'object') {
    found.push(value);
    for (const child of Object.values(value)) containers(child, found);
  }
  return found;
}

/** Every non-container value of `value`, with its dot path. */
function leaves(value, path = '', found = []) {
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) leaves(child, path ? `${path}.${key}` : key, found);
  } else {
    found.push([path, value]);
  }
  return found;
}

describe('order content', () => {
  it('test_exported_and_frozen', () => {
    expect(order).toBeDefined();
    expect(order).toBe(en.order);

    const all = containers(order);
    expect(all.length).toBeGreaterThan(1);
    for (const container of all) {
      expect(Object.isFrozen(container)).toBe(true);
    }
  });

  it('test_leaves_plain', () => {
    const all = leaves(order);

    expect(all.length).toBeGreaterThan(0);
    for (const [path, leaf] of all) {
      expect(typeof leaf, path).toBe('string');
      expect(leaf.trim(), path).not.toBe('');
      expect(leaf, path).not.toContain('<');
      expect(leaf, path).not.toContain(SITE_HOST);
      expect(leaf, path).not.toContain(SITE_CONFIG.contactEmail);
    }
  });

  it('test_error_keys: every error belongs to a form field and uses a known code', () => {
    const codes = Object.values(ORDER_ERROR);

    expect(Object.keys(order.errors).length).toBeGreaterThan(0);
    for (const [field, messages] of Object.entries(order.errors)) {
      expect(FIELD_ORDER, field).toContain(field);
      expect(Object.keys(messages).length, field).toBeGreaterThan(0);
      for (const code of Object.keys(messages)) {
        expect(codes, `${field}.${code}`).toContain(code);
      }
    }
  });

  it('test_error_keys: every address status has a message', () => {
    expect(Object.keys(order.slugStatus).sort()).toEqual(Object.values(SLUG_STATUS).sort());
  });

  it('test_error_keys: every field that can be missing says so', () => {
    for (const field of ['brideName', 'groomName', 'weddingDate', 'slug', 'package', 'email']) {
      expect(order.errors[field], field).toHaveProperty(ORDER_ERROR.REQUIRED);
    }
    expect(order.errors.weddingDate).toHaveProperty(ORDER_ERROR.INVALID);
    expect(order.errors.weddingDate).toHaveProperty(ORDER_ERROR.PAST);
    expect(order.errors.email).toHaveProperty(ORDER_ERROR.INVALID);
    expect(order.errors.brideName).toHaveProperty(ORDER_ERROR.TOO_LONG);
    expect(order.errors.groomName).toHaveProperty(ORDER_ERROR.TOO_LONG);
    expect(order.errors.notes).toHaveProperty(ORDER_ERROR.TOO_LONG);
  });

  it('test_faq', () => {
    const { items } = order.faq;

    expect(items.map((item) => item.id)).toEqual(FAQ_IDS);
    for (const item of items) {
      for (const text of [item.question, item.answer]) {
        expect(text, item.id).not.toMatch(DIGIT);
        expect(text, item.id).not.toMatch(CURRENCY_SYMBOL);
      }
    }
    expect(items.filter((item) => item.link).map((item) => item.link.routeId)).toEqual(FAQ_LINK_ROUTES);
    expect(items.find((item) => item.id === 'timing').link.label).toBe('See pricing');
    expect(items.find((item) => item.id === 'changes').link.label).toBe('See what can be customized');
  });

  it('test_truthful_copy', () => {
    expect(order.intro.privacy).toMatch(/does not send or store/);
    expect(order.form.photosNote).toMatch(/cannot be attached/);
    expect(order.fields.slug.hint).toMatch(/request/);
    expect(order.fields.slug.hint).toMatch(/confirm/);
    for (const item of order.faq.items) {
      expect(item.answer, item.id).not.toMatch(UNSUPPORTED_CLAIM);
    }
  });

  it('test_static_copy: the labels and messages the page relies on', () => {
    expect(order.form.ariaLabel).toBe('Order form');
    expect(order.form.submit).toBe('Create my order email');
    expect(order.closed.title).toBe('Ordering is not open yet.');
    expect(order.fields.package.unsure).toBe('Not sure yet');
    expect(order.result.heading).toBe('Almost done: send the email');
    expect(order.result.copy).toBe('Copy message');
    expect(order.message.subject).toBe('{site} order: {groom} & {bride} ({slug})');
    expect(order.message.none).toBe('None');
  });
});
