import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../lib/database.js';

export interface Migration {
  up: (db: Kysely<Database>) => Promise<void>;
  down: (db: Kysely<Database>) => Promise<void>;
}

async function ensureMigrationsTable(db: Kysely<Database>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);
}

async function getExecutedMigrations(db: Kysely<Database>): Promise<Set<string>> {
  const result = await sql<{ name: string }>`SELECT name FROM _migrations ORDER BY name`.execute(
    db,
  );
  return new Set(result.rows.map((r) => r.name));
}

async function loadMigrations(): Promise<Map<string, Migration>> {
  const migrationsDir = join(fileURLToPath(import.meta.url), '..');
  const files = await readdir(migrationsDir);

  const migrations = new Map<string, Migration>();

  for (const file of files.sort()) {
    // Match only .ts or .js files, but exclude .d.ts and index files
    if (
      file.match(/^\d{3}_.*\.(?:ts|js)$/) &&
      !file.endsWith('.d.ts') &&
      !file.startsWith('index.')
    ) {
      const name = file.replace(/\.(ts|js)$/, '');
      const module = await import(`./${file}`);
      migrations.set(name, module);
    }
  }

  return migrations;
}

export async function migrate(db: Kysely<Database>): Promise<void> {
  await ensureMigrationsTable(db);

  const executed = await getExecutedMigrations(db);
  const migrations = await loadMigrations();

  for (const [name, migration] of migrations) {
    if (!executed.has(name)) {
      await db.transaction().execute(async (trx) => {
        await migration.up(trx);
        await sql`INSERT INTO _migrations (name) VALUES (${name})`.execute(trx);
      });
    }
  }
}
