import { afterEach, describe, expect, it } from 'vitest';

import { createDatabase } from '../../lib/connection.js';

describe('Database connection', () => {
  const connections: ReturnType<typeof createDatabase>[] = [];

  afterEach(() => {
    for (const { sqlite } of connections) {
      sqlite.close();
    }
    connections.length = 0;
  });

  it('should create in-memory database', () => {
    const connection = createDatabase(':memory:');
    connections.push(connection);

    expect(connection.db).toBeDefined();
    expect(connection.sqlite).toBeDefined();
  });

  it('should create Kysely instance', () => {
    const connection = createDatabase(':memory:');
    connections.push(connection);

    expect(typeof connection.db.selectFrom).toBe('function');
  });

  it('should create better-sqlite3 instance', () => {
    const connection = createDatabase(':memory:');
    connections.push(connection);

    expect(connection.sqlite.name).toBe(':memory:');
  });
});
