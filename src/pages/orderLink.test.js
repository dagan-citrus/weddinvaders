import { describe, it, expect } from 'vitest';
import { PACKAGE_QUERY_PARAM, getOrderPath } from './orderLink.js';

// The link from a pricing tier to the order form: the query parameter name and
// the tier id it carries are a contract with the order page.

const ORDER_PATH = '/order';

const queryOf = (path) => new URLSearchParams(path.split('?')[1]);

describe('order link', () => {
  it('test_order_path: a package id travels in the query', () => {
    expect(getOrderPath('custom')).toBe('/order?package=custom');
  });

  it('test_order_path: without a package it is the bare order page', () => {
    expect(getOrderPath()).toBe(ORDER_PATH);
  });

  it('test_order_path: the parameter name is fixed', () => {
    expect(PACKAGE_QUERY_PARAM).toBe('package');
  });

  it('test_order_path: the id is encoded and reads back unchanged', () => {
    const path = getOrderPath('a b');

    expect(path).not.toContain(' ');
    expect(path.split('?')[0]).toBe(ORDER_PATH);
    expect(queryOf(path).get(PACKAGE_QUERY_PARAM)).toBe('a b');
  });
});
