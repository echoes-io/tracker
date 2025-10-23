import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Tracker } from '../lib/index.js';

describe('Tracker', () => {
  let tracker: Tracker;

  beforeEach(async () => {
    tracker = new Tracker(':memory:');
    await tracker.init();
  });

  afterEach(async () => {
    await tracker.close();
  });

  describe('Timeline operations', () => {
    it('should create and retrieve timeline', async () => {
      const timeline = await tracker.createTimeline({
        name: 'test-timeline',
        description: 'Test Timeline Description',
      });

      expect(timeline.name).toBe('test-timeline');
      expect(timeline.description).toBe('Test Timeline Description');

      const retrieved = await tracker.getTimeline('test-timeline');
      expect(retrieved).toEqual(timeline);
    });

    it('should list all timelines', async () => {
      await tracker.createTimeline({ name: 'timeline-1', description: 'First' });
      await tracker.createTimeline({ name: 'timeline-2', description: 'Second' });

      const timelines = await tracker.getTimelines();
      expect(timelines).toHaveLength(2);
    });

    it('should update timeline', async () => {
      await tracker.createTimeline({ name: 'test', description: 'Original' });
      const updated = await tracker.updateTimeline('test', { description: 'Updated' });
      expect(updated.description).toBe('Updated');
    });

    it('should delete timeline', async () => {
      await tracker.createTimeline({ name: 'test', description: 'Test' });
      await tracker.deleteTimeline('test');
      const retrieved = await tracker.getTimeline('test');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Arc operations', () => {
    beforeEach(async () => {
      await tracker.createTimeline({ name: 'test-timeline', description: 'Test' });
    });

    it('should create and retrieve arc', async () => {
      const arc = await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'First Arc',
      });

      expect(arc.name).toBe('arc-1');
      expect(arc.number).toBe(1);

      const retrieved = await tracker.getArc('test-timeline', 'arc-1');
      expect(retrieved).toEqual(arc);
    });

    it('should list arcs in order', async () => {
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-2',
        number: 2,
        description: 'Second',
      });
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'First',
      });

      const arcs = await tracker.getArcs('test-timeline');
      expect(arcs).toHaveLength(2);
      expect(arcs[0].number).toBe(1);
      expect(arcs[1].number).toBe(2);
    });

    it('should update arc', async () => {
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'Original',
      });
      const updated = await tracker.updateArc('test-timeline', 'arc-1', { description: 'Updated' });
      expect(updated.description).toBe('Updated');
    });

    it('should delete arc', async () => {
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'Test',
      });
      await tracker.deleteArc('test-timeline', 'arc-1');
      const retrieved = await tracker.getArc('test-timeline', 'arc-1');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Episode operations', () => {
    beforeEach(async () => {
      await tracker.createTimeline({ name: 'test-timeline', description: 'Test' });
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'Test Arc',
      });
    });

    it('should create and retrieve episode', async () => {
      const episode = await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'episode-1',
        title: 'Episode 1',
        description: 'First Episode',
      });

      expect(episode.number).toBe(1);
      expect(episode.title).toBe('Episode 1');

      const retrieved = await tracker.getEpisode('test-timeline', 'arc-1', 1);
      expect(retrieved).toEqual(episode);
    });

    it('should list episodes', async () => {
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'ep-1',
        title: 'Episode 1',
        description: 'First',
      });
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 2,
        slug: 'ep-2',
        title: 'Episode 2',
        description: 'Second',
      });

      const episodes = await tracker.getEpisodes('test-timeline', 'arc-1');
      expect(episodes).toHaveLength(2);
    });

    it('should update episode', async () => {
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'ep-1',
        title: 'Original',
        description: 'Test',
      });
      const updated = await tracker.updateEpisode('test-timeline', 'arc-1', 1, {
        title: 'Updated',
      });
      expect(updated.title).toBe('Updated');
    });

    it('should delete episode', async () => {
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'ep-1',
        title: 'Test',
        description: 'Test',
      });
      await tracker.deleteEpisode('test-timeline', 'arc-1', 1);
      const retrieved = await tracker.getEpisode('test-timeline', 'arc-1', 1);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Part operations', () => {
    beforeEach(async () => {
      await tracker.createTimeline({ name: 'test-timeline', description: 'Test' });
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'Test Arc',
      });
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'ep-1',
        title: 'Episode 1',
        description: 'Test',
      });
    });

    it('should create and retrieve part', async () => {
      const part = await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 1,
        slug: 'part-1',
        title: 'Part 1',
        description: 'First Part',
      });

      expect(part.number).toBe(1);
      expect(part.title).toBe('Part 1');

      const retrieved = await tracker.getPart('test-timeline', 'arc-1', 1, 1);
      expect(retrieved).toEqual(part);
    });

    it('should list parts', async () => {
      await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 1,
        slug: 'part-1',
        title: 'Part 1',
        description: 'First',
      });
      await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 2,
        slug: 'part-2',
        title: 'Part 2',
        description: 'Second',
      });

      const parts = await tracker.getParts('test-timeline', 'arc-1', 1);
      expect(parts).toHaveLength(2);
    });

    it('should update part', async () => {
      await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 1,
        slug: 'part-1',
        title: 'Original',
        description: 'Test',
      });
      const updated = await tracker.updatePart('test-timeline', 'arc-1', 1, 1, {
        title: 'Updated',
      });
      expect(updated.title).toBe('Updated');
    });

    it('should delete part', async () => {
      await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 1,
        slug: 'part-1',
        title: 'Test',
        description: 'Test',
      });
      await tracker.deletePart('test-timeline', 'arc-1', 1, 1);
      const retrieved = await tracker.getPart('test-timeline', 'arc-1', 1, 1);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Chapter operations', () => {
    beforeEach(async () => {
      await tracker.createTimeline({ name: 'test-timeline', description: 'Test' });
      await tracker.createArc({
        timelineName: 'test-timeline',
        name: 'arc-1',
        number: 1,
        description: 'Test Arc',
      });
      await tracker.createEpisode({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        number: 1,
        slug: 'ep-1',
        title: 'Episode 1',
        description: 'Test',
      });
      await tracker.createPart({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        number: 1,
        slug: 'part-1',
        title: 'Part 1',
        description: 'Test Part',
      });
    });

    it('should create and retrieve chapter', async () => {
      const chapter = await tracker.createChapter({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        partNumber: 1,
        number: 1,
        pov: 'Alice',
        title: 'Chapter 1',
        date: new Date('2024-01-01'),
        excerpt: 'Test excerpt',
        location: 'Test location',
        words: 1000,
        characters: 5000,
        charactersNoSpaces: 4000,
        paragraphs: 10,
        sentences: 50,
        readingTimeMinutes: 5,
      });

      expect(chapter.number).toBe(1);
      expect(chapter.pov).toBe('Alice');

      const retrieved = await tracker.getChapter('test-timeline', 'arc-1', 1, 1);
      expect(retrieved?.title).toBe('Chapter 1');
    });

    it('should list chapters', async () => {
      await tracker.createChapter({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        partNumber: 1,
        number: 1,
        pov: 'Alice',
        title: 'Chapter 1',
        date: new Date('2024-01-01'),
        excerpt: 'Test',
        location: 'Test',
        words: 1000,
        characters: 5000,
        charactersNoSpaces: 4000,
        paragraphs: 10,
        sentences: 50,
        readingTimeMinutes: 5,
      });

      const chapters = await tracker.getChapters('test-timeline', 'arc-1', 1);
      expect(chapters).toHaveLength(1);
    });

    it('should update chapter', async () => {
      await tracker.createChapter({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        partNumber: 1,
        number: 1,
        pov: 'Alice',
        title: 'Original',
        date: new Date('2024-01-01'),
        excerpt: 'Test',
        location: 'Test',
        words: 1000,
        characters: 5000,
        charactersNoSpaces: 4000,
        paragraphs: 10,
        sentences: 50,
        readingTimeMinutes: 5,
      });
      const updated = await tracker.updateChapter('test-timeline', 'arc-1', 1, 1, {
        title: 'Updated',
      });
      expect(updated.title).toBe('Updated');
    });

    it('should delete chapter', async () => {
      await tracker.createChapter({
        timelineName: 'test-timeline',
        arcName: 'arc-1',
        episodeNumber: 1,
        partNumber: 1,
        number: 1,
        pov: 'Alice',
        title: 'Test',
        date: new Date('2024-01-01'),
        excerpt: 'Test',
        location: 'Test',
        words: 1000,
        characters: 5000,
        charactersNoSpaces: 4000,
        paragraphs: 10,
        sentences: 50,
        readingTimeMinutes: 5,
      });
      await tracker.deleteChapter('test-timeline', 'arc-1', 1, 1);
      const retrieved = await tracker.getChapter('test-timeline', 'arc-1', 1, 1);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Cascade delete', () => {
    it('should cascade delete arcs when timeline is deleted', async () => {
      await tracker.createTimeline({ name: 'test', description: 'Test' });
      await tracker.createArc({
        timelineName: 'test',
        name: 'arc-1',
        number: 1,
        description: 'Test',
      });
      await tracker.deleteTimeline('test');
      const arcs = await tracker.getArcs('test');
      expect(arcs).toHaveLength(0);
    });
  });
});
