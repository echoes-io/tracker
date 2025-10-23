import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDatabase } from '../../lib/connection.js';
import { migrate } from '../../lib/migrations.js';

describe('Migrations', () => {
  let db: ReturnType<typeof createDatabase>['db'];
  let sqlite: ReturnType<typeof createDatabase>['sqlite'];

  beforeEach(() => {
    const connection = createDatabase(':memory:');
    db = connection.db;
    sqlite = connection.sqlite;
  });

  afterEach(() => {
    sqlite.close();
  });

  it('should create _migrations table', async () => {
    await migrate(db);

    const result = await db
      .selectFrom('_migrations' as any)
      .selectAll()
      .execute();

    expect(result).toBeDefined();
  });

  it('should run initial migration', async () => {
    await migrate(db);

    const migrations = await db
      .selectFrom('_migrations' as any)
      .select('name')
      .execute();

    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations[0].name).toBe('001_initial');
  });

  it('should not run migrations twice', async () => {
    await migrate(db);
    const firstRun = await db
      .selectFrom('_migrations' as any)
      .selectAll()
      .execute();

    await migrate(db);
    const secondRun = await db
      .selectFrom('_migrations' as any)
      .selectAll()
      .execute();

    expect(secondRun.length).toBe(firstRun.length);
  });

  it('should create all tables', async () => {
    await migrate(db);

    // Verify tables exist by querying them
    await expect(db.selectFrom('timeline').selectAll().execute()).resolves.toBeDefined();
    await expect(db.selectFrom('arc').selectAll().execute()).resolves.toBeDefined();
    await expect(db.selectFrom('episode').selectAll().execute()).resolves.toBeDefined();
    await expect(db.selectFrom('part').selectAll().execute()).resolves.toBeDefined();
    await expect(db.selectFrom('chapter').selectAll().execute()).resolves.toBeDefined();
  });

  it('should be able to rollback migration', async () => {
    await migrate(db);

    // Import and call down function
    const migration = await import('../../migrations/001_initial.js');
    await migration.down(db);

    // Verify tables are dropped
    await expect(db.selectFrom('timeline').selectAll().execute()).rejects.toThrow();
  });
});
