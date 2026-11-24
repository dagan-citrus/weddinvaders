# Component: `renderer.js`

## Location
`src/renderer.js` — 728 lines, the largest file in the repo. Entry point `export function render(ctx, state, assets, event)` at line 698.

## Purpose
All canvas drawing lives here and only here — per `architecture.md`'s design decisions, this
module is pure: `(ctx, state, assets, event) → void`, no side effects, no state mutation. It reads the
state produced by `useGameState.js` every frame and paints it; it never changes gameplay logic.

Every couple-specific string comes from the `event` argument: the title and tagline
(`event.messages.title` / `.tagline`), the final-meeting, game-complete and lost headlines
(`event.messages.finalMeeting` / `.gameComplete` / `.lost`), the two names in the title-screen
control lines (`event.names`), level names and subtitles (`event.levels`) and item emoji and labels
(`event.items`, via the private `findItem(event, id)`). Engine text (controls help, ammo legend,
"Level Complete!", prompts, popups) stays here. The module does not import from `src/events/`.

## Construction
Not a class — a module of draw functions plus one exported entry point. Called from `Game.jsx`'s
render callback (registered via `setRenderCallback`, see [`game-jsx.md`](game-jsx.md)):
```js
render(ctx, state, assetsRef.current, event);
```

## Key Surface
| Function | Line | Purpose |
|---|---|---|
| `render(ctx, state, assets, event)` | 698 | Exported entry point; dispatches to the phase-appropriate draw functions below based on `state.phase`. |
| `drawBackground(ctx, players)` | 31 | Play-field background, per-row shading. |
| `drawPlayer(ctx, player, img, isGroom)` | 67 | Draws bride/groom sprite images at their current position. |
| `drawBullet(ctx, b)` | 95 | Draws one projectile, colored by `ammoType`. |
| `drawItem(ctx, item)` | 122 | Draws one flying wedding item: emoji, remaining price, flash feedback on hit. Border is a low-alpha rgba (`rgba(255,215,0,0.35)` essential / `rgba(255,255,255,0.10)` non-essential) — intentionally faint, not solid. Income items show the label of the ammo they need as a hint badge (`AMMO_META[ammoRequired]`, defaulting to the invite label). Special-text branch includes `incomeType === 'time'` for the hourglass ("⏳ SLOW TIME"), alongside `income`/`mine`/`discount`. |
| `drawPanel(ctx, state, event)` | 196 | Right-side 110px checklist panel (required items + checkmarks). |
| `drawHUD(ctx, state)` | 358 | Top HUD: money, ammo counts, lives, timer. Update this when adding a new ammo type. |
| `drawMessages(ctx, messages)` | 403 | Floating "+$150" / "TRAP!" / "⏳ +15s reprieve!" popup text. |
| `drawAdvanceAnim(ctx, anim)` | 421 | Row-advance flash animation. |
| `drawMeeting(ctx, state, assets, event)` | 440 | `meeting` phase: couple image + level result. |
| `drawTitle(ctx, event)` | 560 | `title` phase screen (controls + ammo legend). |
| `drawOverlay(ctx, state, assets, event)` | 609 | `levelComplete` / `gameComplete` / `lost` overlays. |

Note: like the pre-existing `discount` item, `hourglass` has `price > 0`, so `drawItem()`'s
`if (maxPrice > 0)` branch (HP bar + `$price`) takes priority over the `incomeType === 'time'`
special-text branch — the "⏳ SLOW TIME" label is effectively unreachable today, same as
`discount`'s "−30% OFF". This is an existing rendering quirk, not something introduced or fixed
here; the player still sees the correct price/HP bar while shooting it down.

`roundRect()` (line 15) and `findItem()` (line 13) are private helpers, not part of the public surface.

## Relationships / Cross-links
- Reads dimension constants and ammo metadata from `src/constants.js` — see [`constants.md`](constants.md).
- Reads levels, items, names and messages from the `event` argument — schema in `src/events/eventConfig.js`.
- Consumes state produced by `useGameState.js` — see [`use-game-state.md`](use-game-state.md). Never mutates it.
- Called by `Game.jsx` — see [`game-jsx.md`](game-jsx.md).
- Does **not** import `src/pixelArt.js` — despite `pixelArt.js` defining `drawPixelSprite()`,
  actual sprites are drawn via `assets` (the event's images, preloaded by `useAssets.js`), not pixel art. See
  the note in [`architecture.md`](architecture.md).
- Exercised by the manual checklist in [`testing.md`](testing.md) (visual regressions after any change here should be checked against that checklist).
