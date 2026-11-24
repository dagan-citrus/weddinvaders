# Bug Fix Workflow

Use this skill when diagnosing runtime errors, broken game behaviour, or visual glitches.

## Steps

1. **Read the error** — open browser DevTools → Console. Note the exact error message and stack trace.

2. **Identify the module** — map the error to the correct file:
   - Game logic (state mutation, collisions, timing) → `src/useGameState.js` ([`knowledge/use-game-state.md`](../knowledge/use-game-state.md))
   - Visual glitch (wrong position, missing element) → `src/renderer.js` ([`knowledge/renderer.md`](../knowledge/renderer.md))
   - Wrong value (price, speed, row) → `src/constants.js` ([`knowledge/constants.md`](../knowledge/constants.md)) for engine values, or the event module (`src/events/defaultEvent.js`) for item and level data
   - Asset not loading → `src/useAssets.js` or `src/assets/`
   - Canvas size / control layout → `src/Game.jsx` ([`knowledge/game-jsx.md`](../knowledge/game-jsx.md)) or `src/Game.css`
   - Pixel sprite looks wrong → `src/pixelArt.js` — **note: currently unused/dead code, not imported anywhere**, so a "pixel sprite" bug report almost always means `drawPlayer()`/`drawItem()` in `renderer.js` instead

3. **Read the relevant file(s)** — use the Read tool to get the current content before editing.

4. **Check state shape** — game state lives in a `useRef` in `useGameState.js`. The authoritative shape is `getInitialState()`. If a field is `undefined`, it was likely missing from `getInitialState`.

5. **Check the update loop** — all mutations happen inside `setState(s => ...)` callbacks. Stale-closure bugs appear when accessing outer-scope variables instead of `s.*` inside the callback.

6. **Fix with Edit tool** — make a targeted change. Do not rewrite the whole file unless the bug is pervasive.

7. **Verify** — start the dev server (`npm run dev`), reproduce the original scenario, confirm the bug is gone.
   - Check browser console for new errors after the fix.
   - Run `npm run lint` — must pass with 0 errors.

8. **Update knowledge** — if the fix changes architecture, item IDs, or level structure, update `.agents/knowledge/*.md` in a separate commit.

## Common Pitfalls
- **`GAME_HEIGHT` vs `PLAY_HEIGHT`** — bullets and items should use `PLAY_HEIGHT` (540px), not `GAME_HEIGHT` (600px which includes HUD).
- **`CANVAS_WIDTH` vs `GAME_WIDTH`** — the canvas element must use `CANVAS_WIDTH` (910) not `GAME_WIDTH` (800).
- **Forgetting `incomeAmount` at spawn** — income items get a randomised `incomeAmount` at spawn time in `spawnItem()`; do not rely on the template's default value in collision logic.
- **Adding a field to state without initialising it in `getInitialState()`** — causes `undefined` on level restart.
