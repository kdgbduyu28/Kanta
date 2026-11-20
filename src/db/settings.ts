import type { Db } from './db';

export async function getSetting<T>(db: Db, key: string, fallback: T): Promise<T> {
  const r = await db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  if (!r) return fallback;
  try {
    return JSON.parse(r.value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(db: Db, key: string, value: unknown): Promise<void> {
  await db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}
