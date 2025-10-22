import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface TimelineTable {
  id: Generated<number>;
  name: string;
  title: string;
  description: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Timeline = Selectable<TimelineTable>;
export type NewTimeline = Insertable<TimelineTable>;
export type TimelineUpdate = Updateable<TimelineTable>;
