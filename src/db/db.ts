// Small database interface so the same queries run on expo-sqlite (phone) and node:sqlite (tests).

export type Param = string | number | null;

export interface Db {
  run(sql: string, params?: Param[]): Promise<void>;
  all<T>(sql: string, params?: Param[]): Promise<T[]>;
  get<T>(sql: string, params?: Param[]): Promise<T | null>;
  /** Runs fn inside one transaction. */
  tx(fn: () => Promise<void>): Promise<void>;
  /** Runs a script of several statements (migrations). */
  exec(sql: string): Promise<void>;
}

export const bool = (v: boolean) => (v ? 1 : 0);
