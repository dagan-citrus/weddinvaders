import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

// Routing against the production build: direct loads, reloads and in-app
// navigation must all land on the same page. HTTP status is not asserted:
// `vite preview` answers every path with index.html and 200, unlike GitHub Pages.

const SITE_NAME = "Weddin'Vaders";
const CANVAS_SELECTOR = 'canvas.game-canvas';
const EVENT_PATH = '/DemoWedding';
const NOT_FOUND_HEADING = 'Event not found';
const HOME_LINK_NAME = 'Go to the main site';
const NAV_NAME = 'Site';

/** The seven site pages that render a heading (the demo page is the game). */
const SITE_PAGES = [
  ['customize', 'Customize'],
  ['pricing', 'Pricing'],
  ['how-it-works', 'How it works'],
  ['order', 'Order'],
  ['showcase', 'Showcase'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
];

const DIST_DIR = join(process.cwd(), 'dist');

const mainHeading = (page) => page.getByRole('heading', { level: 1 });
const gameCanvas = (page) => page.locator(CANVAS_SELECTOR);
const pathOf = (page) => new URL(page.url()).pathname;

let pageErrors;

test.beforeEach(({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('Routing (e2e)', () => {
  test('test_e2e_home_is_site: / shows the site, not the game', async ({ page }) => {
    await page.goto('/');

    await expect(mainHeading(page)).toBeVisible();
    await expect(mainHeading(page)).toHaveText(SITE_NAME);
    await expect(gameCanvas(page)).toHaveCount(0);
  });

  for (const [slug, title] of SITE_PAGES) {
    test(`test_e2e_site_deep_links: /${slug} loads directly and survives a reload`, async ({ page }) => {
      await page.goto(`/${slug}`);
      await expect(mainHeading(page)).toHaveText(title);
      await expect(gameCanvas(page)).toHaveCount(0);

      await page.reload();
      await expect(mainHeading(page)).toHaveText(title);
      expect(pathOf(page)).toBe(`/${slug}`);
    });
  }

  test('test_e2e_demo: /demo shows the game', async ({ page }) => {
    await page.goto('/demo');

    await expect(gameCanvas(page)).toBeVisible();
  });

  test('test_e2e_event_deep_link: an event path loads directly and survives a reload', async ({ page }) => {
    await page.goto(EVENT_PATH);
    await expect(gameCanvas(page)).toBeVisible();

    await page.reload();
    await expect(gameCanvas(page)).toBeVisible();
    expect(pathOf(page)).toBe(EVENT_PATH);
  });

  for (const path of ['/demowedding', '/DEMOWEDDING/']) {
    test(`test_e2e_event_case_insensitive: ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(gameCanvas(page)).toBeVisible();
      expect(pathOf(page)).toBe(path);
    });
  }

  test('test_e2e_site_page_case_and_slash: /Pricing/ shows the pricing page', async ({ page }) => {
    await page.goto('/Pricing/');

    await expect(mainHeading(page)).toHaveText('Pricing');
  });

  test('test_e2e_not_found: an unknown address offers a way back to the site', async ({ page }) => {
    await page.goto('/NoSuchEvent');
    await expect(mainHeading(page)).toHaveText(NOT_FOUND_HEADING);
    await expect(gameCanvas(page)).toHaveCount(0);

    await page.getByRole('link', { name: HOME_LINK_NAME }).click();
    await expect(mainHeading(page)).toHaveText(SITE_NAME);
    expect(pathOf(page)).toBe('/');
  });

  test('test_e2e_not_found: a nested path still loads the app and is not found', async ({ page }) => {
    await page.goto(`${EVENT_PATH}/extra`);

    await expect(mainHeading(page)).toHaveText(NOT_FOUND_HEADING);
    await expect(gameCanvas(page)).toHaveCount(0);
  });

  test('test_e2e_navigation_without_reload: links and history do not reload the document', async ({ page }) => {
    await page.goto('/');
    await expect(mainHeading(page)).toHaveText(SITE_NAME);
    await page.evaluate(() => {
      window.__spaMarker = true;
    });
    const marker = () => page.evaluate(() => window.__spaMarker);

    await page
      .getByRole('navigation', { name: NAV_NAME })
      .getByRole('link', { name: 'Pricing', exact: true })
      .click();
    await expect(mainHeading(page)).toHaveText('Pricing');
    expect(pathOf(page)).toBe('/pricing');
    expect(await marker()).toBe(true);

    await page.goBack();
    await expect(mainHeading(page)).toHaveText(SITE_NAME);
    expect(pathOf(page)).toBe('/');
    expect(await marker()).toBe(true);

    await page.goForward();
    await expect(mainHeading(page)).toHaveText('Pricing');
    expect(await marker()).toBe(true);
  });

  test('test_e2e_query_and_hash: they do not affect matching and stay in the URL', async ({ page }) => {
    await page.goto('/pricing?utm=x#top');

    await expect(mainHeading(page)).toHaveText('Pricing');
    expect(page.url().endsWith('/pricing?utm=x#top')).toBe(true);
  });

  test('test_e2e_title: the document title follows the route', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle("Pricing | Weddin'Vaders");

    await page.goto(EVENT_PATH);
    await expect(page).toHaveTitle("Bride & Groom | Weddin'Vaders");
  });

  test('test_e2e_404_fallback_file: the build ships 404.html as a copy of index.html', () => {
    const fallbackPath = join(DIST_DIR, '404.html');

    expect(existsSync(fallbackPath)).toBe(true);
    const fallback = readFileSync(fallbackPath, 'utf8');
    expect(fallback).toBe(readFileSync(join(DIST_DIR, 'index.html'), 'utf8'));
    expect(fallback).toContain('<div id="root">');
  });
});
