import type { Db } from './db';

export type CachedLyrics = { synced: boolean; body: string | null; fetchedAt: number };

export async function getCachedLyrics(db: Db, key: string): Promise<CachedLyrics | null> {
  const r = await db.get<{ synced: number; body: string | null; fetched_at: number }>(
    'SELECT synced, body, fetched_at FROM lyrics WHERE key = ?',
    [key],
  );
  return r ? { synced: !!r.synced, body: r.body, fetchedAt: r.fetched_at } : null;
}

export async function putCachedLyrics(db: Db, key: string, v: CachedLyrics): Promise<void> {
  await db.run(
    `INSERT INTO lyrics (key, synced, body, fetched_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET synced = excluded.synced, body = excluded.body, fetched_at = excluded.fetched_at`,
    [key, v.synced ? 1 : 0, v.body, v.fetchedAt],
  );
}
