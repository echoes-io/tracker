# @echoes-io/tracker

Database library for **Echoes** - a multi-POV digital storytelling platform.

## Overview

The tracker library provides:
- **Database abstraction** for content management (Timeline, Arc, Episode, Part, Chapter)
- **Type-safe CRUD operations** with Kysely query builder
- **Validation** using Zod schemas from @echoes-io/models
- **SQLite storage** with better-sqlite3
- **Complete TypeScript support**

## Architecture Context

Echoes is organized as a multi-repository system:

```
@echoes-io/utils     # Shared utilities (markdown parsing, text stats)
@echoes-io/models    # Shared types and Zod schemas
@echoes-io/tracker   # This library - Database for content management
@echoes-io/rag       # Semantic search and AI context
echoes-timeline-*    # Individual timeline content repositories
echoes-web-app       # Frontend application
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Database**: SQLite with better-sqlite3
- **Query Builder**: Kysely (type-safe SQL)
- **Validation**: Zod (via @echoes-io/models)
- **Testing**: Vitest
- **Linting**: Biome

## Installation

```bash
npm install @echoes-io/tracker
```

## Usage

```typescript
import { Tracker } from '@echoes-io/tracker';

// Create tracker instance
const tracker = new Tracker('./my-database.db'); // or ':memory:' for in-memory

// Initialize database schema
await tracker.init();

// Create a timeline
await tracker.createTimeline({
  name: 'my-timeline',
  description: 'My story timeline'
});

// Create an arc
await tracker.createArc({
  timelineName: 'my-timeline',
  name: 'arc-1',
  number: 1,
  description: 'First arc'
});

// Create an episode
await tracker.createEpisode({
  timelineName: 'my-timeline',
  arcName: 'arc-1',
  number: 1,
  slug: 'episode-1',
  title: 'Episode 1',
  description: 'First episode'
});

// Create a part
await tracker.createPart({
  timelineName: 'my-timeline',
  arcName: 'arc-1',
  episodeNumber: 1,
  number: 1,
  slug: 'part-1',
  title: 'Part 1',
  description: 'First part'
});

// Create a chapter
await tracker.createChapter({
  timelineName: 'my-timeline',
  arcName: 'arc-1',
  episodeNumber: 1,
  partNumber: 1,
  number: 1,
  pov: 'Alice',
  title: 'Chapter 1',
  date: new Date('2024-01-01'),
  excerpt: 'Chapter excerpt',
  location: 'Location',
  words: 1000,
  characters: 5000,
  charactersNoSpaces: 4000,
  paragraphs: 10,
  sentences: 50,
  readingTimeMinutes: 5
});

// Query data
const timelines = await tracker.getTimelines();
const arcs = await tracker.getArcs('my-timeline');
const episodes = await tracker.getEpisodes('my-timeline', 'arc-1');
const chapters = await tracker.getChapters('my-timeline', 'arc-1', 1);

// Update
await tracker.updateTimeline('my-timeline', { description: 'Updated description' });
await tracker.updateChapter('my-timeline', 'arc-1', 1, 1, { title: 'New title' });

// Delete (with cascade)
await tracker.deleteTimeline('my-timeline'); // Deletes all related data

// Close connection
await tracker.close();
```

## API Reference

### Tracker Class

#### Constructor
```typescript
new Tracker(dbPath?: string)
```
- `dbPath`: Path to SQLite database file (default: `./tracker.db`). Use `:memory:` for in-memory database.

#### Initialization
```typescript
async init(): Promise<void>
```
Initializes database schema. Must be called before any other operations.

```typescript
async close(): Promise<void>
```
Closes database connection.

### Timeline Methods

```typescript
async createTimeline(data: Timeline): Promise<Timeline>
async getTimelines(): Promise<Timeline[]>
async getTimeline(name: string): Promise<Timeline | undefined>
async updateTimeline(name: string, data: Partial<Timeline>): Promise<Timeline>
async deleteTimeline(name: string): Promise<void>
```

### Arc Methods

```typescript
async createArc(data: Arc): Promise<Arc>
async getArcs(timelineName: string): Promise<Arc[]>
async getArc(timelineName: string, arcName: string): Promise<Arc | undefined>
async updateArc(timelineName: string, arcName: string, data: Partial<Arc>): Promise<Arc>
async deleteArc(timelineName: string, arcName: string): Promise<void>
```

### Episode Methods

```typescript
async createEpisode(data: Episode): Promise<Episode>
async getEpisodes(timelineName: string, arcName: string): Promise<Episode[]>
async getEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<Episode | undefined>
async updateEpisode(timelineName: string, arcName: string, episodeNumber: number, data: Partial<Episode>): Promise<Episode>
async deleteEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<void>
```

### Part Methods

```typescript
async createPart(data: Part): Promise<Part>
async getParts(timelineName: string, arcName: string, episodeNumber: number): Promise<Part[]>
async getPart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<Part | undefined>
async updatePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number, data: Partial<Part>): Promise<Part>
async deletePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<void>
```

### Chapter Methods

```typescript
async createChapter(data: Chapter): Promise<Chapter>
async getChapters(timelineName: string, arcName: string, episodeNumber: number, partNumber?: number): Promise<Chapter[]>
async getChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<Chapter | undefined>
async updateChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number, data: Partial<Chapter>): Promise<Chapter>
async deleteChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<void>
```

## Database Schema

The library uses SQLite with the following schema:

```
Timeline (1) -> Arc (N) -> Episode (N) -> Part (N) -> Chapter (N)
```

All relationships use cascade delete, so deleting a parent entity automatically deletes all children.

## Type Definitions

All types are imported from `@echoes-io/models`:

```typescript
import type { Timeline, Arc, Episode, Part, Chapter } from '@echoes-io/tracker';
```

See [@echoes-io/models](https://github.com/echoes-io/models) for complete type definitions.

## Validation

All input data is validated using Zod schemas from `@echoes-io/models`. Invalid data will throw a `ZodError` with detailed validation messages.

## Development

### Prerequisites
- Node.js >= 20
- Git

### Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint
npm run lint:fix
```

### Scripts
```bash
npm run dev          # Watch mode for development
npm run build        # Build for production
npm test             # Run tests
npm run test:coverage # Run tests with coverage
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
```

## Integration

### With @echoes-io/models
- Uses all type definitions and Zod validation schemas
- Ensures data consistency across the Echoes ecosystem

### With @echoes-io/utils
- Can be used together for processing markdown content
- Utilities provide text statistics that can be stored in chapters

### With other services
- Provides data layer for sync services (filesystem to database)
- Provides data layer for web applications
- Provides data layer for RAG/semantic search indexing

## Error Handling

The library throws errors in the following cases:
- **ZodError**: Invalid input data (validation failure)
- **Error**: Entity not found (e.g., "Timeline not found")
- **Database errors**: SQLite constraint violations, connection issues

Always wrap operations in try/catch blocks:

```typescript
try {
  await tracker.createTimeline({ name: 'test', description: 'Test' });
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Validation error:', error.errors);
  } else {
    console.error('Database error:', error);
  }
}
```

## License

MIT

