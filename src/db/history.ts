import type { Source } from '../../modules/kanta-media/src/types';
import { newId } from '../lib/id';
import type { Db, Param } from './db';

// Rows are written by HistoryLogger.kt; JS only reads them (and inserts in tests / clears history).

export type Play = {
  id: string;
  trackId: string | null;
  source: Source;
  title: string;
  artist: string;
  startedAt: number;
  listenedMs: number;
};

type Row = { id: string; track_id: string | null; source: Source; title: string; artist: string; started_at: number; listened_ms: number };
const toPlay = (r: Row): Play => ({
  id: r.id,
  trackId: r.track_id,
  source: r.source,
  title: r.title,
  artist: r.artist,
  startedAt: r.started_at,
  listenedMs: r.listened_ms,
});

export async function insertPlay(db: Db, p: Omit<Play, 'id'>): Promise<void> {
  await db.run(
    'INSERT INTO plays (id, track_id, source, title, artist, started_at, listened_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [newId(), p.trackId, p.source, p.title, p.artist, p.startedAt, p.listenedMs],
  );
}

const songKey = (p: Pick<Play, 'trackId' | 'title' | 'artist'>) =>
  p.trackId ?? `${p.title.toLowerCase()}|${p.artist.toLowerCase()}`;

/** Newest first; repeated plays of the same song in a row show once. */
export async function recentPlays(db: Db, limit: number): Promise<Play[]> {
  const rows = (await db.all<Row>('SELECT * FROM plays ORDER BY started_at DESC LIMIT ?', [limit * 4])).map(toPlay);
  const out: Play[] = [];
  for (const p of rows) {
    if (out.length && songKey(out[out.length - 1]) === songKey(p)) continue;
    out.push(p);
    if (out.length === limit) break;
  }
  return out;
}

export async function mostPlayed(
  db: Db,
  o: { sinceMs?: number; limit: number },
): Promise<(Play & { count: number })[]> {
  const params: Param[] = [];
  let where = '';
  if (o.sinceMs != null) {
    where = 'WHERE started_at >= ?';
    params.push(o.sinceMs);
  }
  const rows = await db.all<Row & { count: number }>(
    `SELECT *, COUNT(*) AS count FROM (
       SELECT *, COALESCE(track_id, LOWER(title) || '|' || LOWER(artist)) AS k FROM plays ${where} ORDER BY started_at DESC
     ) GROUP BY k ORDER BY count DESC, MAX(started_at) DESC LIMIT ?`,
    [...params, o.limit],
  );
  return rows.map((r) => ({ ...toPlay(r), count: r.count }));
}

export async function listeningMs(db: Db, sinceMs?: number): Promise<number> {
  const r = await db.get<{ ms: number | null }>(
    `SELECT SUM(listened_ms) AS ms FROM plays ${sinceMs != null ? 'WHERE started_at >= ?' : ''}`,
    sinceMs != null ? [sinceMs] : [],
  );
  return r?.ms ?? 0;
}

export async function clearHistory(db: Db): Promise<void> {
  await db.run('DELETE FROM plays');
}
