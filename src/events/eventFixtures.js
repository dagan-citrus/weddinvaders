/**
 * Shared test fixture for the event config model.
 * Not a test file: imported by the `*.test.js` files under `src/events/`.
 */

/** Indexes of the fixture's items, for tests that mutate one of them. */
export const ITEM_INDEX = Object.freeze({ RINGS: 0, GUEST: 1, DISCOUNT: 2, MINE: 3 });

/**
 * Builds a fresh, fully valid event config on every call.
 * Top-level `overrides` are spread last; mutate the result for nested faults.
 *
 * @param {object} [overrides]
 * @returns {object}
 */
export function makeEvent(overrides = {}) {
  return {
    slug: 'DanAndShelly',
    public: false,
    names: { bride: 'Shelly', groom: 'Dan' },
    images: { bride: '/img/bride.png', groom: '/img/groom.png', couple: '/img/couple.png' },
    messages: {
      title: 'DAN & SHELLY',
      tagline: 'Tag',
      finalMeeting: 'Married',
      gameComplete: 'Done',
      lost: 'Lost',
    },
    items: [
      { id: 'rings', emoji: '💍', label: 'Rings', price: 500, essential: true, exclusiveTo: null, incomeType: null, spawnWeight: 10 },
      { id: 'guest', emoji: '👥', label: 'Guest', price: 0, essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 150, ammoRequired: 'invite', spawnWeight: 5 },
      { id: 'discount', emoji: '🎀', label: 'Organizer', price: 200, essential: false, exclusiveTo: null, incomeType: 'discount', discountPct: 0.3, ammoRequired: 'cash', spawnWeight: 3 },
      { id: 'mine', emoji: '💣', label: 'Trap', price: 0, essential: false, exclusiveTo: null, incomeType: 'mine', ammoRequired: null, spawnWeight: 3 },
    ],
    levels: [
      {
        id: 1,
        name: 'One',
        subtitle: 'Sub',
        required: ['rings'],
        optional: ['guest', 'discount'],
        money: 1000,
        priceScale: 1,
        itemSpeed: 2,
        rowAdvance: 20,
        gameDuration: 60,
        invites: 5,
        hearts: 2,
        hasMines: true,
      },
    ],
    ...overrides,
  };
}
