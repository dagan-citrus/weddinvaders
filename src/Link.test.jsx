import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Link from './Link';

const HOME_PATH = '/';
const TARGET_PATH = '/pricing';
const LINK_TEXT = 'Pricing';

beforeEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

afterEach(() => {
  window.history.replaceState(null, '', HOME_PATH);
});

/** Renders a link to the target and returns its anchor element. */
function renderLink(props = {}) {
  render(<Link to={TARGET_PATH} {...props}>{LINK_TEXT}</Link>);
  return screen.getByRole('link', { name: LINK_TEXT });
}

/**
 * Clicks the anchor and reports whether the Link itself prevented the browser's
 * default action. The document-level listener then cancels it, so jsdom never
 * attempts a real (unimplemented) navigation.
 */
function clickLink(anchor, init) {
  let preventedByLink;
  const record = (event) => {
    preventedByLink = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', record, { once: true });
  fireEvent.click(anchor, init);
  return preventedByLink;
}

describe('Link', () => {
  it('test_link_renders_anchor', () => {
    const anchor = renderLink({ className: 'x' });

    expect(anchor.tagName).toBe('A');
    expect(anchor).toHaveAttribute('href', TARGET_PATH);
    expect(anchor).toHaveClass('x');
    expect(window.location.pathname).toBe(HOME_PATH);
  });

  it('test_link_click_navigates', () => {
    const anchor = renderLink();

    const prevented = clickLink(anchor);

    expect(window.location.pathname).toBe(TARGET_PATH);
    expect(prevented).toBe(true);
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
    ['button: 1', { button: 1 }],
  ])('test_link_modified_click_ignored: %s', (_label, init) => {
    const anchor = renderLink();

    const prevented = clickLink(anchor, init);

    expect(window.location.pathname).toBe(HOME_PATH);
    expect(prevented).toBe(false);
  });

  it('test_link_target_blank_ignored', () => {
    const anchor = renderLink({ target: '_blank' });

    const prevented = clickLink(anchor);

    expect(anchor).toHaveAttribute('target', '_blank');
    expect(window.location.pathname).toBe(HOME_PATH);
    expect(prevented).toBe(false);
  });

  it('test_link_target_self_navigates', () => {
    const anchor = renderLink({ target: '_self' });

    fireEvent.click(anchor);

    expect(window.location.pathname).toBe(TARGET_PATH);
  });

  it('test_link_onclick_called_and_can_cancel: called once, then navigates', () => {
    const onClick = vi.fn();
    const anchor = renderLink({ onClick });

    fireEvent.click(anchor);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe(TARGET_PATH);
  });

  it('test_link_onclick_called_and_can_cancel: preventDefault cancels navigation', () => {
    const onClick = vi.fn((event) => event.preventDefault());
    const anchor = renderLink({ onClick });

    fireEvent.click(anchor);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe(HOME_PATH);
  });
});
