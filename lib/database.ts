import type { Arc, Chapter, Episode, Part, Timeline } from '@echoes-io/models';
import type { Generated } from 'kysely';

// Database-specific fields (timestamps only)
interface DatabaseFields {
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Timeline: PK = name
export interface TimelineTable extends Timeline, DatabaseFields {}

// Arc: PK = (timelineName, name)
export interface ArcTable extends Arc, DatabaseFields {}

// Episode: PK = (timelineName, arcName, number)
export interface EpisodeTable extends Episode, DatabaseFields {}

// Part: PK = (timelineName, arcName, episodeNumber, number)
export interface PartTable extends Part, DatabaseFields {}

// Chapter: PK = (timelineName, arcName, episodeNumber, number)
// Only adapt types for storage (Date → string, optional → null)
export interface ChapterTable extends Omit<Chapter, 'date' | 'outfit' | 'kink'>, DatabaseFields {
  date: string; // Stored as ISO string
  outfit: string | null; // Optional fields stored as null
  kink: string | null;
}

export interface Database {
  timeline: TimelineTable;
  arc: ArcTable;
  episode: EpisodeTable;
  part: PartTable;
  chapter: ChapterTable;
}
