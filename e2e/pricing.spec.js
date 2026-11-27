import { test, expect } from '@playwright/test';
// Plain data with no asset imports, so it loads in Node as well as in the app.
import { pricing } from '../src/content/en/pricing.js';

// The pricing page in a real browser: reachability from the nav, phone layout,
// the column breakpoint and the order links that carry the chosen package.

const SITE_NAME_NAV = 'Site';
const CANVAS_SELECTOR = 'canvas.game-canvas';
const TIER_SELECTOR = '[data-tier]';
const ADDON_SELECTOR = '[data-addon]';
const NOTICE_SELECTOR = '[data-testid="pricing-placeholder-notice"]';
const CTA_SELECTOR = 'section[data-section="cta"]';

const TIERS = [
  ['basic', 'Choose Basic'],
  ['custom', 'Choose Custom'],
  ['premium', 'Choose Premium'],
];

const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 360, height: 740 };
const SMALL = { width: 320, height: 568 };

const MIN_TAP_HEIGHT = 44;
const ALIGN_TOLERANCE = 2;

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const siteNav = (page) => page.getByRole('navigation', { name: SITE_NAME_NAV, exact: true });
const tiers = (page) => page.locator(TIER_SELECTOR);
const tier = (page, id) => page.locator(`[data-tier="${id}"]`);
const notice = (page) => page.locator(NOTICE_SELECTOR);
const closingCta = (page, name) => page.locator(CTA_SELECTOR).getByRole('link', { name, exact: true });
const pathOf = (page) => new URL(page.url()).pathname;

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const boxesOf = async (locator) => {
  const boxes = [];
  for (const element of await locator.all()) boxes.push(await element.boundingBox());
  return boxes;
};

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Pricing page (e2e)', () => {
  test('test_e2e_reachable_from_nav: the nav link opens the packages', async ({ page }) => {
    await page.goto('/');

    await siteNav(page).getByRole('link', { name: 'Pricing', exact: true }).click();

    await expect(mainHeading(page)).toHaveText('Pricing');
    expect(pathOf(page)).toBe('/pricing');
    await expect(tiers(page)).toHaveCount(TIERS.length);
    for (const [id] of TIERS) await expect(tier(page, id)).toBeVisible();
  });

  test('test_e2e_deep_link_and_reload: a direct load and a reload show the same page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(tiers(page)).toHaveCount(TIERS.length);

    await page.reload();

    await expect(tiers(page)).toHaveCount(TIERS.length);
    await expect(page.locator(ADDON_SELECTOR)).toHaveCount(pricing.addons.length);
  });

  for (const viewport of [PHONE, DESKTOP]) {
    test(`test_e2e_notice_visible: ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/pricing');
      await expect(tiers(page)).toHaveCount(TIERS.length);

      if (!pricing.pricesArePlaceholder) {
        await expect(notice(page)).toHaveCount(0);
        return;
      }
      await expect(notice(page)).toBeVisible();
      const noticeBox = await notice(page).boundingBox();
      const firstTierBox = await tiers(page).first().boundingBox();
      expect(noticeBox.y).toBeLessThan(firstTierBox.y);
    });
  }

  for (const viewport of [PHONE, SMALL]) {
    test(`test_e2e_no_horizontal_scroll: ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/pricing');
      await expect(tiers(page)).toHaveCount(TIERS.length);

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      const boxes = await boxesOf(tiers(page));
      if (pricing.pricesArePlaceholder) boxes.push(await notice(page).boundingBox());
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
    });
  }

  test('test_e2e_tier_columns: three columns on desktop, one on a phone', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/pricing');
    await expect(tiers(page)).toHaveCount(TIERS.length);

    const wide = await boxesOf(tiers(page));
    for (let index = 1; index < wide.length; index += 1) {
      expect(Math.abs(wide[index].y - wide[0].y)).toBeLessThan(ALIGN_TOLERANCE);
      expect(wide[index].x).toBeGreaterThan(wide[index - 1].x);
    }

    await page.setViewportSize(PHONE);

    const narrow = await boxesOf(tiers(page));
    for (let index = 1; index < narrow.length; index += 1) {
      expect(Math.abs(narrow[index].x - narrow[0].x)).toBeLessThan(ALIGN_TOLERANCE);
      expect(narrow[index].y).toBeGreaterThan(narrow[index - 1].y);
    }
  });

  test('test_e2e_tier_cta_tappable: the package buttons are big enough to tap', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/pricing');

    for (const [id, name] of TIERS) {
      const box = await tier(page, id).getByRole('link', { name, exact: true }).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(MIN_TAP_HEIGHT);
    }
  });

  for (const [id, name] of TIERS) {
    test(`test_e2e_choose_tier: ${id} leads to the order page with the package`, async ({ page }) => {
      await page.goto('/pricing');
      await page.evaluate(() => {
        window.__spaMarker = true;
      });

      await tier(page, id).getByRole('link', { name, exact: true }).click();

      await expect(mainHeading(page)).toHaveText('Order');
      expect(page.url().endsWith(`/order?package=${id}`)).toBe(true);
      expect(await page.evaluate(() => window.__spaMarker)).toBe(true);
    });
  }

  test('test_e2e_closing_ctas: the closing links lead to customize and the demo', async ({ page }) => {
    await page.goto('/pricing');

    await closingCta(page, 'See what can be customized').click();
    await expect(mainHeading(page)).toHaveText('Customize');
    expect(pathOf(page)).toBe('/customize');

    await page.goBack();
    await expect(mainHeading(page)).toHaveText('Pricing');

    await closingCta(page, 'Try the demo').click();
    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible();
    expect(pathOf(page)).toBe('/demo');
  });
});
