import type { Arc, Chapter, Episode, Part, Timeline } from '@echoes-io/models';
import {
  ArcSchema,
  ChapterSchema,
  EpisodeSchema,
  PartSchema,
  TimelineSchema,
} from '@echoes-io/models';

import { migrate } from '../migrations/index.js';
import { createDatabase } from './connection.js';

/**
 * Tracker - Database abstraction for Echoes content management
 *
 * Provides type-safe CRUD operations for managing the content hierarchy:
 * Timeline -> Arc -> Episode -> Part -> Chapter
 *
 * Features:
 * - Automatic validation using Zod schemas from @echoes-io/models
 * - Type-safe queries with Kysely
 * - Cascade delete for referential integrity
 * - SQLite storage with better-sqlite3
 * - Composite primary keys for natural navigation
 *
 * @example
 * ```typescript
 * const tracker = new Tracker('./echoes.db');
 * await tracker.init();
 *
 * await tracker.createTimeline({
 *   name: 'my-story',
 *   description: 'A fantastic story'
 * });
 *
 * await tracker.close();
 * ```
 */
export class Tracker {
  private db;
  private sqlite;

  /**
   * Creates a new Tracker instance
   *
   * @param dbPath - Path to SQLite database file. Use ':memory:' for in-memory database.
   *                 Defaults to './tracker.db' if not specified.
   *
   * @example
   * ```typescript
   * // File-based database
   * const tracker = new Tracker('./my-database.db');
   *
   * // In-memory database (useful for testing)
   * const tracker = new Tracker(':memory:');
   * ```
   */
  constructor(dbPath?: string) {
    const { db, sqlite } = createDatabase(dbPath);
    this.db = db;
    this.sqlite = sqlite;
  }

  /**
   * Initializes the database schema
   *
   * Must be called before any other operations. Creates all necessary tables
   * and indexes if they don't exist.
   *
   * @throws {Error} If database initialization fails
   *
   * @example
   * ```typescript
   * const tracker = new Tracker('./echoes.db');
   * await tracker.init();
   * ```
   */
  async init() {
    await migrate(this.db);
  }

  /**
   * Closes the database connection
   *
   * Should be called when done using the tracker to free resources.
   *
   * @example
   * ```typescript
   * await tracker.close();
   * ```
   */
  async close() {
    this.sqlite.close();
  }

  // Timeline methods

  /**
   * Creates a new timeline
   *
   * @param data - Timeline data to create
   * @returns The created timeline
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const timeline = await tracker.createTimeline({
   *   name: 'my-story',
   *   description: 'A fantastic story'
   * });
   * ```
   */
  async createTimeline(data: Timeline): Promise<Timeline> {
    const validated = TimelineSchema.parse(data);
    await this.db.insertInto('timeline').values(validated).execute();
    return validated;
  }

  /**
   * Retrieves all timelines
   *
   * @returns Array of all timelines
   *
   * @example
   * ```typescript
   * const timelines = await tracker.getTimelines();
   * console.log(`Found ${timelines.length} timelines`);
   * ```
   */
  async getTimelines(): Promise<Timeline[]> {
    const rows = await this.db.selectFrom('timeline').select(['name', 'description']).execute();
    return rows.map((r) => ({ name: r.name, description: r.description || '' }));
  }

  /**
   * Retrieves a specific timeline by name
   *
   * @param name - Timeline name
   * @returns The timeline if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const timeline = await tracker.getTimeline('my-story');
   * if (timeline) {
   *   console.log(timeline.description);
   * }
   * ```
   */
  async getTimeline(name: string): Promise<Timeline | undefined> {
    const row = await this.db
      .selectFrom('timeline')
      .select(['name', 'description'])
      .where('name', '=', name)
      .executeTakeFirst();
    return row ? { name: row.name, description: row.description || '' } : undefined;
  }

  /**
   * Updates a timeline
   *
   * @param name - Timeline name to update
   * @param data - Partial timeline data to update
   * @returns The updated timeline
   * @throws {Error} If timeline not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const updated = await tracker.updateTimeline('my-story', {
   *   description: 'Updated description'
   * });
   * ```
   */
  async updateTimeline(name: string, data: Partial<Timeline>): Promise<Timeline> {
    const validated = TimelineSchema.partial().parse(data);
    await this.db.updateTable('timeline').set(validated).where('name', '=', name).execute();
    const updated = await this.getTimeline(name);
    if (!updated) throw new Error(`Timeline ${name} not found`);
    return updated;
  }

  /**
   * Deletes a timeline and all its related content
   *
   * This operation cascades: deleting a timeline will also delete all arcs,
   * episodes, parts, and chapters belonging to it.
   *
   * @param name - Timeline name to delete
   *
   * @example
   * ```typescript
   * await tracker.deleteTimeline('my-story');
   * ```
   */
  async deleteTimeline(name: string): Promise<void> {
    await this.db.deleteFrom('timeline').where('name', '=', name).execute();
  }

  // Arc methods

  /**
   * Creates a new arc within a timeline
   *
   * @param data - Arc data to create
   * @returns The created arc
   * @throws {Error} If timeline not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const arc = await tracker.createArc({
   *   timelineName: 'my-story',
   *   name: 'arc-1',
   *   number: 1,
   *   description: 'First arc'
   * });
   * ```
   */
  async createArc(data: Arc): Promise<Arc> {
    const validated = ArcSchema.parse(data);
    await this.db.insertInto('arc').values(validated).execute();
    return validated;
  }

  /**
   * Retrieves all arcs in a timeline, ordered by number
   *
   * @param timelineName - Timeline name
   * @returns Array of arcs in the timeline
   *
   * @example
   * ```typescript
   * const arcs = await tracker.getArcs('my-story');
   * for (const arc of arcs) {
   *   console.log(`Arc ${arc.number}: ${arc.name}`);
   * }
   * ```
   */
  async getArcs(timelineName: string): Promise<Arc[]> {
    const rows = await this.db
      .selectFrom('arc')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .orderBy('number')
      .execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      name: r.name,
      number: r.number,
      description: r.description || '',
    }));
  }

  /**
   * Retrieves a specific arc by timeline and arc name
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @returns The arc if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const arc = await tracker.getArc('my-story', 'arc-1');
   * if (arc) {
   *   console.log(`Arc ${arc.number}: ${arc.description}`);
   * }
   * ```
   */
  async getArc(timelineName: string, arcName: string): Promise<Arc | undefined> {
    const row = await this.db
      .selectFrom('arc')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('name', '=', arcName)
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

  /**
   * Updates an arc
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name to update
   * @param data - Partial arc data to update
   * @returns The updated arc
   * @throws {Error} If arc not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const updated = await tracker.updateArc('my-story', 'arc-1', {
   *   description: 'Updated description'
   * });
   * ```
   */
  async updateArc(timelineName: string, arcName: string, data: Partial<Arc>): Promise<Arc> {
    const validated = ArcSchema.partial().parse(data);
    await this.db
      .updateTable('arc')
      .set(validated)
      .where('timelineName', '=', timelineName)
      .where('name', '=', arcName)
      .execute();
    const updated = await this.getArc(timelineName, arcName);
    if (!updated) throw new Error(`Arc ${arcName} not found`);
    return updated;
  }

  /**
   * Deletes an arc and all its related content
   *
   * This operation cascades: deleting an arc will also delete all episodes,
   * parts, and chapters belonging to it.
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name to delete
   *
   * @example
   * ```typescript
   * await tracker.deleteArc('my-story', 'arc-1');
   * ```
   */
  async deleteArc(timelineName: string, arcName: string): Promise<void> {
    await this.db
      .deleteFrom('arc')
      .where('timelineName', '=', timelineName)
      .where('name', '=', arcName)
      .execute();
  }

  // Episode methods

  /**
   * Creates a new episode within an arc
   *
   * @param data - Episode data to create
   * @returns The created episode
   * @throws {Error} If arc not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const episode = await tracker.createEpisode({
   *   timelineName: 'my-story',
   *   arcName: 'arc-1',
   *   number: 1,
   *   slug: 'episode-1',
   *   title: 'Episode 1',
   *   description: 'First episode'
   * });
   * ```
   */
  async createEpisode(data: Episode): Promise<Episode> {
    const validated = EpisodeSchema.parse(data);
    await this.db.insertInto('episode').values(validated).execute();
    return validated;
  }

  /**
   * Retrieves all episodes in an arc, ordered by number
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @returns Array of episodes in the arc
   *
   * @example
   * ```typescript
   * const episodes = await tracker.getEpisodes('my-story', 'arc-1');
   * for (const episode of episodes) {
   *   console.log(`Episode ${episode.number}: ${episode.title}`);
   * }
   * ```
   */
  async getEpisodes(timelineName: string, arcName: string): Promise<Episode[]> {
    const rows = await this.db
      .selectFrom('episode')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .orderBy('number')
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

  /**
   * Retrieves a specific episode by timeline, arc, and episode number
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @returns The episode if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const episode = await tracker.getEpisode('my-story', 'arc-1', 1);
   * if (episode) {
   *   console.log(episode.title);
   * }
   * ```
   */
  async getEpisode(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
  ): Promise<Episode | undefined> {
    const row = await this.db
      .selectFrom('episode')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('number', '=', episodeNumber)
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

  /**
   * Updates an episode
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number to update
   * @param data - Partial episode data to update
   * @returns The updated episode
   * @throws {Error} If episode not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const updated = await tracker.updateEpisode('my-story', 'arc-1', 1, {
   *   title: 'Updated Title'
   * });
   * ```
   */
  async updateEpisode(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    data: Partial<Episode>,
  ): Promise<Episode> {
    const validated = EpisodeSchema.partial().parse(data);
    await this.db
      .updateTable('episode')
      .set(validated)
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('number', '=', episodeNumber)
      .execute();
    const updated = await this.getEpisode(timelineName, arcName, episodeNumber);
    if (!updated) throw new Error(`Episode ${episodeNumber} not found`);
    return updated;
  }

  /**
   * Deletes an episode and all its related content
   *
   * This operation cascades: deleting an episode will also delete all parts
   * and chapters belonging to it.
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number to delete
   *
   * @example
   * ```typescript
   * await tracker.deleteEpisode('my-story', 'arc-1', 1);
   * ```
   */
  async deleteEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<void> {
    await this.db
      .deleteFrom('episode')
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('number', '=', episodeNumber)
      .execute();
  }

  // Part methods

  /**
   * Creates a new part within an episode
   *
   * @param data - Part data to create
   * @returns The created part
   * @throws {Error} If episode not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const part = await tracker.createPart({
   *   timelineName: 'my-story',
   *   arcName: 'arc-1',
   *   episodeNumber: 1,
   *   number: 1,
   *   slug: 'part-1',
   *   title: 'Part 1',
   *   description: 'First part'
   * });
   * ```
   */
  async createPart(data: Part): Promise<Part> {
    const validated = PartSchema.parse(data);
    await this.db.insertInto('part').values(validated).execute();
    return validated;
  }

  /**
   * Retrieves all parts in an episode, ordered by number
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @returns Array of parts in the episode
   *
   * @example
   * ```typescript
   * const parts = await tracker.getParts('my-story', 'arc-1', 1);
   * for (const part of parts) {
   *   console.log(`Part ${part.number}: ${part.title}`);
   * }
   * ```
   */
  async getParts(timelineName: string, arcName: string, episodeNumber: number): Promise<Part[]> {
    const rows = await this.db
      .selectFrom('part')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .orderBy('number')
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

  /**
   * Retrieves a specific part by timeline, arc, episode, and part number
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param partNumber - Part number
   * @returns The part if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const part = await tracker.getPart('my-story', 'arc-1', 1, 1);
   * if (part) {
   *   console.log(part.title);
   * }
   * ```
   */
  async getPart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
  ): Promise<Part | undefined> {
    const row = await this.db
      .selectFrom('part')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', partNumber)
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

  /**
   * Updates a part
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param partNumber - Part number to update
   * @param data - Partial part data to update
   * @returns The updated part
   * @throws {Error} If part not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const updated = await tracker.updatePart('my-story', 'arc-1', 1, 1, {
   *   title: 'Updated Title'
   * });
   * ```
   */
  async updatePart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
    data: Partial<Part>,
  ): Promise<Part> {
    const validated = PartSchema.partial().parse(data);
    await this.db
      .updateTable('part')
      .set(validated)
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', partNumber)
      .execute();
    const updated = await this.getPart(timelineName, arcName, episodeNumber, partNumber);
    if (!updated) throw new Error(`Part ${partNumber} not found`);
    return updated;
  }

  /**
   * Deletes a part and all its related content
   *
   * This operation cascades: deleting a part will also delete all chapters
   * belonging to it.
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param partNumber - Part number to delete
   *
   * @example
   * ```typescript
   * await tracker.deletePart('my-story', 'arc-1', 1, 1);
   * ```
   */
  async deletePart(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber: number,
  ): Promise<void> {
    await this.db
      .deleteFrom('part')
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', partNumber)
      .execute();
  }

  // Chapter methods

  /**
   * Creates a new chapter within an episode (and optionally a part)
   *
   * Chapters contain the actual content metadata including POV, date, location,
   * and text statistics (word count, reading time, etc.).
   *
   * @param data - Chapter data to create
   * @returns The created chapter
   * @throws {Error} If episode or part not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const chapter = await tracker.createChapter({
   *   timelineName: 'my-story',
   *   arcName: 'arc-1',
   *   episodeNumber: 1,
   *   partNumber: 1,
   *   number: 1,
   *   pov: 'Alice',
   *   title: 'Chapter 1',
   *   date: new Date('2024-01-01'),
   *   excerpt: 'Alice wakes up...',
   *   location: 'Enchanted Forest',
   *   words: 1500,
   *   characters: 7500,
   *   charactersNoSpaces: 6000,
   *   paragraphs: 15,
   *   sentences: 75,
   *   readingTimeMinutes: 8
   * });
   * ```
   */
  async createChapter(data: Chapter): Promise<Chapter> {
    const validated = ChapterSchema.parse(data);
    await this.db
      .insertInto('chapter')
      .values({
        ...validated,
        date: validated.date.toISOString(),
        outfit: validated.outfit ?? null,
        kink: validated.kink ?? null,
      })
      .execute();
    return validated;
  }

  /**
   * Retrieves chapters in an episode, optionally filtered by part
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param partNumber - Optional part number to filter by
   * @returns Array of chapters, ordered by number
   *
   * @example
   * ```typescript
   * // Get all chapters in an episode
   * const allChapters = await tracker.getChapters('my-story', 'arc-1', 1);
   *
   * // Get chapters in a specific part
   * const partChapters = await tracker.getChapters('my-story', 'arc-1', 1, 1);
   * ```
   */
  async getChapters(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    partNumber?: number,
  ): Promise<Chapter[]> {
    let query = this.db
      .selectFrom('chapter')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber);

    if (partNumber !== undefined) {
      query = query.where('partNumber', '=', partNumber);
    }

    const rows = await query.orderBy('number').execute();
    return rows.map((r) => ({
      timelineName: r.timelineName,
      arcName: r.arcName,
      episodeNumber: r.episodeNumber,
      partNumber: r.partNumber,
      number: r.number,
      pov: r.pov,
      title: r.title,
      date: new Date(r.date),
      excerpt: r.excerpt,
      location: r.location,
      outfit: r.outfit ?? undefined,
      kink: r.kink ?? undefined,
      words: r.words,
      characters: r.characters,
      charactersNoSpaces: r.charactersNoSpaces,
      paragraphs: r.paragraphs,
      sentences: r.sentences,
      readingTimeMinutes: r.readingTimeMinutes,
    }));
  }

  /**
   * Retrieves a specific chapter by timeline, arc, episode, and chapter number
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param chapterNumber - Chapter number
   * @returns The chapter if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const chapter = await tracker.getChapter('my-story', 'arc-1', 1, 1);
   * if (chapter) {
   *   console.log(`${chapter.pov}: ${chapter.title}`);
   *   console.log(`Words: ${chapter.words}, Reading time: ${chapter.readingTimeMinutes}min`);
   * }
   * ```
   */
  async getChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
  ): Promise<Chapter | undefined> {
    const row = await this.db
      .selectFrom('chapter')
      .selectAll()
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', chapterNumber)
      .executeTakeFirst();
    return row
      ? {
          timelineName: row.timelineName,
          arcName: row.arcName,
          episodeNumber: row.episodeNumber,
          partNumber: row.partNumber,
          number: row.number,
          pov: row.pov,
          title: row.title,
          date: new Date(row.date),
          excerpt: row.excerpt,
          location: row.location,
          outfit: row.outfit ?? undefined,
          kink: row.kink ?? undefined,
          words: row.words,
          characters: row.characters,
          charactersNoSpaces: row.charactersNoSpaces,
          paragraphs: row.paragraphs,
          sentences: row.sentences,
          readingTimeMinutes: row.readingTimeMinutes,
        }
      : undefined;
  }

  /**
   * Updates a chapter
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param chapterNumber - Chapter number to update
   * @param data - Partial chapter data to update
   * @returns The updated chapter
   * @throws {Error} If chapter not found
   * @throws {ZodError} If validation fails
   *
   * @example
   * ```typescript
   * const updated = await tracker.updateChapter('my-story', 'arc-1', 1, 1, {
   *   title: 'Updated Title',
   *   words: 1600
   * });
   * ```
   */
  async updateChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
    data: Partial<Chapter>,
  ): Promise<Chapter> {
    const validated = ChapterSchema.partial().parse(data);
    const updateData: any = { ...validated };
    if (validated.date) updateData.date = validated.date.toISOString();
    if ('outfit' in validated) updateData.outfit = validated.outfit ?? null;
    if ('kink' in validated) updateData.kink = validated.kink ?? null;

    await this.db
      .updateTable('chapter')
      .set(updateData)
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', chapterNumber)
      .execute();
    const updated = await this.getChapter(timelineName, arcName, episodeNumber, chapterNumber);
    if (!updated) throw new Error(`Chapter ${chapterNumber} not found`);
    return updated;
  }

  /**
   * Deletes a chapter
   *
   * @param timelineName - Timeline name
   * @param arcName - Arc name
   * @param episodeNumber - Episode number
   * @param chapterNumber - Chapter number to delete
   *
   * @example
   * ```typescript
   * await tracker.deleteChapter('my-story', 'arc-1', 1, 1);
   * ```
   */
  async deleteChapter(
    timelineName: string,
    arcName: string,
    episodeNumber: number,
    chapterNumber: number,
  ): Promise<void> {
    await this.db
      .deleteFrom('chapter')
      .where('timelineName', '=', timelineName)
      .where('arcName', '=', arcName)
      .where('episodeNumber', '=', episodeNumber)
      .where('number', '=', chapterNumber)
      .execute();
  }
}
