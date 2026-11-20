import { expect, test } from 'vitest';
import { normalizeArtist, normalizeTitle } from './normalize';

test('titles that are the same song', () => {
  for (const s of ['Yellow', 'Yellow - Remastered 2021', 'Yellow (Official Audio)', 'YELLOW', 'Yellow [Official Video]']) {
    expect(normalizeTitle(s)).toBe('yellow');
  }
  expect(normalizeTitle('Fix You')).not.toBe('yellow');
});

test('artist variants', () => {
  for (const s of ['Coldplay', 'Coldplay - Topic', 'Coldplay, Someone', 'ColdplayVEVO', 'Coldplay feat. X']) {
    expect(normalizeArtist(s)).toBe('coldplay');
  }
  expect(normalizeArtist('Beyoncé')).toBe('beyonce');
});
