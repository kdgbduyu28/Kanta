import { expect, test } from 'vitest';
import type { NowPlaying } from '../../modules/kanta-media/src/types';
import { positionNow } from './position';

const np = (state: NowPlaying['state'], durationMs = 200_000): NowPlaying => ({
  source: 'spotify',
  title: 'x',
  artist: 'y',
  album: null,
  durationMs,
  positionMs: 10_000,
  positionAt: 1_000,
  state,
  artworkUri: null,
  mediaId: null,
  format: null,
});

test('adds elapsed time only while playing', () => {
  expect(positionNow(np('playing'), 3_000)).toBe(12_000);
  expect(positionNow(np('paused'), 3_000)).toBe(10_000);
});

test('clamps to duration, unless unknown', () => {
  expect(positionNow(np('playing'), 999_999)).toBe(200_000);
  expect(positionNow(np('playing', 0), 999_999)).toBe(10_000 + 998_999);
});
