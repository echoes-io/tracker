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
// Exclude ChapterMetadata fields that duplicate foreign keys (timeline, arc, episode, part, chapter)
// and handle optional fields as null
export interface ChapterTable
  extends Omit<Chapter, 'timeline' | 'arc' | 'episode' | 'part' | 'chapter' | 'outfit' | 'kink'>,
    DatabaseFields {
  outfit: string | null;
  kink: string | null;
}

export interface Database {
  timeline: TimelineTable;
  arc: ArcTable;
  episode: EpisodeTable;
  part: PartTable;
  chapter: ChapterTable;
}
