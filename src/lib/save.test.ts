import { expect, test } from 'vitest';
import type { NowPlaying } from '../../modules/kanta-media/src/types';
import { addToPlaylist, createPlaylist, getPlaylistTracks } from '../db/playlists';
import { openMigratedTestDb } from '../db/testDb';
import { listTracks } from '../db/tracks';
import { refreshMissingDetails, saveFromText, saveNowPlaying, syncLocalLibrary } from './save';

const offline = async () => {
  throw new Error('offline');
};
const online = async () => ({
  ok: true,
  status: 200,
  text: async () => '<meta property="og:title" content="Yellow"><meta property="og:description" content="Coldplay · Parachutes · Song · 2000">',
});

test('offline share saves a placeholder, refresh fills it later', async () => {
  const db = await openMigratedTestDb();
  const t = await saveFromText(db, 'Check this https://open.spotify.com/track/abc?si=1', offline);
  expect(t).toMatchObject({ title: 'Spotify song', detailsFetched: false, liked: false });
  expect(await refreshMissingDetails(db, online)).toBe(1);
  expect((await listTracks(db))[0]).toMatchObject({ title: 'Yellow', artist: 'Coldplay', detailsFetched: true });
});

test('no link → null; same song twice → one row', async () => {
  const db = await openMigratedTestDb();
  expect(await saveFromText(db, 'hello', online)).toBeNull();
  await saveFromText(db, 'https://open.spotify.com/track/abc', online);
  await saveFromText(db, 'https://open.spotify.com/intl-fil/track/abc?si=zzz', online);
  expect(await listTracks(db)).toHaveLength(1);
});

const np = (extra: Partial<NowPlaying> = {}): NowPlaying => ({
  source: 'spotify',
  title: 'Yellow',
  artist: 'Coldplay',
  album: 'Parachutes',
  durationMs: 266_000,
  positionMs: 0,
  positionAt: 0,
  state: 'playing',
  artworkUri: null,
  mediaId: null,
  format: null,
  ...extra,
});

test('heart with a media id saves a playable, liked song', async () => {
  const db = await openMigratedTestDb();
  const t = await saveNowPlaying(db, np({ mediaId: 'spotify:track:abc' }));
  expect(t).toMatchObject({ link: 'https://open.spotify.com/track/abc', sourceId: 'abc', liked: true });
});

test('heart without a media id saves without a link', async () => {
  const db = await openMigratedTestDb();
  const t = await saveNowPlaying(db, np({ source: 'applemusic' }));
  expect(t).toMatchObject({ link: '', liked: true });
});

test('local sync removes vanished files from playlists', async () => {
  const db = await openMigratedTestDb();
  const file = (id: string) => ({
    uri: `content://media/external/audio/media/${id}`,
    mediaStoreId: id,
    title: `T${id}`,
    artist: 'A',
    album: 'B',
    durationMs: 1000,
    artworkUri: null,
    format: 'FLAC',
  });
  expect(await syncLocalLibrary(db, [file('1'), file('2')])).toEqual({ added: 2, removed: 0 });
  const p = await createPlaylist(db, 'Mix');
  for (const t of await listTracks(db)) await addToPlaylist(db, p.id, t.id);
  expect(await syncLocalLibrary(db, [file('1')])).toEqual({ added: 0, removed: 1 });
  expect((await getPlaylistTracks(db, p.id)).map((t) => t.sourceId)).toEqual(['1']);
});
