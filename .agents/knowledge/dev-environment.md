# Dev Environment

## Prerequisites
- **Node.js** ≥ 22.22 (required by jsdom 31; CI uses Node 22. ESM project — `"type": "module"` in `package.json`)
- **npm** (comes with Node)

## Install
```bash
npm install
```

## Run / Build / Lint
```bash
npm run dev      # Vite dev server at http://localhost:5173 (HMR enabled)
npm run build    # Production build → dist/
npm run preview  # Serve production build locally
npm run lint     # ESLint 9 (flat config in eslint.config.js)
npm test         # Vitest, single run (unit/component tests, jsdom)
npm run test:watch  # Vitest in watch mode
npm run e2e      # Playwright e2e against the production build (builds + serves on 127.0.0.1:4173)
```

## Key Dependencies
| Package | Version | Role |
|---------|---------|------|
| react / react-dom | ^19.2 | UI shell only (canvas renders the game) |
| vite | ^7.3 | Dev server + bundler |
| @vitejs/plugin-react | ^5.1 | JSX transform |
| eslint + plugins | ^9.39 | Linting (react-hooks, react-refresh) |
| vitest | ^5.1 | Unit/component test runner (configured in `vite.config.js`) |
| jsdom | ^31.0 | DOM environment for Vitest |
| @testing-library/react, /dom, /jest-dom | ^16.3, ^10.4, ^8.0 | Component rendering + DOM matchers |
| @playwright/test | 1.63.0 (exact) | E2E runner — pinned to match the dev container's pre-installed Chromium |

## Vite Config
`vite.config.js` — `@vitejs/plugin-react` plus the Vitest `test` block (jsdom, `src/test/setup.js`, `src/**/*.test.{js,jsx}`). `defineConfig` is imported from `vitest/config`. No custom aliases or env vars required.

## Static Assets
PNG images (`bride-nobg.png`, `groom-nobg.png`, `couple-nobg.png`) live in `src/assets/` and are imported by the default event module, `src/events/defaultEvent.js`, which carries their URLs in `event.images`; `useAssets(images)` only loads the URLs it is given. Vite handles asset hashing automatically.

## No environment variables required.

## Gotchas
- The game loop runs at ~60 fps via `requestAnimationFrame` — **never** add `console.log` inside the game loop (it tanks performance).
- `CANVAS_WIDTH = 910` (800 play + 110 panel) — ensure the canvas element uses `CANVAS_WIDTH`, not `GAME_WIDTH`.
- All engine constants are in `src/constants.js` — do not hardcode magic numbers elsewhere. Per-event data (items, levels, names, messages, images) lives in an event module under `src/events/`, never in game code.
- ESLint enforces React Hooks rules — all custom hooks must start with `use`.
