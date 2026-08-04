import { WEDDING_ITEMS } from './constants';

// ── level definitions ────────────────────────────────────────────────────────
//
//  priceScale   multiplies base item prices   (0.2 → rings cost $100 instead of $500)
//  itemSpeed    pixels/frame for flying items
//  rowAdvance   seconds between each row step (9 rows, 4 steps to meet → 4×interval)
//  hasMines     whether 💣 traps can appear
//
//  money must always be a multiple of $100 (cash ammo costs $100/shot)

export const LEVELS = [
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

// Returns the subset of WEDDING_ITEMS that can spawn in this level
export function getSpawnPool(level) {
  const allowed = new Set([...level.required, ...level.optional]);
  if (level.hasMines) allowed.add('mine');
  return WEDDING_ITEMS.filter(w => allowed.has(w.id));
}

// True when every required item has been acquired
export function isLevelComplete(level, acquiredItems) {
  return level.required.every(id => acquiredItems.includes(id));
}
