# Component: `src/constants.js`

## Location
`src/constants.js` — 45 lines. No exported class; a flat module of exported constants.

## Purpose
The single source of truth for every **engine** constant: dimensions, physics, ammo metadata and
global timing. It's the highest-fan-in module in the repo — imported by `useGameState.js`,
`renderer.js`, `Game.jsx` and `events/eventConfig.js` — which is exactly why `dev-environment.md`'s
gotcha list says "do not hardcode magic numbers elsewhere."

It holds **no per-event data**. Items, levels and their balance numbers (prices, spawn weights,
level money/speed/timers) belong to an event config: the schema is in `src/events/eventConfig.js`
and the default game's data in `src/events/defaultEvent.js`.

## Key Surface
| Export | Line | Purpose |
|---|---|---|
| `GAME_WIDTH`, `PANEL_WIDTH`, `CANVAS_WIDTH` | 1–3 | Play-area width (800), side panel width (110), total canvas width (910). |
| `TOTAL_ROWS`, `ROW_HEIGHT`, `PLAY_HEIGHT`, `HUD_HEIGHT`, `GAME_HEIGHT` | 4–9 | 9 rows × 60px = 540px play height; +60px HUD = 600px total canvas height. |
| `PLAYER_WIDTH`, `PLAYER_HEIGHT`, `PLAYER_SPEED` | 12–14 | Player sprite size and per-frame move speed. |
| `GROOM_START_ROW`/`_X`, `BRIDE_START_ROW`/`_X` | 16–21 | Groom starts row 0 top-right; bride starts row 8 (`TOTAL_ROWS - 1`) bottom-left. |
| `BULLET_SPEED`, `BULLET_WIDTH`, `BULLET_HEIGHT` | 24–26 | Projectile physics/size. |
| `ITEM_WIDTH`, `ITEM_HEIGHT` | 29–30 | Flying-item size. Item speed is per level (`itemSpeed` in the event's levels). |
| `AMMO_ORDER`, `AMMO_META` | 33–38 | Cycling order (`['cash','invite','heart']`) and per-ammo `{label, color, description}` used by the HUD, the mobile buttons and the ammo hint badge on income items. |
| `AMMO_DAMAGE` | 41 | Per-shot damage by ammo type: `{cash: 100, invite: 1, heart: 1}`. |
| `ROW_ADVANCE_SPEEDUP` | 44 | Multiplier applied to the row-advance rate once all required items are acquired (default `2.5`). See `game-design.md`'s "Row-Advance Pacing". |
| `HOURGLASS_SLOW_SECONDS` | 45 | Real seconds the `hourglass` item halves the row-advance rate for (default `15`). |

## Relationships / Cross-links
- Consumed by `src/useGameState.js`, `src/renderer.js`, `src/Game.jsx` and `src/events/eventConfig.js` (`AMMO_ORDER`, to validate an item's `ammoRequired`) — see [`use-game-state.md`](use-game-state.md), [`renderer.md`](renderer.md), [`game-jsx.md`](game-jsx.md).
- The item schema (`id, emoji, label, price, essential, exclusiveTo, incomeType, incomeAmount?, ammoRequired?, discountPct?, spawnWeight?`) and the level schema are documented as typedefs in `src/events/eventConfig.js`; the default game's items and levels are in `src/events/defaultEvent.js`. Those are the data source for the tables in [`game-design.md`](game-design.md) — that file describes the *rules*, the event module holds the *numbers*. If they disagree, trust the event module.
- `src/levels.js` holds only two pure helpers, `getSpawnPool(level, items)` and `isLevelComplete(level, acquiredItems)`; it imports nothing.
