import type { Generated } from 'kysely';

export interface TimelineTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface ArcTable {
  id: Generated<number>;
  timeline_id: number;
  name: string;
  number: number;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface EpisodeTable {
  id: Generated<number>;
  arc_id: number;
  number: number;
  slug: string;
  title: string;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface PartTable {
  id: Generated<number>;
  episode_id: number;
  number: number;
  slug: string;
  title: string;
  description: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface ChapterTable {
  id: Generated<number>;
  episode_id: number;
  part_id: number | null;
  number: number;
  pov: string;
  title: string;
  date: string;
  excerpt: string;
  location: string;
  outfit: string | null;
  kink: string | null;
  words: number;
  characters: number;
  characters_no_spaces: number;
  paragraphs: number;
  sentences: number;
  reading_time_minutes: number;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface Database {
  timeline: TimelineTable;
  arc: ArcTable;
  episode: EpisodeTable;
  part: PartTable;
  chapter: ChapterTable;
}
