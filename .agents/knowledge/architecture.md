# Architecture

## Stack
- **React 19** (JSX, hooks only — no class components)
- **Vite 7** (dev server + build)
- **HTML Canvas** for all game rendering — no DOM elements for game objects

## Directory Layout
```
src/
├── main.jsx          # React root mount
├── App.jsx           # Thin wrapper, renders <Game event={defaultEvent} />
├── Game.jsx          # React shell for one event: canvas element, keyboard/touch controls, game loop lifecycle
├── Game.css          # Layout styles (wrapper, mobile controls, key legend)
├── index.css         # Global reset
├── constants.js      # Engine constants (dimensions, physics, timing) + AMMO_META — no per-event data
├── levels.js         # Two pure helpers: getSpawnPool(level, items), isLevelComplete()
├── useGameState.js   # Core game logic: pure getInitialState/stepGame/advanceLevel + the useGameState(event) hook
├── renderer.js       # Pure canvas drawing — render(ctx, state, assets, event)
├── pixelArt.js       # 8×8 pixel-sprite definitions + drawPixelSprite() — currently UNUSED (not imported anywhere)
├── useAssets.js      # Preloads an event's bride/groom/couple images — useAssets(images)
├── siteConfig.js     # SITE_CONFIG (name, base URL, contact email) + buildSiteUrl() — the only place the hostname appears
├── events/           # Event config model — one config per couple's customized game
│   ├── index.js          # Public entry point: ALL_EVENTS, eventRegistry, re-exports
│   ├── eventConfig.js    # EventConfig typedefs, validateEvent(), assertValidEvent(), EventConfigError, EVENT_ISSUE
│   ├── slug.js           # normalizeSlug(), isValidSlug(), RESERVED_SLUGS, SITE_PAGE_SLUGS
│   ├── registry.js       # createEventRegistry() — lookup by slug, slug availability, public listing
│   ├── eventUrl.js       # getEventPath(), buildEventUrl()
│   └── defaultEvent.js   # The default/demo event (slug DemoWedding): its items, levels, messages and images
└── assets/
    ├── bride-nobg.png
    ├── groom-nobg.png
    └── couple-nobg.png
```

`siteConfig.js` and `events/` are the event config model (design: `docs/designs/T2.md`).
**The game is driven by an event config** (design: `docs/designs/T3.md`): `App.jsx` imports an
event and passes it to `<Game event>`; everything couple-specific — names, images, items, levels,
messages — is read from it. The game modules (`Game.jsx`, `useGameState.js`, `renderer.js`,
`levels.js`, `useAssets.js`, `constants.js`) never import from `src/events/`; the event is an
explicit argument all the way down. Code outside `src/events/` imports from
`./events` (the index), not from the individual modules. New events go in
`src/events/<camelCaseName>Event.js` and are appended to `ALL_EVENTS`.

## Data Flow
```
App.jsx  ── event (from ./events) ──►  Game.jsx   → knowledge/game-jsx.md
                                         └── <GameSession key={event.slug} event>
  ├── useGameState(event)    →  stateRef (never React state — avoids re-renders)
  │                                → knowledge/use-game-state.md
  ├── useAssets(event.images) →  assetsRef
  └── requestAnimationFrame loop:
        state = stepGame(state, event, keys)   ← pure, via setState(updater)
        render(ctx, state, assets, event)
                                   → knowledge/renderer.md
```
Both `useGameState.js` and `renderer.js` read engine constants from `constants.js` (dimensions,
timing, `AMMO_META`) — see [`knowledge/constants.md`](constants.md) — and all per-event data
(`event.items`, `event.levels`, `event.names`, `event.messages`) from the `event` argument.
`levels.js` contributes two pure helpers, `getSpawnPool(level, items)` and `isLevelComplete()`.

## Key Design Decisions
- **`useRef` for game state**, not `useState` — the loop runs at 60 fps; React re-renders would be too slow.
- **`setState(updater)` pattern** — always pass a function so the closure reads the latest state.
- **The event is an explicit argument**, not React context and not part of game state — state stays pure gameplay data, and a different event slug remounts the session (`key={event.slug}`).
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
| [`knowledge/constants.md`](constants.md) | `src/constants.js` — shared engine dimensions, timing, `AMMO_META` |
