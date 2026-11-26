import { test, expect } from '@playwright/test';
// Plain data with no imports of its own, so it loads in Node as well as in the app.
import { SITE_CONFIG, PLACEHOLDER_CONTACT_EMAIL } from '../src/siteConfig.js';

// The order page in a real browser: arriving from a pricing tier, the live
// address check, staying on the page when the order email is created, the
// copy fallback, and the phone layout.
//
// Ordering is closed while the contact address is the placeholder, and the
// production build under test has whatever address is configured. The cases
// that need an open form are therefore skipped while it is closed, and the
// closed-state case is skipped once a real address is set. No test edit is
// needed when that happens.
const OPEN = SITE_CONFIG.contactEmail !== PLACEHOLDER_CONTACT_EMAIL;
const NEEDS_OPEN = 'ordering is closed: SITE_CONFIG.contactEmail is still the placeholder address';
const NEEDS_CLOSED = 'ordering is open: a real contact address is configured';

const ORDER_PATH = '/order';
const SITE_NAV_NAME = 'Site';
const SUBMIT_NAME = 'Create my order email';
const COPY_NAME = 'Copy message';
const FAQ_COUNT = 8;

const SLUG_STATUS_SELECTOR = '[data-testid="order-slug-status"]';
const SLUG_PREVIEW_SELECTOR = '[data-testid="order-slug-preview"]';
const CLOSED_NOTICE_SELECTOR = '[data-testid="order-closed-notice"]';
const RESULT_SELECTOR = '[data-testid="order-result"]';
const MAILTO_LINK_SELECTOR = '[data-testid="order-mailto-link"]';
const MESSAGE_SELECTOR = '[data-testid="order-message"]';
const COPY_STATUS_SELECTOR = '[data-testid="order-copy-status"]';

const PHONE = { width: 360, height: 740 };
const SMALL = { width: 320, height: 568 };
const MIN_TAP_HEIGHT = 44;
/** Sub-pixel rounding of a 44px row. */
const HEIGHT_TOLERANCE = 0.5;

const PACKAGE_RADIOS = ['Basic', 'Custom', 'Premium', 'Not sure yet'];

/** A wedding date that is always in the future. */
const WEDDING_DATE = `${new Date().getFullYear() + 1}-06-12`;

const ORDER = {
  brideName: 'Shelly',
  groomName: 'Dan',
  weddingDate: WEDDING_DATE,
  slug: 'DanAndShelly',
  packageName: 'Custom',
  addons: ['Rush delivery', 'Printable QR code'],
  email: 'dan@example.org',
  notes: 'We met at a taco truck.\nMake level 1 about tacos!',
};

/** The start of the mailto URL for `ORDER`, up to and including `&body=`. */
const MAILTO_START = `mailto:${SITE_CONFIG.contactEmail}`
  + "?subject=Weddin'Vaders%20order%3A%20Dan%20%26%20Shelly%20(DanAndShelly)&body=";
const MAILTO_END = 'about%20tacos!';
const MAILTO_SCHEME = 'mailto:';

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const siteNav = (page) => page.getByRole('navigation', { name: SITE_NAV_NAME, exact: true });
const field = (page, label) => page.getByLabel(label, { exact: true });
const slugField = (page) => field(page, 'Address for your game');
const radio = (page, name) => page.getByRole('radio', { name, exact: true });
const submitButton = (page) => page.getByRole('button', { name: SUBMIT_NAME, exact: true });
const slugStatus = (page) => page.locator(SLUG_STATUS_SELECTOR);
const slugPreview = (page) => page.locator(SLUG_PREVIEW_SELECTOR);
const pathOf = (page) => new URL(page.url()).pathname;

const horizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const boxesOf = async (locator) => {
  const boxes = [];
  for (const element of await locator.all()) boxes.push(await element.boundingBox());
  return boxes;
};

/** Fills the whole form with `ORDER`. */
async function fill(page) {
  await field(page, "Bride's name").fill(ORDER.brideName);
  await field(page, "Groom's name").fill(ORDER.groomName);
  await field(page, 'Wedding date').fill(ORDER.weddingDate);
  await slugField(page).fill(ORDER.slug);
  await radio(page, ORDER.packageName).check();
  for (const name of ORDER.addons) await page.getByRole('checkbox', { name, exact: true }).check();
  await field(page, 'Your email').fill(ORDER.email);
  await field(page, 'Notes (optional)').fill(ORDER.notes);
}

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Order page (e2e)', () => {
  test('test_e2e_from_pricing_tier: a pricing tier opens the form with that package chosen', async ({ page }) => {
    await page.goto('/pricing');

    await page.locator('[data-tier="custom"]').getByRole('link', { name: 'Choose Custom', exact: true }).click();

    await expect(mainHeading(page)).toHaveText('Order');
    expect(page.url().endsWith(`${ORDER_PATH}?package=custom`)).toBe(true);
    await expect(radio(page, 'Custom')).toBeChecked();
    for (const name of PACKAGE_RADIOS.filter((option) => option !== 'Custom')) {
      await expect(radio(page, name)).not.toBeChecked();
    }
  });

  test('test_e2e_from_pricing_tier: the nav link opens the form with no package chosen', async ({ page }) => {
    await page.goto('/');

    await siteNav(page).getByRole('link', { name: 'Order', exact: true }).click();

    await expect(mainHeading(page)).toHaveText('Order');
    expect(pathOf(page)).toBe(ORDER_PATH);
    await expect(submitButton(page)).toBeVisible();
    for (const name of PACKAGE_RADIOS) await expect(radio(page, name)).not.toBeChecked();
  });

  test('test_e2e_deep_link_and_reload: a direct load and a reload keep the package and show the FAQ', async ({ page }) => {
    await page.goto(`${ORDER_PATH}?package=basic`);
    await expect(radio(page, 'Basic')).toBeChecked();

    await page.reload();

    await expect(radio(page, 'Basic')).toBeChecked();
    await expect(page.locator('[data-faq]')).toHaveCount(FAQ_COUNT);
    await expect(page.locator('main')).toHaveAttribute('data-route', 'order');
  });

  test('test_e2e_slug_live: the address is suggested and checked as you type', async ({ page }) => {
    await page.goto(ORDER_PATH);

    await field(page, "Bride's name").fill(ORDER.brideName);
    await field(page, "Groom's name").fill(ORDER.groomName);

    await expect(slugField(page)).toHaveValue('DanAndShelly');
    await expect(slugStatus(page)).toHaveAttribute('data-status', 'available');
    await expect(slugPreview(page)).toContainText(`${SITE_CONFIG.baseUrl}/DanAndShelly`);

    await slugField(page).fill('pricing');
    await expect(slugStatus(page)).toHaveAttribute('data-status', 'reserved');
    await expect(slugPreview(page)).toHaveCount(0);

    await slugField(page).fill('DemoWedding');
    await expect(slugStatus(page)).toHaveAttribute('data-status', 'taken');
    await expect(slugPreview(page)).toHaveCount(0);
  });

  test('test_e2e_validation_focus: an empty submit points at the first missing field', async ({ page }) => {
    test.skip(!OPEN, NEEDS_OPEN);
    await page.goto(ORDER_PATH);

    await submitButton(page).click();

    await expect(page.getByText("Enter the bride's name.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.activeElement.id)).toBe('order-brideName');
    await expect(page.locator(RESULT_SELECTOR)).toHaveCount(0);
  });

  test('test_e2e_closed: while ordering is closed the form says so and cannot be sent', async ({ page }) => {
    test.skip(OPEN, NEEDS_CLOSED);
    await page.goto(ORDER_PATH);

    const notice = page.locator(CLOSED_NOTICE_SELECTOR);
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Ordering is not open yet.');
    const noticeBox = await notice.boundingBox();
    const firstInputBox = await field(page, "Bride's name").boundingBox();
    expect(noticeBox.y).toBeLessThan(firstInputBox.y);

    await expect(submitButton(page)).toBeDisabled();

    await fill(page);
    await expect(slugStatus(page)).toHaveAttribute('data-status', 'available');
    await expect(submitButton(page)).toBeDisabled();
    await expect(page.locator(RESULT_SELECTOR)).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(SITE_CONFIG.contactEmail);
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
  });

  test('test_e2e_submit_mailto: a valid order creates the email without leaving the page', async ({ page }) => {
    test.skip(!OPEN, NEEDS_OPEN);
    await page.goto(ORDER_PATH);
    await page.evaluate(() => {
      window.__spaMarker = true;
    });
    await fill(page);

    await submitButton(page).click();

    const link = page.locator(MAILTO_LINK_SELECTOR);
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href.startsWith(MAILTO_START)).toBe(true);
    expect(href.endsWith(MAILTO_END)).toBe(true);
    await expect(page.locator(MESSAGE_SELECTOR)).toHaveValue(/Package: Custom\nAdd-ons: Rush delivery, Printable QR code\n/);
    expect(pathOf(page)).toBe(ORDER_PATH);
    expect(await page.evaluate(() => window.__spaMarker)).toBe(true);
  });

  test('test_e2e_copy_fallback: the message can be copied when no email app opens', async ({ page, context }) => {
    test.skip(!OPEN, NEEDS_OPEN);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(ORDER_PATH);
    await fill(page);
    await submitButton(page).click();
    await expect(page.locator(RESULT_SELECTOR)).toBeVisible();

    await page.getByRole('button', { name: COPY_NAME, exact: true }).click();

    await expect(page.locator(COPY_STATUS_SELECTOR)).toHaveText('Copied.');
    const message = await page.locator(MESSAGE_SELECTOR).inputValue();
    expect(message).toContain('Bride: Shelly');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(message);
  });

  test('test_e2e_no_requests_or_storage: the page sends and stores nothing', async ({ page }) => {
    await page.goto(ORDER_PATH);
    await expect(submitButton(page)).toBeVisible();
    await page.waitForLoadState('networkidle');
    // Opening the mail app is a `mailto:` navigation, which Playwright reports
    // as a request although nothing goes over the network. Count real ones.
    const requests = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(MAILTO_SCHEME)) requests.push(request.url());
    });

    await fill(page);
    if (OPEN) {
      await submitButton(page).click();
      await expect(page.locator(RESULT_SELECTOR)).toBeVisible();
    }

    expect(requests).toEqual([]);
    const stored = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookie: document.cookie,
    }));
    expect(stored).toEqual({ local: 0, session: 0, cookie: '' });
  });

  for (const viewport of [PHONE, SMALL]) {
    test(`test_e2e_phone: ${viewport.width}px wide`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(ORDER_PATH);
      await expect(submitButton(page)).toBeVisible();

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      const controls = [
        ...await boxesOf(page.locator('.order-input')),
        ...await boxesOf(page.locator('#order-package label')),
        await submitButton(page).boundingBox(),
      ];
      expect(controls.length).toBeGreaterThan(PACKAGE_RADIOS.length);
      for (const box of controls) {
        expect(box.height).toBeGreaterThanOrEqual(MIN_TAP_HEIGHT - HEIGHT_TOLERANCE);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }

      await fill(page);

      await expect(slugStatus(page)).toHaveAttribute('data-status', 'available');
      for (const box of [await slugStatus(page).boundingBox(), await slugPreview(page).boundingBox()]) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
