import { expect, test } from 'vitest';
import { clearHistory, insertPlay, listeningMs, mostPlayed, recentPlays } from '../db/history';
import { openMigratedTestDb } from '../db/testDb';
import { compactCount, formatClock, formatHours, formatLong } from './stats';

const play = (title: string, startedAt: number, trackId: string | null = null, listenedMs = 60_000) => ({
  trackId,
  source: 'spotify' as const,
  title,
  artist: 'Coldplay',
  startedAt,
  listenedMs,
});

test('recent plays dedupe consecutive repeats', async () => {
  const db = await openMigratedTestDb();
  await insertPlay(db, play('Yellow', 1));
  await insertPlay(db, play('Yellow', 2));
  await insertPlay(db, play('Fix You', 3));
  await insertPlay(db, play('Yellow', 4));
  expect((await recentPlays(db, 10)).map((p) => p.title)).toEqual(['Yellow', 'Fix You', 'Yellow']);
});

test('most played groups by track id, else title|artist', async () => {
  const db = await openMigratedTestDb();
  await insertPlay(db, play('Yellow', 1, 't1'));
  await insertPlay(db, play('Yellow (Live)', 2, 't1'));
  await insertPlay(db, play('Fix You', 3));
  await insertPlay(db, play('fix you', 4));
  await insertPlay(db, play('Clocks', 5));
  const top = await mostPlayed(db, { limit: 5 });
  expect(top.map((p) => p.count)).toEqual([2, 2, 1]);
  expect(top[2].title).toBe('Clocks');
  expect(await mostPlayed(db, { sinceMs: 5, limit: 5 })).toHaveLength(1);
});

test('listening time and clearing', async () => {
  const db = await openMigratedTestDb();
  await insertPlay(db, play('A', 1, null, 30_000));
  await insertPlay(db, play('B', 2, null, 90_000));
  expect(await listeningMs(db)).toBe(120_000);
  expect(await listeningMs(db, 2)).toBe(90_000);
  await clearHistory(db);
  expect(await listeningMs(db)).toBe(0);
});

test('formatting', () => {
  expect(formatHours(43_200_000)).toBe('12h');
  expect(formatHours(2_700_000)).toBe('45m');
  expect(formatHours(5_400_000)).toBe('1h 30m');
  expect(formatClock(266_000)).toBe('4:26');
  expect(formatClock(102_000)).toBe('1:42');
  expect(formatLong(18_720_000)).toBe('5 hr 12 min');
  expect(compactCount(1248)).toBe('1.2K');
  expect(compactCount(24)).toBe('24');
});
