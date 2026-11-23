# Component: `useGameState()`

## Location
`src/useGameState.js:125` — exported hook `useGameState()`. ~500 lines total; the largest logic module in the repo.

## Purpose
The core game-logic engine. Owns all mutable game state, keyboard input, the 60fps update loop
(movement, spawning, collisions, win/lose checks), and phase transitions (`title` → `playing` →
`meeting`/`levelComplete` → …). It's the single node in the [`architecture.md`](architecture.md)
data flow that turns raw input into the next frame's state; `renderer.md` only reads what this
produces.

## Construction
Called once per mount from `Game.jsx` (see [`game-jsx.md`](game-jsx.md)):
```js
const { getState, startLoop, stopLoop, setRenderCallback, handleAction } = useGameState();
```
Internally, state lives in `stateRef` (a `useRef`, not `useState` — see architecture.md's "Key
Design Decisions") seeded by `getInitialState(levelIndex = 0)` (`useGameState.js:85`).

## Key Surface
| Export / function | Line | Purpose |
|---|---|---|
| `getInitialState(levelIndex)` | 97 | Builds a fresh state object for a given level (money, ammo, players, timers, `slowTimer`). Authoritative shape — a field missing here becomes `undefined` after a level restart. |
| `useGameState()` | 125 | The hook itself; returns `{ getState, startLoop, stopLoop, setRenderCallback, handleAction }`. |
| `onKey(e)` (internal, in the hook's keyboard effect) | 141 | Routes `keydown`/`keyup`. Non-`playing` phases (title/meeting/levelComplete/gameComplete/lost) advance on any key; while `playing`, dispatches shoot/cycle-ammo. |
| `shoot(role)` | 227 | Validates ammo/money, deducts cost, spawns a bullet. Called for both keyboard shortcuts and `handleAction({type:'SHOOT'})`. |
| `update()` | 258 | Runs every animation frame: row advance (rate-adjusted, see below), player movement (`moveX`), bullet travel, item spawn/movement, escaped-item life loss, **bullet↔item collision** (inline, not a separate function), win/lose phase transition. |
| `loop()` / `startLoop()` / `stopLoop()` | 449–460 | `requestAnimationFrame` driver; calls `update()` then the render callback registered via `setRenderCallback`. |
| `handleAction(action)` | 466 | Dispatch table for UI-originated actions: `START`, `RESTART`, `NEXT_LEVEL`, `SHOOT`, `SELECT_AMMO` — used by `Game.jsx`'s click handler and on-screen mobile buttons. |
| `spawnItem(groomRow, brideRow, level, acquiredItems)` (internal) | 48 | Builds one flying item from the level's weighted spawn pool; randomizes `incomeAmount` for guest/family items. |
| `pickWeighted(pool)` (internal) | 38 | Cumulative-weight random pick over a pool's `spawnWeight` fields — used by `spawnItem()` instead of a uniform pick. See `constants.md`'s `WEDDING_ITEMS.spawnWeight`. |

### Row-advance rate (inside `update()`, ~lines 279–284)
```js
const requiredDone = isLevelComplete(level, acquiredItems); // this frame's incoming items
let advanceRate = requiredDone ? ROW_ADVANCE_SPEEDUP : 1;
if (slowTimer > 0) advanceRate *= 0.5;
```
`rowAdvanceTimer` accumulates by `advanceRate` per second instead of a flat `1` — speeding up once
the level's required items are all acquired, tempered (halved) while an hourglass pickup's
`slowTimer` is active. The `incomeType === 'time'` collision branch (~line 395) sets
`slowTimer = HOURGLASS_SLOW_SECONDS * FPS` when an hourglass item is shot down. See
`game-design.md`'s "Row-Advance Pacing".

### Controls (verified against `onKey`/`moveX`, `useGameState.js:186–191,296–297`)
- **Bride**: `KeyA`/`KeyD` move, `KeyW` shoot, `KeyS` cycle ammo.
- **Groom**: `ArrowLeft`/`ArrowRight` move, `ArrowUp`/`ArrowDown` cycle ammo, `Space`/`Enter` shoot.
- These are the reverse of what an earlier version of `game-design.md`/`testing.md` claimed — fixed as part of this pass; re-verify here (not from memory) if they're ever in question again.

## Relationships / Cross-links
- Consumes constants and item/ammo schema from `src/constants.js` — see [`constants.md`](constants.md).
- Consumes `LEVELS`, `getSpawnPool()`, `isLevelComplete()` from `src/levels.js` (documented inline in [`game-design.md`](game-design.md), not split into its own component file).
- Constructed by and handed to `Game.jsx` — see [`game-jsx.md`](game-jsx.md).
- Its output state is the sole input to `render()` in `src/renderer.js` — see [`renderer.md`](renderer.md).
- Exercised by the manual checklist in [`testing.md`](testing.md) and the [`bug-fix.md`](../skills/bug-fix.md) / [`new-feature.md`](../skills/new-feature.md) skills.
