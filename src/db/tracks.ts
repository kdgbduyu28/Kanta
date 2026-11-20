import type { Source } from '../../modules/kanta-media/src/types';
import { newId } from '../lib/id';
import { bool, type Db, type Param } from './db';

export type TrackKind = 'track' | 'album' | 'playlist';

export type Track = {
  id: string;
  source: Source;
  kind: TrackKind;
  link: string;
  sourceId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  durationMs: number;
  liked: boolean;
  addedAt: number;
  detailsFetched: boolean;
};

export type TrackInput = Omit<Track, 'id' | 'addedAt'> & { id?: string };

type Row = {
  id: string;
  source: Source;
  kind: TrackKind;
  link: string;
  source_id: string;
  title: string;
  artist: string;
  album: string | null;
  artwork_url: string | null;
  duration_ms: number;
  liked: number;
  added_at: number;
  details_fetched: number;
};

export function toTrack(r: Row): Track {
  return {
    id: r.id,
    source: r.source,
    kind: r.kind,
    link: r.link,
    sourceId: r.source_id,
    title: r.title,
    artist: r.artist,
    album: r.album,
    artworkUrl: r.artwork_url,
    durationMs: r.duration_ms,
    liked: !!r.liked,
    addedAt: r.added_at,
    detailsFetched: !!r.details_fetched,
  };
}

/** Insert, or update the existing row with the same source + sourceId (keeps its id and addedAt). */
export async function upsertTrack(db: Db, t: TrackInput, now = Date.now()): Promise<Track> {
  const existing = await db.get<Row>('SELECT * FROM tracks WHERE source = ? AND source_id = ?', [t.source, t.sourceId]);
  if (existing) {
    await db.run(
      `UPDATE tracks SET kind = ?, link = ?, title = ?, artist = ?, album = ?, artwork_url = ?, duration_ms = ?,
       liked = ?, details_fetched = ? WHERE id = ?`,
      [
        t.kind,
        t.link || existing.link,
        t.title,
        t.artist,
        t.album,
        t.artworkUrl,
        t.durationMs,
        bool(t.liked || !!existing.liked),
        bool(t.detailsFetched || !!existing.details_fetched),
        existing.id,
      ],
    );
    return (await getTrack(db, existing.id))!;
  }
  const id = t.id ?? newId();
  await db.run(
    `INSERT INTO tracks (id, source, kind, link, source_id, title, artist, album, artwork_url, duration_ms, liked,
     added_at, details_fetched) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, t.source, t.kind, t.link, t.sourceId, t.title, t.artist, t.album, t.artworkUrl, t.durationMs, bool(t.liked), now, bool(t.detailsFetched)],
  );
  return (await getTrack(db, id))!;
}

export async function updateTrackDetails(
  db: Db,
  id: string,
  d: { title: string; artist: string; album: string | null; artworkUrl: string | null; durationMs: number },
): Promise<void> {
  await db.run(
    'UPDATE tracks SET title = ?, artist = ?, album = ?, artwork_url = ?, duration_ms = ?, details_fetched = 1 WHERE id = ?',
    [d.title, d.artist, d.album, d.artworkUrl, d.durationMs, id],
  );
}

export async function getTrack(db: Db, id: string): Promise<Track | null> {
  const r = await db.get<Row>('SELECT * FROM tracks WHERE id = ?', [id]);
  return r ? toTrack(r) : null;
}

export async function findTrackBySourceId(db: Db, source: Source, sourceId: string): Promise<Track | null> {
  const r = await db.get<Row>('SELECT * FROM tracks WHERE source = ? AND source_id = ?', [source, sourceId]);
  return r ? toTrack(r) : null;
}

export type ListOptions = {
  source?: Source;
  liked?: boolean;
  orderBy?: 'added' | 'title' | 'artist';
  artist?: string;
  album?: string;
};

export async function listTracks(db: Db, o: ListOptions = {}): Promise<Track[]> {
  const where: string[] = [];
  const params: Param[] = [];
  if (o.source) {
    where.push('source = ?');
    params.push(o.source);
  }
  if (o.liked) where.push('liked = 1');
  if (o.artist != null) {
    where.push('artist = ?');
    params.push(o.artist);
  }
  if (o.album != null) {
    where.push('album = ?');
    params.push(o.album);
  }
  const order =
    o.orderBy === 'title'
      ? 'title COLLATE NOCASE'
      : o.orderBy === 'artist'
        ? 'artist COLLATE NOCASE, title COLLATE NOCASE'
        : 'added_at DESC';
  const rows = await db.all<Row>(
    `SELECT * FROM tracks ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`,
    params,
  );
  return rows.map(toTrack);
}

export async function setLiked(db: Db, id: string, liked: boolean): Promise<void> {
  await db.run('UPDATE tracks SET liked = ? WHERE id = ?', [bool(liked), id]);
}

/** Deletes a track and closes the gaps it leaves in playlists. */
export async function deleteTrack(db: Db, id: string): Promise<void> {
  await db.tx(async () => {
    const affected = await db.all<{ playlist_id: string }>(
      'SELECT DISTINCT playlist_id FROM playlist_tracks WHERE track_id = ?',
      [id],
    );
    await db.run('DELETE FROM playlist_tracks WHERE track_id = ?', [id]);
    await db.run('UPDATE plays SET track_id = NULL WHERE track_id = ?', [id]);
    await db.run('DELETE FROM tracks WHERE id = ?', [id]);
    for (const { playlist_id } of affected) await renumber(db, playlist_id);
  });
}

/** Rewrites positions 0..n-1 in the current order. */
export async function renumber(db: Db, playlistId: string): Promise<void> {
  const rows = await db.all<{ rowid: number }>(
    'SELECT rowid FROM playlist_tracks WHERE playlist_id = ? ORDER BY position, rowid',
    [playlistId],
  );
  for (let i = 0; i < rows.length; i++) {
    await db.run('UPDATE playlist_tracks SET position = ? WHERE rowid = ?', [i, rows[i].rowid]);
  }
}

export async function listArtists(db: Db): Promise<{ artist: string; count: number; artworkUrl: string | null }[]> {
  return db.all(
    `SELECT artist, COUNT(*) AS count, MAX(artwork_url) AS artworkUrl FROM tracks
     WHERE kind = 'track' AND artist <> '' GROUP BY artist ORDER BY artist COLLATE NOCASE`,
  );
}

export async function listAlbums(
  db: Db,
): Promise<{ album: string; artist: string; count: number; artworkUrl: string | null }[]> {
  return db.all(
    `SELECT album, MIN(artist) AS artist, COUNT(*) AS count, MAX(artwork_url) AS artworkUrl FROM tracks
     WHERE album IS NOT NULL AND album <> '' GROUP BY album ORDER BY album COLLATE NOCASE`,
  );
}

export async function countTracks(db: Db): Promise<number> {
  return (await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM tracks"))?.n ?? 0;
}

export async function sourcesWithSongs(db: Db): Promise<Source[]> {
  const rows = await db.all<{ source: Source }>('SELECT DISTINCT source FROM tracks');
  return rows.map((r) => r.source);
}
