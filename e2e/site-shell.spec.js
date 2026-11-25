import { test, expect } from '@playwright/test';

// The site shell and landing page in a real browser: layout, overflow,
// computed styles, scrolling and media queries do not exist in jsdom.

const SITE_NAME = "Weddin'Vaders";
const HEADLINE = 'Your wedding, as a two-player arcade game.';
const CANVAS_SELECTOR = 'canvas.game-canvas';
const PREVIEW_SELECTOR = '[data-testid="gameplay-preview"]';
const PREVIEW_ITEM_SELECTOR = `${PREVIEW_SELECTOR} [data-item]`;
const HERO_SELECTOR = 'section[data-section="hero"]';
const SITE_NAV_NAME = 'Site';
const FOOTER_NAV_NAME = 'Footer';
const DEMO_CTA = 'Try the demo';
const ORDER_CTA = 'Get your game';

const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 360, height: 740 };
const SMALL = { width: 320, height: 568 };
const SHORT_PHONE = { width: 360, height: 300 };

const MIN_TAP_HEIGHT = 40;
const SAME_COLUMN_TOLERANCE = 40;
const FOCUS_OUTLINE_WIDTH = '3px';

const NAV_LINK_NAMES = [
  'Home', 'Demo', 'Customize', 'Pricing', 'How it works', 'Order', 'Showcase', 'Privacy', 'Terms',
];

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const siteNav = (page) => page.getByRole('navigation', { name: SITE_NAV_NAME, exact: true });
const footerNav = (page) => page.getByRole('navigation', { name: FOOTER_NAV_NAME, exact: true });
const hero = (page) => page.locator(HERO_SELECTOR);
const heroCta = (page, name) => hero(page).getByRole('link', { name, exact: true });
const preview = (page) => page.locator(PREVIEW_SELECTOR);
const pathOf = (page) => new URL(page.url()).pathname;

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const animationNames = (page) =>
  page.locator(PREVIEW_ITEM_SELECTOR).evaluateAll((items) => items.map((item) => getComputedStyle(item).animationName));

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Site shell and landing page (e2e)', () => {
  test('test_e2e_home_content: the landing page shows the pitch and the preview, not the game', async ({ page }) => {
    await page.goto('/');

    await expect(mainHeading(page)).toBeVisible();
    await expect(mainHeading(page)).toHaveText(SITE_NAME);
    await expect(page.getByText(HEADLINE)).toBeVisible();
    await expect(preview(page)).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('test_e2e_hero_cta_demo: "Try the demo" opens the game', async ({ page }) => {
    await page.goto('/');

    await heroCta(page, DEMO_CTA).click();

    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible();
    expect(pathOf(page)).toBe('/demo');
  });

  test('test_e2e_hero_cta_order: "Get your game" opens the order page', async ({ page }) => {
    await page.goto('/');

    await heroCta(page, ORDER_CTA).click();

    await expect(mainHeading(page)).toHaveText('Order');
    expect(pathOf(page)).toBe('/order');
  });

  for (const [name, viewport] of [['PHONE', PHONE], ['SMALL', SMALL]]) {
    for (const path of ['/', '/pricing', '/NoSuchEvent']) {
      test(`test_e2e_no_horizontal_scroll: ${path} at ${name} (${viewport.width}px)`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await expect(mainHeading(page)).toBeVisible();

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      });
    }
  }

  test('test_e2e_phone_nav_usable: all nine nav links fit a phone and work', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');

    const links = siteNav(page).getByRole('link');
    await expect(links).toHaveText(NAV_LINK_NAMES);
    for (const name of NAV_LINK_NAMES) {
      const link = siteNav(page).getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${name} right edge`).toBeLessThanOrEqual(PHONE.width);
      expect(box.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TAP_HEIGHT);
    }

    await siteNav(page).getByRole('link', { name: 'Pricing', exact: true }).click();
    await expect(mainHeading(page)).toHaveText('Pricing');
  });

  test('test_e2e_phone_hero: the hero buttons and the preview fit a phone', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');

    for (const name of [DEMO_CTA, ORDER_CTA]) {
      const cta = heroCta(page, name);
      await expect(cta).toBeVisible();
      const box = await cta.boundingBox();
      expect(box.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${name} right edge`).toBeLessThanOrEqual(PHONE.width);
    }

    const previewBox = await preview(page).boundingBox();
    expect(previewBox.width).toBeGreaterThan(0);
    expect(previewBox.width).toBeLessThanOrEqual(PHONE.width);
  });

  test('test_e2e_desktop_layout: the hero is two columns on desktop and one on a phone', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await expect(preview(page)).toBeVisible();

    const desktopHeading = await mainHeading(page).boundingBox();
    const desktopPreview = await preview(page).boundingBox();
    expect(desktopPreview.x).toBeGreaterThan(desktopHeading.x + SAME_COLUMN_TOLERANCE);

    await page.setViewportSize(PHONE);
    const phoneHeading = await mainHeading(page).boundingBox();
    const phonePreview = await preview(page).boundingBox();
    expect(phonePreview.y).toBeGreaterThan(phoneHeading.y);
    expect(Math.abs(phonePreview.x - phoneHeading.x)).toBeLessThan(SAME_COLUMN_TOLERANCE);
  });

  test('test_e2e_scroll_and_focus: in-app navigation scrolls to the top and focuses main', async ({ page }) => {
    // Short enough that the destination page scrolls too; otherwise its scroll
    // position would be 0 whether or not navigation scrolled to the top.
    await page.setViewportSize(SHORT_PHONE);
    await page.goto('/');
    await expect(mainHeading(page)).toHaveText(SITE_NAME);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await footerNav(page).getByRole('link', { name: 'Privacy policy', exact: true }).click();

    await expect(mainHeading(page)).toHaveText('Privacy');
    expect(pathOf(page)).toBe('/privacy');
    const scrollableBy = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(scrollableBy).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.activeElement.id)).toBe('main');
  });

  test('test_e2e_site_body_not_game_layout: site pages do not get the game page layout', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await expect(mainHeading(page)).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('data-surface', 'site');
    const body = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { display: style.display, margin: style.margin };
    });
    expect(body).toEqual({ display: 'block', margin: '0px' });

    const rootWidth = await page.evaluate(() => document.getElementById('root').getBoundingClientRect().width);
    expect(rootWidth).toBe(DESKTOP.width);
  });

  test('test_e2e_focus_visible: keyboard focus is visible on links', async ({ page }) => {
    await page.goto('/');
    await expect(mainHeading(page)).toBeVisible();

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content', exact: true });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Tab');
    const brand = page.getByRole('banner').getByRole('link', { name: SITE_NAME, exact: true });
    await expect(brand).toBeFocused();
    const outline = await brand.evaluate((link) => {
      const style = getComputedStyle(link);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline).toEqual({ style: 'solid', width: FOCUS_OUTLINE_WIDTH });
  });

  test('test_e2e_reduced_motion: the preview animates only when motion is welcome', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(preview(page)).toBeVisible();

    const reduced = await animationNames(page);
    expect(reduced.length).toBeGreaterThan(0);
    expect(reduced.every((name) => name === 'none')).toBe(true);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const animated = await animationNames(page);
    expect(animated.some((name) => name !== 'none')).toBe(true);
  });
});
