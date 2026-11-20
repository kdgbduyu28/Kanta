// Web preview only: the PDF's example songs, so screens can be checked in a browser.
import type { NowPlaying } from '../../modules/kanta-media/src/types';
import type { Play } from '../db/history';
import type { PlaylistSummary } from '../db/playlists';
import type { Track } from '../db/tracks';

const tr = (id: string, title: string, artist: string, source: Track['source'], album: string | null = null): Track => ({
  id,
  source,
  kind: 'track',
  link: '',
  sourceId: id,
  title,
  artist,
  album,
  artworkUrl: null,
  durationMs: 180_000 + (id.charCodeAt(0) % 7) * 20_000,
  liked: ['s1', 's3', 's6'].includes(id),
  addedAt: 1_700_000_000_000 - id.charCodeAt(1) * 1000,
  detailsFetched: true,
});

export const sampleTracks: Track[] = [
  tr('s1', 'Die With A Smile', 'Lady Gaga, Bruno Mars', 'spotify'),
  tr('s2', 'APT.', 'ROSÉ, Bruno Mars', 'ytmusic'),
  tr('s3', 'Beautiful Things', 'Benson Boone', 'applemusic'),
  tr('s4', 'greedy', 'Tate McRae', 'spotify'),
  tr('s5', 'Yellow', 'Coldplay', 'local', 'Parachutes'),
  tr('s6', 'Sunset Lover', 'Petit Biscuit', 'spotify'),
  tr('s7', 'Ocean Eyes', 'Billie Eilish', 'ytmusic'),
  tr('s8', 'The Night We Met', 'Lord Huron', 'applemusic'),
  tr('s9', 'Snooze', 'SZA', 'spotify'),
];

export const samplePlaylists: PlaylistSummary[] = [
  { id: 'p1', name: 'Chill Vibes', description: 'A laid-back mix for every moment', createdAt: 3, count: 4, durationMs: 18_720_000, covers: [] },
  { id: 'p2', name: 'My Playlist', description: null, createdAt: 2, count: 3, durationMs: 600_000, covers: [] },
  { id: 'p3', name: 'Workout Mix', description: null, createdAt: 1, count: 2, durationMs: 400_000, covers: [] },
];

export const samplePlaylistTracks: Record<string, string[]> = {
  p1: ['s6', 's7', 's8', 's9'],
  p2: ['s1', 's2', 's3'],
  p3: ['s4', 's5'],
};

export const samplePlays: Play[] = sampleTracks.slice(0, 6).map((t, i) => ({
  id: `pl${i}`,
  trackId: t.id,
  source: t.source,
  title: t.title,
  artist: t.artist,
  startedAt: 1_700_000_000_000 - i * 600_000,
  listenedMs: 150_000,
}));

export const sampleNowPlaying: NowPlaying = {
  source: 'spotify',
  title: 'Die With A Smile',
  artist: 'Lady Gaga & Bruno Mars',
  album: null,
  durationMs: 252_000,
  positionMs: 102_000,
  positionAt: Date.now(),
  state: 'paused',
  artworkUri: null,
  mediaId: null,
  format: null,
};
