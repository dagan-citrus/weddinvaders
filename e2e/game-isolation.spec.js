import { test, expect } from '@playwright/test';

// The site's CSS must not change the game. Game pages keep the page-level
// styles and the exact layout they had before the site shell existed.
// Playwright's default colour scheme is light, which the expectations rely on.

/** Where the default event's game is served. */
const GAME_PATH = '/DemoWedding';
/** A second registered event: every event page is a game surface, not only the default one. */
const SAMPLE_EVENT_PATH = '/MayaAndNoah';
/** The demo is a site page that embeds the game and links to the event's own page. */
const DEMO_PATH = '/demo';
const DEMO_HEADING = 'Play the demo';
const OWN_PAGE_LINK = 'Open this sample on its own page';

const CANVAS_SELECTOR = 'canvas.game-canvas';
const BRIDE_SHOOT_SELECTOR = '.shoot-btn.bride-shoot';
const SITE_CHROME_SELECTOR = 'header, footer, nav, main, .site';

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 390, height: 844 };

// Desktop layout of the game measured on the production build of commit 1a2b1b4
// (the integration branch before the site shell), at /DemoWedding in Chromium.
// At this size the canvas is capped by its max-width, so the numbers do not
// depend on the machine's fonts.
const BASELINE = {
  desktopCanvas: { x: 230, y: 75.484375, width: 819.984375, height: 542.015625 },
};
const GEOMETRY_TOLERANCE_PX = 0.5;

// On a phone the game shrinks to fit its touch controls, whose width depends on
// the installed fonts, so absolute positions differ between machines. What the
// page-level game rules guarantee there is font-independent: the game is
// centred, the canvas keeps its shape and nothing leaves the viewport.
const CANVAS_BORDER_PX = 2;
const CANVAS_ASPECT_RATIO = 910 / 600;
const ASPECT_RATIO_TOLERANCE = 0.01;

const GAME_BODY_STYLES = {
  display: 'flex',
  'align-items': 'flex-start',
  'justify-content': 'center',
  'overflow-x': 'hidden',
  'background-color': 'rgb(5, 5, 16)',
  margin: '0px',
  'min-width': '320px',
};
/** The light-scheme text colour of the game's :root rule. */
const GAME_ROOT_COLOR = 'rgb(33, 53, 71)';

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const gameCanvas = (page) => page.locator(CANVAS_SELECTOR);

/** Computed values of `properties` on the first element matching `selector`. */
const computedStyles = (page, selector, properties) =>
  page.evaluate(([target, names]) => {
    const style = getComputedStyle(document.querySelector(target));
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
  }, [selector, properties]);

const rectOf = (page, selector) =>
  page.evaluate((target) => {
    const { x, y, width, height } = document.querySelector(target).getBoundingClientRect();
    return { x, y, width, height };
  }, selector);

function expectRectClose(actual, expected, label) {
  for (const side of ['x', 'y', 'width', 'height']) {
    expect(Math.abs(actual[side] - expected[side]), `${label} ${side}: ${actual[side]} vs ${expected[side]}`)
      .toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  }
}

/** Opens the game and waits until it is laid out. */
async function openGame(page, viewport, path = GAME_PATH) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await expect(gameCanvas(page)).toBeVisible();
}

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Game isolation from site CSS (e2e)', () => {
  for (const path of [GAME_PATH, SAMPLE_EVENT_PATH]) {
    test(`test_e2e_game_surface: ${path} is a game surface without site chrome`, async ({ page }) => {
      await openGame(page, DESKTOP, path);

      await expect(page.locator('html')).toHaveAttribute('data-surface', 'game');
      await expect(page.locator(SITE_CHROME_SELECTOR)).toHaveCount(0);
    });
  }

  test('test_e2e_game_page_styles: the game page keeps its page-level styles', async ({ page }) => {
    await openGame(page, DESKTOP);

    expect(await computedStyles(page, 'body', Object.keys(GAME_BODY_STYLES))).toEqual(GAME_BODY_STYLES);
    expect(await computedStyles(page, 'html', ['color'])).toEqual({ color: GAME_ROOT_COLOR });
  });

  test('test_e2e_game_control_styles: the touch controls keep their styles', async ({ page }) => {
    await openGame(page, MOBILE);

    expect(
      await computedStyles(page, '.ammo-btn', ['padding', 'font-size', 'font-weight', 'border-radius', 'border-top-width']),
    ).toEqual({
      padding: '8px 12px',
      'font-size': '22px',
      'font-weight': '500',
      'border-radius': '8px',
      'border-top-width': '1px',
    });

    expect(
      await computedStyles(page, BRIDE_SHOOT_SELECTOR, ['padding', 'font-size', 'font-weight', 'border-top-style', 'min-width']),
    ).toEqual({
      padding: '12px 24px',
      'font-size': '16px',
      'font-weight': '700',
      'border-top-style': 'none',
      'min-width': '120px',
    });

    expect(await computedStyles(page, '.game-wrapper', ['padding'])).toEqual({ padding: '16px' });
  });

  test('test_e2e_game_geometry_unchanged: the canvas and controls sit where they did', async ({ page }) => {
    await openGame(page, DESKTOP);
    expectRectClose(await rectOf(page, CANVAS_SELECTOR), BASELINE.desktopCanvas, 'desktop canvas');

    await openGame(page, MOBILE);
    const canvas = await rectOf(page, CANVAS_SELECTOR);
    const shoot = await rectOf(page, BRIDE_SHOOT_SELECTOR);

    // Centred by the game's flex body: equal space on both sides.
    expect(Math.abs(canvas.x + canvas.width / 2 - MOBILE.width / 2)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
    // Shrunk to fit, not stretched or clipped.
    expect(canvas.x).toBeGreaterThan(0);
    expect(canvas.x + canvas.width).toBeLessThan(MOBILE.width);
    const drawnRatio = (canvas.width - 2 * CANVAS_BORDER_PX) / (canvas.height - 2 * CANVAS_BORDER_PX);
    expect(Math.abs(drawnRatio / CANVAS_ASPECT_RATIO - 1)).toBeLessThanOrEqual(ASPECT_RATIO_TOLERANCE);
    // The touch controls sit under the canvas, inside the viewport.
    expect(shoot.y).toBeGreaterThanOrEqual(canvas.y + canvas.height);
    expect(shoot.x).toBeGreaterThanOrEqual(0);
    expect(shoot.x + shoot.width).toBeLessThanOrEqual(MOBILE.width);
    expect(shoot.y + shoot.height).toBeLessThanOrEqual(MOBILE.height);
  });

  test('test_e2e_game_after_site_navigation: arriving from the site gives the same game page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(DEMO_PATH);
    await expect(mainHeading(page)).toHaveText(DEMO_HEADING);
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'site');
    expect(await computedStyles(page, 'body', ['display'])).toEqual({ display: 'block' });

    await page.getByRole('link', { name: OWN_PAGE_LINK, exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${GAME_PATH}$`));
    await expect(gameCanvas(page)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'game');
    await expect(page.locator(SITE_CHROME_SELECTOR)).toHaveCount(0);
    expect(await computedStyles(page, 'body', ['display'])).toEqual({ display: 'flex' });
    expectRectClose(await rectOf(page, CANVAS_SELECTOR), BASELINE.desktopCanvas, 'desktop canvas after navigation');

    await page.goBack();

    await expect(mainHeading(page)).toHaveText(DEMO_HEADING);
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'site');
    expect(await computedStyles(page, 'body', ['display'])).toEqual({ display: 'block' });
  });

  test('test_e2e_game_no_site_tokens_effect: site styles do not reach game elements', async ({ page }) => {
    await openGame(page, DESKTOP);

    expect(await computedStyles(page, CANVAS_SELECTOR, ['border-top-color'])).toEqual({
      'border-top-color': 'rgb(51, 51, 51)',
    });
    expect(await computedStyles(page, '.key-legend', ['color'])).toEqual({ color: 'rgb(102, 102, 102)' });
  });
});
