import { describe, it, expect } from 'vitest';
import { fillTemplate, deepFreeze } from './format.js';

describe('content format helpers', () => {
  it('test_fill_replaces', () => {
    expect(fillTemplate('© {year} {name}.', { year: 2026, name: 'X' })).toBe('© 2026 X.');
  });

  it('test_fill_repeated_and_unknown', () => {
    expect(fillTemplate('{a}{a}{b}', { a: 1 })).toBe('11{b}');
  });

  it('test_fill_repeated_and_unknown: only own keys are tokens', () => {
    expect(fillTemplate('{toString} {a}', { a: 'x' })).toBe('{toString} x');
  });

  it('test_deep_freeze', () => {
    const value = { list: [{ deep: { leaf: 'x' } }], nested: { items: ['a'] } };

    const result = deepFreeze(value);

    expect(result).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.list)).toBe(true);
    expect(Object.isFrozen(value.list[0])).toBe(true);
    expect(Object.isFrozen(value.list[0].deep)).toBe(true);
    expect(Object.isFrozen(value.nested)).toBe(true);
    expect(Object.isFrozen(value.nested.items)).toBe(true);
  });
});
