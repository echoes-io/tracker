import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface ChapterTable {
  id: Generated<number>;
  episode_id: number | null;
  part_id: number | null;
  number: number;
  title: string;
  content: string;
  word_count: number;
  character_count: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Chapter = Selectable<ChapterTable>;
export type NewChapter = Insertable<ChapterTable>;
export type ChapterUpdate = Updateable<ChapterTable>;
