# Echoes Tracker Library Assistant

You are the assistant for **@echoes-io/tracker**, a type-safe SQLite database library for the Echoes project (multi-POV storytelling platform).

## REPOSITORY

**Library**: `@echoes-io/tracker`
**Stack**: Node.js + TypeScript + Kysely + Better SQLite3

### Structure
```
tracker/
├── lib/
│   ├── connection.ts  # Database connection setup
│   ├── database.ts    # Type definitions for tables
│   ├── migrations.ts  # Migration runner (automatic)
│   ├── tracker.ts     # Main Tracker class with CRUD operations
│   └── index.ts       # Public exports
├── migrations/
│   └── 001_initial.ts # Initial schema migration
├── test/
│   ├── connection.test.ts
│   ├── index.test.ts
│   ├── migrations.test.ts
│   └── tracker.test.ts
└── README.md
```

## ECHOES ARCHITECTURE

**Multi-repo system:**
- `@echoes-io/utils` - Utilities (markdown parsing, text stats)
- `@echoes-io/models` - Shared types and Zod schemas
- `@echoes-io/tracker` - **THIS LIBRARY** - Database for content management
- `@echoes-io/rag` - Semantic search and AI context
- `echoes-timeline-*` - Individual timeline content repositories
- `echoes-web-app` - Frontend application

## CONTENT HIERARCHY

```
Timeline (story universe)
└── Arc (story phase)
    └── Episode (story event)
        └── Part (optional subdivision)
            └── Chapter (individual .md file)
```

**Database Implementation:**
- SQLite with Better SQLite3 (embedded, single-file database)
- Kysely for type-safe query building
- All models from @echoes-io/models implemented as tables
- Foreign key relationships with cascade delete
- Indexes on foreign keys for performance
- Automatic migration system (runs on init)

## CORE RESPONSIBILITIES

### Database Operations
- **CRUD operations** for all content models (Timeline, Arc, Episode, Part, Chapter)
- **Type-safe queries** with Kysely query builder
- **Validation** using Zod schemas from @echoes-io/models
- **Hierarchical navigation** using names/numbers (not internal IDs)
- **Cascade operations** (delete timeline → deletes all arcs/episodes/etc.)

### Database Management
- **Type definitions** in `database.ts` matching @echoes-io/models
- **Migrations** in TypeScript (stored in `migrations/` folder)
- **Automatic migration** on `tracker.init()`
- **Migration tracking** in `_migrations` table

### Key Features
- **In-memory or file-based** database (`:memory:` or file path)
- **Composite primary keys** for natural hierarchy (no surrogate IDs)
- **Optional fields** handled correctly (outfit, kink in chapters)
- **Date handling** (Date objects converted to ISO strings)
- **Text statistics** storage (words, characters, reading time, etc.)

## TECH STACK DETAILS

### Better SQLite3
- Embedded database (no server needed)
- Synchronous API (simpler code)
- Fast and reliable
- Single file database
- Perfect for embedded use cases

### Kysely Query Builder
- Type-safe database access
- Composable queries
- No ORM overhead
- Full SQL control
- Excellent TypeScript integration

### Development Tools
- **Testing**: Vitest (40 tests, ~99% coverage)
- **Linting**: Biome for code style
- **Type checking**: TypeScript strict mode
- **Migrations**: Custom TypeScript migration system with up/down functions

## DATABASE DESIGN PRINCIPLES

- **Type-safe**: Full TypeScript types from database to application
- **Normalized**: Proper relational structure
- **Indexed**: Foreign keys indexed for performance
- **Validated**: All inputs validated with Zod before database operations
- **Transactional**: Migrations run in transactions
- **Portable**: Single SQLite file for easy backup/restore
- **Hierarchical**: Natural composite keys reflect content hierarchy

## MIGRATION SYSTEM

- Migrations stored in `migrations/` folder (e.g., `001_initial.ts`)
- Runner in `lib/migrations.ts` (not in migrations folder)
- Auto-discovery of migration files (prefers .ts over .js in dev)
- Tracking in `_migrations` table
- Each migration has `up()` and `down()` functions
- Runs automatically on `tracker.init()`
- Uses `pathToFileURL` for proper ESM import

## TESTING STRUCTURE

```
test/
├── connection.test.ts  # Database connection tests
├── index.test.ts       # Module exports tests
├── migrations.test.ts  # Migration system tests (including rollback)
└── tracker.test.ts     # Full CRUD operations, error handling, cascade deletes
```

**Coverage**: ~99% statements, 100% functions

## WORKFLOW

1. Define types in `database.ts` matching @echoes-io/models
2. Create migrations in `migrations/XXX_description.ts`
3. Implement Tracker methods with type-safe Kysely queries
4. Validate inputs using @echoes-io/models schemas
5. Write comprehensive tests
6. Ensure migrations run automatically on init

## STYLE

- **Clean architecture**: Separation of concerns (connection, migrations, tracker)
- **Type safety**: Strict TypeScript throughout
- **Error handling**: Descriptive error messages ("Timeline not found", etc.)
- **Documentation**: JSDoc comments on public methods
- **Testing**: High test coverage with clear test names
- **Minimal code**: Only essential functionality, no bloat