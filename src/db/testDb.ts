// In-memory database for vitest, on Node's built-in SQLite (Node 22.13+).
import { DatabaseSync } from 'node:sqlite';
import type { Db, Param } from './db';
import { migrate } from './schema';

export function openTestDb(): Db {
  const sq = new DatabaseSync(':memory:');
  sq.exec('PRAGMA foreign_keys = ON;');
  let depth = 0;
  return {
    run: async (sql, params: Param[] = []) => {
      sq.prepare(sql).run(...params);
    },
    all: async <T>(sql: string, params: Param[] = []) => sq.prepare(sql).all(...params) as T[],
    get: async <T>(sql: string, params: Param[] = []) => (sq.prepare(sql).get(...params) as T | undefined) ?? null,
    tx: async (fn) => {
      // Nested calls join the outer transaction, like expo-sqlite's helper.
      if (depth > 0) return fn();
      depth++;
      sq.exec('BEGIN');
      try {
        await fn();
        sq.exec('COMMIT');
      } catch (e) {
        sq.exec('ROLLBACK');
        throw e;
      } finally {
        depth--;
      }
    },
    exec: async (sql) => {
      sq.exec(sql);
    },
  };
}

export async function openMigratedTestDb(): Promise<Db> {
  const db = openTestDb();
  await migrate(db);
  return db;
}
