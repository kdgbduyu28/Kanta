import { newId } from '../lib/id';
import type { Db } from './db';
import { renumber, toTrack, type Track } from './tracks';

export type Playlist = { id: string; name: string; description: string | null; createdAt: number };
export type PlaylistSummary = Playlist & { count: number; durationMs: number; covers: string[] };

type Row = { id: string; name: string; description: string | null; created_at: number };
const toPlaylist = (r: Row): Playlist => ({ id: r.id, name: r.name, description: r.description, createdAt: r.created_at });

export async function createPlaylist(db: Db, name: string, description?: string, now = Date.now()): Promise<Playlist> {
  const id = newId();
  await db.run('INSERT INTO playlists (id, name, description, created_at) VALUES (?, ?, ?, ?)', [
    id,
    name.trim(),
    description?.trim() || null,
    now,
  ]);
  return { id, name: name.trim(), description: description?.trim() || null, createdAt: now };
}

export async function renamePlaylist(db: Db, id: string, name: string, description?: string | null): Promise<void> {
  await db.run('UPDATE playlists SET name = ?, description = ? WHERE id = ?', [name.trim(), description?.trim() || null, id]);
}

export async function deletePlaylist(db: Db, id: string): Promise<void> {
  await db.tx(async () => {
    await db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', [id]);
    await db.run('DELETE FROM playlists WHERE id = ?', [id]);
  });
}

export async function getPlaylist(db: Db, id: string): Promise<Playlist | null> {
  const r = await db.get<Row>('SELECT * FROM playlists WHERE id = ?', [id]);
  return r ? toPlaylist(r) : null;
}

export async function addToPlaylist(db: Db, playlistId: string, trackId: string): Promise<void> {
  const n = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM playlist_tracks WHERE playlist_id = ?', [playlistId]);
  await db.run('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)', [
    playlistId,
    trackId,
    n?.n ?? 0,
  ]);
}

export async function removeFromPlaylist(db: Db, playlistId: string, position: number): Promise<void> {
  await db.tx(async () => {
    await db.run('DELETE FROM playlist_tracks WHERE playlist_id = ? AND position = ?', [playlistId, position]);
    await renumber(db, playlistId);
  });
}

/** Moves the song at `from` to `to`, shifting the ones in between. */
export async function movePlaylistTrack(db: Db, playlistId: string, from: number, to: number): Promise<void> {
  if (from === to) return;
  await db.tx(async () => {
    const ids = (
      await db.all<{ track_id: string }>(
        'SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position',
        [playlistId],
      )
    ).map((r) => r.track_id);
    if (from < 0 || from >= ids.length) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(Math.max(0, Math.min(ids.length, to)), 0, moved);
    await db.run('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlistId]);
    for (let i = 0; i < ids.length; i++) {
      await db.run('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)', [playlistId, ids[i], i]);
    }
  });
}

export async function listPlaylists(db: Db): Promise<PlaylistSummary[]> {
  const rows = await db.all<Row & { count: number; duration_ms: number | null }>(
    `SELECT p.*, COUNT(pt.track_id) AS count, SUM(t.duration_ms) AS duration_ms
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     LEFT JOIN tracks t ON t.id = pt.track_id
     GROUP BY p.id ORDER BY p.created_at DESC`,
  );
  const out: PlaylistSummary[] = [];
  for (const r of rows) {
    const covers = await db.all<{ artwork_url: string }>(
      `SELECT t.artwork_url FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
       WHERE pt.playlist_id = ? AND t.artwork_url IS NOT NULL ORDER BY pt.position LIMIT 4`,
      [r.id],
    );
    out.push({ ...toPlaylist(r), count: r.count, durationMs: r.duration_ms ?? 0, covers: covers.map((c) => c.artwork_url) });
  }
  return out;
}

export async function getPlaylistTracks(db: Db, id: string): Promise<Track[]> {
  const rows = await db.all<Parameters<typeof toTrack>[0]>(
    `SELECT t.* FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = ? ORDER BY pt.position`,
    [id],
  );
  return rows.map(toTrack);
}
