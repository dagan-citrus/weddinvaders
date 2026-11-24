# Architecture

## Stack
- **React 19** (JSX, hooks only — no class components)
- **Vite 7** (dev server + build)
- **HTML Canvas** for all game rendering — no DOM elements for game objects

## Directory Layout
```
src/
├── main.jsx          # React root mount
├── App.jsx           # Router shell: matches the URL path to a route and renders its page
├── routes.js         # Route table (derived from SITE_PAGE_SLUGS) + pure matchRoute(), getDocumentTitle()
├── navigation.js     # History API glue: usePathname(), navigate()
├── Link.jsx          # <a> that navigates in-app without a document reload
├── pages/            # One component per page
│   ├── SiteLayout.jsx      # Frame of every main-site page: <nav aria-label="Site"> + <main data-route>
│   ├── HomePage.jsx        # `/` (placeholder until the landing page is built)
│   ├── PlaceholderPage.jsx # Site pages not built yet: heading + "Coming soon."
│   ├── NotFoundPage.jsx    # "Event not found" + link to the main site
│   ├── DemoPage.jsx        # `/demo`: <Game event={defaultEvent} />, no layout
│   └── EventPage.jsx       # `/<slug>`: <Game event={event} />, no layout
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
**The game is driven by an event config** (design: `docs/designs/T3.md`): a page (`EventPage`,
`DemoPage`) passes an event to `<Game event>`; everything couple-specific — names, images, items, levels,
messages — is read from it. The game modules (`Game.jsx`, `useGameState.js`, `renderer.js`,
`levels.js`, `useAssets.js`, `constants.js`) never import from `src/events/`; the event is an
explicit argument all the way down. Code outside `src/events/` imports from
`./events` (the index), not from the individual modules. New events go in
`src/events/<camelCaseName>Event.js` and are appended to `ALL_EVENTS`.

## Routing
Design: `docs/designs/T4.md`. Hand-rolled, no router dependency.

| Path | Renders |
|------|---------|
| `/` | `HomePage` inside `SiteLayout` — the main site, never the game |
| `/<site page>` (the eight `SITE_PAGE_SLUGS`) | That page inside `SiteLayout` (`PlaceholderPage` until built); `/demo` is the exception: the game alone |
| `/<slug>` of a registered event | `EventPage` — the game alone, no site layout |
| anything else (unknown slug, more than one segment, undecodable) | `NotFoundPage` inside `SiteLayout` |

- `matchRoute(pathname, registry)` in `routes.js` is the single matcher: pathname only (query and
  hash are ignored and left in the URL), empty segments dropped (trailing/doubled slashes are
  fine), site pages and slugs case-insensitive, a site page always wins over an event. The URL is
  never rewritten.
- **One route table.** `SITE_ROUTES` is derived from `SITE_PAGE_SLUGS` (`events/slug.js`), which is
  also what reserves those names as event slugs. Adding a site page = add it to `SITE_PAGE_SLUGS`,
  give it a title in `routes.js`, and add its component to `PAGE_COMPONENTS` in `App.jsx`.
- `App.jsx` calls `matchRoute(usePathname())`, sets `document.title` from `getDocumentTitle()`, and
  picks the page. Use `<Link to>` / `navigate(to)` for internal links — a plain `<a>` reloads the
  document.
- **Deep links on GitHub Pages:** the `spaFallback` plugin in `vite.config.js` copies
  `dist/index.html` to `dist/404.html` on build. GitHub Pages serves `404.html` (with HTTP status
  404) for any unknown path, and the SPA then routes it. `vite preview` and the dev server answer
  unknown paths with `index.html` and 200 instead, so local runs cannot prove the Pages behaviour —
  see the post-deploy check in [`testing.md`](testing.md).

## Data Flow
```
EventPage / DemoPage ── event (from ./events) ──►  Game.jsx   → knowledge/game-jsx.md
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
`src/main.jsx` → `<App />` → the page for the current path. On game pages (`/demo`, `/<slug>`) the
canvas is the only meaningful DOM node.

## Component Files
| File | Covers |
|------|--------|
| [`knowledge/use-game-state.md`](use-game-state.md) | `useGameState()` hook in `src/useGameState.js` — core game logic, input, update loop |
| [`knowledge/renderer.md`](renderer.md) | `render()` and draw functions in `src/renderer.js` — all canvas drawing |
| [`knowledge/game-jsx.md`](game-jsx.md) | `Game` component in `src/Game.jsx` — React shell wiring hooks + canvas + controls |
| [`knowledge/constants.md`](constants.md) | `src/constants.js` — shared engine dimensions, timing, `AMMO_META` |
