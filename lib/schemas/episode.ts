import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface EpisodeTable {
  id: Generated<number>;
  arc_id: number;
  number: number;
  title: string;
  description: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Episode = Selectable<EpisodeTable>;
export type NewEpisode = Insertable<EpisodeTable>;
export type EpisodeUpdate = Updateable<EpisodeTable>;
