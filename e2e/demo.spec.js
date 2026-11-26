import { test, expect } from '@playwright/test';

// The demo page in a real browser: the real game embedded in a site page, the
// switch between the two sample events, keys that must not scroll the page or
// start the game by accident, and the layout on a phone.

const DEMO_PATH = '/demo';
const GARDEN_PATH = '/demo?event=garden';
const CLASSIC_EVENT_PATH = '/DemoWedding';
const GARDEN_EVENT_PATH = '/MayaAndNoah';

const DEMO_HEADING = 'Play the demo';
const SITE_NAV_NAME = 'Site';
const SWITCHER_NAME = 'Sample games';
const CLASSIC_LABEL = 'Classic wedding';
const GARDEN_LABEL = "Maya & Noah's garden party";
const OWN_PAGE_LINK = 'Open this sample on its own page';
const ORDER_CTA = 'Get your game';

const STAGE_SELECTOR = '[data-testid="demo-stage"]';
const CANVAS_SELECTOR = 'canvas.game-canvas';
const AMMO_BUTTON_SELECTOR = '.ammo-btn';
const SHOOT_BUTTON_SELECTOR = '.shoot-btn';
const SITE_CHROME_SELECTOR = 'header, nav, main';

const DESKTOP = { width: 1280, height: 720 };
const SHORT_DESKTOP = { width: 1280, height: 500 };
const TOUCH_DEVICE = { width: 390, height: 844 };
const PHONE = { width: 360, height: 740 };
const SMALL = { width: 320, height: 568 };

/** Smaller than the site header, so scrolling the switcher this close to the top always scrolls. */
const SWITCHER_TOP_MARGIN_PX = 20;

const SETTLE_MS = 300;
const TAB_SETTLE_MS = 500;

// Every string the classic sample's title screen draws, in draw order (mind the
// double and triple spaces). The same strings as on the event's own page.
const DEFAULT_TITLE_TEXTS = [
  "WEDDIN'VADERS",
  'Buy the wedding of your dreams!',
  '👰 Bride  —  A/D move   ·   S ammo   ·   W shoot',
  '🤵 Groom  —  ←/→ move   ·   ↑/↓ ammo   ·   Space shoot',
  '',
  '💵 Cash shoots at items to buy them',
  '💌 Send invites to guests — they attend & bring gift money!',
  '💕 Send hearts to family — they donate BIG bucks!',
  '',
  'Collect items on the right panel. N = fast-forward once done!',
  '',
  '— Press any key to begin —',
  'LEVEL 1', 'Save the Date', 'SCORE', '0', '💍', 'Rings', 'EXTRAS', '🎂', 'Cake',
];
const DEFAULT_TITLE = "WEDDIN'VADERS";
const DEFAULT_LEVEL_1_AMMO = '💌×12  💕×4';

const GARDEN_TITLE = 'MAYA & NOAH';
const GARDEN_LEVEL_1_NAME = 'The Backyard';
const GARDEN_BRIDE_CONTROLS = '👰 Maya  —  A/D move   ·   S ammo   ·   W shoot';
const GARDEN_LEVEL_1_AMMO = '💌×10  💕×4';
const MONEY_PREFIX = '💰';

const CANVAS_BORDER_PX = 2;
const CANVAS_ASPECT_RATIO = 910 / 600;
const ASPECT_RATIO_TOLERANCE = 0.01;
/** The game container caps the canvas at this width. */
const CANVAS_MAX_WIDTH = 820;
const DESKTOP_CANVAS_MIN_WIDTH = 700;

/** Records the text of every canvas `fillText` call in `window.__drawnTexts`. */
async function recordDrawnTexts(page) {
  await page.addInitScript(() => {
    window.__drawnTexts = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function fillText(text, ...rest) {
      window.__drawnTexts.push(text);
      return original.call(this, text, ...rest);
    };
  });
}

const drawnTexts = (page) => page.evaluate(() => window.__drawnTexts);
const resetDrawnTexts = (page) => page.evaluate(() => { window.__drawnTexts = []; });

/** Waits until the canvas has drawn `text` since the recorder was last reset. */
const expectDrawn = (page, text) =>
  expect
    .poll(async () => (await drawnTexts(page)).includes(text), {
      message: `expected the canvas to draw ${JSON.stringify(text)}`,
    })
    .toBe(true);

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const stage = (page) => page.locator(STAGE_SELECTOR);
const stageCanvas = (page) => stage(page).locator(CANVAS_SELECTOR);
const siteNav = (page) => page.getByRole('navigation', { name: SITE_NAV_NAME, exact: true });
const switcher = (page) => page.getByRole('navigation', { name: SWITCHER_NAME, exact: true });
const sampleLink = (page, name) => switcher(page).getByRole('link', { name, exact: true });
const ownPageLink = (page) => page.getByRole('link', { name: OWN_PAGE_LINK, exact: true });
const pathAndQuery = (page) => {
  const { pathname, search } = new URL(page.url());
  return pathname + search;
};

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const scrollY = (page) => page.evaluate(() => window.scrollY);

/** Computed values of `properties` on the first element matching `selector`. */
const computedStyles = (page, selector, properties) =>
  page.evaluate(([target, names]) => {
    const style = getComputedStyle(document.querySelector(target));
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
  }, [selector, properties]);

/** Opens the demo page and waits until the embedded game is laid out and drawing. */
async function openDemo(page, { path = DEMO_PATH, viewport } = {}) {
  if (viewport) await page.setViewportSize(viewport);
  await recordDrawnTexts(page);
  await page.goto(path);
  await expect(stageCanvas(page)).toBeVisible();
  await expect.poll(async () => (await drawnTexts(page)).length).toBeGreaterThan(0);
}

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Demo page (e2e)', () => {
  test('test_e2e_demo_page: the demo is a site page with the game inside it', async ({ page }) => {
    await openDemo(page);

    await expect(mainHeading(page)).toHaveText(DEMO_HEADING);
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'site');
    await expect(page.locator(CANVAS_SELECTOR)).toHaveCount(1);
    await expect(stageCanvas(page)).toBeVisible();
    await expect(stage(page)).toHaveAttribute('data-surface', 'game');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(siteNav(page).getByRole('link', { name: 'Demo', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('test_e2e_demo_default_title: the classic sample draws the original title screen', async ({ page }) => {
    await openDemo(page);

    await expect
      .poll(async () => (await drawnTexts(page)).length)
      .toBeGreaterThanOrEqual(DEFAULT_TITLE_TEXTS.length);

    const texts = await drawnTexts(page);
    expect(texts.slice(0, DEFAULT_TITLE_TEXTS.length)).toEqual(DEFAULT_TITLE_TEXTS);
  });

  test('test_e2e_demo_play_starts: a key starts the classic sample', async ({ page }) => {
    await openDemo(page);

    await page.keyboard.press('KeyX');

    await expectDrawn(page, DEFAULT_LEVEL_1_AMMO);
  });

  test('test_e2e_switch_draws_sample: picking the garden party draws and plays that event', async ({ page }) => {
    await openDemo(page);
    await expectDrawn(page, DEFAULT_TITLE);

    await sampleLink(page, GARDEN_LABEL).click();
    await expect(stage(page)).toHaveAttribute('data-event-slug', 'MayaAndNoah');
    await resetDrawnTexts(page);

    for (const expected of [GARDEN_TITLE, GARDEN_LEVEL_1_NAME, GARDEN_BRIDE_CONTROLS]) {
      await expectDrawn(page, expected);
    }

    // The classic game's loop has stopped: nothing of it is drawn any more.
    await resetDrawnTexts(page);
    await page.waitForTimeout(SETTLE_MS);
    const afterSwitch = await drawnTexts(page);
    expect(afterSwitch.length).toBeGreaterThan(0);
    expect(afterSwitch).not.toContain(DEFAULT_TITLE);

    expect(pathAndQuery(page)).toBe(GARDEN_PATH);
    await expect(sampleLink(page, GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
    await expect(sampleLink(page, CLASSIC_LABEL)).not.toHaveAttribute('aria-current');

    await page.keyboard.press('KeyX');
    await expectDrawn(page, GARDEN_LEVEL_1_AMMO);
  });

  test('test_e2e_switch_back_resets: returning to the classic sample starts it afresh', async ({ page }) => {
    await openDemo(page, { path: GARDEN_PATH });
    await page.keyboard.press('KeyX');
    await expectDrawn(page, GARDEN_LEVEL_1_AMMO);

    await sampleLink(page, CLASSIC_LABEL).click();
    await expect(stage(page)).toHaveAttribute('data-event-slug', 'DemoWedding');
    await resetDrawnTexts(page);
    await expectDrawn(page, DEFAULT_TITLE);

    // Back on a title screen: no HUD money line from either game.
    await resetDrawnTexts(page);
    await page.waitForTimeout(SETTLE_MS);
    const texts = await drawnTexts(page);
    expect(texts).toContain(DEFAULT_TITLE);
    expect(texts.filter((text) => String(text).startsWith(MONEY_PREFIX))).toEqual([]);
    expect(texts).not.toContain(GARDEN_TITLE);
    expect(pathAndQuery(page)).toBe(DEMO_PATH);
  });

  test('test_e2e_switch_does_not_scroll_or_add_history: switching keeps the page where it is', async ({ page }) => {
    await openDemo(page, { viewport: SHORT_DESKTOP });
    // Scroll down, leaving the switcher just inside the viewport.
    await sampleLink(page, GARDEN_LABEL).evaluate((link, margin) => {
      window.scrollTo(0, link.getBoundingClientRect().top + window.scrollY - margin);
    }, SWITCHER_TOP_MARGIN_PX);
    const scrolledTo = await scrollY(page);
    expect(scrolledTo).toBeGreaterThan(0);
    const historyLength = await page.evaluate(() => window.history.length);

    await sampleLink(page, GARDEN_LABEL).click();
    await expect(stage(page)).toHaveAttribute('data-event-slug', 'MayaAndNoah');

    expect(await scrollY(page)).toBe(scrolledTo);
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
  });

  test('test_e2e_deep_link_and_reload: the sample has its own link', async ({ page }) => {
    await openDemo(page, { path: GARDEN_PATH });

    await expectDrawn(page, GARDEN_TITLE);
    await expect(sampleLink(page, GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');

    await page.reload();

    await expectDrawn(page, GARDEN_TITLE);
    await expect(sampleLink(page, GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
    expect(await drawnTexts(page)).not.toContain(DEFAULT_TITLE);
  });

  test('test_e2e_keys_do_not_scroll: game keys never scroll the demo page', async ({ page }) => {
    await openDemo(page, { viewport: SHORT_DESKTOP });
    const scrollableBy = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(scrollableBy).toBeGreaterThan(0);

    for (const key of ['Space', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(SETTLE_MS);
    expect(await scrollY(page)).toBe(0);

    // The page itself can scroll: a key the game does not use still does.
    await page.keyboard.press('PageDown');
    await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
  });

  test('test_e2e_tab_does_not_start: Tab moves focus and leaves the game on its title screen', async ({ page }) => {
    await openDemo(page);

    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();
    await page.waitForTimeout(TAB_SETTLE_MS);
    expect(await drawnTexts(page)).not.toContain(DEFAULT_LEVEL_1_AMMO);

    await page.keyboard.press('KeyX');
    await expectDrawn(page, DEFAULT_LEVEL_1_AMMO);
  });

  for (const [name, viewport] of [['PHONE', PHONE], ['SMALL', SMALL]]) {
    for (const path of [DEMO_PATH, GARDEN_PATH]) {
      test(`test_e2e_phone_no_horizontal_scroll: ${path} at ${name} (${viewport.width}px)`, async ({ page }) => {
        await openDemo(page, { path, viewport });

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

        const controls = [
          [CANVAS_SELECTOR, 1],
          [AMMO_BUTTON_SELECTOR, 6],
          [SHOOT_BUTTON_SELECTOR, 2],
        ];
        for (const [selector, count] of controls) {
          const elements = stage(page).locator(selector);
          await expect(elements).toHaveCount(count);
          for (let index = 0; index < count; index++) {
            const element = elements.nth(index);
            await expect(element).toBeVisible();
            const box = await element.boundingBox();
            expect(box.x, `${selector} #${index} left edge`).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width, `${selector} #${index} right edge`).toBeLessThanOrEqual(viewport.width);
          }
        }
      });
    }
  }

  for (const [name, viewport] of [['DESKTOP', DESKTOP], ['SHORT_DESKTOP', SHORT_DESKTOP], ['PHONE', PHONE]]) {
    test(`test_e2e_canvas_ratio: the embedded canvas keeps its shape at ${name}`, async ({ page }) => {
      await openDemo(page, { viewport });

      const { width, height } = await stageCanvas(page).boundingBox();
      const drawnRatio = (width - 2 * CANVAS_BORDER_PX) / (height - 2 * CANVAS_BORDER_PX);
      expect(Math.abs(drawnRatio / CANVAS_ASPECT_RATIO - 1)).toBeLessThanOrEqual(ASPECT_RATIO_TOLERANCE);
      expect(height).toBeLessThanOrEqual(viewport.height);
      expect(width).toBeLessThanOrEqual(viewport.width);

      if (viewport === DESKTOP) {
        expect(width).toBeGreaterThan(DESKTOP_CANVAS_MIN_WIDTH);
        expect(width).toBeLessThanOrEqual(CANVAS_MAX_WIDTH);
      }
    });
  }

  test('test_e2e_embedded_button_styles: the embedded controls keep the game\'s own styles', async ({ page }) => {
    await openDemo(page, { viewport: TOUCH_DEVICE });

    expect(
      await computedStyles(page, `${STAGE_SELECTOR} ${AMMO_BUTTON_SELECTOR}`, ['padding', 'font-size', 'font-weight']),
    ).toEqual({ padding: '8px 12px', 'font-size': '22px', 'font-weight': '500' });

    expect(
      await computedStyles(page, `${STAGE_SELECTOR} .shoot-btn.bride-shoot`, ['padding', 'font-weight', 'min-width']),
    ).toEqual({ padding: '12px 24px', 'font-weight': '700', 'min-width': '120px' });

    // The full-page game layout is switched off inside the site page …
    expect(
      await computedStyles(page, `${STAGE_SELECTOR} .game-wrapper`, ['min-height', 'padding']),
    ).toEqual({ 'min-height': '0px', padding: '0px' });
    // … and the game's page-level body rules do not apply here.
    expect(await computedStyles(page, 'body', ['display'])).toEqual({ display: 'block' });
  });

  test('test_e2e_cta_and_own_page: the page leads to the order form and to the sample\'s own page', async ({ page }) => {
    await openDemo(page, { path: GARDEN_PATH });

    await page.locator('section[data-section="cta"]').getByRole('link', { name: ORDER_CTA, exact: true }).click();
    await expect(page).toHaveURL(/\/order$/);

    await page.goBack();
    await expect(mainHeading(page)).toHaveText(DEMO_HEADING);
    await expect(sampleLink(page, GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
    await expect(ownPageLink(page)).toHaveAttribute('href', GARDEN_EVENT_PATH);

    await ownPageLink(page).click();

    await expect(page).toHaveURL(new RegExp(`${GARDEN_EVENT_PATH}$`));
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'game');
    await expect(page.locator(SITE_CHROME_SELECTOR)).toHaveCount(0);
    await resetDrawnTexts(page);
    await expectDrawn(page, GARDEN_TITLE);

    await page.goBack();

    await expect(mainHeading(page)).toHaveText(DEMO_HEADING);
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'site');
    await expect(sampleLink(page, GARDEN_LABEL)).toHaveAttribute('aria-current', 'true');
  });

  test('test_e2e_cta_and_own_page: the classic sample links to its own page', async ({ page }) => {
    await openDemo(page);

    await expect(ownPageLink(page)).toHaveAttribute('href', CLASSIC_EVENT_PATH);
  });

  test('test_e2e_sample_event_direct: the sample event has its own guest page', async ({ page }) => {
    await recordDrawnTexts(page);
    await page.goto('/mayaandnoah');

    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible();
    await expect(page).toHaveTitle("Maya & Noah | Weddin'Vaders");
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'game');
    await expectDrawn(page, GARDEN_TITLE);
  });
});

test.describe('Demo page on a touchscreen (e2e)', () => {
  test.use({ viewport: PHONE, hasTouch: true });

  test('test_e2e_touch_tap_starts: tapping the game starts it and the touch buttons work', async ({ page }) => {
    await openDemo(page);

    await stageCanvas(page).tap();
    await expectDrawn(page, DEFAULT_LEVEL_1_AMMO);

    await stage(page).getByRole('button', { name: '👰 SHOOT', exact: true }).tap();
    await stage(page).getByRole('button', { name: '🤵 SHOOT', exact: true }).tap();
    await page.waitForTimeout(SETTLE_MS);

    // Still playing after the taps (any page error fails the test in afterEach).
    await resetDrawnTexts(page);
    await expectDrawn(page, 'LEVEL 1');
  });
});
