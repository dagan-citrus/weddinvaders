# Testing

## Automated tests

| Level | Tool | Files | Command |
|-------|------|-------|---------|
| Unit / component | Vitest + Testing Library (jsdom) | `src/**/*.test.{js,jsx}`, next to the source they cover | `npm test` (`npm run test:watch` while developing) |
| E2E | Playwright (Chromium) | `e2e/*.spec.js` | `npm run e2e` |

Run `npm run lint`, `npm test` and `npm run build` before committing; add `npm run e2e` for any
change a user can see. Test files must lint clean too.

### Vitest setup
- Configured in the `test` block of `vite.config.js` — there is no separate Vitest config file.
- `globals: false`: import `describe`/`it`/`expect` from `vitest` in every test file.
- `src/test/setup.js` runs before each test file. It registers the jest-dom matchers
  (`toBeInTheDocument()` …), cleans up Testing Library renders after each test, and **stubs
  `HTMLCanvasElement.prototype.getContext`**: jsdom has no canvas, so without the stub the render
  loop would throw on its first frame. The stub accepts every call and draws nothing — component
  tests can prove the app mounts and reacts to input, but **not** what is painted. Assert on real
  pixels in e2e instead.
- jsdom never fires `Image.onload`, so component tests must not depend on assets being loaded.

### Testing game logic
- The game logic is pure and testable without React: `getInitialState(event, levelIndex)`,
  `stepGame(state, event, keys)` and `advanceLevel(state, event)` in `src/useGameState.js`,
  `getSpawnPool(level, items)` / `isLevelComplete()` in `src/levels.js`, and
  `render(ctx, state, assets, event)` in `src/renderer.js` (pass a recording context to assert the
  strings drawn). Pass any event config — `makeEvent()` from `src/events/eventFixtures.js` or
  `defaultEvent`.
- Randomness: there is no injectable RNG. Use `vi.spyOn(Math, 'random')`; the order of
  `Math.random()` calls in `stepGame` is part of its contract (see
  [`use-game-state.md`](use-game-state.md)).
- Shared test helpers live in `src/test/`.

### Playwright setup
- `playwright.config.js`: specs run against the **production build** — the `webServer` entry runs
  `npm run build` then `vite preview` on `http://127.0.0.1:4173` (`--strictPort`; `127.0.0.1`
  rather than `localhost`, which can resolve to IPv6). Use relative URLs (`page.goto('/')`).
  Outside CI an already-running server on that port is reused.
- `@playwright/test` is pinned to an exact version (no caret) so it matches the Chromium build
  pre-installed in the cloud dev container (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — do not
  run `playwright install` there. On another machine run `npx playwright install chromium` once.
  Bump the pin only together with the container's Playwright version.
- Output goes to `playwright-report/` and `test-results/` (git-ignored, lint-ignored).
- **The game is not at `/`.** `/` is the main site; game specs load an event path
  (`/DemoWedding`, the default event). In component tests, set the path before rendering `<App />`
  with `window.history.replaceState(null, '', path)` and reset it afterwards.
- `vite preview` answers every unknown path with `index.html` and HTTP 200, so e2e proves the
  router handles direct loads and reloads but **cannot** prove GitHub Pages serves `404.html`.
  The build output is checked instead (`dist/404.html` equals `dist/index.html`), plus the
  post-deploy check below.

### CI
`.github/workflows/ci.yml` runs on every pull request (any base branch): job `check` runs lint,
`npm test` and build; job `e2e` installs Chromium and runs `npm run e2e`, uploading the HTML
report as an artifact. `deploy.yml` (push to `main` → GitHub Pages) is separate and runs no tests.

## Manual gameplay checks
The automated tests are smoke-level; gameplay rules are still verified by hand.

### Start the dev server
```bash
npm run dev
# → http://localhost:5173/DemoWedding   (the game; `/` is the main site)
```

### Manual test checklist (run after any gameplay change)
1. **Title screen** — loads without errors; ammo legend visible; click/Space starts game.
2. **Player movement** — Groom: ←/→ move, ↑/↓ cycle ammo, Space/Enter shoot. Bride: A/D move, W shoot, S cycle ammo.
3. **Ammo types** — 💵 cash reduces item HP; 💌 invite targets guest items; 💕 heart targets family items.
4. **Item acquisition** — shoot item to 0 HP → popup message, item added to acquired list, side panel checkmark updates.
5. **Income items** — shooting a guest with invite gives random $100–$300; family with heart gives $300–$500.
6. **Side panel** — right 110px shows required items with checkmarks as acquired.
7. **Level complete** — acquire all required items → players walk to center → couple image appears → "Level Complete!" → press any key → next level.
8. **N key fast-forward** — once all required items acquired, press N to advance rows toward center.
9. **Game over** — lose all lives → lost overlay → click to restart.
10. **All 5 levels** — play through or use browser console to jump levels if needed.

## Browser Console Checks
Open DevTools → Console. After each major change verify:
- No uncaught errors or warnings during gameplay
- No "undefined" or "NaN" appearing in HUD values

## Build Verification
```bash
npm run build   # must complete without errors
npm run preview # spot-check the production build looks identical to dev
```
The build must also produce `dist/404.html`, a byte copy of `dist/index.html` (the GitHub Pages
deep-link fallback, written by the `spaFallback` plugin in `vite.config.js`).

## Post-deploy check (deep links)
After a deploy to GitHub Pages, on the live site open a site page (`/pricing`) and an event page
(`/DemoWedding`) **directly** (typed URL, not via a link) and reload each: the right page must
render. This is the only check that exercises the real `404.html` fallback. The HTTP status of
those responses is 404 by design, so crawlers and link-preview bots may not treat them as pages.

## Lint
```bash
npm run lint    # must pass with 0 errors before committing
```
