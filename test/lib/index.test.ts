import { describe, expect, it } from 'vitest';

import type { Arc, Chapter, Episode, Part, Timeline } from '../../lib/index.js';
import { Tracker } from '../../lib/index.js';

describe('Tracker module exports', () => {
  it('should export Tracker class', () => {
    expect(Tracker).toBeDefined();
    expect(typeof Tracker).toBe('function');
  });

  it('should be able to instantiate Tracker', () => {
    const tracker = new Tracker(':memory:');
    expect(tracker).toBeInstanceOf(Tracker);
  });

  it('should export TypeScript types', () => {
    // Type-only test - verifies types are exported correctly
    const timeline: Timeline = { name: 'test', description: 'test' };
    const arc: Arc = { timelineName: 'test', name: 'arc', number: 1, description: 'test' };
    const episode: Episode = {
      timelineName: 'test',
      arcName: 'arc',
      number: 1,
      slug: 'ep',
      title: 'Episode',
      description: 'test',
    };
    const part: Part = {
      timelineName: 'test',
      arcName: 'arc',
      episodeNumber: 1,
      number: 1,
      slug: 'part',
      title: 'Part',
      description: 'test',
    };
    const chapter: Chapter = {
      timelineName: 'test',
      arcName: 'arc',
      episodeNumber: 1,
      partNumber: 1,
      number: 1,
      pov: 'Alice',
      title: 'Chapter',
      date: new Date(),
      excerpt: 'test',
      location: 'test',
      words: 100,
      characters: 500,
      charactersNoSpaces: 400,
      paragraphs: 5,
      sentences: 10,
      readingTimeMinutes: 1,
    };

    expect(timeline).toBeDefined();
    expect(arc).toBeDefined();
    expect(episode).toBeDefined();
    expect(part).toBeDefined();
    expect(chapter).toBeDefined();
  });
});
