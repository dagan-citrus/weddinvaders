import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Vite emits one stylesheet for the whole app, so every rule is global. These
// checks read the CSS as text: the game's page-level rules must be scoped to
// the game surface, and site rules must not be able to reach the game.

// `new URL()` is jsdom's in this environment, which `fileURLToPath` rejects; pass the string.
const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = (name) => join(SRC_DIR, name);
const readCss = (name) => readFileSync(sourcePath(name), 'utf8');

const GAME_CSS_FILES = ['Game.css', 'index.css'];
const SITE_CSS_FILES = ['styles/site.css', 'pages/HomePage.css'];

/** A selector that starts with a bare page-level element (or the universal selector). */
const UNSCOPED_PAGE_SELECTOR = /^(\*|body|button|a|h1)(?![\w-])/;
const SITE_SELECTOR_PREFIXES = ['.site', '.home-', "html[data-surface='site']"];

const KEYFRAMES_RULE = /^@(-\w+-)?keyframes\b/;

/** Double quotes become single quotes, so either attribute-quoting style matches. */
const normalizeQuotes = (text) => text.replaceAll('"', "'");

/**
 * The selectors of every style rule in `css`, comma lists split up. At-rule
 * headers (`@media …`) and keyframe steps (`from`, `50%`) are not selectors.
 */
function styleSelectors(css) {
  const text = normalizeQuotes(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const selectors = [];
  const openBlocks = [];
  let prelude = '';
  for (const char of text) {
    if (char === '{') {
      const header = prelude.trim();
      const insideKeyframes = openBlocks.some((block) => KEYFRAMES_RULE.test(block));
      if (!header.startsWith('@') && !insideKeyframes) {
        selectors.push(...header.split(',').map((selector) => selector.trim().replace(/\s+/g, ' ')));
      }
      openBlocks.push(header);
      prelude = '';
    } else if (char === '}') {
      openBlocks.pop();
      prelude = '';
    } else if (char === ';') {
      prelude = '';
    } else {
      prelude += char;
    }
  }
  return selectors;
}

describe('CSS scoping', () => {
  it('test_game_css_scoped: the parser sees page-level selectors', () => {
    const sample = '* { margin: 0 }\nbutton:focus,\nbutton:focus-visible { outline: 0 }\n@media (min-width: 1px) { body { margin: 0 } }\n@keyframes spin { from { top: 0 } to { top: 1px } }';

    expect(styleSelectors(sample)).toEqual(['*', 'button:focus', 'button:focus-visible', 'body']);
  });

  it.each(GAME_CSS_FILES)('test_game_css_scoped: %s has no unscoped page-level rule', (file) => {
    const selectors = styleSelectors(readCss(file));

    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => UNSCOPED_PAGE_SELECTOR.test(selector))).toEqual([]);
  });

  it('test_game_css_scoped: the game rules are scoped to the game surface', () => {
    expect(normalizeQuotes(readCss('Game.css'))).toContain(":where([data-surface='game']) *");
    expect(normalizeQuotes(readCss('index.css'))).toContain(":root:where([data-surface='game'])");
  });

  it.each(SITE_CSS_FILES)('test_site_css_scoped: every rule of %s is scoped to the site', (file) => {
    const selectors = styleSelectors(readCss(file));

    expect(selectors.length).toBeGreaterThan(0);
    const unscoped = selectors.filter(
      (selector) => !SITE_SELECTOR_PREFIXES.some((prefix) => selector.startsWith(prefix)),
    );
    expect(unscoped).toEqual([]);
  });

  it('test_pricing_css_scoped: every rule of pages/PricingPage.css belongs to the pricing page', () => {
    const selectors = styleSelectors(readCss('pages/PricingPage.css'));

    expect(selectors.length).toBeGreaterThan(0);
    // A rule may be raised under `.site` to outrank the shell's element defaults.
    const foreign = selectors.filter(
      (selector) => !(selector.startsWith('.pricing-') || (selector.startsWith('.site') && selector.includes('.pricing-'))),
    );
    expect(foreign).toEqual([]);
  });

  it('test_order_css_scoped: every rule of pages/OrderPage.css belongs to the order page', () => {
    const selectors = styleSelectors(readCss('pages/OrderPage.css'));

    expect(selectors.length).toBeGreaterThan(0);
    // A rule may be raised under `.site` to outrank the shell's element defaults.
    const foreign = selectors.filter(
      (selector) => !(selector.startsWith('.order-') || (selector.startsWith('.site') && selector.includes('.order-'))),
    );
    expect(foreign).toEqual([]);
  });

  it.each([
    ['--wv-bg', '#050510'],
    ['--wv-gold', '#ffd700'],
    ['--wv-pink', '#ff69b4'],
    ['--wv-blue', '#4169e1'],
  ])('test_tokens_defined: %s is %s', (token, value) => {
    const tokens = readCss('styles/tokens.css').toLowerCase();

    expect(tokens).toMatch(new RegExp(`${token}:\\s*${value}\\s*;`));
  });

  it('test_app_css_removed', () => {
    expect(existsSync(sourcePath('App.css'))).toBe(false);
  });
});
