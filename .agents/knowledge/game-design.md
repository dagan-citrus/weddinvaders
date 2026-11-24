# Game Design

## Concept
Two-player cooperative Space Invaders-style game. The **Bride** (bottom) and **Groom** (top) move toward each other across 9 rows, shooting flying wedding items to buy everything needed for their wedding before they meet in the middle.

## Game Phases
| Phase | Description |
|-------|-------------|
| `title` | Start screen — explains controls + ammo types |
| `playing` | Main gameplay loop |
| `meeting` | Players reached the same row → couple image shown, then level result |
| `levelComplete` | Time ran out with all required items bought → next level |
| `gameComplete` | All 5 levels cleared |
| `lost` | Ran out of lives, money went negative, or met without completing requirements |

## Players
- **Groom** — starts top-right (row 0), moves down. Controls: ←/→ move, ↑/↓ cycle ammo, Space/Enter shoot.
- **Bride** — starts bottom-left (row 8), moves up. Controls: A/D move, W shoot, S cycle ammo.
- Both move one row at a time on a timed `rowAdvanceTimer`.
- Key bindings are handled in `onKey()` / `moveX()` in [`knowledge/use-game-state.md`](use-game-state.md).

## Ammo Types
| Type | Key | Cost | Effect |
|------|-----|------|--------|
| 💵 Cash | `cash` | $100/shot (deducted from `money`) | Damages purchasable items (HP = price × priceScale) |
| 💌 Invite | `invite` | 1 envelope | Hits `guest` items → guest attends, brings $100–$300 random gift |
| 💕 Heart | `heart` | 1 heart | Hits `parent_bride`/`parent_groom` → family donates $300–$500 random |

## Item Types (defined in `src/constants.js` `WEDDING_ITEMS` — see [`knowledge/constants.md`](constants.md))
| ID | Emoji | Type | Notes |
|----|-------|------|-------|
| `rings` | 💍 | purchase (required) | Always required |
| `officiant` | ⛪ | purchase (required) | Level 2+ |
| `catering` | 🍽️ | purchase (required) | Level 3+ |
| `flowers` | 💐 | purchase (optional) | Bride-exclusive |
| `suit` | 🤵 | purchase (optional) | Groom-exclusive |
| `cake` | 🎂 | purchase (optional) | Level 4+ |
| `guest` | 👥 | income (invite ammo) | Gives $100–$300 |
| `parent_bride` | 👩‍👧 | income (heart ammo) | Bride-exclusive, gives $300–$500 |
| `parent_groom` | 👨‍👦 | income (heart ammo) | Groom-exclusive, gives $300–$500 |
| `discount` | 🎀 | discount | Reduces remaining item prices by 30% |
| `mine` | 💣 | trap | Explodes on contact, costs a life |
| `hourglass` | ⏳ | time (cash ammo) | Rare; slows row-advance pace for `HOURGLASS_SLOW_SECONDS` (15s) |

### Spawn Probability
Every item template has a `spawnWeight` in `WEDDING_ITEMS` (`constants.js`); `spawnItem()`
(`useGameState.js`'s `pickWeighted()`) does a cumulative-weight random pick, not a uniform one.
Purchasable items (rings/officiant/catering/flowers/suit/cake) are weight `10` (most common),
`guest` is `5`, `parent_bride`/`parent_groom` are `2` (rare), `discount`/`mine` are `3`, and the
new `hourglass` is `2` (rare, same tier as family).

## Level Structure (`src/levels.js`)
5 levels with increasing difficulty:

| Level | Name | Required Items | money | priceScale | itemSpeed | hasMines |
|-------|------|---------------|-------|-----------|-----------|---------|
| 1 | Save the Date | rings | $9900 | 0.1× | 1.5 | No |
| 2 | The Ceremony | rings, officiant | $3000 | 0.4× | 2.0 | No |
| 3 | The Reception | rings, officiant, catering | $2500 | 0.65× | 2.5 | No |
| 4 | The Full Wedding | rings, officiant, catering, flowers, suit | $2000 | 0.9× | 3.0 | Yes |
| 5 | Dream Wedding | rings, officiant, catering, flowers, suit, cake | $1800 | 1.2× | 3.5 | Yes |

## Win / Lose Conditions
- **Win level**: All `required` items acquired when players meet (or time runs out with money ≥ 0).
- **Lose**: Lives reach 0, OR players meet without all required items, OR money goes negative.
- **Starting money must be a multiple of $100** (cash ammo costs $100/shot — leftover cents are unspendable).

## Row-Advance Pacing
- Once all `required` items for the level are acquired, row-advance speeds up by
  `ROW_ADVANCE_SPEEDUP` (`constants.js`, default `2.5×`) — this limits how long players can keep
  farming optional items/money instead of finishing the level.
- The `hourglass` item temporarily halves whatever the current rate is (including during the
  speedup) for `HOURGLASS_SLOW_SECONDS` (15s) — a player-earned reprieve, not a hard freeze. The
  two effects compose rather than override each other; see `use-game-state.md`.

## Key Constraints
- Items spawn on rows between the two players (never on their rows).
- `exclusiveTo: 'bride'` items can only be shot by bride; `'groom'` items only by groom.
- Rows advance on `rowAdvanceTimer`; press **N** (when level complete) to fast-forward.
- `priceScale` multiplies each item's base `price` — e.g., rings at 0.1× cost $50 instead of $500.
