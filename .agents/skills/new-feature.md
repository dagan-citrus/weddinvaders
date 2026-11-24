# New Feature Workflow

Use this skill when adding new items, ammo types, levels, game phases, or UI changes.

## Steps

### Adding a new wedding item
Items and levels are per-event data. For the default game edit `src/events/defaultEvent.js`; for
another couple edit that event's module under `src/events/`.
1. Add an entry to the event's `items` array:
   ```js
   { id: 'myItem', emoji: '🎵', label: 'Band', price: 400,
     essential: false, exclusiveTo: null, incomeType: null }
   ```
2. Add `'myItem'` to the `optional` or `required` array of the relevant level(s) in the same event's `levels`.
3. Run `npm test` — the registry validates every bundled event (`validateEvent` in `src/events/eventConfig.js`).
4. Verify the item spawns and can be purchased in the preview.

### Adding a new level
1. Append a level object to the event's `levels` array (default game: `src/events/defaultEvent.js`). Follow the existing shape exactly.
   - `money` **must** be a multiple of $100.
   - `required` must be a subset of the ids in the same event's `items`.
   - `id` must be sequential (next integer after last level).
2. No other files need changing — `getSpawnPool()` and `isLevelComplete()` are generic.

### Adding a new ammo type
1. Add the ammo key to `AMMO_ORDER` and `AMMO_META` in `src/constants.js`.
2. Add `AMMO_DAMAGE[newType]` in `src/constants.js`.
3. Add the ammo count to `getInitialState()` in `src/useGameState.js` (and a per-level count to the level schema in `src/events/eventConfig.js` and to each event's levels).
4. Handle the ammo type in `shoot()` (cost/ammo deduction, `src/useGameState.js`) and in the bullet↔item
   collision loop inside `stepGame()` (effect on hit, same file — see [`knowledge/use-game-state.md`](../knowledge/use-game-state.md)).
5. Update `drawHUD()` in `src/renderer.js` to display the new ammo count (see [`knowledge/renderer.md`](../knowledge/renderer.md)).

### Adding a new game phase
1. Add phase handling to `stepGame()` in `src/useGameState.js` (early-return for phases that pause the loop).
2. Add a draw branch in `render()` in `src/renderer.js`.
3. Add `handleCanvasClick` / keyboard handling in `src/Game.jsx`.
4. Update `game-design.md` phase table.

### UI / layout changes
- Canvas is `CANVAS_WIDTH × GAME_HEIGHT` (910×600). Play area is `GAME_WIDTH × PLAY_HEIGHT` (800×540). Panel is 110px wide on the right.
- All canvas drawing is in `src/renderer.js` — no DOM elements for game objects.
- CSS layout changes (wrapper, mobile controls) go in `src/Game.css`.

## Verify
```bash
npm run dev     # manual test per testing.md checklist
npm run lint    # must pass
npm run build   # must succeed
```

## After the feature
Update `.agents/knowledge/` if the change affects architecture, item IDs, level structure, or dev workflow — commit knowledge update separately from feature commit.
