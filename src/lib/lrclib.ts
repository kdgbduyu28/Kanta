import type { Db } from '../db/db';
import { getCachedLyrics, putCachedLyrics } from '../db/lyrics';
import { parseLrc, type LyricLine } from './lrc';
import { normalizeArtist, normalizeTitle } from './normalize';

export type Lyrics = { synced: true; lines: LyricLine[] } | { synced: false; lines: string[] };

type FetchFn = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

const MISS_TTL_MS = 7 * 24 * 3600 * 1000;
export const USER_AGENT = 'Kanta/1.0 (Android music hub)';

export const lyricsKey = (q: { title: string; artist: string }) => `${normalizeTitle(q.title)}|${normalizeArtist(q.artist)}`;

/**
 * Lyrics from LRCLIB (free, no key), cached. A 404 is cached as "none" for 7 days;
 * network errors are not cached so the next open tries again.
 */
export async function getLyrics(
  db: Db,
  q: { title: string; artist: string; durationMs: number },
  fetchFn: FetchFn = fetch as unknown as FetchFn,
  now = Date.now(),
): Promise<Lyrics | null> {
  const key = lyricsKey(q);
  const cached = await getCachedLyrics(db, key);
  if (cached && (cached.body != null || now - cached.fetchedAt < MISS_TTL_MS)) {
    return cached.body == null ? null : decode(cached.synced, cached.body);
  }
  const params = new URLSearchParams({ track_name: q.title, artist_name: q.artist });
  if (q.durationMs > 0) params.set('duration', String(Math.round(q.durationMs / 1000)));
  let r: Awaited<ReturnType<FetchFn>>;
  try {
    r = await fetchFn(`https://lrclib.net/api/get?${params}`, { headers: { 'User-Agent': USER_AGENT } });
  } catch {
    return null;
  }
  if (r.status === 404) {
    await putCachedLyrics(db, key, { synced: false, body: null, fetchedAt: now });
    return null;
  }
  if (!r.ok) return null;
  const j = (await r.json()) as { syncedLyrics?: string | null; plainLyrics?: string | null };
  if (j.syncedLyrics) {
    await putCachedLyrics(db, key, { synced: true, body: j.syncedLyrics, fetchedAt: now });
    return decode(true, j.syncedLyrics);
  }
  if (j.plainLyrics) {
    await putCachedLyrics(db, key, { synced: false, body: j.plainLyrics, fetchedAt: now });
    return decode(false, j.plainLyrics);
  }
  await putCachedLyrics(db, key, { synced: false, body: null, fetchedAt: now });
  return null;
}

function decode(synced: boolean, body: string): Lyrics {
  return synced ? { synced: true, lines: parseLrc(body) } : { synced: false, lines: body.split(/\r?\n/) };
}
