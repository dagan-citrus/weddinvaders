import { WEDDING_ITEMS } from '../constants';
import { LEVELS }        from '../levels';
import brideImage  from '../assets/bride-nobg.png';
import groomImage  from '../assets/groom-nobg.png';
import coupleImage from '../assets/couple-nobg.png';

/**
 * The default (demo) event: the game exactly as it plays today.
 * `items` and `levels` are the game's own arrays, not copies, so there is a
 * single source of truth until the game itself reads from the event config.
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
  items:  WEDDING_ITEMS,
  levels: LEVELS,
};
