# Architecture

## Stack
- **React 19** (JSX, hooks only — no class components)
- **Vite 7** (dev server + build)
- **HTML Canvas** for all game rendering — no DOM elements for game objects

## Directory Layout
```
src/
├── main.jsx          # React root mount
├── App.jsx           # Thin wrapper, renders <Game />
├── Game.jsx          # React shell: canvas element, keyboard/touch controls, game loop lifecycle
├── Game.css          # Layout styles (wrapper, mobile controls, key legend)
├── index.css         # Global reset
├── constants.js      # All magic numbers + WEDDING_ITEMS + AMMO_META
├── levels.js         # LEVELS array, getSpawnPool(), isLevelComplete()
├── useGameState.js   # Core game logic hook (update loop, input, collision)
├── renderer.js       # Pure canvas drawing — render(ctx, state, assets)
├── pixelArt.js       # 8×8 pixel-sprite definitions + drawPixelSprite() — currently UNUSED (not imported anywhere)
├── useAssets.js      # Preloads bride/groom/couple PNG images
├── siteConfig.js     # SITE_CONFIG (name, base URL, contact email) + buildSiteUrl() — the only place the hostname appears
├── events/           # Event config model — one config per couple's customized game
│   ├── index.js          # Public entry point: ALL_EVENTS, eventRegistry, re-exports
│   ├── eventConfig.js    # EventConfig typedefs, validateEvent(), assertValidEvent(), EventConfigError, EVENT_ISSUE
│   ├── slug.js           # normalizeSlug(), isValidSlug(), RESERVED_SLUGS, SITE_PAGE_SLUGS
│   ├── registry.js       # createEventRegistry() — lookup by slug, slug availability, public listing
│   ├── eventUrl.js       # getEventPath(), buildEventUrl()
│   └── defaultEvent.js   # The default/demo event (slug DemoWedding), built from WEDDING_ITEMS + LEVELS
└── assets/
    ├── bride-nobg.png
    ├── groom-nobg.png
    └── couple-nobg.png
```

`siteConfig.js` and `events/` are the event config model (design: `docs/designs/T2.md`).
**The game does not consume them yet** — it still reads `constants.js` / `levels.js` directly
until task T3 makes `Game` take an event config. Code outside `src/events/` imports from
`./events` (the index), not from the individual modules. New events go in
`src/events/<camelCaseName>Event.js` and are appended to `ALL_EVENTS`.

## Data Flow
```
Game.jsx                          → knowledge/game-jsx.md
  ├── useGameState()  →  stateRef (never React state — avoids re-renders)
  │                                → knowledge/use-game-state.md
  ├── useAssets()     →  assetsRef
  └── requestAnimationFrame loop:
        update(stateRef)   ← pure mutation via setState(updater)
        render(ctx, state, assets)
                                   → knowledge/renderer.md
```
Both `useGameState.js` and `renderer.js` read shared data/config from
`constants.js` (dimensions, timing, `WEDDING_ITEMS`, `AMMO_META`) and
`levels.js` (`LEVELS`, `getSpawnPool()`, `isLevelComplete()`) — see
[`knowledge/constants.md`](constants.md).

## Key Design Decisions
- **`useRef` for game state**, not `useState` — the loop runs at 60 fps; React re-renders would be too slow.
- **`setState(updater)` pattern** — always pass a function so the closure reads the latest state.
- **`renderer.js` is pure** — takes `(ctx, state, assets)`, returns nothing, has no side-effects.
- **Canvas dimensions**: `CANVAS_WIDTH = 910` (800 play area + 110 panel), `GAME_HEIGHT = 600` (540 play + 60 HUD).

## Entry Point
`src/main.jsx` → `<App />` → `<Game />` — the canvas is the only meaningful DOM node.

## Component Files
| File | Covers |
|------|--------|
| [`knowledge/use-game-state.md`](use-game-state.md) | `useGameState()` hook in `src/useGameState.js` — core game logic, input, update loop |
| [`knowledge/renderer.md`](renderer.md) | `render()` and draw functions in `src/renderer.js` — all canvas drawing |
| [`knowledge/game-jsx.md`](game-jsx.md) | `Game` component in `src/Game.jsx` — React shell wiring hooks + canvas + controls |
| [`knowledge/constants.md`](constants.md) | `src/constants.js` — shared dimensions, timing, `WEDDING_ITEMS`, `AMMO_META` schema |
