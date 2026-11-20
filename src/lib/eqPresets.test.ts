import { expect, test } from 'vitest';
import { clampDb, EQ_FREQS_HZ, EQ_PRESETS, matchPreset } from './eqPresets';

test('bands match the design', () => {
  expect(EQ_FREQS_HZ).toEqual([60, 150, 400, 1000, 2400, 6000, 10000, 14000, 16000]);
});

test('presets exactly', () => {
  expect(EQ_PRESETS).toEqual({
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    pop: [-1, 1, 3, 4, 3, 1, 0, -1, -1],
    rock: [4, 3, -1, -2, -1, 2, 4, 5, 5],
    jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2],
    classical: [4, 3, 2, 0, -1, -1, 0, 2, 3],
    hiphop: [5, 4, 1, -1, -1, 1, 0, 2, 3],
    edm: [5, 4, 0, -2, 0, 2, 3, 4, 4],
  });
});

test('clamp and match', () => {
  expect(clampDb(15)).toBe(12);
  expect(clampDb(-20)).toBe(-12);
  expect(matchPreset([...EQ_PRESETS.rock])).toBe('rock');
  expect(matchPreset([1, 1, 1, 1, 1, 1, 1, 1, 1], [{ name: 'Mine', gainsDb: [1, 1, 1, 1, 1, 1, 1, 1, 1] }])).toBe('custom:Mine');
  expect(matchPreset([1, 0, 0, 0, 0, 0, 0, 0, 0])).toBeNull();
});
