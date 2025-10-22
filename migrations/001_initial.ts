import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../lib/schemas/index.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('timeline')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('arc')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('timeline_id', 'integer', (col) =>
      col.notNull().references('timeline.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('order', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('episode')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('arc_id', 'integer', (col) => col.notNull().references('arc.id').onDelete('cascade'))
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('part')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('episode_id', 'integer', (col) =>
      col.notNull().references('episode.id').onDelete('cascade'),
    )
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('chapter')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('episode_id', 'integer', (col) => col.references('episode.id').onDelete('cascade'))
    .addColumn('part_id', 'integer', (col) => col.references('part.id').onDelete('cascade'))
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('word_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('character_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Indexes
  await db.schema.createIndex('idx_arc_timeline').on('arc').column('timeline_id').execute();
  await db.schema.createIndex('idx_episode_arc').on('episode').column('arc_id').execute();
  await db.schema.createIndex('idx_part_episode').on('part').column('episode_id').execute();
  await db.schema.createIndex('idx_chapter_episode').on('chapter').column('episode_id').execute();
  await db.schema.createIndex('idx_chapter_part').on('chapter').column('part_id').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('chapter').execute();
  await db.schema.dropTable('part').execute();
  await db.schema.dropTable('episode').execute();
  await db.schema.dropTable('arc').execute();
  await db.schema.dropTable('timeline').execute();
}
