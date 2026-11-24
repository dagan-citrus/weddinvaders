# Component: `Game` (`src/Game.jsx`)

## Location
`src/Game.jsx:14` — `export default function Game({ event })`, a thin wrapper around the private `GameSession({ event })` (line 18). 111 lines.

## Purpose
The React shell and orchestrator. It's the one place that wires the two core modules together:
it constructs `useGameState(event)` and `useAssets(event.images)`, owns the `<canvas>` element, drives the
render/game loop lifecycle, and translates DOM events (click, on-screen mobile buttons) into
`handleAction()` calls. Per `architecture.md`'s data flow, this is the root node — everything
else in `src/` is either a hook it calls or a pure function it calls into.

## Construction
Rendered by `App.jsx` as `<Game event={defaultEvent} />` → the only consumer is `src/main.jsx`'s React root.
`event` is a required prop (an `EventConfig` from `src/events/`); `Game` has no default, so the
engine can never fall back to the default couple by accident, and `Game.jsx` itself does not
import from `src/events/`.

**Event change = remount.** `Game` renders `<GameSession key={event.slug} event={event} />`. An
event's identity is its slug: switching to an event with a different slug starts a fresh session
(state, held keys, images, listeners and the animation loop all reset together), while
re-rendering with the same slug never resets a running game. Replacing the event object under the
same slug during a mount is unsupported.

## Key Surface
| Element | Line | Purpose |
|---|---|---|
| `useAssets(event.images)` call | 20 | Preloads the event's bride/groom/couple images into `assetsRef`. |
| `useGameState(event)` call | 21 | Destructures `{ getState, startLoop, stopLoop, setRenderCallback, handleAction }` — see [`use-game-state.md`](use-game-state.md). |
| render-callback effect | 23–32 | Registers a callback that calls `render(ctx, state, assets, event)` (see [`renderer.md`](renderer.md)) every frame, and starts/stops the `requestAnimationFrame` loop on mount/unmount. |
| `handleCanvasClick` | 34–41 | Maps a canvas click to the right `handleAction` for the current phase (`START`, `NEXT_LEVEL`, `RESTART`). |
| `<canvas>` element | 49–55 | Sized `CANVAS_WIDTH × GAME_HEIGHT` from `src/constants.js`; the only meaningful DOM node for gameplay. |
| `.mobile-controls` block | 58–102 | On-screen ammo-select and shoot buttons for touch devices, dispatching `SELECT_AMMO` / `SHOOT` actions per role. |
| `.key-legend` | 104–107 | On-screen text listing keyboard controls — kept in sync with the real bindings in `useGameState.js`. The two player words come from `event.names.bride` / `.groom` (default: `Bride` / `Groom`); each line is a single text node. |

## Relationships / Cross-links
- Constructs and is the sole caller of `useGameState(event)` — see [`use-game-state.md`](use-game-state.md).
- Constructs `useAssets(images)` (`src/useAssets.js`, not a dedicated component file — small/single-purpose); it loads the three URLs in `event.images`.
- Calls `render()` from `src/renderer.js` — see [`renderer.md`](renderer.md).
- Imports layout/dimension constants from `src/constants.js` — see [`constants.md`](constants.md).
- Styling lives in `src/Game.css`, imported here (line 6).
- Manual verification of this component's wiring is covered by [`testing.md`](testing.md) and [`write-test.md`](../skills/write-test.md).
