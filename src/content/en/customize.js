// Copy for the customization page. "Before" values are not here: the page reads them
// from the default event so they cannot drift from the game.
import { deepFreeze } from '../format.js';

export const customize = deepFreeze({
  intro: {
    headline: 'Your wedding, not just any wedding.',
    body: 'Every game is put together by hand for one couple. This is everything we can change today, shown next to what the standard game has.',
  },
  pairLabels: { before: 'Standard game', after: 'Example' },
  options: [
    { id: 'names', title: 'Names and web address',
      body: 'Your names label the two players on the title screen and in the controls legend, and appear in the browser tab. Your game also gets its own address made from your names.',
      fields: [{ id: 'bride', label: 'Bride' }, { id: 'groom', label: 'Groom' }, { id: 'address', label: 'Address' }],
      example: { bride: 'Shelly', groom: 'Dan', slug: 'DanAndShelly' } },
    { id: 'photos', title: 'Photos',
      body: 'Three pictures go into the game: one of each of you as your player, and one of you together that appears every time the two players meet.',
      fields: [
        { id: 'bride', label: 'Bride player', alt: 'The standard bride picture' },
        { id: 'groom', label: 'Groom player', alt: 'The standard groom picture' },
        { id: 'couple', label: 'Meeting picture', alt: 'The standard couple picture' },
      ],
      slotText: 'Your photo' },
    { id: 'messages', title: 'Messages',
      body: 'Five lines of text are yours to write: the title, the tagline under it, and the headlines for clearing the last level, finishing the game and losing.',
      fields: [
        { id: 'title', label: 'Title' }, { id: 'tagline', label: 'Tagline' },
        { id: 'finalMeeting', label: 'Last level cleared' },
        { id: 'gameComplete', label: 'Game finished' }, { id: 'lost', label: 'Game lost' },
      ],
      example: { title: 'DAN & SHELLY', tagline: 'Help us pay for the big day!',
        finalMeeting: '🎉  JUST MARRIED!  🎉', gameComplete: '🎉 MARRIED AT LAST! 🎉', lost: '💔 Back to the budget!' } },
    { id: 'items', title: 'Items',
      body: 'Every flying item has an emoji, a short label and a base price. We can swap any of them or add new ones. An item can be reserved for one player, or behave like the special ones: guests and family who bring money, a discount, extra time or a trap.',
      priceTemplate: 'Base price ${price}',
      examples: [
        { id: 'cake', emoji: '🧁', label: 'Cupcakes', price: 300 },
        { id: 'catering', emoji: '🌮', label: 'Taco Truck', price: 600 },
        { id: 'flowers', emoji: '🌵', label: 'Cactus', price: 150 },
      ] },
    { id: 'levels', title: 'Levels',
      body: 'Each level has a name, a subtitle, a list of what must be bought and what else may fly by, and its own balance: starting budget, prices, speed, time limit, invites, hearts and whether traps appear. We can rename the five standard levels, rebalance them or build a different set.',
      fields: [
        { id: 'name', label: 'Name' }, { id: 'subtitle', label: 'Subtitle' }, { id: 'required', label: 'Must buy' },
        { id: 'money', label: 'Starting budget' }, { id: 'gameDuration', label: 'Time limit' },
      ],
      moneyTemplate: '${amount}', durationTemplate: '{seconds} seconds',
      example: { levelId: 1, name: 'The Proposal', subtitle: 'She said yes. Now find a ring!',
        required: ['rings', 'cake'], money: 5000, gameDuration: 180 } },
  ],
  fixed: {
    heading: 'What stays the same',
    body: 'Better to say it now than after you order. These parts are the same in every game today.',
    items: [
      { id: 'theme', title: 'Look and colours', body: 'The arcade screen, its colours and its fonts are fixed.' },
      { id: 'sound', title: 'Music and sound', body: 'The game is silent. There is no music or sound to change.' },
      { id: 'language', title: 'Language', body: "The game's own text (controls, hints and pop-ups) is in English." },
      { id: 'controls', title: 'Controls and rules', body: 'The keys, the touch buttons and the way the game plays are the same for everyone.' },
    ],
    note: 'Is one of these important to you? Tell us when you order. We cannot promise it, but we want to know.',
  },
  cta: {
    heading: 'See it, then make it yours',
    body: 'Play the standard game first, then tell us what you want changed.',
    primaryCta: 'Try the demo',
    secondaryCta: 'Get your game',
  },
});
