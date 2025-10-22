import type { ArcTable } from './arc.js';
import type { ChapterTable } from './chapter.js';
import type { EpisodeTable } from './episode.js';
import type { PartTable } from './part.js';
import type { TimelineTable } from './timeline.js';

export interface Database {
  timeline: TimelineTable;
  arc: ArcTable;
  episode: EpisodeTable;
  part: PartTable;
  chapter: ChapterTable;
}

export * from './arc.js';
export * from './chapter.js';
export * from './episode.js';
export * from './part.js';
export * from './timeline.js';
