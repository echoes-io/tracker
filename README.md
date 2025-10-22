# @echoes-io/tracker

Content management API and database for **Echoes** - a multi-POV digital storytelling platform.

## Overview

The tracker service provides:
- **REST API** for content management (Timeline, Arc, Episode, Part, Chapter)
- **Database** for storing content metadata and statistics
- **Synchronization** with timeline repositories
- **Content indexing** and search capabilities
- **API endpoints** for the web application and other services

## Architecture Context

Echoes is organized as a multi-repository system:

```
@echoes-io/utils     # Shared utilities (markdown parsing, text stats)
@echoes-io/models    # Shared types and schemas
@echoes-io/tracker   # This service - Content management API and database
@echoes-io/rag       # Semantic search and AI context
echoes-timeline-*    # Individual timeline content repositories
echoes-web-app       # Frontend application
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod (via @echoes-io/models)
- **Testing**: Vitest
- **Linting**: Biome

## API Endpoints

### Timelines
- `GET /api/timelines` - List all timelines
- `GET /api/timelines/:name` - Get timeline details
- `POST /api/timelines` - Create timeline
- `PUT /api/timelines/:name` - Update timeline
- `DELETE /api/timelines/:name` - Delete timeline

### Arcs
- `GET /api/timelines/:timeline/arcs` - List arcs in timeline
- `GET /api/timelines/:timeline/arcs/:name` - Get arc details
- `POST /api/timelines/:timeline/arcs` - Create arc
- `PUT /api/timelines/:timeline/arcs/:name` - Update arc
- `DELETE /api/timelines/:timeline/arcs/:name` - Delete arc

### Episodes
- `GET /api/timelines/:timeline/arcs/:arc/episodes` - List episodes in arc
- `GET /api/timelines/:timeline/arcs/:arc/episodes/:number` - Get episode details
- `POST /api/timelines/:timeline/arcs/:arc/episodes` - Create episode
- `PUT /api/timelines/:timeline/arcs/:arc/episodes/:number` - Update episode
- `DELETE /api/timelines/:timeline/arcs/:arc/episodes/:number` - Delete episode

### Parts
- `GET /api/timelines/:timeline/arcs/:arc/episodes/:episode/parts` - List parts in episode
- `GET /api/timelines/:timeline/arcs/:arc/episodes/:episode/parts/:number` - Get part details
- `POST /api/timelines/:timeline/arcs/:arc/episodes/:episode/parts` - Create part
- `PUT /api/timelines/:timeline/arcs/:arc/episodes/:episode/parts/:number` - Update part
- `DELETE /api/timelines/:timeline/arcs/:arc/episodes/:episode/parts/:number` - Delete part

### Chapters
- `GET /api/timelines/:timeline/arcs/:arc/episodes/:episode/chapters` - List chapters in episode
- `GET /api/timelines/:timeline/arcs/:arc/episodes/:episode/chapters/:number` - Get chapter details
- `POST /api/timelines/:timeline/arcs/:arc/episodes/:episode/chapters` - Create chapter
- `PUT /api/timelines/:timeline/arcs/:arc/episodes/:episode/chapters/:number` - Update chapter
- `DELETE /api/timelines/:timeline/arcs/:arc/episodes/:episode/chapters/:number` - Delete chapter

### Sync
- `POST /api/sync/timeline/:name` - Sync timeline repository with database
- `POST /api/sync/all` - Sync all timeline repositories

## Database Schema

Uses Prisma with PostgreSQL to implement the content hierarchy:

```
Timeline (1) -> Arc (N) -> Episode (N) -> Part (N) -> Chapter (N)
```

All models from `@echoes-io/models` are implemented as database tables with proper relationships and constraints.

## Development

### Prerequisites
- Node.js >= 20
- PostgreSQL >= 14
- Git

### Setup
```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Scripts
```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server

# Database
npm run db:setup     # Setup database
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed with sample data

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Linting
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/echoes_tracker"

# Server
PORT=3000
NODE_ENV=development

# Timeline repositories (for sync)
TIMELINES_BASE_PATH="/path/to/timeline/repositories"
```

## Integration

### With @echoes-io/models
- Uses all type definitions and validation schemas
- Implements database models matching the interfaces

### With @echoes-io/utils
- Uses utilities for markdown parsing and text statistics
- Leverages path generation for file operations

### With timeline repositories
- Syncs content from filesystem to database
- Watches for file changes and updates metadata

### With @echoes-io/rag
- Provides content for semantic indexing
- Receives search queries and returns results

## License

MIT
