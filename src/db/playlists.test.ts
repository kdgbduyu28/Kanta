import { expect, test } from 'vitest';
import { addToPlaylist, createPlaylist, getPlaylistTracks, listPlaylists, movePlaylistTrack, removeFromPlaylist } from './playlists';
import { getSetting, setSetting } from './settings';
import { openMigratedTestDb } from './testDb';
import { upsertTrack } from './tracks';
import { song } from './fixtures';

test('listPlaylists returns count, duration and up to four covers', async () => {
  const db = await openMigratedTestDb();
  const p = await createPlaylist(db, 'Chill Vibes');
  for (const id of ['a', 'b', 'c', 'd', 'e']) {
    const t = await upsertTrack(db, song(id, { artworkUrl: `https://img/${id}`, durationMs: 60_000 }));
    await addToPlaylist(db, p.id, t.id);
  }
  const [s] = await listPlaylists(db);
  expect(s.count).toBe(5);
  expect(s.durationMs).toBe(300_000);
  expect(s.covers).toEqual(['https://img/a', 'https://img/b', 'https://img/c', 'https://img/d']);
});

test('empty playlist has zero count and duration', async () => {
  const db = await openMigratedTestDb();
  await createPlaylist(db, 'Empty');
  const [s] = await listPlaylists(db);
  expect(s).toMatchObject({ count: 0, durationMs: 0, covers: [] });
});

test('move and remove', async () => {
  const db = await openMigratedTestDb();
  const p = await createPlaylist(db, 'Mix');
  for (const id of ['a', 'b', 'c']) await addToPlaylist(db, p.id, (await upsertTrack(db, song(id))).id);
  await movePlaylistTrack(db, p.id, 0, 2);
  expect((await getPlaylistTracks(db, p.id)).map((t) => t.sourceId)).toEqual(['b', 'c', 'a']);
  await removeFromPlaylist(db, p.id, 1);
  expect((await getPlaylistTracks(db, p.id)).map((t) => t.sourceId)).toEqual(['b', 'a']);
});

test('settings fallback and JSON round trip', async () => {
  const db = await openMigratedTestDb();
  expect(await getSetting(db, 'missing', 42)).toBe(42);
  await setSetting(db, 'audio', { eqEnabled: true, gains: [1, 2] });
  expect(await getSetting(db, 'audio', null)).toEqual({ eqEnabled: true, gains: [1, 2] });
  await setSetting(db, 'audio', { eqEnabled: false });
  expect(await getSetting(db, 'audio', null)).toEqual({ eqEnabled: false });
});
