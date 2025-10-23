# @echoes-io/tracker

Database library for **Echoes** - a multi-POV digital storytelling platform.

## Overview

The tracker library provides a type-safe database abstraction for managing Echoes content hierarchy. It handles the complete content structure from timelines down to individual chapters, with automatic validation, referential integrity, and cascade operations.

### Key Features

- **Type-safe CRUD operations** - Full TypeScript support with Kysely query builder
- **Automatic validation** - All inputs validated using Zod schemas from @echoes-io/models
- **Referential integrity** - Foreign key constraints with cascade delete
- **SQLite storage** - Fast, embedded database with better-sqlite3
- **Hierarchical navigation** - Navigate content using names/numbers, not internal IDs
- **Rich metadata** - Store comprehensive chapter metadata including text statistics

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

## Content Hierarchy

The tracker manages a hierarchical content structure:

```
Timeline (story universe)
  └─ Arc (story phase/arc)
      └─ Episode (story event)
          └─ Part (optional subdivision)
              └─ Chapter (individual .md file)
```

Each level has:
- **Timeline**: Root container for a story (e.g., "my-fantasy-world")
- **Arc**: Major story phase (e.g., "The Beginning", "The Journey")
- **Episode**: Story event or collection of chapters (e.g., "The Awakening")
- **Part**: Optional subdivision of episodes (e.g., "Morning", "Afternoon")
- **Chapter**: Individual content file with metadata and statistics

## Installation

```bash
npm install @echoes-io/tracker
```

## Quick Start

```typescript
import { Tracker } from '@echoes-io/tracker';

// Create tracker instance
const tracker = new Tracker('./echoes.db');

// Initialize database schema
await tracker.init();

// Create content hierarchy
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

await tracker.createEpisode({
  timelineName: 'my-story',
  arcName: 'arc-1',
  number: 1,
  slug: 'awakening',
  title: 'The Awakening',
  description: 'Our hero wakes up'
});

// Query content
const episodes = await tracker.getEpisodes('my-story', 'arc-1');
console.log(`Found ${episodes.length} episodes`);

// Clean up
await tracker.close();
```

## Usage Guide

### Initialization

```typescript
import { Tracker } from '@echoes-io/tracker';

// File-based database (persists to disk)
const tracker = new Tracker('./my-database.db');

// In-memory database (useful for testing)
const testTracker = new Tracker(':memory:');

// Initialize schema (required before any operations)
await tracker.init();
```

### Timeline Operations

```typescript
// Create
const timeline = await tracker.createTimeline({
  name: 'my-story',
  description: 'An epic tale'
});

// Read
const allTimelines = await tracker.getTimelines();
const specific = await tracker.getTimeline('my-story');

// Update
await tracker.updateTimeline('my-story', {
  description: 'An even more epic tale'
});

// Delete (cascades to all arcs, episodes, parts, chapters)
await tracker.deleteTimeline('my-story');
```

### Arc Operations

```typescript
// Create
await tracker.createArc({
  timelineName: 'my-story',
  name: 'arc-1',
  number: 1,
  description: 'First arc'
});

// Read
const arcs = await tracker.getArcs('my-story');
const arc = await tracker.getArc('my-story', 'arc-1');

// Update
await tracker.updateArc('my-story', 'arc-1', {
  description: 'Updated description'
});

// Delete (cascades to episodes, parts, chapters)
await tracker.deleteArc('my-story', 'arc-1');
```

### Episode Operations

```typescript
// Create
await tracker.createEpisode({
  timelineName: 'my-story',
  arcName: 'arc-1',
  number: 1,
  slug: 'awakening',
  title: 'The Awakening',
  description: 'Hero wakes up'
});

// Read
const episodes = await tracker.getEpisodes('my-story', 'arc-1');
const episode = await tracker.getEpisode('my-story', 'arc-1', 1);

// Update
await tracker.updateEpisode('my-story', 'arc-1', 1, {
  title: 'The Great Awakening'
});

// Delete (cascades to parts, chapters)
await tracker.deleteEpisode('my-story', 'arc-1', 1);
```

### Part Operations

Parts are optional subdivisions of episodes.

```typescript
// Create
await tracker.createPart({
  timelineName: 'my-story',
  arcName: 'arc-1',
  episodeNumber: 1,
  number: 1,
  slug: 'morning',
  title: 'Morning',
  description: 'The morning events'
});

// Read
const parts = await tracker.getParts('my-story', 'arc-1', 1);
const part = await tracker.getPart('my-story', 'arc-1', 1, 1);

// Update
await tracker.updatePart('my-story', 'arc-1', 1, 1, {
  title: 'Early Morning'
});

// Delete (cascades to chapters)
await tracker.deletePart('my-story', 'arc-1', 1, 1);
```

### Chapter Operations

Chapters contain the actual content metadata and statistics.

```typescript
// Create with full metadata
await tracker.createChapter({
  timelineName: 'my-story',
  arcName: 'arc-1',
  episodeNumber: 1,
  partNumber: 1,
  number: 1,
  
  // Content metadata
  pov: 'Alice',
  title: 'A Strange Dream',
  date: new Date('2024-01-01'),
  excerpt: 'Alice woke up in a strange place...',
  location: 'Enchanted Forest',
  outfit: 'Blue dress',  // optional
  kink: 'fantasy',       // optional
  
  // Text statistics (typically from @echoes-io/utils)
  words: 1500,
  characters: 7500,
  charactersNoSpaces: 6000,
  paragraphs: 15,
  sentences: 75,
  readingTimeMinutes: 8
});

// Read all chapters in an episode
const allChapters = await tracker.getChapters('my-story', 'arc-1', 1);

// Read chapters in a specific part
const partChapters = await tracker.getChapters('my-story', 'arc-1', 1, 1);

// Read specific chapter
const chapter = await tracker.getChapter('my-story', 'arc-1', 1, 1);
if (chapter) {
  console.log(`${chapter.pov}: ${chapter.title}`);
  console.log(`${chapter.words} words, ${chapter.readingTimeMinutes}min read`);
}

// Update
await tracker.updateChapter('my-story', 'arc-1', 1, 1, {
  title: 'A Very Strange Dream',
  words: 1600
});

// Delete
await tracker.deleteChapter('my-story', 'arc-1', 1, 1);
```

## API Reference

### Constructor

```typescript
new Tracker(dbPath?: string)
```

Creates a new Tracker instance.

- **dbPath**: Path to SQLite database file (default: `./tracker.db`). Use `:memory:` for in-memory database.

### Initialization Methods

#### `init(): Promise<void>`

Initializes the database schema. Must be called before any other operations.

**Throws**: Error if database initialization fails

#### `close(): Promise<void>`

Closes the database connection. Should be called when done to free resources.

### Timeline Methods

#### `createTimeline(data: Timeline): Promise<Timeline>`

Creates a new timeline.

**Parameters**:
- `data`: Timeline data with `name` and `description`

**Returns**: The created timeline

**Throws**: ZodError if validation fails

#### `getTimelines(): Promise<Timeline[]>`

Retrieves all timelines.

**Returns**: Array of all timelines

#### `getTimeline(name: string): Promise<Timeline | undefined>`

Retrieves a specific timeline by name.

**Parameters**:
- `name`: Timeline name

**Returns**: The timeline if found, undefined otherwise

#### `updateTimeline(name: string, data: Partial<Timeline>): Promise<Timeline>`

Updates a timeline.

**Parameters**:
- `name`: Timeline name to update
- `data`: Partial timeline data to update

**Returns**: The updated timeline

**Throws**: 
- Error if timeline not found
- ZodError if validation fails

#### `deleteTimeline(name: string): Promise<void>`

Deletes a timeline and all its related content (cascades).

**Parameters**:
- `name`: Timeline name to delete

### Arc Methods

#### `createArc(data: Arc): Promise<Arc>`

Creates a new arc within a timeline.

**Parameters**:
- `data`: Arc data with `timelineName`, `name`, `number`, and `description`

**Returns**: The created arc

**Throws**: 
- Error if timeline not found
- ZodError if validation fails

#### `getArcs(timelineName: string): Promise<Arc[]>`

Retrieves all arcs in a timeline, ordered by number.

**Parameters**:
- `timelineName`: Timeline name

**Returns**: Array of arcs

#### `getArc(timelineName: string, arcName: string): Promise<Arc | undefined>`

Retrieves a specific arc.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name

**Returns**: The arc if found, undefined otherwise

#### `updateArc(timelineName: string, arcName: string, data: Partial<Arc>): Promise<Arc>`

Updates an arc.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name to update
- `data`: Partial arc data to update

**Returns**: The updated arc

**Throws**: 
- Error if arc not found
- ZodError if validation fails

#### `deleteArc(timelineName: string, arcName: string): Promise<void>`

Deletes an arc and all its related content (cascades).

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name to delete

### Episode Methods

#### `createEpisode(data: Episode): Promise<Episode>`

Creates a new episode within an arc.

**Parameters**:
- `data`: Episode data with `timelineName`, `arcName`, `number`, `slug`, `title`, and `description`

**Returns**: The created episode

**Throws**: 
- Error if arc not found
- ZodError if validation fails

#### `getEpisodes(timelineName: string, arcName: string): Promise<Episode[]>`

Retrieves all episodes in an arc, ordered by number.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name

**Returns**: Array of episodes

#### `getEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<Episode | undefined>`

Retrieves a specific episode.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number

**Returns**: The episode if found, undefined otherwise

#### `updateEpisode(timelineName: string, arcName: string, episodeNumber: number, data: Partial<Episode>): Promise<Episode>`

Updates an episode.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number to update
- `data`: Partial episode data to update

**Returns**: The updated episode

**Throws**: 
- Error if episode not found
- ZodError if validation fails

#### `deleteEpisode(timelineName: string, arcName: string, episodeNumber: number): Promise<void>`

Deletes an episode and all its related content (cascades).

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number to delete

### Part Methods

#### `createPart(data: Part): Promise<Part>`

Creates a new part within an episode.

**Parameters**:
- `data`: Part data with `timelineName`, `arcName`, `episodeNumber`, `number`, `slug`, `title`, and `description`

**Returns**: The created part

**Throws**: 
- Error if episode not found
- ZodError if validation fails

#### `getParts(timelineName: string, arcName: string, episodeNumber: number): Promise<Part[]>`

Retrieves all parts in an episode, ordered by number.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number

**Returns**: Array of parts

#### `getPart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<Part | undefined>`

Retrieves a specific part.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `partNumber`: Part number

**Returns**: The part if found, undefined otherwise

#### `updatePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number, data: Partial<Part>): Promise<Part>`

Updates a part.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `partNumber`: Part number to update
- `data`: Partial part data to update

**Returns**: The updated part

**Throws**: 
- Error if part not found
- ZodError if validation fails

#### `deletePart(timelineName: string, arcName: string, episodeNumber: number, partNumber: number): Promise<void>`

Deletes a part and all its related content (cascades).

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `partNumber`: Part number to delete

### Chapter Methods

#### `createChapter(data: Chapter): Promise<Chapter>`

Creates a new chapter within an episode (and optionally a part).

**Parameters**:
- `data`: Chapter data including metadata and text statistics

**Returns**: The created chapter

**Throws**: 
- Error if episode or part not found
- ZodError if validation fails

#### `getChapters(timelineName: string, arcName: string, episodeNumber: number, partNumber?: number): Promise<Chapter[]>`

Retrieves chapters in an episode, optionally filtered by part.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `partNumber`: Optional part number to filter by

**Returns**: Array of chapters, ordered by number

#### `getChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<Chapter | undefined>`

Retrieves a specific chapter.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `chapterNumber`: Chapter number

**Returns**: The chapter if found, undefined otherwise

#### `updateChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number, data: Partial<Chapter>): Promise<Chapter>`

Updates a chapter.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `chapterNumber`: Chapter number to update
- `data`: Partial chapter data to update

**Returns**: The updated chapter

**Throws**: 
- Error if chapter not found
- ZodError if validation fails

#### `deleteChapter(timelineName: string, arcName: string, episodeNumber: number, chapterNumber: number): Promise<void>`

Deletes a chapter.

**Parameters**:
- `timelineName`: Timeline name
- `arcName`: Arc name
- `episodeNumber`: Episode number
- `chapterNumber`: Chapter number to delete

## Database Schema

The library uses SQLite with the following schema:

```sql
Timeline (1) -> Arc (N) -> Episode (N) -> Part (N) -> Chapter (N)
```

All relationships use foreign keys with `ON DELETE CASCADE`, ensuring referential integrity. Deleting a parent entity automatically deletes all children.

### Tables

All column names use camelCase for consistency with TypeScript/JavaScript conventions:

- **timeline**: `id`, `name` (unique), `description`, `createdAt`, `updatedAt`
- **arc**: `id`, `timelineId` (FK), `name`, `number`, `description`, `createdAt`, `updatedAt`
- **episode**: `id`, `arcId` (FK), `number`, `slug`, `title`, `description`, `createdAt`, `updatedAt`
- **part**: `id`, `episodeId` (FK), `number`, `slug`, `title`, `description`, `createdAt`, `updatedAt`
- **chapter**: `id`, `episodeId` (FK), `partId` (FK, nullable), `number`, `pov`, `title`, `date`, `excerpt`, `location`, `outfit`, `kink`, `words`, `characters`, `charactersNoSpaces`, `paragraphs`, `sentences`, `readingTimeMinutes`, `createdAt`, `updatedAt`

### Indexes

Indexes are created on all foreign key columns for optimal query performance.

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

See [@echoes-io/models](https://github.com/echoes-io/models) for complete type definitions and schemas.

## Validation

All input data is automatically validated using Zod schemas from `@echoes-io/models`. Invalid data will throw a `ZodError` with detailed validation messages.

```typescript
try {
  await tracker.createTimeline({
    name: '',  // Invalid: empty string
    description: 'Test'
  });
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Validation errors:', error.errors);
    // [{ path: ['name'], message: 'Timeline name is required' }]
  }
}
```

## Error Handling

The library throws errors in the following cases:

- **ZodError**: Invalid input data (validation failure)
- **Error**: Entity not found (e.g., "Timeline not found")
- **Database errors**: SQLite constraint violations, connection issues

Always wrap operations in try/catch blocks:

```typescript
try {
  const timeline = await tracker.getTimeline('non-existent');
  if (!timeline) {
    console.log('Timeline not found');
  }
  
  await tracker.createArc({
    timelineName: 'non-existent',
    name: 'arc-1',
    number: 1,
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

## Integration

### With @echoes-io/models

The tracker uses all type definitions and Zod validation schemas from @echoes-io/models, ensuring data consistency across the Echoes ecosystem.

### With @echoes-io/utils

Typically used together for processing markdown content:

```typescript
import { Tracker } from '@echoes-io/tracker';
import { calculateTextStats } from '@echoes-io/utils';

const content = readMarkdownFile('chapter.md');
const stats = calculateTextStats(content);

await tracker.createChapter({
  ...frontmatter,
  ...stats,
  timelineName: 'my-story',
  arcName: 'arc-1',
  episodeNumber: 1,
  partNumber: 1
});
```

### With Other Services

- **Sync services**: Populate database from filesystem
- **Web applications**: Query content for display
- **RAG/semantic search**: Index content for search

## Database Migrations

The tracker uses an automatic migration system. Migrations run automatically when you call `tracker.init()`.

### How It Works

- Migrations are stored in the `migrations/` directory
- Each migration file follows the pattern `XXX_description.ts` (e.g., `001_initial.ts`)
- Executed migrations are tracked in the `_migrations` table
- Only pending migrations run on initialization
- Each migration runs in a transaction (atomic)
- Migrations execute in alphabetical order

### Creating a Migration

To add a new migration, create a file in `migrations/` with the next number:

```typescript
// migrations/002_add_tags.ts
import type { Kysely } from 'kysely';
import type { Database } from '../lib/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  // Apply changes
  await db.schema
    .createTable('tags')
    .addColumn('name', 'text', (col) => col.primaryKey())
    .addColumn('description', 'text')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Rollback changes (for manual recovery if needed)
  await db.schema.dropTable('tags').execute();
}
```

The migration will run automatically the next time `tracker.init()` is called.

### Best Practices

- **Keep migrations small** - One logical change per migration
- **Always provide `down()`** - For potential manual rollbacks
- **Never modify deployed migrations** - Create a new migration instead
- **Test on a copy** - Test migrations on a database copy before production
- **Use descriptive names** - `002_add_user_roles.ts` not `002_update.ts`

### Migration Structure

```
migrations/
├── index.ts           # Migration runner (automatic)
├── 001_initial.ts     # Initial schema
├── 002_add_tags.ts    # Add tags feature
└── 003_add_indexes.ts # Performance improvements
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

### Testing

The library includes comprehensive tests covering all CRUD operations, cascade deletes, and error cases.

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run dev
```

## Examples

### Complete Workflow

```typescript
import { Tracker } from '@echoes-io/tracker';

async function main() {
  const tracker = new Tracker('./echoes.db');
  await tracker.init();

  try {
    // Create hierarchy
    await tracker.createTimeline({
      name: 'fantasy-world',
      description: 'A magical fantasy world'
    });

    await tracker.createArc({
      timelineName: 'fantasy-world',
      name: 'beginning',
      number: 1,
      description: 'The story begins'
    });

    await tracker.createEpisode({
      timelineName: 'fantasy-world',
      arcName: 'beginning',
      number: 1,
      slug: 'awakening',
      title: 'The Awakening',
      description: 'Hero discovers their power'
    });

    await tracker.createPart({
      timelineName: 'fantasy-world',
      arcName: 'beginning',
      episodeNumber: 1,
      number: 1,
      slug: 'morning',
      title: 'Morning',
      description: 'The day begins'
    });

    await tracker.createChapter({
      timelineName: 'fantasy-world',
      arcName: 'beginning',
      episodeNumber: 1,
      partNumber: 1,
      number: 1,
      pov: 'Alice',
      title: 'A Strange Dream',
      date: new Date('2024-01-01'),
      excerpt: 'Alice woke up in a strange place...',
      location: 'Enchanted Forest',
      words: 1500,
      characters: 7500,
      charactersNoSpaces: 6000,
      paragraphs: 15,
      sentences: 75,
      readingTimeMinutes: 8
    });

    // Query
    const chapters = await tracker.getChapters('fantasy-world', 'beginning', 1);
    console.log(`Created ${chapters.length} chapters`);

    // Update
    await tracker.updateChapter('fantasy-world', 'beginning', 1, 1, {
      title: 'A Very Strange Dream'
    });

    // Clean up
    await tracker.deleteTimeline('fantasy-world');
  } finally {
    await tracker.close();
  }
}

main().catch(console.error);
```

### Batch Operations

```typescript
async function importContent(tracker: Tracker) {
  const timeline = 'my-story';
  const arc = 'arc-1';
  const episode = 1;

  // Create multiple chapters
  const chapters = [
    { number: 1, pov: 'Alice', title: 'Chapter 1', /* ... */ },
    { number: 2, pov: 'Bob', title: 'Chapter 2', /* ... */ },
    { number: 3, pov: 'Alice', title: 'Chapter 3', /* ... */ },
  ];

  for (const chapter of chapters) {
    await tracker.createChapter({
      timelineName: timeline,
      arcName: arc,
      episodeNumber: episode,
      partNumber: 1,
      ...chapter
    });
  }

  console.log(`Imported ${chapters.length} chapters`);
}
```

## License

MIT

## Contributing

Contributions are welcome! Please ensure:

- All tests pass (`npm test`)
- Code follows style guide (`npm run lint`)
- New features include tests
- Documentation is updated

## Support

For issues and questions:
- GitHub Issues: [echoes-io/tracker](https://github.com/echoes-io/tracker/issues)
- Documentation: This README and JSDoc comments in code
