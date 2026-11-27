# Component: `useGameState()`

## Location
`src/useGameState.js:345` — exported hook `useGameState(event)`. ~520 lines total; the largest logic module in the repo.

## Purpose
The core game-logic engine. Owns all mutable game state, keyboard input, the 60fps update loop
(movement, spawning, collisions, win/lose checks), and phase transitions (`title` → `playing` →
`meeting`/`levelComplete` → …). It's the single node in the [`architecture.md`](architecture.md)
data flow that turns raw input into the next frame's state; `renderer.md` only reads what this
produces.

## Construction
Called once per mount from `Game.jsx`'s `GameSession` (see [`game-jsx.md`](game-jsx.md)):
```js
const { getState, startLoop, stopLoop, setRenderCallback, handleAction } = useGameState(event);
```
`event` is the event config (`src/events/eventConfig.js`) and is **constant for the life of a
mount** — `Game` remounts the session when the event's slug changes. The event is an explicit
argument everywhere; it is never stored in game state, and this module does not import from
`src/events/`.

Internally, state lives in `stateRef` (a `useRef`, not `useState` — see architecture.md's "Key
Design Decisions") seeded by `getInitialState(event)` (`useGameState.js:105`).

### Pure seams (exported, testable without React)
The game logic is three pure functions at module scope; the hook only wires them to input, refs
and the animation loop:
- `getInitialState(event, levelIndex = 0)` — a fresh state for one level.
- `stepGame(state, event, keys)` — the next frame's state. Never mutates its arguments; reads
  randomness only through `Math.random()`, and **the order of those calls is part of the
  contract** (spawn row, spawn direction, weighted pick, donation amount, item id; then one per
  popup message) — tests spy on `Math.random`, so do not reorder `spawnItem()`.
- `advanceLevel(state, event)` — the next level (already `playing`) or `gameComplete`.

## Key Surface
| Export / function | Line | Purpose |
|---|---|---|
| `getInitialState(event, levelIndex)` | 105 | Builds a fresh state object for `event.levels[levelIndex]` (clamped to the last level): money, ammo, players, timers, `slowTimer`. Authoritative shape — a field missing here becomes `undefined` after a level restart. |
| `advanceLevel(state, event)` | 139 | `{ ...getInitialState(event, next), phase: 'playing' }` when a next level exists, else `{ ...state, phase: 'gameComplete' }`. No phase guard — callers keep theirs (the meeting scene waits for `meetingTimer >= 80`). Used by the keyboard handler and `handleAction({type:'NEXT_LEVEL'})`. |
| `stepGame(state, event, keys)` | 154 | One frame of game logic: row advance (rate-adjusted, see below), player movement (`moveX`), bullet travel, item spawn/movement, escaped-item life loss, **bullet↔item collision** (inline, not a separate function), win/lose phase transition. `meeting` only ticks `meetingTimer`; any other non-`playing` phase returns the same state object. `keys` is anything with `has(code)`. |
| `useGameState(event)` | 345 | The hook itself; returns `{ getState, startLoop, stopLoop, setRenderCallback, handleAction }`. |
| `onKey(e)` (internal, in the hook's keyboard effect) | 401 | Routes `keydown`/`keyup`. Non-`playing` phases (title/meeting/levelComplete/gameComplete/lost) advance on any key; while `playing`, dispatches shoot/cycle-ammo. |
| `cycleAmmoFor(role, dir)` / `shoot(role)` | 359 / 368 | Both are stable `useCallback`s declared **above** the keyboard effect, which lists them as deps (the react-hooks lint rules reject using them before declaration). `shoot` validates ammo/money, deducts cost, spawns a bullet; called for both keyboard shortcuts and `handleAction({type:'SHOOT'})`. |
| `update()` (internal) | 471 | Runs every animation frame: `setState(s => stepGame(s, event, keysRef.current))`. |
| `startLoop()` / `stopLoop()` | 477–489 | `requestAnimationFrame` driver. `startLoop` owns an inner `function loop()` declaration (a self-referencing `useCallback` fails the react-hooks lint rule) that calls `update()` then the render callback registered via `setRenderCallback`. |
| `handleAction(action)` | 493 | Dispatch table for UI-originated actions: `START`, `RESTART`, `NEXT_LEVEL`, `SHOOT`, `SELECT_AMMO` — used by `Game.jsx`'s click handler and on-screen mobile buttons. |
| `spawnItem(groomRow, brideRow, level, eventItems, acquiredItems)` (internal) | 51 | Builds one flying item from the level's weighted spawn pool (`getSpawnPool(level, eventItems)`); randomizes `incomeAmount` for income items — the $300–$500 "family" pool when `isFamilyDonor(item)` (the item needs heart ammo, line 49), else the $100–$300 guest pool. |
| `pickWeighted(pool)` (internal) | 38 | Cumulative-weight random pick over a pool's `spawnWeight` fields — used by `spawnItem()` instead of a uniform pick. |

### Row-advance rate (inside `stepGame()`, ~lines 175–181)
```js
const requiredDone = isLevelComplete(level, acquiredItems); // this frame's incoming items
let advanceRate = requiredDone ? ROW_ADVANCE_SPEEDUP : 1;
if (slowTimer > 0) advanceRate *= 0.5;
```
`rowAdvanceTimer` accumulates by `advanceRate` per second instead of a flat `1` — speeding up once
the level's required items are all acquired, tempered (halved) while an hourglass pickup's
`slowTimer` is active. The `incomeType === 'time'` collision branch (~line 289) sets
`slowTimer = HOURGLASS_SLOW_SECONDS * FPS` when an hourglass item is shot down. See
`game-design.md`'s "Row-Advance Pacing".

### Controls (verified against `onKey`/`moveX`, `useGameState.js:452–457,210–211`)
- **Bride**: `KeyA`/`KeyD` move, `KeyW` shoot, `KeyS` cycle ammo.
- **Groom**: `ArrowLeft`/`ArrowRight` move, `ArrowUp`/`ArrowDown` cycle ammo, `Space`/`Enter` shoot.
- These are the reverse of what an earlier version of `game-design.md`/`testing.md` claimed — fixed as part of this pass; re-verify here (not from memory) if they're ever in question again.

## Relationships / Cross-links
- Consumes engine constants and ammo metadata from `src/constants.js` — see [`constants.md`](constants.md).
- Reads items and levels from the `event` argument (`event.items`, `event.levels`) — schema in `src/events/eventConfig.js`.
- Consumes `getSpawnPool(level, items)` and `isLevelComplete()` from `src/levels.js` (documented inline in [`game-design.md`](game-design.md), not split into its own component file).
- Constructed by and handed to `Game.jsx` — see [`game-jsx.md`](game-jsx.md).
- Its output state is the sole input to `render()` in `src/renderer.js` — see [`renderer.md`](renderer.md).
- Exercised by the smoke tests and manual checklist in [`testing.md`](testing.md) and the [`bug-fix.md`](../skills/bug-fix.md) / [`new-feature.md`](../skills/new-feature.md) skills.
