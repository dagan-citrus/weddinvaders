import { test, expect } from '@playwright/test';

// The default event, in the production build and a real browser, must draw and
// play exactly as the game did before it became config-driven.

/** Where the default event's game is served. */
const GAME_PATH = '/';

const SETTLE_MS = 500;
const HTTP_OK = 200;
const DEFAULT_IMAGE_URL = /\/assets\/(bride|groom|couple)-nobg-[\w-]+\.png$/;
const DEFAULT_IMAGE_NAMES = ['bride', 'couple', 'groom'];

// Every string the title screen draws, in draw order (mind the double and triple spaces).
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

const LEVEL_1_AMMO_TEXT = '💌×12  💕×4';
const LEVEL_1_HUD_TEXTS = ['💰 $9900', 'LEVEL 1', 'Save the Date', LEVEL_1_AMMO_TEXT];

const BRIDE_LEGEND = '👰 Bride — A/D move · S ammo · W shoot';
const GROOM_LEGEND = '🤵 Groom — ←/→ move · ↑/↓ ammo · Space shoot';

/** Collects uncaught page errors; must be called before `page.goto`. */
function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

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

test.describe('Default event game (e2e)', () => {
  test('test_e2e_title_strings: the title screen draws the original strings', async ({ page }) => {
    await recordDrawnTexts(page);
    await page.goto(GAME_PATH);

    await expect
      .poll(async () => (await drawnTexts(page)).length)
      .toBeGreaterThanOrEqual(DEFAULT_TITLE_TEXTS.length);

    const texts = await drawnTexts(page);
    expect(texts.slice(0, DEFAULT_TITLE_TEXTS.length)).toEqual(DEFAULT_TITLE_TEXTS);
  });

  test('test_e2e_default_images_load: the three default images are served', async ({ page }) => {
    const loaded = new Set();
    page.on('response', (response) => {
      const match = new URL(response.url()).pathname.match(DEFAULT_IMAGE_URL);
      if (match && response.status() === HTTP_OK) loaded.add(match[1]);
    });

    await page.goto(GAME_PATH);

    await expect.poll(() => [...loaded].sort()).toEqual(DEFAULT_IMAGE_NAMES);
  });

  test('test_e2e_level1_hud: starting the game shows level 1 of the default event', async ({ page }) => {
    await recordDrawnTexts(page);
    await page.goto(GAME_PATH);
    await expect.poll(async () => (await drawnTexts(page)).length).toBeGreaterThan(0);

    await page.keyboard.press('KeyX');

    for (const expected of LEVEL_1_HUD_TEXTS) {
      await expect.poll(async () => (await drawnTexts(page)).includes(expected), {
        message: `expected the canvas to draw ${JSON.stringify(expected)}`,
      }).toBe(true);
    }
  });

  test('test_e2e_legend: the key legend names the default players', async ({ page }) => {
    await page.goto(GAME_PATH);

    await expect(page.getByText(BRIDE_LEGEND)).toBeVisible();
    await expect(page.getByText(GROOM_LEGEND)).toBeVisible();
  });

  test('test_e2e_no_errors: playing the default event raises no page errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await recordDrawnTexts(page);
    await page.goto(GAME_PATH);
    await expect.poll(async () => (await drawnTexts(page)).length).toBeGreaterThan(0);

    for (const key of ['KeyX', 'Space', 'KeyW', 'KeyS', 'ArrowUp']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(SETTLE_MS);

    // The ammo counter proves the game is playing. The money text would not:
    // Space and W each spend $100 of cash, possibly before the first playing frame is drawn.
    expect(await drawnTexts(page)).toContain(LEVEL_1_AMMO_TEXT);
    expect(errors).toEqual([]);
  });
});
