# Weddin'Vaders — Agent Knowledge Base

Space Invaders-style cooperative two-player browser game built with React + Vite + Canvas, where a bride and groom shoot ammo at flying wedding items to fund and complete their wedding.

## Knowledge Files

| File | Description |
|------|-------------|
| [`knowledge/architecture.md`](knowledge/architecture.md) | Module overview, data flow, game loop, key entry points |
| [`knowledge/dev-environment.md`](knowledge/dev-environment.md) | Prerequisites, run/build commands, gotchas |
| [`knowledge/game-design.md`](knowledge/game-design.md) | Game phases, ammo types, item system, level structure, win/lose rules |
| [`knowledge/testing.md`](knowledge/testing.md) | How to verify changes: Vitest component tests, Playwright e2e, CI, plus the manual gameplay checklist |

## Component Files

| File | Component | Purpose |
|------|-----------|---------|
| [`knowledge/use-game-state.md`](knowledge/use-game-state.md) | `useGameState()` — `src/useGameState.js` | Core game-logic hook: state, input, 60fps update loop, collisions, phase transitions |
| [`knowledge/renderer.md`](knowledge/renderer.md) | `render()` + draw functions — `src/renderer.js` | All canvas drawing, pure `(ctx, state, assets) → void` |
| [`knowledge/game-jsx.md`](knowledge/game-jsx.md) | `Game` — `src/Game.jsx` | React shell orchestrating hooks, canvas, and controls |
| [`knowledge/constants.md`](knowledge/constants.md) | `src/constants.js` | Shared dimensions, timing, `WEDDING_ITEMS`/`AMMO_META` schema (highest fan-in module in the repo) |

## Skill Files

| File | When to use |
|------|-------------|
| [`skills/bug-fix.md`](skills/bug-fix.md) | Diagnosing and fixing runtime errors or broken game behaviour |
| [`skills/new-feature.md`](skills/new-feature.md) | Adding new items, levels, ammo types, phases, or UI changes |
| [`skills/write-test.md`](skills/write-test.md) | Manually verifying a feature works end-to-end in the preview |

## Keeping Knowledge Up to Date

After any change that affects **architecture, game design rules, dev workflow, or a documented
component's interface/behaviour**, update the relevant `.agents/knowledge/*.md` file (topic *or*
component) in a separate commit:

```
git add .agents/knowledge/<file>.md
git commit -m "docs: update agent knowledge — <what changed>"
```

Changes that require a knowledge update:
- New source files or renamed modules → `architecture.md`
- New level, item type, ammo type, or phase → `game-design.md`
- New npm script, env var, or build step → `dev-environment.md`
- **If the change touches `useGameState.js`, `renderer.js`, `Game.jsx`, or `constants.js`** — check
  that component's dedicated file (`use-game-state.md` / `renderer.md` / `game-jsx.md` /
  `constants.md`) for drift, not just the topic file. Line numbers cited there will go stale as
  those files grow; re-verify them rather than assuming.
