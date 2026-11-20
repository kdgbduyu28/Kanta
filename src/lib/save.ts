import type { LocalTrack, NowPlaying } from '../../modules/kanta-media/src/types';
import type { Db } from '../db/db';
import { deleteTrack, getTrack, listTracks, updateTrackDetails, upsertTrack, type Track } from '../db/tracks';
import { fetchLinkDetails, placeholderDetails } from './linkDetails';
import { linkFromMediaId, parseMusicLink, sourceIdFromMediaId } from './links';
import { normalizeArtist, normalizeTitle } from './normalize';

type FetchFn = Parameters<typeof fetchLinkDetails>[1];

/** Share sheet / paste: saves the first music link in the text. */
export async function saveFromText(db: Db, text: string, fetchFn?: FetchFn): Promise<Track | null> {
  const p = parseMusicLink(text);
  if (!p) return null;
  const d = await fetchLinkDetails(p, fetchFn);
  const details = d ?? placeholderDetails(p);
  return upsertTrack(db, {
    source: p.source,
    kind: p.kind,
    link: p.link,
    sourceId: p.sourceId,
    ...details,
    liked: false,
    detailsFetched: d != null,
  });
}

/** Re-tries details for songs saved while offline. Returns how many were filled. */
export async function refreshMissingDetails(db: Db, fetchFn?: FetchFn): Promise<number> {
  const rows = await db.all<{ id: string; link: string }>(
    "SELECT id, link FROM tracks WHERE details_fetched = 0 AND link <> '' AND source <> 'local'",
  );
  let filled = 0;
  for (const r of rows) {
    const p = parseMusicLink(r.link);
    if (!p) continue;
    const d = await fetchLinkDetails(p, fetchFn);
    if (d) {
      await updateTrackDetails(db, r.id, d);
      filled++;
    }
  }
  return filled;
}

/**
 * The heart on Now Playing. Uses the session's media id for a playable link when the app gives one;
 * otherwise saves the song without a link (the screen asks the user to share it to Kanta once).
 */
export async function saveNowPlaying(db: Db, np: NowPlaying): Promise<Track | null> {
  if (!np.title) return null;
  if (np.source === 'local') {
    const existing = await db.get<{ id: string }>("SELECT id FROM tracks WHERE source = 'local' AND link = ?", [np.mediaId ?? '']);
    if (existing) {
      await db.run('UPDATE tracks SET liked = 1 WHERE id = ?', [existing.id]);
      return getTrack(db, existing.id);
    }
  }
  const link = np.mediaId ? linkFromMediaId(np.source, np.mediaId) : null;
  const sourceId =
    (np.mediaId ? sourceIdFromMediaId(np.source, np.mediaId) : null) ??
    `np:${normalizeTitle(np.title)}|${normalizeArtist(np.artist)}`;
  return upsertTrack(db, {
    source: np.source,
    kind: 'track',
    link: link ?? '',
    sourceId,
    title: np.title,
    artist: np.artist,
    album: np.album,
    artworkUrl: np.artworkUri,
    durationMs: np.durationMs,
    liked: true,
    detailsFetched: true,
  });
}

/** True when a saved song still needs the user to share it once before Kanta can play it. */
export const needsLink = (t: Track) => t.link === '';

/**
 * Brings "On this phone" in line with the device: adds new files, updates changed ones,
 * and removes songs whose files are gone (and their playlist entries).
 */
export async function syncLocalLibrary(db: Db, files: LocalTrack[]): Promise<{ added: number; removed: number }> {
  const before = await listTracks(db, { source: 'local' });
  const seen = new Set<string>();
  let added = 0;
  for (const f of files) {
    seen.add(f.mediaStoreId);
    if (!before.some((b) => b.sourceId === f.mediaStoreId)) added++;
    await upsertTrack(db, {
      source: 'local',
      kind: 'track',
      link: f.uri,
      sourceId: f.mediaStoreId,
      title: f.title,
      artist: f.artist,
      album: f.album || null,
      artworkUrl: f.artworkUri,
      durationMs: f.durationMs,
      liked: false,
      detailsFetched: true,
    });
  }
  let removed = 0;
  for (const b of before) {
    if (!seen.has(b.sourceId)) {
      await deleteTrack(db, b.id);
      removed++;
    }
  }
  return { added, removed };
}
