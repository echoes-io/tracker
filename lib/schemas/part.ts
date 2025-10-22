import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface PartTable {
  id: Generated<number>;
  episode_id: number;
  number: number;
  title: string;
  description: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Part = Selectable<PartTable>;
export type NewPart = Insertable<PartTable>;
export type PartUpdate = Updateable<PartTable>;
