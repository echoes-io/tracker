import type { Kysely } from 'kysely';

import type { Database } from '../lib/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('chapter').renameColumn('excerpt', 'summary').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('chapter').renameColumn('summary', 'excerpt').execute();
}
