import type { Db } from '../db/db';
import { listTracks, type Track } from '../db/tracks';
import { stripAccents } from './normalize';

export type SearchFilter = 'all' | 'songs' | 'artists' | 'albums';

export type SearchResult =
  | { kind: 'song'; track: Track }
  | { kind: 'artist'; artist: string; count: number; artworkUrl: string | null }
  | { kind: 'album'; album: string; artist: string; artworkUrl: string | null };

const fold = (s: string) => stripAccents(s).toLowerCase();

/** Searches the Kanta library: case- and accent-insensitive, over title, artist and album. */
export async function searchLibrary(db: Db, q: string, filter: SearchFilter): Promise<SearchResult[]> {
  const needle = fold(q.trim());
  if (!needle) return [];
  const tracks = await listTracks(db, { orderBy: 'title' });
  const out: SearchResult[] = [];

  if (filter === 'all' || filter === 'artists') {
    const artists = new Map<string, { count: number; artworkUrl: string | null }>();
    for (const t of tracks) {
      if (!t.artist || !fold(t.artist).includes(needle)) continue;
      const a = artists.get(t.artist) ?? { count: 0, artworkUrl: null };
      a.count++;
      a.artworkUrl ??= t.artworkUrl;
      artists.set(t.artist, a);
    }
    for (const [artist, a] of artists) out.push({ kind: 'artist', artist, ...a });
  }
  if (filter === 'all' || filter === 'albums') {
    const seen = new Set<string>();
    for (const t of tracks) {
      if (!t.album || seen.has(t.album) || !fold(t.album).includes(needle)) continue;
      seen.add(t.album);
      out.push({ kind: 'album', album: t.album, artist: t.artist, artworkUrl: t.artworkUrl });
    }
  }
  if (filter === 'all' || filter === 'songs') {
    for (const t of tracks) {
      if ([t.title, t.artist, t.album ?? ''].some((f) => fold(f).includes(needle))) out.push({ kind: 'song', track: t });
    }
  }
  return out;
}
