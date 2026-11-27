import { test, expect } from '@playwright/test';

// The customization page in a real browser: reachability from the nav, phone
// overflow, the before/after layout, images loading and the calls to action.

const PAGE_PATH = '/customize';
const PAGE_HEADING = 'Customize';
const SITE_NAME = "Weddin'Vaders";
const SITE_NAV_NAME = 'Site';
const OPTION_SELECTOR = '[data-option]';
const OPTION_COUNT = 5;
const PHOTO_SELECTOR = '[data-example="photos"] img';
const PHOTO_COUNT = 3;
const CTA_SELECTOR = 'section[data-section="cta"]';
const CANVAS_SELECTOR = 'canvas.game-canvas';
const DEMO_CTA = 'Try the demo';
const ORDER_CTA = 'Get your game';

const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 360, height: 740 };
const SMALL = { width: 320, height: 568 };

const SAME_ROW_TOLERANCE = 2;

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const siteNav = (page) => page.getByRole('navigation', { name: SITE_NAV_NAME, exact: true });
const options = (page) => page.locator(OPTION_SELECTOR);
const cta = (page, name) => page.locator(CTA_SELECTOR).getByRole('link', { name, exact: true });
const pathOf = (page) => new URL(page.url()).pathname;
const brideNameVariant = (page, name) =>
  page.locator(`[data-example="names"] [data-field="bride"] [data-variant="${name}"]`);

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Customization page (e2e)', () => {
  test('test_e2e_reachable_from_nav: the nav link opens the page', async ({ page }) => {
    await page.goto('/');
    await expect(mainHeading(page)).toHaveText(SITE_NAME);

    await siteNav(page).getByRole('link', { name: PAGE_HEADING, exact: true }).click();

    await expect(mainHeading(page)).toHaveText(PAGE_HEADING);
    expect(pathOf(page)).toBe(PAGE_PATH);
    await expect(options(page)).toHaveCount(OPTION_COUNT);
    for (const card of await options(page).all()) {
      await expect(card).toBeVisible();
    }
  });

  test('test_e2e_deep_link_and_reload: the page survives a direct load and a reload', async ({ page }) => {
    await page.goto(PAGE_PATH);
    await expect(options(page)).toHaveCount(OPTION_COUNT);

    await page.reload();

    await expect(mainHeading(page)).toHaveText(PAGE_HEADING);
    await expect(options(page)).toHaveCount(OPTION_COUNT);
  });

  test('test_e2e_photos_load: the three standard pictures are real images', async ({ page }) => {
    await page.goto(PAGE_PATH);

    const photos = page.locator(PHOTO_SELECTOR);
    await expect(photos).toHaveCount(PHOTO_COUNT);
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();   // the images are lazy-loaded
      await expect.poll(() => photo.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    }
  });

  for (const [name, viewport] of [['PHONE', PHONE], ['SMALL', SMALL]]) {
    test(`test_e2e_no_horizontal_scroll: ${name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(PAGE_PATH);
      await expect(options(page)).toHaveCount(OPTION_COUNT);

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      for (const card of await options(page).all()) {
        const box = await card.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
    });
  }

  test('test_e2e_layout_breakpoint: before and after stack on a phone and sit side by side on desktop', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(PAGE_PATH);
    await expect(brideNameVariant(page, 'after')).toBeVisible();

    const phoneBefore = await brideNameVariant(page, 'before').boundingBox();
    const phoneAfter = await brideNameVariant(page, 'after').boundingBox();
    expect(phoneAfter.y).toBeGreaterThan(phoneBefore.y);

    await page.setViewportSize(DESKTOP);
    await expect.poll(async () => {
      const before = await brideNameVariant(page, 'before').boundingBox();
      const after = await brideNameVariant(page, 'after').boundingBox();
      return Math.abs(after.y - before.y);
    }).toBeLessThan(SAME_ROW_TOLERANCE);

    const desktopBefore = await brideNameVariant(page, 'before').boundingBox();
    const desktopAfter = await brideNameVariant(page, 'after').boundingBox();
    expect(desktopAfter.x).toBeGreaterThan(desktopBefore.x);
  });

  test('test_e2e_cta_demo: "Try the demo" opens the game', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await cta(page, DEMO_CTA).click();

    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible();
    expect(pathOf(page)).toBe('/demo');
  });

  test('test_e2e_cta_order: "Get your game" opens the order page', async ({ page }) => {
    await page.goto(PAGE_PATH);

    await cta(page, ORDER_CTA).click();

    await expect(mainHeading(page)).toHaveText('Order');
    expect(pathOf(page)).toBe('/order');
  });
});
