import { expect, test } from 'vitest';
import type { Db } from './db';
import { addToPlaylist, createPlaylist, getPlaylistTracks } from './playlists';
import { migrate } from './schema';
import { openMigratedTestDb } from './testDb';
import { song } from './fixtures';
import { deleteTrack, listTracks, setLiked, upsertTrack } from './tracks';

async function fresh(): Promise<Db> {
  return openMigratedTestDb();
}

test('migrate twice is a no-op', async () => {
  const db = await fresh();
  await migrate(db);
  const v = await db.get<{ version: number }>('SELECT version FROM schema_version');
  expect(v?.version).toBe(1);
  const rows = await db.all('SELECT * FROM schema_version');
  expect(rows).toHaveLength(1);
});

test('upsert keeps id and addedAt for the same source + sourceId', async () => {
  const db = await fresh();
  const a = await upsertTrack(db, song('x1'), 1000);
  const b = await upsertTrack(db, song('x1', { title: 'Renamed' }), 2000);
  expect(b.id).toBe(a.id);
  expect(b.addedAt).toBe(1000);
  expect(b.title).toBe('Renamed');
  expect(await listTracks(db)).toHaveLength(1);
});

test('upsert never un-likes a song', async () => {
  const db = await fresh();
  const a = await upsertTrack(db, song('x1', { liked: true }));
  const b = await upsertTrack(db, song('x1', { liked: false }));
  expect(b.id).toBe(a.id);
  expect(b.liked).toBe(true);
});

test('deleting a track closes the gap in playlists', async () => {
  const db = await fresh();
  const [a, b, c] = [await upsertTrack(db, song('a')), await upsertTrack(db, song('b')), await upsertTrack(db, song('c'))];
  const p = await createPlaylist(db, 'Mix');
  for (const t of [a, b, c]) await addToPlaylist(db, p.id, t.id);
  await deleteTrack(db, b.id);
  expect((await getPlaylistTracks(db, p.id)).map((t) => t.sourceId)).toEqual(['a', 'c']);
  const pos = await db.all<{ position: number }>('SELECT position FROM playlist_tracks ORDER BY position');
  expect(pos.map((r) => r.position)).toEqual([0, 1]);
});

test('liked filter and ordering', async () => {
  const db = await fresh();
  const a = await upsertTrack(db, song('a', { title: 'Zebra' }), 1);
  await upsertTrack(db, song('b', { title: 'apple' }), 2);
  await setLiked(db, a.id, true);
  expect((await listTracks(db, { liked: true })).map((t) => t.title)).toEqual(['Zebra']);
  expect((await listTracks(db, { orderBy: 'title' })).map((t) => t.title)).toEqual(['apple', 'Zebra']);
  expect((await listTracks(db)).map((t) => t.title)).toEqual(['apple', 'Zebra']); // newest first
});
