import { describe, it, expect } from 'vitest';
import { render } from './renderer';
import { getInitialState } from './useGameState';
import { defaultEvent as D } from './events/defaultEvent';
import { createRecordingContext } from './test/recordingContext';
import {
  makeAltEvent, playing, flyingItem, deepFreeze, NO_ASSETS,
  DEFAULT_TITLE_TEXTS, ALT_TITLE_TEXTS, DEFAULT_LEAK_STRINGS,
} from './test/gameFixtures';

const ALL_REQUIRED_LEVEL_5 = ['rings', 'officiant', 'catering', 'flowers', 'suit', 'cake'];
const ITEM_TEXTS_PER_INCOME_ITEM = 4; // emoji, label, amount, ammo hint
const HINT_OFFSET = 3;

/** Every string one `render` call draws, in draw order. */
function drawnTexts(state, event, assets = NO_ASSETS) {
  const recording = createRecordingContext();
  render(recording.ctx, state, assets, event);
  return recording.texts;
}

/** The HUD strings for two living players holding cash, with three lives. */
const HUD = (time, money, invites, hearts) => [
  '🤵', '💵', '👰', '💵', '❤️❤️❤️', time, money, `💌×${invites}  💕×${hearts}`, '👰 💵', '💵 🤵',
];
const PANEL_L1 = ['LEVEL 1', 'Save the Date', 'SCORE', '0', '💍', 'Rings', 'EXTRAS', '🎂', 'Cake'];
const PANEL_L1_DONE = ['LEVEL 1', 'Save the Date', 'SCORE', '0', '💍', 'Rings', '✓', 'EXTRAS', '🎂', 'Cake'];

const inPhase = (state, phase, extra = {}) => ({ ...state, phase, ...extra });

/** A state whose players are not drawn, so flying items are the first texts. */
function withHiddenPlayers(state) {
  return {
    ...state,
    players: {
      groom: { ...state.players.groom, alive: false },
      bride: { ...state.players.bride, alive: false },
    },
  };
}

const incomeItem = (row, overrides) => flyingItem({
  price: 0, maxPrice: 0, essential: false, incomeType: 'income', row, y: row * 60 + 2, ...overrides,
});

function expectNoDefaultLeak(texts) {
  for (const text of texts) {
    for (const leak of DEFAULT_LEAK_STRINGS) {
      expect(String(text)).not.toContain(leak);
    }
  }
}

/** The alternative-event states rendered by the cases below. */
function altStates(alt) {
  return {
    title: getInitialState(alt),
    'playing level 2': playing(alt, 1),
    lost: inPhase(playing(alt), 'lost'),
    levelComplete: inPhase(playing(alt, 0, { acquiredItems: ['chuppah'] }), 'levelComplete'),
    gameComplete: inPhase(playing(alt, 1, { acquiredItems: ['chuppah', 'band'] }), 'gameComplete'),
    'meeting, next level': inPhase(playing(alt, 0, { acquiredItems: ['chuppah'] }), 'meeting', { meetingTimer: 120 }),
    'meeting, final': inPhase(playing(alt, 1, { acquiredItems: ['chuppah', 'band'] }), 'meeting', { meetingTimer: 120 }),
  };
}

describe('render: title screen', () => {
  it('test_title_default', () => {
    expect(drawnTexts(getInitialState(D), D)).toEqual(DEFAULT_TITLE_TEXTS);
  });

  it('test_title_alt', () => {
    const alt = makeAltEvent();

    expect(drawnTexts(getInitialState(alt), alt)).toEqual(ALT_TITLE_TEXTS);
  });

  it('test_title_alt_no_default_leak', () => {
    const alt = makeAltEvent();
    const texts = drawnTexts(getInitialState(alt), alt);

    expect(texts.length).toBeGreaterThan(0);
    expectNoDefaultLeak(texts);
  });
});

describe('render: playing', () => {
  it('test_playing_default_level1', () => {
    expect(drawnTexts(playing(D), D)).toEqual([...HUD('5:00', '💰 $9900', 12, 4), ...PANEL_L1]);
  });

  it('test_playing_default_level4_truncates_name', () => {
    expect(drawnTexts(playing(D, 3), D)).toEqual([
      ...HUD('1:35', '💰 $2000', 12, 5),
      'LEVEL 4', 'The Full Wedd…', 'SCORE', '0',
      '💍', 'Rings', '⛪', 'Officiant', '🍽️', 'Catering', '💐', 'Flowers', '🤵', 'Suit',
      'EXTRAS', '🎂', 'Cake',
    ]);
  });

  it('test_playing_default_level5_no_extras', () => {
    expect(drawnTexts(playing(D, 4), D)).toEqual([
      ...HUD('1:20', '💰 $1800', 12, 5),
      'LEVEL 5', 'Dream Wedding', 'SCORE', '0',
      '💍', 'Rings', '⛪', 'Officiant', '🍽️', 'Catering', '💐', 'Flowers', '🤵', 'Suit', '🎂', 'Cake',
    ]);
  });

  it('test_playing_alt_level2', () => {
    const alt = makeAltEvent();

    expect(drawnTexts(playing(alt, 1), alt)).toEqual([
      ...HUD('0:30', '💰 $500', 3, 1),
      'LEVEL 2', 'Alt Two', 'SCORE', '0', '⛺', 'Chuppah', '🎺', 'Band',
    ]);
  });

  it('test_playing_item_and_score', () => {
    const withItem = playing(D, 0, { items: [flyingItem({ x: 866.5 })] });
    expect(drawnTexts(withItem, D)).toEqual([
      '💍', 'Rings', '$50', '⭐', ...HUD('5:00', '💰 $9900', 12, 4), ...PANEL_L1,
    ]);

    const bought = playing(D, 0, { acquiredItems: ['rings'], score: 500 });
    expect(drawnTexts(bought, D)).toEqual([
      ...HUD('5:00', '💰 $9900', 12, 4),
      'LEVEL 1', 'Save the Date', 'SCORE', '500', '💍', 'Rings', '✓', 'EXTRAS', '🎂', 'Cake',
    ]);
  });

  it('test_item_hint_default', () => {
    const parentGroom = D.items.find((item) => item.id === 'parent_groom');
    const state = withHiddenPlayers(playing(D, 3, {
      items: [
        incomeItem(1, { templateId: 'guest', label: 'Guest', emoji: '👥', incomeAmount: 200, ammoRequired: 'invite' }),
        incomeItem(2, { templateId: 'parent_groom', label: 'His Family', emoji: parentGroom.emoji, incomeAmount: 400, ammoRequired: 'heart' }),
        incomeItem(3, { templateId: 'mine', label: 'Trap', emoji: '💣', incomeType: 'mine' }),
      ],
    }));

    expect(drawnTexts(state, D).slice(0, 11)).toEqual([
      '👥', 'Guest', '+$200', '💌',
      parentGroom.emoji, 'His Family', '+$400', '💕',
      '💣', 'Trap', '⚡ DANGER',
    ]);
  });

  it('test_item_hint_by_required_ammo', () => {
    const alt = makeAltEvent();
    const requiredAmmo = ['heart', 'invite', null, 'cash'];
    const state = withHiddenPlayers(playing(alt, 0, {
      items: requiredAmmo.map((ammoRequired, index) => incomeItem(index + 1, {
        id: `i${index}`, templateId: 'friend', label: 'Friend', emoji: '🧑', incomeAmount: 100, ammoRequired,
      })),
    }));

    const texts = drawnTexts(state, alt);
    const hints = requiredAmmo.map((_, index) => texts[index * ITEM_TEXTS_PER_INCOME_ITEM + HINT_OFFSET]);

    expect(hints).toEqual(['💕', '💌', '💌', '💵']);
  });

  it('test_render_out_of_range_level_falls_back', () => {
    const state = { ...playing(D), currentLevel: 9 };
    let texts;

    expect(() => { texts = drawnTexts(state, D); }).not.toThrow();
    expect(texts).toContain('LEVEL 1');
  });
});

describe('render: lost', () => {
  it('test_lost_default_missing', () => {
    const state = inPhase(playing(D, 0, { time: 0 }), 'lost');

    expect(drawnTexts(state, D)).toEqual([
      ...HUD('0:00', '💰 $9900', 12, 4), ...PANEL_L1,
      '💔 Wedding Failed!', 'Still needed: 💍 Rings', 'Press R to try again',
      ...PANEL_L1,
    ]);
  });

  it('test_lost_default_two_missing', () => {
    const texts = drawnTexts(inPhase(playing(D, 2, { acquiredItems: ['rings'] }), 'lost'), D);
    const panel = [
      'LEVEL 3', 'The Reception', 'SCORE', '0',
      '💍', 'Rings', '✓', '⛪', 'Officiant', '🍽️', 'Catering',
      'EXTRAS', '🤵', 'Suit', '💐', 'Flowers', '🎂', 'Cake',
    ];

    expect(texts).toContain('Still needed: ⛪ Officiant  ·  🍽️ Catering');
    expect(texts.slice(-panel.length)).toEqual(panel);
  });

  it('test_lost_default_lives', () => {
    const texts = drawnTexts(inPhase(playing(D, 0, { lives: 0 }), 'lost'), D);

    expect(texts).toContain('❤️ Ran out of lives');
    expect(texts[4]).toBe('');
  });

  it('test_lost_default_money', () => {
    const texts = drawnTexts(inPhase(playing(D, 0, { money: -100, acquiredItems: ['rings'] }), 'lost'), D);

    expect(texts).toContain('💸 Ran out of money');
    expect(texts).toContain('💰 $-100');
  });

  it('test_lost_alt', () => {
    const alt = makeAltEvent();
    const texts = drawnTexts(altStates(alt).lost, alt);

    expect(texts).toContain('ALT LOST');
    expect(texts).toContain('Still needed: ⛺ Chuppah');
    expect(texts).not.toContain('💔 Wedding Failed!');
  });
});

describe('render: level and game complete', () => {
  it('test_level_complete_default', () => {
    const state = inPhase(playing(D, 0, { acquiredItems: ['rings'] }), 'levelComplete');

    expect(drawnTexts(state, D)).toEqual([
      ...HUD('5:00', '💰 $9900', 12, 4), ...PANEL_L1_DONE,
      '🎊 Level Complete! 🎊', 'Next: Lvl 2 — The Ceremony', 'Press any key to continue',
      ...PANEL_L1_DONE,
    ]);
  });

  it('test_level_complete_alt', () => {
    const alt = makeAltEvent();

    expect(drawnTexts(altStates(alt).levelComplete, alt)).toContain('Next: Lvl 2 — Alt Two');
  });

  it('test_game_complete_default', () => {
    const state = inPhase(playing(D, 4, { acquiredItems: ALL_REQUIRED_LEVEL_5, score: 500 }), 'gameComplete');
    const texts = drawnTexts(state, D);
    const headline = texts.indexOf("🎉 YOU'RE MARRIED! 🎉");

    expect(headline).toBeGreaterThan(-1);
    expect(texts[headline + 1]).toBe('Press any key to return to title');
  });

  it('test_game_complete_alt', () => {
    const alt = makeAltEvent();
    const texts = drawnTexts(altStates(alt).gameComplete, alt);

    expect(texts).toContain('ALT COMPLETE');
    expect(texts).not.toContain("🎉 YOU'RE MARRIED! 🎉");
  });
});

describe('render: meeting scene', () => {
  it('test_meeting_default_blink', () => {
    const state = inPhase(playing(D), 'meeting', { meetingTimer: 0 });

    expect(drawnTexts(state, D)).toEqual(['👰', '💵', '🤵', '💵', ...PANEL_L1]);
  });

  it('test_meeting_default_next_level', () => {
    const base = playing(D, 0, { acquiredItems: ['rings'], score: 500 });
    const panel = ['LEVEL 1', 'Save the Date', 'SCORE', '500', '💍', 'Rings', '✓', 'EXTRAS', '🎂', 'Cake'];

    expect(drawnTexts(inPhase(base, 'meeting', { meetingTimer: 120 }), D)).toEqual([
      '💒  Level Complete!  💒', 'Next: Level 2 — The Ceremony', '— Press any key to continue —', ...panel,
    ]);
    expect(drawnTexts(inPhase(base, 'meeting', { meetingTimer: 80 }), D)).toEqual([
      '💒  Level Complete!  💒', 'Next: Level 2 — The Ceremony', ...panel,
    ]);
  });

  it('test_meeting_default_final', () => {
    const state = inPhase(playing(D, 4, { acquiredItems: ALL_REQUIRED_LEVEL_5 }), 'meeting', { meetingTimer: 120 });

    expect(drawnTexts(state, D).slice(0, 2)).toEqual([
      '🎉  MARRIED!  🎉', '— Press any key to continue —',
    ]);
  });

  it('test_meeting_alt', () => {
    const alt = makeAltEvent();
    const states = altStates(alt);

    expect(drawnTexts(states['meeting, next level'], alt)[1]).toBe('Next: Level 2 — Alt Two');
    expect(drawnTexts(states['meeting, final'], alt)[0]).toBe('ALT FINAL');
  });
});

describe('render: isolation between events', () => {
  it.each(Object.keys(altStates(makeAltEvent())))('test_alt_phases_no_default_leak: %s', (name) => {
    const alt = makeAltEvent();
    const texts = drawnTexts(altStates(alt)[name], alt);

    expect(texts.length).toBeGreaterThan(0);
    expectNoDefaultLeak(texts);
  });
});

describe('render: images and purity', () => {
  const fakeImage = () => ({ complete: true, naturalWidth: 100, naturalHeight: 50 });

  it('test_sprites_use_assets', () => {
    const assets = { groom: fakeImage(), bride: fakeImage(), couple: fakeImage() };

    const playingFrame = createRecordingContext();
    render(playingFrame.ctx, playing(D), assets, D);
    expect(playingFrame.images).toHaveLength(2);
    expect(playingFrame.images[0]).toBe(assets.groom);
    expect(playingFrame.images[1]).toBe(assets.bride);

    const completeFrame = createRecordingContext();
    const complete = inPhase(playing(D, 4, { acquiredItems: ALL_REQUIRED_LEVEL_5, score: 500 }), 'gameComplete');
    render(completeFrame.ctx, complete, assets, D);
    expect(completeFrame.images.some((image) => image === assets.couple)).toBe(true);
  });

  it('test_render_pure', () => {
    const alt = deepFreeze(makeAltEvent());
    const states = altStates(alt);

    for (const state of Object.values(states)) {
      const frozen = deepFreeze(state);
      expect(() => drawnTexts(frozen, alt)).not.toThrow();
    }
  });
});
