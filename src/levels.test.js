import { describe, it, expect } from 'vitest';
import { getSpawnPool, isLevelComplete } from './levels';
import { defaultEvent as D } from './events/defaultEvent';
import { validateEvent } from './events/eventConfig';
import { makeAltEvent, deepFreeze } from './test/gameFixtures';

const ids = (items) => items.map((item) => item.id);

const LEVEL_4_AND_5_POOL = [
  'rings', 'officiant', 'catering', 'guest', 'parent_bride', 'parent_groom',
  'discount', 'mine', 'hourglass', 'flowers', 'suit', 'cake',
];

describe('fixtures', () => {
  it('test_alt_event_valid: the alternative fixture event is a valid event config', () => {
    expect(validateEvent(makeAltEvent())).toEqual([]);
  });
});

describe('levels module', () => {
  it('test_levels_module_exports', async () => {
    const levelsModule = await import('./levels');
    expect(Object.keys(levelsModule).sort()).toEqual(['getSpawnPool', 'isLevelComplete']);
  });
});

describe('getSpawnPool', () => {
  it.each([
    [1, ['rings', 'guest', 'parent_bride', 'parent_groom', 'hourglass', 'cake']],
    [2, ['rings', 'officiant', 'guest', 'parent_bride', 'parent_groom', 'hourglass', 'flowers', 'suit']],
    [3, ['rings', 'officiant', 'catering', 'guest', 'parent_bride', 'parent_groom', 'hourglass', 'flowers', 'suit', 'cake']],
    [4, LEVEL_4_AND_5_POOL],
    [5, LEVEL_4_AND_5_POOL],
  ])('test_spawn_pool_default: default level %i', (levelNumber, expectedIds) => {
    expect(ids(getSpawnPool(D.levels[levelNumber - 1], D.items))).toEqual(expectedIds);
  });

  it('test_spawn_pool_same_objects', () => {
    const alt = makeAltEvent();
    const pool = getSpawnPool(alt.levels[1], alt.items);

    expect(pool).toHaveLength(4);
    for (const item of pool) {
      expect(alt.items.some((candidate) => candidate === item)).toBe(true);
    }
  });

  it('test_spawn_pool_mine_by_type', () => {
    const alt = makeAltEvent();
    expect(ids(getSpawnPool(alt.levels[1], alt.items))).toEqual(['chuppah', 'band', 'friend', 'bomb']);
  });

  it('test_spawn_pool_no_mines_when_disabled', () => {
    const alt = makeAltEvent();
    expect(ids(getSpawnPool(alt.levels[0], alt.items))).toEqual(['chuppah', 'band', 'friend', 'grandma']);
  });

  it('test_spawn_pool_uses_given_items', () => {
    expect(getSpawnPool(D.levels[0], makeAltEvent().items)).toEqual([]);
  });

  it('test_spawn_pool_pure', () => {
    const alt = deepFreeze(makeAltEvent());
    const itemCount = alt.items.length;

    expect(() => getSpawnPool(alt.levels[1], alt.items)).not.toThrow();
    expect(alt.items).toHaveLength(itemCount);
  });
});

describe('isLevelComplete', () => {
  it('test_is_level_complete', () => {
    const level = D.levels[1];

    expect(isLevelComplete(level, [])).toBe(false);
    expect(isLevelComplete(level, ['rings'])).toBe(false);
    expect(isLevelComplete(level, ['officiant', 'cake', 'rings'])).toBe(true);
  });
});
