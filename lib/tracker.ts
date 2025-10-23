import type { Arc, Chapter, Episode, Part, Timeline } from '@echoes-io/models';
import {
  ArcSchema,
  ChapterSchema,
  EpisodeSchema,
  PartSchema,
  TimelineSchema,
} from '@echoes-io/models';

import { up as migration001 } from '../migrations/001_initial.js';
import { createDatabase } from './connection.js';

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
  async createTimeline(data: Timeline): Promise<Timeline> {
    const validated = TimelineSchema.parse(data);
    await this.db
      .insertInto('timeline')
      .values({ name: validated.name, description: validated.description })
      .execute();
    return validated;
  }

  async getTimelines(): Promise<Timeline[]> {
    const rows = await this.db.selectFrom('timeline').select(['name', 'description']).execute();
    return rows.map((r) => ({ name: r.name, description: r.description || '' }));
  }

  async getTimeline(name: string): Promise<Timeline | undefined> {
    const row = await this.db
      .selectFrom('timeline')
      .select(['name', 'description'])
      .where('name', '=', name)
      .executeTakeFirst();
    return row ? { name: row.name, description: row.description || '' } : undefined;
  }

  async updateTimeline(name: string, data: Partial<Timeline>): Promise<Timeline> {
    const validated = TimelineSchema.partial().parse(data);
    await this.db
      .updateTable('timeline')
      .set({ description: validated.description })
      .where('name', '=', name)
      .execute();
    const updated = await this.getTimeline(name);
    if (!updated) throw new Error(`Timeline ${name} not found`);
    return updated;
  }

  async deleteTimeline(name: string): Promise<void> {
    await this.db.deleteFrom('timeline').where('name', '=', name).execute();
  }

  // Arc methods
  async createArc(data: Arc): Promise<Arc> {
    const validated = ArcSchema.parse(data);
    const timeline = await this.db
      .selectFrom('timeline')
      .select('id')
      .where('name', '=', validated.timelineName)
      .executeTakeFirst();
    if (!timeline) throw new Error(`Timeline ${validated.timelineName} not found`);

    await this.db
      .insertInto('arc')
      .values({
        timeline_id: timeline.id,
        name: validated.name,
        number: validated.number,
        description: validated.description,
      })
      .execute();
    return validated;
  }

  async getArcs(timelineName: string): Promise<Arc[]> {
    const rows = await this.db
      .selectFrom('arc')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select(['timeline.name as timelineName', 'arc.name', 'arc.number', 'arc.description'])
      .where('timeline.name', '=', timelineName)
      .orderBy('arc.number')
      .execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      name: r.name,
      number: r.number,
      description: r.description || '',
    }));
  }

  async getArc(timelineName: string, arcName: string): Promise<Arc | undefined> {
    const row = await this.db
      .selectFrom('arc')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select(['timeline.name as timelineName', 'arc.name', 'arc.number', 'arc.description'])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .executeTakeFirst();
    return row
      ? {
          timelineName: row.timelineName,
          name: row.name,
          number: row.number,
          description: row.description || '',
        }
      : undefined;
  }

  async updateArc(timelineName: string, arcName: string, data: Partial<Arc>): Promise<Arc> {
    const validated = ArcSchema.partial().parse(data);
    const arc = await this.db
      .selectFrom('arc')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('arc.id')
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .executeTakeFirst();
    if (!arc) throw new Error(`Arc ${arcName} not found`);

    await this.db
      .updateTable('arc')
      .set({ number: validated.number, description: validated.description })
      .where('id', '=', arc.id)
      .execute();
    const updated = await this.getArc(timelineName, arcName);
    if (!updated) throw new Error(`Arc ${arcName} not found`);
    return updated;
  }

  async deleteArc(timelineName: string, arcName: string): Promise<void> {
    await this.db
      .deleteFrom('arc')
      .where('id', '=', (eb) =>
        eb
          .selectFrom('arc')
          .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
          .select('arc.id')
          .where('timeline.name', '=', timelineName)
          .where('arc.name', '=', arcName),
      )
      .execute();
  }

  // Episode methods
  async createEpisode(data: Episode): Promise<Episode> {
    const validated = EpisodeSchema.parse(data);
    const arc = await this.db
      .selectFrom('arc')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('arc.id')
      .where('timeline.name', '=', validated.timelineName)
      .where('arc.name', '=', validated.arcName)
      .executeTakeFirst();
    if (!arc) throw new Error(`Arc ${validated.arcName} not found`);

    await this.db
      .insertInto('episode')
      .values({
        arc_id: arc.id,
        number: validated.number,
        slug: validated.slug,
        title: validated.title,
        description: validated.description,
      })
      .execute();
    return validated;
  }

  async getEpisodes(timelineName: string, arcName: string): Promise<Episode[]> {
    const rows = await this.db
      .selectFrom('episode')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number',
        'episode.slug',
        'episode.title',
        'episode.description',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .orderBy('episode.number')
      .execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      arcName: r.arcName,
      number: r.number,
      slug: r.slug,
      title: r.title,
      description: r.description || '',
    }));
  }

  async getEpisode(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
  ): Promise<Episode | undefined> {
    const row = await this.db
      .selectFrom('episode')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number',
        'episode.slug',
        'episode.title',
        'episode.description',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .executeTakeFirst();
    return row
      ? {
          timelineName: row.timelineName,
          arcName: row.arcName,
          number: row.number,
          slug: row.slug,
          title: row.title,
          description: row.description || '',
        }
      : undefined;
  }

  async updateEpisode(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    data: Partial<Episode>,
  ): Promise<Episode> {
    const validated = EpisodeSchema.partial().parse(data);
    const episode = await this.db
      .selectFrom('episode')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('episode.id')
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .executeTakeFirst();
    if (!episode) throw new Error(`Episode ${episodeNumber} not found`);

    await this.db
      .updateTable('episode')
      .set({ slug: validated.slug, title: validated.title, description: validated.description })
      .where('id', '=', episode.id)
      .execute();
    const updated = await this.getEpisode(timelineName, arcName, episodeNumber);
    if (!updated) throw new Error(`Episode ${episodeNumber} not found`);
    return updated;
  }

  async deleteEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<void> {
    await this.db
      .deleteFrom('episode')
      .where('id', '=', (eb) =>
        eb
          .selectFrom('episode')
          .innerJoin('arc', 'arc.id', 'episode.arc_id')
          .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
          .select('episode.id')
          .where('timeline.name', '=', timelineName)
          .where('arc.name', '=', arcName)
          .where('episode.number', '=', episodeNumber),
      )
      .execute();
  }

  // Part methods
  async createPart(data: Part): Promise<Part> {
    const validated = PartSchema.parse(data);
    const episode = await this.db
      .selectFrom('episode')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('episode.id')
      .where('timeline.name', '=', validated.timelineName)
      .where('arc.name', '=', validated.arcName)
      .where('episode.number', '=', validated.episodeNumber)
      .executeTakeFirst();
    if (!episode) throw new Error(`Episode ${validated.episodeNumber} not found`);

    await this.db
      .insertInto('part')
      .values({
        episode_id: episode.id,
        number: validated.number,
        slug: validated.slug,
        title: validated.title,
        description: validated.description,
      })
      .execute();
    return validated;
  }

  async getParts(timelineName: string, arcName: string, episodeNumber: number): Promise<Part[]> {
    const rows = await this.db
      .selectFrom('part')
      .innerJoin('episode', 'episode.id', 'part.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number as episodeNumber',
        'part.number',
        'part.slug',
        'part.title',
        'part.description',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .orderBy('part.number')
      .execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      arcName: r.arcName,
      episodeNumber: r.episodeNumber,
      number: r.number,
      slug: r.slug,
      title: r.title,
      description: r.description || '',
    }));
  }

  async getPart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
  ): Promise<Part | undefined> {
    const row = await this.db
      .selectFrom('part')
      .innerJoin('episode', 'episode.id', 'part.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number as episodeNumber',
        'part.number',
        'part.slug',
        'part.title',
        'part.description',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .where('part.number', '=', partNumber)
      .executeTakeFirst();
    return row
      ? {
          timelineName: row.timelineName,
          arcName: row.arcName,
          episodeNumber: row.episodeNumber,
          number: row.number,
          slug: row.slug,
          title: row.title,
          description: row.description || '',
        }
      : undefined;
  }

  async updatePart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
    data: Partial<Part>,
  ): Promise<Part> {
    const validated = PartSchema.partial().parse(data);
    const part = await this.db
      .selectFrom('part')
      .innerJoin('episode', 'episode.id', 'part.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('part.id')
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .where('part.number', '=', partNumber)
      .executeTakeFirst();
    if (!part) throw new Error(`Part ${partNumber} not found`);

    await this.db
      .updateTable('part')
      .set({ slug: validated.slug, title: validated.title, description: validated.description })
      .where('id', '=', part.id)
      .execute();
    const updated = await this.getPart(timelineName, arcName, episodeNumber, partNumber);
    if (!updated) throw new Error(`Part ${partNumber} not found`);
    return updated;
  }

  async deletePart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
  ): Promise<void> {
    await this.db
      .deleteFrom('part')
      .where('id', '=', (eb) =>
        eb
          .selectFrom('part')
          .innerJoin('episode', 'episode.id', 'part.episode_id')
          .innerJoin('arc', 'arc.id', 'episode.arc_id')
          .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
          .select('part.id')
          .where('timeline.name', '=', timelineName)
          .where('arc.name', '=', arcName)
          .where('episode.number', '=', episodeNumber)
          .where('part.number', '=', partNumber),
      )
      .execute();
  }

  // Chapter methods
  async createChapter(data: Chapter): Promise<Chapter> {
    const validated = ChapterSchema.parse(data);
    const episode = await this.db
      .selectFrom('episode')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('episode.id')
      .where('timeline.name', '=', validated.timelineName)
      .where('arc.name', '=', validated.arcName)
      .where('episode.number', '=', validated.episodeNumber)
      .executeTakeFirst();
    if (!episode) throw new Error(`Episode ${validated.episodeNumber} not found`);

    let partId: number | null = null;
    if (validated.partNumber) {
      const part = await this.db
        .selectFrom('part')
        .select('id')
        .where('episode_id', '=', episode.id)
        .where('number', '=', validated.partNumber)
        .executeTakeFirst();
      if (!part) throw new Error(`Part ${validated.partNumber} not found`);
      partId = part.id;
    }

    await this.db
      .insertInto('chapter')
      .values({
        episode_id: episode.id,
        part_id: partId,
        number: validated.number,
        pov: validated.pov,
        title: validated.title,
        date: validated.date.toISOString(),
        excerpt: validated.excerpt,
        location: validated.location,
        outfit: validated.outfit,
        kink: validated.kink,
        words: validated.words,
        characters: validated.characters,
        characters_no_spaces: validated.charactersNoSpaces,
        paragraphs: validated.paragraphs,
        sentences: validated.sentences,
        reading_time_minutes: validated.readingTimeMinutes,
      })
      .execute();
    return validated;
  }

  async getChapters(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber?: number,
  ): Promise<Chapter[]> {
    let query = this.db
      .selectFrom('chapter')
      .innerJoin('episode', 'episode.id', 'chapter.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .leftJoin('part', 'part.id', 'chapter.part_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number as episodeNumber',
        'part.number as partNumber',
        'chapter.number',
        'chapter.pov',
        'chapter.title',
        'chapter.date',
        'chapter.excerpt',
        'chapter.location',
        'chapter.outfit',
        'chapter.kink',
        'chapter.words',
        'chapter.characters',
        'chapter.characters_no_spaces',
        'chapter.paragraphs',
        'chapter.sentences',
        'chapter.reading_time_minutes',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber);

    if (partNumber !== undefined) {
      query = query.where('part.number', '=', partNumber);
    }

    const rows = await query.orderBy('chapter.number').execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      arcName: r.arcName,
      episodeNumber: r.episodeNumber,
      partNumber: r.partNumber || 0,
      number: r.number,
      pov: r.pov,
      title: r.title,
      date: new Date(r.date),
      excerpt: r.excerpt,
      location: r.location,
      outfit: r.outfit || undefined,
      kink: r.kink || undefined,
      words: r.words,
      characters: r.characters,
      charactersNoSpaces: r.characters_no_spaces,
      paragraphs: r.paragraphs,
      sentences: r.sentences,
      readingTimeMinutes: r.reading_time_minutes,
    }));
  }

  async getChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
  ): Promise<Chapter | undefined> {
    const row = await this.db
      .selectFrom('chapter')
      .innerJoin('episode', 'episode.id', 'chapter.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .leftJoin('part', 'part.id', 'chapter.part_id')
      .select([
        'timeline.name as timelineName',
        'arc.name as arcName',
        'episode.number as episodeNumber',
        'part.number as partNumber',
        'chapter.number',
        'chapter.pov',
        'chapter.title',
        'chapter.date',
        'chapter.excerpt',
        'chapter.location',
        'chapter.outfit',
        'chapter.kink',
        'chapter.words',
        'chapter.characters',
        'chapter.characters_no_spaces',
        'chapter.paragraphs',
        'chapter.sentences',
        'chapter.reading_time_minutes',
      ])
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .where('chapter.number', '=', chapterNumber)
      .executeTakeFirst();
    return row
      ? {
          timelineName: row.timelineName,
          arcName: row.arcName,
          episodeNumber: row.episodeNumber,
          partNumber: row.partNumber || 0,
          number: row.number,
          pov: row.pov,
          title: row.title,
          date: new Date(row.date),
          excerpt: row.excerpt,
          location: row.location,
          outfit: row.outfit || undefined,
          kink: row.kink || undefined,
          words: row.words,
          characters: row.characters,
          charactersNoSpaces: row.characters_no_spaces,
          paragraphs: row.paragraphs,
          sentences: row.sentences,
          readingTimeMinutes: row.reading_time_minutes,
        }
      : undefined;
  }

  async updateChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
    data: Partial<Chapter>,
  ): Promise<Chapter> {
    const validated = ChapterSchema.partial().parse(data);
    const chapter = await this.db
      .selectFrom('chapter')
      .innerJoin('episode', 'episode.id', 'chapter.episode_id')
      .innerJoin('arc', 'arc.id', 'episode.arc_id')
      .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
      .select('chapter.id')
      .where('timeline.name', '=', timelineName)
      .where('arc.name', '=', arcName)
      .where('episode.number', '=', episodeNumber)
      .where('chapter.number', '=', chapterNumber)
      .executeTakeFirst();
    if (!chapter) throw new Error(`Chapter ${chapterNumber} not found`);

    await this.db
      .updateTable('chapter')
      .set({
        pov: validated.pov,
        title: validated.title,
        date: validated.date?.toISOString(),
        excerpt: validated.excerpt,
        location: validated.location,
        outfit: validated.outfit,
        kink: validated.kink,
        words: validated.words,
        characters: validated.characters,
        characters_no_spaces: validated.charactersNoSpaces,
        paragraphs: validated.paragraphs,
        sentences: validated.sentences,
        reading_time_minutes: validated.readingTimeMinutes,
      })
      .where('id', '=', chapter.id)
      .execute();
    const updated = await this.getChapter(timelineName, arcName, episodeNumber, chapterNumber);
    if (!updated) throw new Error(`Chapter ${chapterNumber} not found`);
    return updated;
  }

  async deleteChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
  ): Promise<void> {
    await this.db
      .deleteFrom('chapter')
      .where('id', '=', (eb) =>
        eb
          .selectFrom('chapter')
          .innerJoin('episode', 'episode.id', 'chapter.episode_id')
          .innerJoin('arc', 'arc.id', 'episode.arc_id')
          .innerJoin('timeline', 'timeline.id', 'arc.timeline_id')
          .select('chapter.id')
          .where('timeline.name', '=', timelineName)
          .where('arc.name', '=', arcName)
          .where('episode.number', '=', episodeNumber)
          .where('chapter.number', '=', chapterNumber),
      )
      .execute();
  }
}
