import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { getInitialState, advanceLevel, stepGame, useGameState } from './useGameState';
import { defaultEvent as D } from './events/defaultEvent';
import { makeEvent } from './events/eventFixtures';
import { makeAltEvent, playing, flyingItem, bullet, deepFreeze } from './test/gameFixtures';
import { installFrameDriver } from './test/frameDriver';

const ALL_REQUIRED_LEVEL_5 = ['rings', 'officiant', 'catering', 'flowers', 'suit', 'cake'];
const NO_KEYS = new Set();

/** `Math.random` returns `values` in order, then 0 forever. */
function randomSeq(values = []) {
  const spy = vi.spyOn(Math, 'random');
  values.forEach((value) => spy.mockReturnValueOnce(value));
  spy.mockReturnValue(0);
}

/** One frame with no keys held. */
const step = (state, event, keys = NO_KEYS) => stepGame(state, event, keys);

/** Both players placed on the given rows (y is irrelevant to the rules under test). */
function playersAt(event, groomRow, brideRow) {
  const { players } = getInitialState(event);
  return {
    groom: { ...players.groom, row: groomRow },
    bride: { ...players.bride, row: brideRow },
  };
}

const incomeItem = (overrides) => flyingItem({
  price: 0, maxPrice: 0, essential: false, incomeType: 'income', ...overrides,
});

beforeEach(() => {
  randomSeq();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── getInitialState (R5) ─────────────────────────────────────────────────────

describe('getInitialState', () => {
  it('test_initial_default_level0', () => {
    expect(getInitialState(D)).toEqual({
      phase: 'title',
      currentLevel: 0,
      frame: 0,
      time: 300,
      money: 9900,
      ammo: { invite: 12, heart: 4 },
      discount: 1,
      lives: 3,
      players: {
        bride: { role: 'bride', x: 20, y: 485, row: 8, speed: 5, alive: true, selectedAmmo: 'cash' },
        groom: { role: 'groom', x: 718, y: 5, row: 0, speed: 5, alive: true, selectedAmmo: 'cash' },
      },
      bullets: [],
      items: [],
      acquiredItems: [],
      messages: [],
      score: 0,
      spawnTimer: 0,
      rowAdvanceTimer: 0,
      advanceAnim: 0,
      meetingTimer: 0,
      slowTimer: 0,
    });
  });

  it.each([
    [0, 300, 9900, 12, 4],
    [1, 150, 3000, 10, 4],
    [2, 110, 2500, 10, 4],
    [3, 95, 2000, 12, 5],
    [4, 80, 1800, 12, 5],
  ])('test_initial_default_each_level: index %i', (index, time, money, invite, heart) => {
    const state = getInitialState(D, index);

    expect(state.currentLevel).toBe(index);
    expect(state.time).toBe(time);
    expect(state.money).toBe(money);
    expect(state.ammo).toEqual({ invite, heart });
  });

  it('test_initial_clamps', () => {
    expect(getInitialState(D, 9).currentLevel).toBe(4);
    expect(getInitialState(makeAltEvent(), 9).currentLevel).toBe(1);
  });

  it('test_initial_alt', () => {
    const alt = makeAltEvent();

    expect(getInitialState(alt)).toMatchObject({ time: 60, money: 1000, ammo: { invite: 5, heart: 2 } });
    expect(getInitialState(alt, 1)).toMatchObject({ time: 30, money: 500, ammo: { invite: 3, heart: 1 } });
  });

  it('test_initial_fresh', () => {
    const first = getInitialState(D);
    const second = getInitialState(D);

    expect(first).not.toBe(second);
    expect(first.players).not.toBe(second.players);
    expect(first.items).not.toBe(second.items);
    expect(first.ammo).not.toBe(second.ammo);
  });
});

// ── advanceLevel (R9) ────────────────────────────────────────────────────────

describe('advanceLevel', () => {
  it('test_advance_default_next', () => {
    const state = { ...playing(D, 0), phase: 'meeting', meetingTimer: 80, score: 500 };
    const next = advanceLevel(state, D);

    expect(next).toEqual({ ...getInitialState(D, 1), phase: 'playing' });
    expect(next).toMatchObject({ currentLevel: 1, money: 3000, time: 150, score: 0 });
  });

  it('test_advance_default_last', () => {
    const state = { ...playing(D, 4), phase: 'meeting', score: 7 };

    expect(advanceLevel(state, D)).toEqual({ ...state, phase: 'gameComplete' });
  });

  it('test_advance_alt', () => {
    const alt = makeAltEvent();

    expect(advanceLevel(playing(alt, 0), alt)).toMatchObject({ currentLevel: 1, money: 500, phase: 'playing' });
    expect(advanceLevel(playing(alt, 1), alt)).toMatchObject({ currentLevel: 1, phase: 'gameComplete' });
  });

  it('test_advance_single_level_event', () => {
    const base = makeEvent();

    expect(advanceLevel(playing(base, 0), base).phase).toBe('gameComplete');
  });

  it('test_advance_pure', () => {
    const alt = deepFreeze(makeAltEvent());
    const state = deepFreeze(playing(alt, 0));

    expect(() => advanceLevel(state, alt)).not.toThrow();
    expect(() => advanceLevel(deepFreeze(playing(alt, 1)), alt)).not.toThrow();
  });
});

// ── stepGame (R7, R8) ────────────────────────────────────────────────────────

describe('stepGame: phases and timers', () => {
  it.each(['title', 'levelComplete', 'gameComplete', 'lost'])(
    'test_step_idle_phases: %s returns the same state object',
    (phase) => {
      const state = { ...playing(D), phase };

      expect(step(state, D)).toBe(state);
    },
  );

  it('test_step_meeting_ticks', () => {
    const next = step({ ...playing(D), phase: 'meeting', meetingTimer: 5 }, D);

    expect(next).toMatchObject({ meetingTimer: 6, phase: 'meeting', money: 9900 });
  });

  it('test_step_tick', () => {
    expect(step(playing(D), D)).toMatchObject({
      frame: 1, spawnTimer: 1, time: 300, phase: 'playing', items: [],
    });
  });

  it('test_step_second_boundary', () => {
    expect(step(playing(D, 0, { frame: 59 }), D)).toMatchObject({
      frame: 60, time: 299, rowAdvanceTimer: 1,
    });
  });

  it('test_step_speedup', () => {
    const next = step(playing(D, 0, { frame: 59, acquiredItems: ['rings'] }), D);

    expect(next.rowAdvanceTimer).toBe(2.5);
  });

  it('test_step_hourglass_halves', () => {
    const next = step(playing(D, 0, { frame: 59, acquiredItems: ['rings'], slowTimer: 10 }), D);

    expect(next).toMatchObject({ rowAdvanceTimer: 1.25, slowTimer: 9 });
  });

  it('test_step_row_advance_default', () => {
    const next = step(playing(D, 0, { frame: 59, rowAdvanceTimer: 59 }), D);

    expect(next.players.groom).toMatchObject({ row: 1, y: 65 });
    expect(next.players.bride).toMatchObject({ row: 7, y: 425 });
    expect(next).toMatchObject({ advanceAnim: 60, rowAdvanceTimer: 0, time: 299 });
  });

  it('test_step_row_advance_reads_event_level', () => {
    const alt = makeAltEvent();

    const onDefault = step(playing(D, 0, { frame: 59, rowAdvanceTimer: 19 }), D);
    expect(onDefault.players.groom.row).toBe(0);
    expect(onDefault.rowAdvanceTimer).toBe(20);

    const onAltLevel1 = step(playing(alt, 0, { frame: 59, rowAdvanceTimer: 19 }), alt);
    expect(onAltLevel1.players.groom.row).toBe(1);
    expect(onAltLevel1.rowAdvanceTimer).toBe(0);

    const onAltLevel2 = step(playing(alt, 1, { frame: 59, rowAdvanceTimer: 9 }), alt);
    expect(onAltLevel2.players.groom.row).toBe(1);
  });

  it('test_step_movement', () => {
    const next = step(playing(D), D, new Set(['ArrowLeft', 'KeyD']));

    expect(next.players.groom.x).toBe(713);
    expect(next.players.bride.x).toBe(25);
  });

  it('test_step_movement_clamped', () => {
    const state = playing(D);
    state.players.bride = { ...state.players.bride, x: 0 };

    expect(step(state, D, new Set(['KeyA'])).players.bride.x).toBe(0);
  });
});

describe('stepGame: spawning', () => {
  it('test_step_spawn_default_first', () => {
    const next = step(playing(D, 0, { spawnTimer: 89 }), D);

    expect(next.spawnTimer).toBe(0);
    expect(next.items).toEqual([{
      id: '', templateId: 'rings', label: 'Rings', emoji: '💍', price: 50, maxPrice: 50,
      essential: true, exclusiveTo: null, incomeType: null, incomeAmount: 0, discountPct: 0,
      ammoRequired: null, row: 1, x: 866.5, y: 62, vx: -1.5, flashTimer: 0,
    }]);
  });

  it('test_step_spawn_guest', () => {
    randomSeq([0.5, 0.9, 0.4, 0.5, 0.25]);
    const next = step(playing(D, 0, { spawnTimer: 89 }), D);

    expect(next.items).toEqual([expect.objectContaining({
      id: '9', templateId: 'guest', label: 'Guest', incomeType: 'income', incomeAmount: 200,
      ammoRequired: 'invite', price: 0, row: 4, x: -66.5, y: 242, vx: 1.5,
    })]);
  });

  it('test_step_spawn_family', () => {
    randomSeq([0.99, 0.2, 0.5, 0.99, 0.25]);
    const top = step(playing(D, 0, { spawnTimer: 89 }), D);

    expect(top.items).toEqual([expect.objectContaining({
      templateId: 'parent_bride', exclusiveTo: 'bride', ammoRequired: 'heart', incomeAmount: 500,
      row: 7, x: 866.5, y: 422, vx: -1.5,
    })]);

    vi.restoreAllMocks();
    randomSeq([0, 0, 0.5, 0, 0]);
    const bottom = step(playing(D, 0, { spawnTimer: 89 }), D);

    expect(bottom.items).toEqual([expect.objectContaining({
      templateId: 'parent_bride', incomeAmount: 300,
    })]);
  });

  it('test_step_spawn_skips_acquired', () => {
    const next = step(playing(D, 0, { spawnTimer: 89, acquiredItems: ['rings'] }), D);

    expect(next.items).toEqual([expect.objectContaining({ templateId: 'guest', incomeAmount: 100 })]);
  });

  it('test_step_spawn_mine_level4', () => {
    randomSeq([0, 0, 0.56, 0]);
    const next = step(playing(D, 3, { spawnTimer: 89 }), D);

    expect(next.items).toEqual([expect.objectContaining({
      templateId: 'mine', incomeType: 'mine', price: 0, x: 865, vx: -3,
    })]);
  });

  it('test_step_spawn_no_mine_level3', () => {
    randomSeq([0, 0, 0.56, 0]);
    const next = step(playing(D, 2, { spawnTimer: 89 }), D);

    expect(next.items).toEqual([expect.objectContaining({
      templateId: 'hourglass', price: 98, vx: -2.5,
    })]);
  });

  it('test_step_spawn_price_scale', () => {
    const next = step(playing(D, 4, { spawnTimer: 89 }), D);

    expect(next.items).toEqual([expect.objectContaining({
      templateId: 'rings', price: 600, maxPrice: 600, vx: -3.5,
    })]);
  });

  it('test_step_spawn_no_room', () => {
    const next = step(playing(D, 0, { spawnTimer: 89, players: playersAt(D, 3, 4) }), D);

    expect(next.items).toEqual([]);
    expect(next.spawnTimer).toBe(0);
  });

  it('test_step_spawn_cap', () => {
    const items = Array.from({ length: 8 }, (_, index) => flyingItem({ id: `i${index}` }));
    const next = step(playing(D, 0, { spawnTimer: 89, items }), D);

    expect(next.items).toHaveLength(8);
    expect(next.spawnTimer).toBe(90);
  });

  it.each([
    [0, { templateId: 'chuppah', price: 300 }],
    [0.3, { templateId: 'band', price: 200 }],
    [0.6, { templateId: 'friend', incomeAmount: 300 }],
    [0.9, { templateId: 'grandma', incomeAmount: 500 }],
    [0.999, { templateId: 'grandma' }],
  ])('test_step_spawn_alt: weighted roll %f', (roll, expected) => {
    const alt = makeAltEvent();
    randomSeq([0, 0, roll, 0.99, 0]);
    const next = step(playing(alt, 0, { spawnTimer: 89 }), alt);

    expect(next.items).toEqual([expect.objectContaining({ ...expected, x: 866, vx: -2 })]);
    expect(next.items[0].templateId).not.toBe('bomb');
  });

  it.each([
    [0, { templateId: 'chuppah', price: 150 }],
    [0.3, { templateId: 'band', price: 100 }],
    [0.6, { templateId: 'friend', incomeAmount: 300 }],
    [0.9, { templateId: 'bomb', incomeType: 'mine' }],
  ])('test_step_spawn_alt_level2: weighted roll %f', (roll, expected) => {
    const alt = makeAltEvent();
    randomSeq([0, 0, roll, 0.99, 0]);
    const next = step(playing(alt, 1, { spawnTimer: 89 }), alt);

    expect(next.items).toEqual([expect.objectContaining({ ...expected, x: 865, vx: -3 })]);
  });
});

describe('stepGame: hits', () => {
  it('test_step_buy', () => {
    const next = step(playing(D, 0, { items: [flyingItem()], bullets: [bullet()] }), D);

    expect(next).toMatchObject({
      acquiredItems: ['rings'], score: 500, items: [], bullets: [], money: 9900,
    });
    expect(next.messages).toEqual([expect.objectContaining({
      text: '+500pts', color: '#ffd700', x: 398.5, y: 62, timer: 90,
    })]);
  });

  it('test_step_partial_damage', () => {
    const catering = () => flyingItem({ templateId: 'catering', price: 520, maxPrice: 520 });

    const full = step(playing(D, 2, { items: [catering()], bullets: [bullet()] }), D);
    expect(full.items).toEqual([expect.objectContaining({ price: 420, flashTimer: 8 })]);
    expect(full).toMatchObject({ score: 0, acquiredItems: [] });

    const discounted = step(playing(D, 2, { items: [catering()], bullets: [bullet()], discount: 0.7 }), D);
    expect(discounted.items).toEqual([expect.objectContaining({ price: 450 })]);
  });

  it('test_step_mine', () => {
    const mine = flyingItem({ templateId: 'mine', price: 0, maxPrice: 0, essential: false, incomeType: 'mine' });
    const next = step(playing(D, 3, { items: [mine], bullets: [bullet()] }), D);

    expect(next).toMatchObject({ lives: 2, phase: 'playing', acquiredItems: ['mine'], score: 0 });
    expect(next.messages).toEqual([expect.objectContaining({ text: '💣 TRAP! −1 life', color: '#f44336' })]);
  });

  it('test_step_discount', () => {
    const organizer = (price) => flyingItem({
      templateId: 'discount', emoji: '🎀', price, maxPrice: 180, essential: false,
      incomeType: 'discount', discountPct: 0.3, ammoRequired: 'cash',
    });

    const bought = step(playing(D, 3, { items: [organizer(100)], bullets: [bullet()] }), D);
    expect(bought).toMatchObject({ discount: 0.7, acquiredItems: ['discount'] });
    expect(bought.messages).toEqual([expect.objectContaining({ text: '30% discount! 🎀', color: '#ff9800' })]);

    const damaged = step(playing(D, 3, { items: [organizer(180)], bullets: [bullet()] }), D);
    expect(damaged).toMatchObject({ discount: 1, acquiredItems: [] });
    expect(damaged.items).toEqual([expect.objectContaining({ price: 80 })]);
  });

  it('test_step_hourglass', () => {
    const hourglass = flyingItem({
      templateId: 'hourglass', price: 15, maxPrice: 15, essential: false,
      incomeType: 'time', ammoRequired: 'cash',
    });
    const next = step(playing(D, 0, { items: [hourglass], bullets: [bullet()] }), D);

    expect(next).toMatchObject({ slowTimer: 900, score: 0 });
    expect(next.messages).toEqual([expect.objectContaining({ text: '⏳ +15s reprieve!', color: '#64b5f6' })]);
  });

  it('test_step_guest_income', () => {
    const guest = incomeItem({ templateId: 'guest', incomeAmount: 200, ammoRequired: 'invite' });
    const next = step(playing(D, 0, { items: [guest], bullets: [bullet({ ammoType: 'invite' })] }), D);

    expect(next).toMatchObject({ money: 10100, acquiredItems: ['guest'] });
    expect(next.messages).toEqual([expect.objectContaining({
      text: '💌 Guest arrived! +$200', color: '#4caf50',
    })]);
  });

  it('test_step_family_income_default', () => {
    const family = incomeItem({
      templateId: 'parent_bride', exclusiveTo: 'bride', incomeAmount: 400, ammoRequired: 'heart',
    });
    const heart = bullet({ ammoType: 'heart', role: 'bride', vy: -8 });
    const next = step(playing(D, 0, { items: [family], bullets: [heart] }), D);

    expect(next.money).toBe(10300);
    expect(next.messages).toEqual([expect.objectContaining({ text: '💕 Family donated! +$400' })]);
  });

  it('test_step_family_keyed_on_heart', () => {
    const alt = makeAltEvent();
    const grandma = incomeItem({ templateId: 'grandma', incomeAmount: 500, ammoRequired: 'heart' });
    const next = step(playing(alt, 0, { items: [grandma], bullets: [bullet({ ammoType: 'heart' })] }), alt);

    expect(next).toMatchObject({ money: 1500, acquiredItems: ['grandma'] });
    expect(next.messages).toEqual([expect.objectContaining({ text: '💕 Family donated! +$500' })]);
  });

  it('test_step_guest_alt', () => {
    const alt = makeAltEvent();
    const friend = incomeItem({ templateId: 'friend', incomeAmount: 300, ammoRequired: 'invite' });
    const next = step(playing(alt, 0, { items: [friend], bullets: [bullet({ ammoType: 'invite' })] }), alt);

    expect(next.money).toBe(1300);
    expect(next.messages).toEqual([expect.objectContaining({ text: '💌 Guest arrived! +$300' })]);
  });

  it('test_step_mine_alt', () => {
    const alt = makeAltEvent();
    const bomb = flyingItem({ templateId: 'bomb', price: 0, maxPrice: 0, essential: false, incomeType: 'mine' });
    const next = step(playing(alt, 1, { items: [bomb], bullets: [bullet()] }), alt);

    expect(next.lives).toBe(2);
    expect(next.messages).toEqual([expect.objectContaining({ text: '💣 TRAP! −1 life' })]);
  });

  it('test_step_wrong_ammo', () => {
    const guest = incomeItem({ templateId: 'guest', incomeAmount: 200, ammoRequired: 'invite' });
    const next = step(playing(D, 0, { items: [guest], bullets: [bullet()] }), D);

    expect(next).toMatchObject({ money: 9900, acquiredItems: [], messages: [], bullets: [] });
    expect(next.items).toEqual([expect.objectContaining({ templateId: 'guest', flashTimer: 12 })]);
  });

  it('test_step_wrong_player', () => {
    const family = incomeItem({
      templateId: 'parent_bride', exclusiveTo: 'bride', incomeAmount: 400, ammoRequired: 'heart',
    });
    const next = step(playing(D, 0, { items: [family], bullets: [bullet({ ammoType: 'heart' })] }), D);

    expect(next.acquiredItems).toEqual([]);
    expect(next.items).toEqual([expect.objectContaining({ flashTimer: 12 })]);
  });
});

describe('stepGame: escapes and outcomes', () => {
  it('test_step_escape_essential', () => {
    const next = step(playing(D, 0, { items: [flyingItem({ x: -135 })] }), D);

    expect(next).toMatchObject({ lives: 2, items: [], phase: 'playing' });
  });

  it('test_step_escape_already_acquired', () => {
    const next = step(playing(D, 0, { items: [flyingItem({ x: -135 })], acquiredItems: ['rings'] }), D);

    expect(next.lives).toBe(3);
  });

  it('test_step_escape_non_essential', () => {
    const cake = flyingItem({ x: -135, essential: false, templateId: 'cake' });
    const next = step(playing(D, 0, { items: [cake] }), D);

    expect(next).toMatchObject({ lives: 3, items: [] });
  });

  it('test_step_timeout_level_complete', () => {
    const next = step(playing(D, 0, { time: 1, frame: 59, acquiredItems: ['rings'] }), D);

    expect(next).toMatchObject({ phase: 'levelComplete', time: 0, frame: 60 });
  });

  it('test_step_timeout_game_complete', () => {
    const next = step(playing(D, 4, { time: 1, frame: 59, acquiredItems: ALL_REQUIRED_LEVEL_5 }), D);

    expect(next.phase).toBe('gameComplete');
  });

  it('test_step_timeout_reads_event_length', () => {
    const alt = makeAltEvent();
    const base = makeEvent();
    const lastSecond = { time: 1, frame: 59 };

    expect(step(playing(alt, 0, { ...lastSecond, acquiredItems: ['chuppah'] }), alt).phase).toBe('levelComplete');
    expect(step(playing(alt, 1, { ...lastSecond, acquiredItems: ['chuppah', 'band'] }), alt).phase).toBe('gameComplete');
    expect(step(playing(base, 0, { ...lastSecond, acquiredItems: ['rings'] }), base).phase).toBe('gameComplete');
  });

  it('test_step_timeout_lost', () => {
    const alt = makeAltEvent();
    const lastSecond = { time: 1, frame: 59 };

    expect(step(playing(D, 0, lastSecond), D).phase).toBe('lost');
    expect(step(playing(D, 0, { ...lastSecond, acquiredItems: ['rings'], money: -100 }), D).phase).toBe('lost');
    expect(step(playing(alt, 1, { ...lastSecond, acquiredItems: ['chuppah'] }), alt).phase).toBe('lost');
  });

  it('test_step_no_lives', () => {
    expect(step(playing(D, 0, { lives: 0 }), D).phase).toBe('lost');
  });

  it('test_step_meet', () => {
    const met = playersAt(D, 4, 4);

    expect(step(playing(D, 0, { players: met, acquiredItems: ['rings'] }), D).phase).toBe('meeting');
    expect(step(playing(D, 0, { players: met, acquiredItems: [] }), D).phase).toBe('lost');
  });

  it('test_step_pure', () => {
    const event = deepFreeze(structuredClone(D));
    const build = () => playing(event, 0, { spawnTimer: 89, items: [flyingItem()], bullets: [bullet()] });
    const state = deepFreeze(build());
    const held = Object.freeze({ keys: new Set(['ArrowLeft']) });
    const eventBefore = structuredClone(event);

    expect(() => stepGame(state, event, held.keys)).not.toThrow();
    expect(state).toEqual(build());
    expect(event).toEqual(eventBefore);
    expect([...held.keys]).toEqual(['ArrowLeft']);
  });
});

// ── useGameState hook (R10) ──────────────────────────────────────────────────

describe('useGameState hook', () => {
  /** Mounts the hook on `event` with a manual frame driver and a running loop. */
  function mountHook(event) {
    const driver = installFrameDriver();
    const { result } = renderHook(({ event: current }) => useGameState(current), {
      initialProps: { event },
    });
    result.current.startLoop();
    return {
      driver,
      state: () => result.current.getState(),
      action: (action) => result.current.handleAction(action),
      api: () => result.current,
    };
  }

  const keyDown = (code, times = 1) => {
    for (let i = 0; i < times; i++) fireEvent.keyDown(window, { code });
  };

  const LEVEL_2_START = {
    phase: 'playing', currentLevel: 1, money: 3000, time: 150, ammo: { invite: 10, heart: 4 },
    score: 0, lives: 3, acquiredItems: [], frame: 0,
  };

  /** Plays default level 1 up to frame 79 of the meeting scene, asserting each step. */
  function playDefaultLevel1ToMeeting() {
    const game = mountHook(D);
    const { driver, state, action } = game;

    // 1. start, first item spawns
    keyDown('KeyX');
    driver.step(90);
    expect(state()).toMatchObject({ frame: 90, time: 299 });
    expect(state().items).toEqual([expect.objectContaining({
      templateId: 'rings', price: 50, row: 1, x: 866.5, vx: -1.5,
    })]);

    // 2. the item flies under the groom
    driver.step(76);
    expect(state().frame).toBe(166);
    expect(state().items[0].x).toBe(752.5);

    // 3. the groom shoots cash
    keyDown('Space');
    expect(state().money).toBe(9800);
    expect(state().bullets).toEqual([expect.objectContaining({
      x: 744, y: 55, vy: 8, ammoType: 'cash', role: 'groom',
    })]);

    // 4. the bullet buys the rings
    driver.step(1);
    expect(state()).toMatchObject({
      frame: 167, acquiredItems: ['rings'], score: 500, items: [], bullets: [],
    });
    expect(state().messages).toEqual([expect.objectContaining({ text: '+500pts', x: 751, y: 62 })]);

    // 5. fast-forward the rows until the couple meets
    keyDown('KeyN', 4);
    expect(state().players.groom.row).toBe(4);
    expect(state().players.bride.row).toBe(4);
    expect(state()).toMatchObject({ advanceAnim: 60, phase: 'playing' });

    // 6. meeting scene starts
    driver.step(1);
    expect(state()).toMatchObject({ phase: 'meeting', meetingTimer: 0, frame: 168 });

    // 7. too early to continue, by key or by action
    driver.step(79);
    keyDown('KeyX');
    action({ type: 'NEXT_LEVEL' });
    expect(state()).toMatchObject({ phase: 'meeting', meetingTimer: 79 });

    return game;
  }

  it('test_hook_initial_state', () => {
    expect(mountHook(D).state()).toEqual(getInitialState(D));

    vi.unstubAllGlobals();
    expect(mountHook(makeAltEvent()).state()).toMatchObject({ money: 1000, time: 60 });
  });

  it('test_hook_api_shape', () => {
    const api = mountHook(D).api();

    expect(Object.keys(api).sort()).toEqual(
      ['getState', 'handleAction', 'setRenderCallback', 'startLoop', 'stopLoop'],
    );
    for (const value of Object.values(api)) {
      expect(typeof value).toBe('function');
    }
  });

  it('test_hook_title_any_key', () => {
    const { state } = mountHook(D);
    expect(state().phase).toBe('title');

    keyDown('KeyX');

    expect(state().phase).toBe('playing');
  });

  it('test_hook_restart_uses_event', () => {
    const alt = makeAltEvent();
    const { state, action } = mountHook(alt);

    keyDown('KeyX');
    action({ type: 'RESTART' });

    expect(state()).toEqual({ ...getInitialState(alt, 0), phase: 'playing' });
  });

  it('test_hook_default_level1_playthrough', () => {
    const { driver, state } = playDefaultLevel1ToMeeting();

    // 8. after frame 80 of the meeting any key starts level 2
    driver.step(1);
    keyDown('KeyX');
    expect(state()).toMatchObject(LEVEL_2_START);
  });

  it('test_hook_next_level_action', () => {
    const { driver, state, action } = playDefaultLevel1ToMeeting();

    driver.step(1);
    action({ type: 'NEXT_LEVEL' });

    expect(state()).toMatchObject(LEVEL_2_START);
  });

  it('test_hook_key_n_needs_required', () => {
    const { state } = mountHook(D);

    keyDown('KeyX');
    keyDown('KeyN');

    expect(state().players.groom.row).toBe(0);
  });

  it('test_hook_single_level_event_playthrough', () => {
    const base = makeEvent();
    const { driver, state } = mountHook(base);

    // 1. start, first item spawns at this event's price and speed
    keyDown('KeyX');
    driver.step(90);
    expect(state().items).toEqual([expect.objectContaining({
      templateId: 'rings', price: 500, x: 866, vx: -2,
    })]);

    // 2. the item flies under the groom
    driver.step(56);
    expect(state().frame).toBe(146);
    expect(state().items[0].x).toBe(754);

    // 3. five cash shots
    keyDown('Space', 5);
    expect(state().money).toBe(500);
    expect(state().bullets).toHaveLength(5);

    // 4. they buy the rings
    driver.step(1);
    expect(state()).toMatchObject({ acquiredItems: ['rings'], score: 5000, items: [], bullets: [] });

    // 5. the couple meets
    keyDown('KeyN', 4);
    driver.step(1);
    expect(state().phase).toBe('meeting');

    // 6. the only level is the last one
    driver.step(80);
    keyDown('KeyX');
    expect(state()).toMatchObject({ phase: 'gameComplete', currentLevel: 0, score: 5000, money: 500 });

    // 7. back to this event's title
    keyDown('KeyX');
    expect(state()).toMatchObject({ phase: 'title', money: 1000, score: 0, time: 60 });
  });
});
