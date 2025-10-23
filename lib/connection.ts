import { join } from 'node:path';

import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import type { Database as DatabaseSchema } from './database.js';

export function createDatabase(dbPath?: string): {
  db: Kysely<DatabaseSchema>;
  sqlite: Database.Database;
} {
  const path = dbPath || join(process.cwd(), 'tracker.db');
  const sqlite = new Database(path);

  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });

  return { db, sqlite };
}
