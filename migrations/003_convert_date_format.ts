import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../lib/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  // Convert ISO date strings to simple date format (YYYY-MM-DD)
  // This handles existing databases that stored dates as ISO strings
  await sql`
    UPDATE chapter 
    SET date = substr(date, 1, 10) 
    WHERE date LIKE '%T%'
  `.execute(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Cannot reliably convert back to ISO format without time information
  // This is a one-way migration
}
