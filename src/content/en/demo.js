import { deepFreeze } from '../format.js';

/** Copy of the demo page. */
export const demo = deepFreeze({
  heading: 'Play the demo',
  intro: 'This is the real game, not a video. Grab a partner, pick a sample, then press any key or tap the game to start.',
  switcher: {
    ariaLabel: 'Sample games',
    samples: [
      { id: 'classic', label: 'Classic wedding',
        summary: 'The classic wedding: Bride and Groom, five levels, from the rings to the full dream wedding.' },
      { id: 'garden', label: "Maya & Noah's garden party",
        summary: 'A customized sample: Maya and Noah, a three-level garden party with its own shopping list.' },
    ],
  },
  photoNote: 'Both samples use the same stand-in artwork. In your game, those pictures are replaced with photos of you.',
  ownPage: {
    link: 'Open this sample on its own page',
    hint: 'That is how your guests see your game: no menus, just the game.',
  },
  controls: {
    heading: 'How to play',
    groups: [
      { id: 'keyboard', title: 'On a keyboard', items: [
        'Bride: A and D to move, S to change ammo, W to shoot.',
        'Groom: left and right arrows to move, up and down arrows to change ammo, Space to shoot.',
        'Once everything on the list is bought, press N to fast-forward.',
      ] },
      { id: 'touch', title: 'On a touchscreen', items: [
        'Tap the game to start, and to continue after each level.',
        'Each player has three ammo buttons and a SHOOT button under the game.',
        'Players do not move sideways on a touchscreen, so shoot as an item flies past.',
      ] },
    ],
    ammoNote: 'Cash buys items. Invites bring guests who pay you. Hearts make family chip in.',
  },
  differences: {
    heading: 'What changes between the samples',
    items: [
      { id: 'names', title: 'Names',
        body: 'The classic sample calls its players Bride and Groom. The garden party is played by Maya and Noah, and their names are on the title screen and next to the controls.' },
      { id: 'messages', title: 'Title and messages',
        body: "The title screen reads WEDDIN'VADERS in one and MAYA & NOAH in the other. The tagline and the win and lose messages change too." },
      { id: 'items', title: 'The shopping list',
        body: 'Rings, an officiant and catering become a garden, a band and a taco bar. The traps turn into rain, and the extras are fairy lights, ice cream and a photo booth.' },
      { id: 'levels', title: 'Levels',
        body: 'The classic game has five levels. The garden party has three, with its own names, budgets and pace.' },
      { id: 'photos', title: 'Photos',
        body: 'Not changed here: both samples share the same stand-in artwork. Your game uses your own photos.' },
    ],
  },
  cta: {
    heading: 'Want one with your names on it?',
    body: 'We build each game by hand: your names, your photos, your own shopping list and levels, at your own web address.',
    primaryCta: 'Get your game',
    secondaryCta: 'See what you can customize',
  },
});
