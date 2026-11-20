import { expect, test } from 'vitest';
import { song } from '../db/fixtures';
import { openMigratedTestDb } from '../db/testDb';
import { upsertTrack } from '../db/tracks';
import { searchLibrary } from './search';
import { homeSections, libraryEmptyState } from './sections';

test('search is case and accent insensitive across fields', async () => {
  const db = await openMigratedTestDb();
  await upsertTrack(db, song('a', { title: 'Halo', artist: 'Beyoncé', album: 'I Am... Sasha Fierce' }));
  await upsertTrack(db, song('b', { title: 'Yellow', artist: 'Coldplay', album: 'Parachutes' }));
  const r = await searchLibrary(db, 'beyonce', 'all');
  expect(r.map((x) => x.kind)).toEqual(['artist', 'song']);
  expect((await searchLibrary(db, 'PARACH', 'songs')).map((x) => x.kind === 'song' && x.track.title)).toEqual(['Yellow']);
  expect(await searchLibrary(db, 'parach', 'albums')).toEqual([{ kind: 'album', album: 'Parachutes', artist: 'Coldplay', artworkUrl: null }]);
  expect(await searchLibrary(db, '   ', 'all')).toEqual([]);
});

test('home with nothing shows get started', () => {
  expect(homeSections({ recent: [], sourcesWithSongs: [], hasLocalFiles: false })).toEqual([{ kind: 'getStarted' }]);
});

test('home with history lists recent first and only sources with songs', () => {
  const recent = [{ id: '1', trackId: null, source: 'spotify' as const, title: 'Yellow', artist: 'Coldplay', startedAt: 1, listenedMs: 1 }];
  expect(homeSections({ recent, sourcesWithSongs: ['ytmusic'], hasLocalFiles: true })).toEqual([
    { kind: 'recent', plays: recent },
    { kind: 'browse', sources: ['ytmusic', 'local'] },
  ]);
});

test('library empty states', () => {
  expect(libraryEmptyState('playlists', { playlists: 0 })).toMatchObject({ action: 'newPlaylist' });
  expect(libraryEmptyState('songs', {})).toMatchObject({ action: 'sources' });
  expect(libraryEmptyState('songs', { songs: 3 })).toBeNull();
});
