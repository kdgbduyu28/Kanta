import * as SQLite from 'expo-sqlite';
import type { Db, Param } from './db';
import { migrate } from './schema';

export const DB_NAME = 'kanta.db';

let opened: Promise<Db> | null = null;

/** Opens filesDir/SQLite/kanta.db once (WAL, shared with the Kotlin service) and migrates it. */
export function openExpoDb(): Promise<Db> {
  opened ??= (async () => {
    const sq = await SQLite.openDatabaseAsync(DB_NAME);
    await sq.execAsync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000; PRAGMA foreign_keys = ON;');
    const db: Db = {
      run: async (sql, params: Param[] = []) => {
        await sq.runAsync(sql, params);
      },
      all: (sql, params: Param[] = []) => sq.getAllAsync(sql, params),
      get: async (sql, params: Param[] = []) => (await sq.getFirstAsync(sql, params)) ?? null,
      tx: (fn) => sq.withTransactionAsync(fn),
      exec: (sql) => sq.execAsync(sql),
    };
    await migrate(db);
    return db;
  })();
  return opened;
}
