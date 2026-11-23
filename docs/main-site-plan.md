# Main site + per-event pages — plan and task breakdown

This is the task source for the delivery pipeline (designer → test-builder + implementer → reviewer,
one PR per task).

## Goal

Split the single hardcoded game into two things served from one domain:

- **Main site** at `/` — the commercial site: pitch, playable demo, customization info, packages,
  how-to, order/contact.
- **Event pages** at `/<EventName>` (e.g. `/DanAndShelly`) — one customized game per couple.

The domain is `weddinvaders.barvazone.com` today and may change; nothing may depend on the
hostname except one site-config value.

## Requirements

| ID | Requirement |
|----|-------------|
| G1 | `/` renders the main site, not the game. |
| G2 | `/<slug>` renders the game customized by that event's config. Slugs are matched case-insensitively. |
| G3 | An unknown slug shows a friendly "event not found" page linking back to the main site. |
| G4 | Main-site paths (`demo`, `customize`, `pricing`, `how-it-works`, `order`, `showcase`, `privacy`, `terms`, …) are reserved and can never be used as event slugs. |
| G5 | Deep links work on GitHub Pages (direct load or refresh of `/DanAndShelly` or `/pricing`). |
| G6 | The game reads everything couple-specific from an event config: names, bride/groom/couple images, item list and labels, levels, messages. No couple-specific value stays hardcoded in game code. |
| G7 | The current game is preserved exactly as the default/demo event — no gameplay change. |
| G8 | The domain and the site's contact details live in one site-config module. |
| G9 | All main-site copy lives in content modules, separate from layout components, so it can be edited or translated without touching components. |
| G10 | The main site is usable on phones (the game already has touch controls). |
| G11 | `npm run lint`, the automated tests and `npm run build` pass in CI on every PR. |

## Decisions (defaults — change here before the affected task starts)

| # | Decision | Default |
|---|----------|---------|
| D1 | Sales model | Concierge: an order/contact form, no online payment. Each event config is authored by us. |
| D2 | Where event configs live | Static: one module per event under `src/events/`, bundled at build time. No backend. |
| D3 | Site language | English, with copy isolated per G9 so Hebrew/RTL can be added later. |
| D4 | Guest data (leaderboards, guest names) | Out of scope. |
| D5 | Routing | Client-side routing in the existing SPA; GitHub Pages `404.html` fallback for deep links. |
| D6 | Order form delivery | Static-hosting friendly: the form composes a `mailto:` to the contact address from site config. |
| D7 | Prices | Placeholder values in a content module until real prices are supplied. |
| D8 | Tests | Vitest + Testing Library for unit/component, Playwright for e2e (the repo has no tests today). |

## Task breakdown

| ID | Task | Scope | Depends on | Complex |
|----|------|-------|------------|---------|
| T1 | Test tooling + CI | Add Vitest, Testing Library and Playwright with `npm test` / `npm run e2e`; a CI workflow running lint, tests and build on PRs; one smoke test that the app mounts. Remove the stray `src/useGameState.js.bak`. Update `.agents/knowledge/testing.md`. | — | |
| T2 | Event config model | `src/events/`: config shape, validation, the default event built from today's hardcoded values, a registry with case-insensitive lookup, slug normalisation and the reserved-slug list (G2, G4). Site-config module (G8). | T1 | yes — every later task builds on this contract |
| T3 | Config-driven game | `Game` takes an event config; `useAssets`, `useGameState`, `renderer`, `levels` and the item list read from it instead of module-level constants (G6). Default event plays identically (G7). | T2 | yes — touches the highest fan-in modules |
| T4 | Routing + deep links | Routes for `/`, main-site pages, `/demo`, `/<slug>` and not-found (G1–G3); GitHub Pages fallback (G5); placeholder pages for the site routes. | T3 | |
| T5 | Site shell + landing page | Layout, navigation, footer; home page with pitch, gameplay hero, three-step "how it works", call to action; content-module structure (G9); responsive (G10). | T4 | |
| T6 | Demo page | `/demo` with the playable default event and at least one alternative sample event to show what customization changes. | T4 | |
| T7 | Customization page | What can be customized (names, photos, items, levels, messages, theme), each with an example. | T5 | |
| T8 | Packages + pricing page | Tiers and add-ons rendered from a content module (D7). | T5 | |
| T9 | Order / contact page | Form: couple names, date, desired slug (validated against reserved and taken slugs), package, notes; delivery per D6. FAQ section. | T5, T8 | |
| T10 | How-to page | Using the game at the wedding (QR on table cards, big screen, pre-wedding link) and controls tutorial. | T5 | |
| T11 | Showcase + legal | Showcase grid driven by events flagged public; privacy and terms pages. | T5 | |
| T12 | Metadata + docs | Page titles, description/Open Graph tags, favicon; refresh `.agents/knowledge/` for the new architecture. | T5–T11 | |

### Milestones

- **M1 — foundation:** T1 → T2 → T3 → T4 (strictly serial).
- **M2 — sellable v1:** T5, T6, then T7, T8, T9 (T6–T8 can run in parallel once T5 is merged).
- **M3 — completeness:** T10, T11, T12.

## Test setup inventory

- Today: no automated tests; `npm run lint` and `npm run build` only; manual checklist in
  `.agents/knowledge/testing.md`. CI has only the deploy workflow, which publishes `main` to
  GitHub Pages on every push.
- After T1: unit/component tests next to source as `*.test.js(x)` run by `npm test`; e2e specs
  under `e2e/` run by `npm run e2e`; CI runs lint, `npm test`, `npm run build` on PRs.
