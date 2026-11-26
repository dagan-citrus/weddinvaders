import { defaultEvent } from './defaultEvent';

/** Sample event for the demo page: a fictional couple, to show what customization changes. */
export const mayaAndNoahEvent = {
  slug:   'MayaAndNoah',
  public: false,
  names:  { bride: 'Maya', groom: 'Noah' },
  // Stand-in artwork shared with the default event; a real event has its own photos.
  images: defaultEvent.images,
  messages: {
    title:        'MAYA & NOAH',
    tagline:      'Throw the garden party of the year!',
    finalMeeting: '🌿  JUST MARRIED!  🌿',
    gameComplete: '🥂 WHAT A PARTY! 🥂',
    lost:         '🌧️ Party rained out!',
  },
  items: [
    // essentials
    { id: 'venue',      emoji: '🏡', label: 'Garden',       price: 600, essential: true,  exclusiveTo: null, incomeType: null, spawnWeight: 10 },
    { id: 'band',       emoji: '🎷', label: 'Band',         price: 400, essential: true,  exclusiveTo: null, incomeType: null, spawnWeight: 10 },
    { id: 'tacos',      emoji: '🌮', label: 'Taco Bar',     price: 700, essential: true,  exclusiveTo: null, incomeType: null, spawnWeight: 10 },
    // income
    { id: 'friend',     emoji: '🥳', label: 'Friend',       price: 0, essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 150, ammoRequired: 'invite', spawnWeight: 5 },
    { id: 'grandma',    emoji: '👵', label: 'Grandma',      price: 0, essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
    { id: 'grandpa',    emoji: '👴', label: 'Grandpa',      price: 0, essential: false, exclusiveTo: null, incomeType: 'income', incomeAmount: 400, ammoRequired: 'heart',  spawnWeight: 2 },
    // special
    { id: 'planner',    emoji: '🎀', label: 'Planner',      price: 200, essential: false, exclusiveTo: null, incomeType: 'discount', discountPct: 0.3, ammoRequired: 'cash', spawnWeight: 3 },
    { id: 'rain',       emoji: '🌧️', label: 'Rain',         price: 0,   essential: false, exclusiveTo: null, incomeType: 'mine',     ammoRequired: null,   spawnWeight: 3 },
    { id: 'slowdance',  emoji: '💃', label: 'Slow Dance',   price: 150, essential: false, exclusiveTo: null, incomeType: 'time',     ammoRequired: 'cash', spawnWeight: 2 },
    // optional purchases
    { id: 'lights',     emoji: '✨', label: 'Fairy Lights', price: 200, essential: false, exclusiveTo: null, incomeType: null, spawnWeight: 10 },
    { id: 'icecream',   emoji: '🍦', label: 'Ice Cream',    price: 250, essential: false, exclusiveTo: null, incomeType: null, spawnWeight: 10 },
    { id: 'photobooth', emoji: '📸', label: 'Photo Booth',  price: 300, essential: false, exclusiveTo: null, incomeType: null, spawnWeight: 10 },
  ],
  levels: [
    { id: 1, name: 'The Backyard', subtitle: 'First things first: book the garden.',
      required: ['venue'],
      optional: ['friend', 'lights', 'grandma', 'grandpa', 'slowdance'],
      money: 5000, priceScale: 0.15, itemSpeed: 1.5, rowAdvance: 45, gameDuration: 240,
      invites: 10, hearts: 4, hasMines: false },
    { id: 2, name: 'Sound Check', subtitle: 'No band, no dance floor.',
      required: ['venue', 'band'],
      optional: ['friend', 'lights', 'icecream', 'grandma', 'grandpa', 'planner', 'slowdance'],
      money: 3000, priceScale: 0.5, itemSpeed: 2.0, rowAdvance: 30, gameDuration: 150,
      invites: 10, hearts: 4, hasMines: false },
    { id: 3, name: 'Golden Hour', subtitle: 'Feed everyone before sunset. Mind the rain!',
      required: ['venue', 'band', 'tacos'],
      optional: ['friend', 'lights', 'icecream', 'photobooth', 'grandma', 'grandpa', 'planner', 'slowdance'],
      money: 2400, priceScale: 0.8, itemSpeed: 2.6, rowAdvance: 22, gameDuration: 100,
      invites: 10, hearts: 4, hasMines: true },
  ],
};
