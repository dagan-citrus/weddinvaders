/**
 * Shared fixtures for the game tests (levels, game state, renderer, components).
 * Not a test file.
 */
import { makeEvent } from '../events/eventFixtures';
import { getInitialState } from '../useGameState';

// ── golden default data ──────────────────────────────────────────────────────
// Verbatim copies of the item and level literals as they were before the game
// became config-driven (commit 7f459b6: src/constants.js and src/levels.js).
// The default event must stay strictly equal to these.

export const GOLDEN_DEFAULT_ITEMS = [
  // ── essentials (bought with cash) ──
  { id: 'rings',        emoji: '💍', label: 'Rings',          price: 500, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  { id: 'officiant',    emoji: '⛪', label: 'Officiant',       price: 300, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  { id: 'catering',     emoji: '🍽️', label: 'Catering',        price: 800, essential: true,  exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
  // ── income items ──
  { id: 'guest',        emoji: '👥', label: 'Guest',       price: 0, essential: false, exclusiveTo: null,    incomeType: 'income', incomeAmount: 150, ammoRequired: 'invite', spawnWeight: 5 },
  { id: 'parent_bride', emoji: '👩‍👧', label: 'Her Family',  price: 0, essential: false, exclusiveTo: 'bride', incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
  { id: 'parent_groom', emoji: '👨‍👦', label: 'His Family',  price: 0, essential: false, exclusiveTo: 'groom', incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
  // ── special ──
  { id: 'discount',     emoji: '🎀', label: 'Organizer',       price: 200, essential: false, exclusiveTo: null,    incomeType: 'discount', discountPct: 0.3,  ammoRequired: 'cash',  spawnWeight: 3 },
  { id: 'mine',         emoji: '💣', label: 'Trap',            price: 0,   essential: false, exclusiveTo: null,    incomeType: 'mine',     ammoRequired: null,                       spawnWeight: 3 },
  { id: 'hourglass',    emoji: '⏳', label: 'More Time',       price: 150, essential: false, exclusiveTo: null,    incomeType: 'time',     ammoRequired: 'cash',                     spawnWeight: 2 },
  // ── optional purchases ──
  { id: 'flowers',      emoji: '💐', label: 'Flowers',         price: 200, essential: false, exclusiveTo: 'bride', incomeType: null,       spawnWeight: 10 },
  { id: 'suit',         emoji: '🤵', label: 'Suit',            price: 250, essential: false, exclusiveTo: 'groom', incomeType: null,       spawnWeight: 10 },
  { id: 'cake',         emoji: '🎂', label: 'Cake',            price: 350, essential: false, exclusiveTo: null,    incomeType: null,       spawnWeight: 10 },
];

export const GOLDEN_DEFAULT_LEVELS = [
  {
    id:           1,
    name:         'Save the Date',
    subtitle:     'Just the basics — one ring to rule them all!',
    required:     ['rings'],
    optional:     ['guest', 'cake', 'parent_bride', 'parent_groom', 'hourglass'],
    money:        9900,   // multiple of $100
    priceScale:   0.1,    // rings cost $50 — one cash shot buys it
    itemSpeed:    1.5,    // snappy intro pace
    rowAdvance:   60,     // rows advance once per minute
    gameDuration: 300,    // 5 minutes — no pressure
    invites:      12,
    hearts:       4,
    hasMines:     false,
  },
  {
    id:           2,
    name:         'The Ceremony',
    subtitle:     'Someone needs to officiate this thing.',
    required:     ['rings', 'officiant'],
    optional:     ['guest', 'suit', 'flowers', 'parent_bride', 'parent_groom', 'hourglass'],
    money:        3000,
    priceScale:   0.4,
    itemSpeed:    2.0,
    rowAdvance:   30,
    gameDuration: 150,
    invites:      10,
    hearts:       4,
    hasMines:     false,
  },
  {
    id:           3,
    name:         'The Reception',
    subtitle:     'You have to feed your guests!',
    required:     ['rings', 'officiant', 'catering'],
    optional:     ['guest', 'suit', 'flowers', 'cake', 'parent_bride', 'parent_groom', 'hourglass'],
    money:        2500,
    priceScale:   0.65,
    itemSpeed:    2.5,
    rowAdvance:   24,
    gameDuration: 110,
    invites:      10,
    hearts:       4,
    hasMines:     false,
  },
  {
    id:           4,
    name:         'The Full Wedding',
    subtitle:     'Fashion matters. So does cake.',
    required:     ['rings', 'officiant', 'catering', 'flowers', 'suit'],
    optional:     ['guest', 'parent_bride', 'parent_groom', 'cake', 'discount', 'hourglass'],
    money:        2000,
    priceScale:   0.9,
    itemSpeed:    3.0,
    rowAdvance:   20,
    gameDuration: 95,
    invites:      12,
    hearts:       5,
    hasMines:     true,
  },
  {
    id:           5,
    name:         'Dream Wedding',
    subtitle:     'The whole package. Watch out for traps!',
    required:     ['rings', 'officiant', 'catering', 'flowers', 'suit', 'cake'],
    optional:     ['guest', 'parent_bride', 'parent_groom', 'discount', 'hourglass'],
    money:        1800,
    priceScale:   1.2,
    itemSpeed:    3.5,
    rowAdvance:   16,
    gameDuration: 80,
    invites:      12,
    hearts:       5,
    hasMines:     true,
  },
];

// ── alternative event ────────────────────────────────────────────────────────

/**
 * A second event whose ids, labels, names and messages share nothing with the
 * default one. `bomb` is a mine whose id is not 'mine'; `grandma` is a heart
 * donor whose id is not 'parent_*'. Fresh object on every call.
 */
export function makeAltEvent() {
  return makeEvent({
    slug: 'TomAndAnna',
    names:    { bride: 'Anna', groom: 'Tom' },
    images:   { bride: '/alt/bride.png', groom: '/alt/groom.png', couple: '/alt/couple.png' },
    messages: { title: 'TOM & ANNA', tagline: 'Alt tagline', finalMeeting: 'ALT FINAL', gameComplete: 'ALT COMPLETE', lost: 'ALT LOST' },
    items: [
      { id: 'chuppah', emoji: '⛺', label: 'Chuppah', price: 300, essential: true,  exclusiveTo: null, incomeType: null, spawnWeight: 4 },
      { id: 'band',    emoji: '🎺', label: 'Band',    price: 200, essential: false, exclusiveTo: null, incomeType: null, spawnWeight: 4 },
      { id: 'friend',  emoji: '🧑', label: 'Friend',  price: 0,   essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 150, ammoRequired: 'invite', spawnWeight: 4 },
      { id: 'grandma', emoji: '👵', label: 'Grandma', price: 0,   essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 4 },
      { id: 'bomb',    emoji: '🧨', label: 'Bomb',    price: 0,   essential: false, exclusiveTo: null, incomeType: 'mine',   ammoRequired: null, spawnWeight: 4 },
    ],
    levels: [
      { id: 1, name: 'Alt One', subtitle: 's1', required: ['chuppah'],         optional: ['band', 'friend', 'grandma'],
        money: 1000, priceScale: 1,   itemSpeed: 2, rowAdvance: 20, gameDuration: 60, invites: 5, hearts: 2, hasMines: false },
      { id: 2, name: 'Alt Two', subtitle: 's2', required: ['chuppah', 'band'], optional: ['friend'],
        money: 500,  priceScale: 0.5, itemSpeed: 3, rowAdvance: 10, gameDuration: 30, invites: 3, hearts: 1, hasMines: true },
    ],
  });
}

// ── state builders ───────────────────────────────────────────────────────────

/** The initial state of a level, already in the `playing` phase. */
export function playing(event, levelIndex = 0, overrides = {}) {
  return { ...getInitialState(event, levelIndex), phase: 'playing', ...overrides };
}

/** A flying item as the spawner builds it: default-event rings on level 1. */
export function flyingItem(overrides = {}) {
  return {
    id: 'i1', templateId: 'rings', label: 'Rings', emoji: '💍', price: 50, maxPrice: 50,
    essential: true, exclusiveTo: null, incomeType: null, incomeAmount: 0, discountPct: 0,
    ammoRequired: null, row: 1, x: 400, y: 62, vx: -1.5, flashTimer: 0,
    ...overrides,
  };
}

/** A groom cash bullet that overlaps `flyingItem()` after one frame. */
export function bullet(overrides = {}) {
  return { id: 'b1', x: 420, y: 70, vy: 8, ammoType: 'cash', role: 'groom', ...overrides };
}

export const NO_ASSETS = { bride: null, groom: null, couple: null, loaded: false };

// ── expected drawn text ──────────────────────────────────────────────────────

/** Title-screen lines that belong to the engine, not to an event. */
export const ENGINE_TITLE_LINES = [
  '',
  '💵 Cash shoots at items to buy them',
  '💌 Send invites to guests — they attend & bring gift money!',
  '💕 Send hearts to family — they donate BIG bucks!',
  '',
  'Collect items on the right panel. N = fast-forward once done!',
  '',
  '— Press any key to begin —',
];

/** Every string the title screen draws for the default event, in draw order. */
export const DEFAULT_TITLE_TEXTS = [
  "WEDDIN'VADERS",
  'Buy the wedding of your dreams!',
  '👰 Bride  —  A/D move   ·   S ammo   ·   W shoot',
  '🤵 Groom  —  ←/→ move   ·   ↑/↓ ammo   ·   Space shoot',
  ...ENGINE_TITLE_LINES,
  'LEVEL 1', 'Save the Date', 'SCORE', '0', '💍', 'Rings', 'EXTRAS', '🎂', 'Cake',
];

/** The same for `makeAltEvent()`. */
export const ALT_TITLE_TEXTS = [
  'TOM & ANNA',
  'Alt tagline',
  '👰 Anna  —  A/D move   ·   S ammo   ·   W shoot',
  '🤵 Tom  —  ←/→ move   ·   ↑/↓ ammo   ·   Space shoot',
  ...ENGINE_TITLE_LINES,
  'LEVEL 1', 'Alt One', 'SCORE', '0', '⛺', 'Chuppah', 'EXTRAS', '🎺', 'Band',
];

/** Default-event strings that must never be drawn when another event is rendered. */
export const DEFAULT_LEAK_STRINGS = [
  "WEDDIN'VADERS",
  'Buy the wedding of your dreams!',
  '🎉  MARRIED!  🎉',
  "🎉 YOU'RE MARRIED! 🎉",
  '💔 Wedding Failed!',
  ...GOLDEN_DEFAULT_LEVELS.map((level) => level.name),
  ...GOLDEN_DEFAULT_ITEMS.map((item) => item.label),
  'Bride',
  'Groom',
];

/** Recursively freezes a fixture so a test fails if the code under test mutates it. */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
