import { expect, test } from 'vitest';
import { openMigratedTestDb } from '../db/testDb';
import { activeLineIndex, parseLrc } from './lrc';
import { getLyrics } from './lrclib';

test('parses stamps, skips tags, repeats multi-stamp lines', () => {
  expect(parseLrc('[00:12.34]Hello\n[01:02.5]World')).toEqual([
    { timeMs: 12_340, line: 'Hello' },
    { timeMs: 62_500, line: 'World' },
  ]);
  expect(parseLrc('[ar:Coldplay]\n[00:01.00]A')).toEqual([{ timeMs: 1000, line: 'A' }]);
  expect(parseLrc('[00:05.00][00:01.00]Chorus').map((l) => l.timeMs)).toEqual([1000, 5000]);
});

test('active line', () => {
  const lines = parseLrc('[00:12.34]Hello\n[01:02.5]World');
  expect(activeLineIndex(lines, 12_339)).toBe(-1);
  expect(activeLineIndex(lines, 12_340)).toBe(0);
  expect(activeLineIndex(lines, 70_000)).toBe(1);
});

const q = { title: 'Yellow', artist: 'Coldplay', durationMs: 266_000 };

test('asks lrclib with duration and caches hits', async () => {
  const db = await openMigratedTestDb();
  const urls: string[] = [];
  const f = async (url: string) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ syncedLyrics: '[00:01.00]Look at the stars' }) };
  };
  const a = await getLyrics(db, q, f);
  expect(a).toEqual({ synced: true, lines: [{ timeMs: 1000, line: 'Look at the stars' }] });
  expect(urls[0]).toBe('https://lrclib.net/api/get?track_name=Yellow&artist_name=Coldplay&duration=266');
  await getLyrics(db, q, f);
  expect(urls).toHaveLength(1);
});

test('404 is cached for a week; errors are not cached', async () => {
  const db = await openMigratedTestDb();
  let calls = 0;
  const notFound = async () => (calls++, { ok: false, status: 404, json: async () => ({}) });
  expect(await getLyrics(db, q, notFound, 0)).toBeNull();
  expect(await getLyrics(db, q, notFound, 1000)).toBeNull();
  expect(calls).toBe(1);
  expect(await getLyrics(db, q, notFound, 8 * 24 * 3600 * 1000)).toBeNull();
  expect(calls).toBe(2);

  const db2 = await openMigratedTestDb();
  let tries = 0;
  const broken = async () => {
    tries++;
    throw new Error('offline');
  };
  expect(await getLyrics(db2, q, broken)).toBeNull();
  expect(await getLyrics(db2, q, broken)).toBeNull();
  expect(tries).toBe(2);
});

test('plain lyrics only', async () => {
  const db = await openMigratedTestDb();
  const f = async () => ({ ok: true, status: 200, json: async () => ({ syncedLyrics: null, plainLyrics: 'a\nb' }) });
  expect(await getLyrics(db, q, f)).toEqual({ synced: false, lines: ['a', 'b'] });
});
