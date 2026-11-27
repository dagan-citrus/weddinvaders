import brideImage  from '../assets/bride-nobg.png';
import groomImage  from '../assets/groom-nobg.png';
import coupleImage from '../assets/couple-nobg.png';

/**
 * The default (demo) event. Its `items` and `levels` are the single source of
 * truth for the default game data; the game reads them through the event.
 *
 * @type {import('./eventConfig').EventConfig}
 */
export const defaultEvent = {
  slug:   'DemoWedding',
  public: true,
  names: {
    bride: 'Bride',
    groom: 'Groom',
  },
  images: {
    bride:  brideImage,
    groom:  groomImage,
    couple: coupleImage,
  },
  messages: {
    title:        "WEDDIN'VADERS",
    tagline:      'Buy the wedding of your dreams!',
    finalMeeting: '🎉  MARRIED!  🎉',
    gameComplete: "🎉 YOU'RE MARRIED! 🎉",
    lost:         '💔 Wedding Failed!',
  },

  // spawnWeight controls relative spawn probability — higher = more common.
  items: [
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
  ],

  // ── level definitions ────────────────────────────────────────────────────────
  //
  //  priceScale   multiplies base item prices   (0.2 → rings cost $100 instead of $500)
  //  itemSpeed    pixels/frame for flying items
  //  rowAdvance   seconds between each row step (9 rows, 4 steps to meet → 4×interval)
  //  hasMines     whether 💣 traps can appear
  //
  //  money must always be a multiple of $100 (cash ammo costs $100/shot)

  levels: [
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
  ],
};
