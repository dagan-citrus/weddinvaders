# Component: `src/constants.js`

## Location
`src/constants.js` — 74 lines. No exported class; a flat module of exported constants.

## Purpose
The single source of truth for every dimension, timing value, and the item/ammo data schema.
It's the highest-fan-in module in the repo — imported by `levels.js`, `useGameState.js`,
`renderer.js`, and `Game.jsx` — which is exactly why `dev-environment.md`'s gotcha list says
"do not hardcode magic numbers elsewhere." Anything that looks like a game-balance number
(price, speed, timer length) should be traced back here first.

## Key Surface
| Export | Line | Purpose |
|---|---|---|
| `GAME_WIDTH`, `PANEL_WIDTH`, `CANVAS_WIDTH` | 1–3 | Play-area width (800), side panel width (110), total canvas width (910). |
| `TOTAL_ROWS`, `ROW_HEIGHT`, `PLAY_HEIGHT`, `HUD_HEIGHT`, `GAME_HEIGHT` | 4–9 | 9 rows × 60px = 540px play height; +60px HUD = 600px total canvas height. |
| `PLAYER_WIDTH`, `PLAYER_HEIGHT`, `PLAYER_SPEED` | 12–14 | Player sprite size and per-frame move speed. |
| `GROOM_START_ROW`/`_X`, `BRIDE_START_ROW`/`_X` | 16–21 | Groom starts row 0 top-right; bride starts row 8 (`TOTAL_ROWS - 1`) bottom-left. |
| `BULLET_SPEED`, `BULLET_WIDTH`, `BULLET_HEIGHT` | 24–26 | Projectile physics/size. |
| `ITEM_WIDTH`, `ITEM_HEIGHT`, `ITEM_SPEED` | 29–31 | Flying-item size; `ITEM_SPEED` here is a fallback — each level overrides it via `itemSpeed` in `levels.js`. |
| `AMMO_ORDER`, `AMMO_META` | 34–39 | Cycling order (`['cash','invite','heart']`) and per-ammo `{label, color, description}` used by the HUD and mobile buttons. |
| `WEDDING_ITEMS` | 43–60 | The item schema: `id, emoji, label, price, essential, exclusiveTo, incomeType, incomeAmount?, ammoRequired?, discountPct?, spawnWeight`. This is the data `game-design.md`'s item table describes. `spawnWeight` drives `useGameState.js`'s weighted spawn pick (`pickWeighted()`) — higher is more common. |
| `AMMO_DAMAGE` | 63 | Per-shot damage by ammo type: `{cash: 100, invite: 1, heart: 1}`. |
| `INITIAL_MONEY`, `INITIAL_INVITE`, `INITIAL_HEART` | 66–68 | Fallback starting resources (levels in `levels.js` override money/invites/hearts per level). |
| `GAME_DURATION`, `ROW_ADVANCE_INTERVAL` | 71–72 | Fallback timing (also overridden per level by `gameDuration`/`rowAdvance` in `levels.js`). |
| `ROW_ADVANCE_SPEEDUP` | 73 | Multiplier applied to the row-advance rate once all required items are acquired (default `2.5`). See `game-design.md`'s "Row-Advance Pacing". |
| `HOURGLASS_SLOW_SECONDS` | 74 | Real seconds the `hourglass` item halves the row-advance rate for (default `15`). |

## Relationships / Cross-links
- Consumed by `src/levels.js` (`WEDDING_ITEMS` → `getSpawnPool()`), `src/useGameState.js`, `src/renderer.js`, and `src/Game.jsx` — see [`use-game-state.md`](use-game-state.md), [`renderer.md`](renderer.md), [`game-jsx.md`](game-jsx.md).
- `WEDDING_ITEMS` and `AMMO_META` are the data source for the tables in [`game-design.md`](game-design.md) — that file describes the *rules*, this file (and `levels.js`) hold the *numbers*. If they disagree, trust this file.
- Per-level overrides (`money`, `priceScale`, `itemSpeed`, `rowAdvance`, `gameDuration`, `invites`, `hearts`, `hasMines`) live in `src/levels.js`, not here — not split into its own component file (100 lines, two pure helper functions, already covered by `game-design.md`'s level table).
