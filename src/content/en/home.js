import { deepFreeze } from '../format.js';

/** Copy of the landing page. */
export const home = deepFreeze({
  hero: {
    headline: 'Your wedding, as a two-player arcade game.',
    subhead: 'The bride and groom team up to buy their wedding, one shot at a time: rings, catering, cake and all. We build a version with your names, your photos and your own web address.',
    primaryCta: 'Try the demo',
    secondaryCta: 'Get your game',
    facts: ['Two players, one team', 'Five levels', 'Keyboard or touchscreen', 'Plays in the browser'],
    previewLabel: 'Illustration of the game: the groom at the top and the bride at the bottom of an arcade screen, with wedding items flying between them.',
    previewCaption: 'An illustration. The demo is the real game.',
  },
  pitch: {
    heading: 'A wedding you have to earn',
    features: [
      {
        id: 'coop',
        title: 'Two players, one team',
        body: 'The groom starts at the top, the bride at the bottom. They move toward each other row by row, and they win by meeting in the middle with everything on the list bought.',
      },
      {
        id: 'budget',
        title: 'A budget to survive',
        body: 'Shoot cash to pay for the rings, the catering and the cake. Send invites so guests bring gifts, and hearts so family chips in. Watch out for traps.',
      },
      {
        id: 'yours',
        title: 'Made about you',
        body: 'Your names, your photos, your own items, levels and messages. Every game we make is built for one couple.',
      },
    ],
  },
  steps: {
    heading: 'Three steps to your own game',
    items: [
      {
        id: 'play',
        title: '1. Play the demo',
        body: 'Grab a partner and try it. Five levels, two players, on one keyboard or one touchscreen.',
      },
      {
        id: 'tell',
        title: '2. Tell us about your wedding',
        body: 'Send us your names, your photos and anything you want changed. We put your game together by hand.',
      },
      {
        id: 'share',
        title: '3. Share your link',
        body: 'Your game gets its own address, like {host}/YourNames. Send it to your guests or put it on a screen at the party.',
      },
    ],
  },
  cta: {
    heading: 'Ready to play your wedding?',
    body: 'Try the demo first, or tell us about your day and we will take it from there.',
    primaryCta: 'Try the demo',
    secondaryCta: 'Get your game',
  },
});
