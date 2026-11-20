import { afterEach, expect, test } from 'vitest';
import { setLang, t } from './index';

afterEach(() => setLang('en'));

test('english passes text through', () => {
  expect(t('Home')).toBe('Home');
});

test('filipino translates known strings', () => {
  setLang('fil');
  expect(t('Your Library')).toBe('Iyong Library');
});

test('unknown text falls back to english', () => {
  setLang('fil');
  expect(t('Some brand new label')).toBe('Some brand new label');
});

test('numbers fill {n} entries', () => {
  setLang('fil');
  expect(t('{n} songs', { n: 87 })).toBe('87 kanta');
  expect(t('87 songs')).toBe('87 kanta');
});
