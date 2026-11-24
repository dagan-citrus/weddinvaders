import { test, expect } from '@playwright/test';

/** The default event's own address: the stable route that renders the game. */
const GAME_PATH = '/DemoWedding';

const CANVAS_SELECTOR = 'canvas.game-canvas';
const CANVAS_WIDTH = '910';
const CANVAS_HEIGHT = '600';
const SETTLE_MS = 500;
const OPAQUE_ALPHA = 255;
const SAMPLE_POINT = { x: 10, y: 10 };

/** Collects uncaught page errors; must be called before `page.goto`. */
function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

test.describe('App smoke (e2e)', () => {
  test('E1: shows the game canvas with the configured dimensions', async ({ page }) => {
    await page.goto(GAME_PATH);
    const canvas = page.locator(CANVAS_SELECTOR);

    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('width', CANVAS_WIDTH);
    await expect(canvas).toHaveAttribute('height', CANVAS_HEIGHT);
  });

  test('E2: loads and runs without uncaught page errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(GAME_PATH);

    await expect(page.locator(CANVAS_SELECTOR)).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);

    expect(errors).toEqual([]);
  });

  test('E3: the render loop paints an opaque background', async ({ page }) => {
    await page.goto(GAME_PATH);
    const canvas = page.locator(CANVAS_SELECTOR);
    await expect(canvas).toBeVisible();

    await expect
      .poll(() =>
        canvas.evaluate(
          (el, { x, y }) => el.getContext('2d').getImageData(x, y, 1, 1).data[3],
          SAMPLE_POINT,
        ),
      )
      .toBe(OPAQUE_ALPHA);
  });

  test('E4: starting the game and pressing the controls raises no errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(GAME_PATH);
    const canvas = page.locator(CANVAS_SELECTOR);
    await expect(canvas).toBeVisible();

    await canvas.click(); // title → playing
    for (const key of ['Space', 'KeyW', 'ArrowUp', 'KeyS']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(SETTLE_MS);

    expect(errors).toEqual([]);
    await expect(canvas).toBeVisible();
  });
});
