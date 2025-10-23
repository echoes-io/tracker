# @echoes-io/tracker

Type-safe SQLite database library for managing hierarchical story content.

[![npm version](https://img.shields.io/npm/v/@echoes-io/tracker.svg)](https://www.npmjs.com/package/@echoes-io/tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Content Hierarchy](#content-hierarchy)
- [API Reference](#api-reference)
  - [Tracker Class](#tracker-class)
  - [Timeline Methods](#timeline-methods)
  - [Arc Methods](#arc-methods)
  - [Episode Methods](#episode-methods)
  - [Part Methods](#part-methods)
  - [Chapter Methods](#chapter-methods)
- [Database Migrations](#database-migrations)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Development](#development)
- [License](#license)

## Features

- **Type-safe CRUD operations** - Full TypeScript support with Kysely query builder
- **Automatic validation** - All inputs validated using Zod schemas
- **Referential integrity** - Foreign key constraints with cascade delete
- **SQLite storage** - Fast, embedded database with better-sqlite3
- **Automatic migrations** - Database schema updates on init
- **Hierarchical navigation** - Navigate content using names/numbers, not IDs

## Installation

```bash
npm install @echoes-io/tracker
```

## Quick Start

```typescript
import { Tracker } from '@echoes-io/tracker';

// Create tracker instance
const tracker = new Tracker('./echoes.db');

// Initialize database (runs migrations automatically)
await tracker.init();

// Create content
await tracker.createTimeline({
  name: 'my-story',
  description: 'A fantastic adventure'
});

await tracker.createArc({
  timelineName: 'my-story',
  name: 'arc-1',
  number: 1,
  description: 'The beginning'
});

// Query content
const arcs = await tracker.getArcs('my-story');

// Clean up
await tracker.close();
```

## Content Hierarchy

The tracker manages a hierarchical content structure:

```
Timeline (story universe)
  └─ Arc (story phase)
      └─ Episode (story event)
          └─ Part (optional subdivision)
              └─ Chapter (individual content file)
```

**Example:**
- Timeline: `my-fantasy-world`
  - Arc: `the-beginning` (number: 1)
    - Episode: `awakening` (number: 1)
      - Part: `morning` (number: 1)
        - Chapter: POV character chapter (number: 1)

## API Reference

### Tracker Class

#### Constructor

```typescript
new Tracker(dbPath?: string)
```

Creates a new Tracker instance.

- `dbPath`: Path to SQLite database file (default: `./tracker.db`). Use `:memory:` for in-memory database.

#### `init(): Promise<void>`

Initializes the database schema and runs pending migrations. Must be called before any other operations.

#### `close(): Promise<void>`

Closes the database connection. Should be called when done to free resources.

### Timeline Methods

#### `createTimeline(data: Timeline): Promise<Timeline>`

Creates a new timeline.

```typescript
await tracker.createTimeline({
  name: 'my-story',
  description: 'A fantastic adventure'
});
```

#### `getTimelines(): Promise<Timeline[]>`

Retrieves all timelines.

#### `getTimeline(name: string): Promise<Timeline | undefined>`

Retrieves a specific timeline by name.

#### `updateTimeline(name: string, data: Partial<Timeline>): Promise<Timeline>`

Updates a timeline.

#### `deleteTimeline(name: string): Promise<void>`

Deletes a timeline and all its related content (cascades).

### Arc Methods

#### `createArc(data: Arc): Promise<Arc>`

Creates a new arc within a timeline.

```typescript
await tracker.createArc({
  timelineName: 'my-story',
  name: 'arc-1',
  number: 1,
  description: 'First arc'
});
```

#### `getArcs(timelineName: string): Promise<Arc[]>`

Retrieves all arcs in a timeline, ordered by number.

#### `getArc(timelineName: string, arcName: string): Promise<Arc | undefined>`

Retrieves a specific arc.

#### `updateArc(timelineName: string, arcName: string, data: Partial<Arc>): Promise<Arc>`

Updates an arc.

#### `deleteArc(timelineName: string, arcName: string): Promise<void>`

Deletes an arc and all its related content (cascades).

### Episode Methods

#### `createEpisode(data: Episode): Promise<Episode>`

Creates a new episode within an arc.

```typescript
await tracker.createEpisode({
  timelineName: 'my-story',
  arcName: 'arc-1',
  number: 1,
  slug: 'awakening',
  title: 'The Awakening',
  description: 'Hero discovers their power'
});
```

#### `getEpisodes(timelineName: string, arcName: string): Promise<Episode[]>`

Retrieves all episodes in an arc, ordered by number.

#### `getEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<Episode | undefined>`

Retrieves a specific episode.

#### `updateEpisode(timelineName: string, arcName: string, episodeNumber: number, data: Partial<Episode>): Promise<Episode>`

Updates an episode.

#### `deleteEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<void>`

Deletes an episode and all its related content (cascades).

### Part Methods

#### `createPart(data: Part): Promise<Part>`

Creates a new part within an episode.

```typescript
await tracker.createPart({
  timelineName: 'my-story',
  arcName: 'arc-1',
  episodeNumber: 1,
  number: 1,
  slug: 'morning',
  title: 'Morning',
  description: 'The day begins'
});
```

#### `getParts(timelineName: string, arcName: string, episodeNumber: number): Promise<Part[]>`

Retrieves all parts in an episode, ordered by number.

#### `getPart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<Part | undefined>`

Retrieves a specific part.

#### `updatePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number, data: Partial<Part>): Promise<Part>`

Updates a part.

#### `deletePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<void>`

Deletes a part and all its related content (cascades).

### Chapter Methods

#### `createChapter(data: Chapter): Promise<Chapter>`

Creates a new chapter within an episode (and optionally a part).

```typescript
await tracker.createChapter({
  timelineName: 'my-story',
  arcName: 'arc-1',
  episodeNumber: 1,
  partNumber: 1,
  number: 1,
  pov: 'Alice',
  title: 'A Strange Dream',
  date: new Date('2024-01-01'),
  excerpt: 'Alice woke up in a strange place...',
  location: 'Enchanted Forest',
  outfit: 'Blue dress',  // optional
  kink: 'fantasy',       // optional
  words: 1500,
  characters: 7500,
  charactersNoSpaces: 6000,
  paragraphs: 15,
  sentences: 75,
  readingTimeMinutes: 8
});
```

#### `getChapters(timelineName: string, arcName: string, episodeNumber: number, partNumber?: number): Promise<Chapter[]>`

Retrieves chapters in an episode, optionally filtered by part.

#### `getChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<Chapter | undefined>`

Retrieves a specific chapter.

#### `updateChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number, data: Partial<Chapter>): Promise<Chapter>`

Updates a chapter.

#### `deleteChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<void>`

Deletes a chapter.

## Database Migrations

Migrations run automatically when you call `tracker.init()`.

### How It Works

- Migrations are stored in the `migrations/` directory
- Each migration file follows the pattern `XXX_description.ts` (e.g., `001_initial.ts`)
- Executed migrations are tracked in the `_migrations` table
- Only pending migrations run on initialization
- Each migration runs in a transaction (atomic)

### Creating a Migration

Create a file in `migrations/` with the next number:

```typescript
// migrations/002_add_tags.ts
import type { Kysely } from 'kysely';
import type { Database } from '../lib/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('tags')
    .addColumn('name', 'text', (col) => col.primaryKey())
    .addColumn('description', 'text')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('tags').execute();
}
```

The migration will run automatically the next time `tracker.init()` is called.

## Type Definitions

All types are imported from `@echoes-io/models`:

```typescript
import type { 
  Timeline, 
  Arc, 
  Episode, 
  Part, 
  Chapter 
} from '@echoes-io/tracker';
```

## Error Handling

The library throws errors in the following cases:

- **ZodError**: Invalid input data (validation failure)
- **Error**: Entity not found (e.g., "Timeline not found")
- **Database errors**: SQLite constraint violations, connection issues

Always wrap operations in try/catch blocks:

```typescript
try {
  await tracker.createTimeline({
    name: 'my-story',
    description: 'Test'
  });
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Validation error:', error.errors);
  } else {
    console.error('Database error:', error.message);
  }
}
```

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
```

### Testing

The library includes comprehensive tests covering all CRUD operations, cascade deletes, error cases, and migrations.

Test structure:

```
test/
└── lib/
    ├── connection.test.ts  # Database connection tests
    ├── index.test.ts       # Module exports tests
    ├── migrations.test.ts  # Migration system tests
    └── tracker.test.ts     # Tracker CRUD operations tests
```

Current coverage: **~99%** statements, **100%** functions.

## License

MIT

---

Part of the [Echoes](https://github.com/echoes-io) project - a multi-POV digital storytelling platform.
