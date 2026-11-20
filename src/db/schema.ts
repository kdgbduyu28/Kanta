import type { Db } from './db';

// The Kotlin side (KantaDb.kt) writes plays, queue and queue_state in this same file.
// Change those three tables only together with the Kotlin code.
const MIGRATIONS: string[] = [
  /* 1 */ `
  CREATE TABLE tracks (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    kind TEXT NOT NULL,
    link TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    album TEXT,
    artwork_url TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    liked INTEGER NOT NULL DEFAULT 0,
    added_at INTEGER NOT NULL,
    details_fetched INTEGER NOT NULL DEFAULT 0,
    UNIQUE (source, source_id)
  );
  CREATE TABLE playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE playlist_tracks (
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL
  );
  CREATE INDEX playlist_tracks_playlist ON playlist_tracks(playlist_id, position);
  CREATE INDEX playlist_tracks_track ON playlist_tracks(track_id);
  CREATE TABLE queue (
    position INTEGER PRIMARY KEY,
    track_id TEXT NOT NULL,
    source TEXT NOT NULL,
    link TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    duration_ms INTEGER NOT NULL
  );
  CREATE TABLE queue_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cursor INTEGER NOT NULL,
    shuffle INTEGER NOT NULL,
    repeat TEXT NOT NULL,
    order_json TEXT NOT NULL
  );
  CREATE TABLE plays (
    id TEXT PRIMARY KEY,
    track_id TEXT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    listened_ms INTEGER NOT NULL
  );
  CREATE INDEX plays_started ON plays(started_at);
  CREATE INDEX plays_track ON plays(track_id);
  CREATE TABLE lyrics (
    key TEXT PRIMARY KEY,
    synced INTEGER NOT NULL,
    body TEXT,
    fetched_at INTEGER NOT NULL
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(db: Db): Promise<void> {
  await db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const row = await db.get<{ version: number }>('SELECT version FROM schema_version');
  const current = row?.version ?? 0;
  if (current >= MIGRATIONS.length) return;
  await db.tx(async () => {
    for (let v = current; v < MIGRATIONS.length; v++) await db.exec(MIGRATIONS[v]);
    if (row) await db.run('UPDATE schema_version SET version = ?', [MIGRATIONS.length]);
    else await db.run('INSERT INTO schema_version (version) VALUES (?)', [MIGRATIONS.length]);
  });
}
