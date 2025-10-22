import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface ArcTable {
  id: Generated<number>;
  timeline_id: number;
  name: string;
  title: string;
  description: string | null;
  order: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Arc = Selectable<ArcTable>;
export type NewArc = Insertable<ArcTable>;
export type ArcUpdate = Updateable<ArcTable>;
