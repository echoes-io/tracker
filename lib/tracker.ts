import { up as migration001 } from '../migrations/001_initial.js';
import { createDatabase } from './connection.js';
import type {
  Arc,
  Chapter,
  Episode,
  NewArc,
  NewChapter,
  NewEpisode,
  NewTimeline,
  Timeline,
  TimelineUpdate,
} from './schemas/index.js';

export class Tracker {
  private db;
  private sqlite;

  constructor(dbPath?: string) {
    const { db, sqlite } = createDatabase(dbPath);
    this.db = db;
    this.sqlite = sqlite;
  }

  async init() {
    await migration001(this.db);
  }

  async close() {
    this.sqlite.close();
  }

  // Timeline methods
  async createTimeline(timeline: NewTimeline): Promise<Timeline> {
    const result = await this.db
      .insertInto('timeline')
      .values(timeline)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }

  async getTimelines(): Promise<Timeline[]> {
    return await this.db.selectFrom('timeline').selectAll().execute();
  }

  async getTimeline(name: string): Promise<Timeline | undefined> {
    return await this.db
      .selectFrom('timeline')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
  }

  async updateTimeline(name: string, update: TimelineUpdate): Promise<Timeline> {
    return await this.db
      .updateTable('timeline')
      .set(update)
      .where('name', '=', name)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteTimeline(name: string): Promise<void> {
    await this.db.deleteFrom('timeline').where('name', '=', name).execute();
  }

  // Arc methods
  async createArc(arc: NewArc): Promise<Arc> {
    return await this.db.insertInto('arc').values(arc).returningAll().executeTakeFirstOrThrow();
  }

  async getArcs(timelineId: number): Promise<Arc[]> {
    return await this.db
      .selectFrom('arc')
      .selectAll()
      .where('timeline_id', '=', timelineId)
      .orderBy('order')
      .execute();
  }

  // Episode methods
  async createEpisode(episode: NewEpisode): Promise<Episode> {
    return await this.db
      .insertInto('episode')
      .values(episode)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getEpisodes(arcId: number): Promise<Episode[]> {
    return await this.db
      .selectFrom('episode')
      .selectAll()
      .where('arc_id', '=', arcId)
      .orderBy('number')
      .execute();
  }

  // Chapter methods
  async createChapter(chapter: NewChapter): Promise<Chapter> {
    return await this.db
      .insertInto('chapter')
      .values(chapter)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getChapters(episodeId?: number, partId?: number): Promise<Chapter[]> {
    let query = this.db.selectFrom('chapter').selectAll();

    if (episodeId) query = query.where('episode_id', '=', episodeId);
    if (partId) query = query.where('part_id', '=', partId);

    return await query.orderBy('number').execute();
  }
}
