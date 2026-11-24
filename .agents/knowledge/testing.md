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

### CI
`.github/workflows/ci.yml` runs on every pull request (any base branch): job `check` runs lint,
`npm test` and build; job `e2e` installs Chromium and runs `npm run e2e`, uploading the HTML
report as an artifact. `deploy.yml` (push to `main` → GitHub Pages) is separate and runs no tests.

## Manual gameplay checks
The automated tests are smoke-level; gameplay rules are still verified by hand.

### Start the dev server
```bash
npm run dev
# → http://localhost:5173
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

## Lint
```bash
npm run lint    # must pass with 0 errors before committing
```
