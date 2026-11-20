// Test helpers (not a test file).
import type { TrackInput } from './tracks';

export function song(sourceId: string, extra: Partial<TrackInput> = {}): TrackInput {
  return {
    source: 'spotify',
    kind: 'track',
    link: `https://open.spotify.com/track/${sourceId}`,
    sourceId,
    title: `Song ${sourceId}`,
    artist: 'Artist',
    album: null,
    artworkUrl: null,
    durationMs: 200_000,
    liked: false,
    detailsFetched: true,
    ...extra,
  };
}
