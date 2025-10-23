import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../lib/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  // Timeline: PK = name
  await db.schema
    .createTable('timeline')
    .addColumn('name', 'text', (col) => col.primaryKey())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Arc: PK = (timelineName, name)
  await db.schema
    .createTable('arc')
    .addColumn('timelineName', 'text', (col) =>
      col.notNull().references('timeline.name').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('arc_pk', ['timelineName', 'name'])
    .execute();

  // Episode: PK = (timelineName, arcName, number)
  await db.schema
    .createTable('episode')
    .addColumn('timelineName', 'text', (col) => col.notNull())
    .addColumn('arcName', 'text', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('episode_pk', ['timelineName', 'arcName', 'number'])
    .addForeignKeyConstraint(
      'episode_arc_fk',
      ['timelineName', 'arcName'],
      'arc',
      ['timelineName', 'name'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // Part: PK = (timelineName, arcName, episodeNumber, number)
  await db.schema
    .createTable('part')
    .addColumn('timelineName', 'text', (col) => col.notNull())
    .addColumn('arcName', 'text', (col) => col.notNull())
    .addColumn('episodeNumber', 'integer', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('createdAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('part_pk', ['timelineName', 'arcName', 'episodeNumber', 'number'])
    .addForeignKeyConstraint(
      'part_episode_fk',
      ['timelineName', 'arcName', 'episodeNumber'],
      'episode',
      ['timelineName', 'arcName', 'number'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // Chapter: PK = (timelineName, arcName, episodeNumber, number)
  await db.schema
    .createTable('chapter')
    .addColumn('timelineName', 'text', (col) => col.notNull())
    .addColumn('arcName', 'text', (col) => col.notNull())
    .addColumn('episodeNumber', 'integer', (col) => col.notNull())
    .addColumn('partNumber', 'integer', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('pov', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('date', 'text', (col) => col.notNull())
    .addColumn('excerpt', 'text', (col) => col.notNull())
    .addColumn('location', 'text', (col) => col.notNull())
    .addColumn('outfit', 'text')
    .addColumn('kink', 'text')
    .addColumn('words', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('characters', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('charactersNoSpaces', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('paragraphs', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('sentences', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('readingTimeMinutes', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('chapter_pk', ['timelineName', 'arcName', 'episodeNumber', 'number'])
    .addForeignKeyConstraint(
      'chapter_episode_fk',
      ['timelineName', 'arcName', 'episodeNumber'],
      'episode',
      ['timelineName', 'arcName', 'number'],
      (cb) => cb.onDelete('cascade'),
    )
    .addForeignKeyConstraint(
      'chapter_part_fk',
      ['timelineName', 'arcName', 'episodeNumber', 'partNumber'],
      'part',
      ['timelineName', 'arcName', 'episodeNumber', 'number'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // Indexes for foreign keys (for query performance)
  await db.schema.createIndex('idx_arc_timeline').on('arc').column('timelineName').execute();
  await db.schema
    .createIndex('idx_episode_arc')
    .on('episode')
    .columns(['timelineName', 'arcName'])
    .execute();
  await db.schema
    .createIndex('idx_part_episode')
    .on('part')
    .columns(['timelineName', 'arcName', 'episodeNumber'])
    .execute();
  await db.schema
    .createIndex('idx_chapter_episode')
    .on('chapter')
    .columns(['timelineName', 'arcName', 'episodeNumber'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('chapter').execute();
  await db.schema.dropTable('part').execute();
  await db.schema.dropTable('episode').execute();
  await db.schema.dropTable('arc').execute();
  await db.schema.dropTable('timeline').execute();
}
