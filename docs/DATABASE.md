# Database Architecture & Development Guide

**The Growth Archive**  
**Canonical Production Engine:** PostgreSQL 16+  
**Local Development Fallback:** SQLite (WAL Mode)

---

## 1. Canonical Production Database (PostgreSQL 16+)

PostgreSQL is the **sole authoritative production database** for The Growth Archive. All production deployments, database migrations, locking mechanisms, unique constraints, and high-concurrency validations must target PostgreSQL.

### Canonical Schema Location
- **Schema**: [`prisma/schema.prisma`](file:///Users/chotachetan/Documents/MMDP/prisma/schema.prisma)
- **Initial Migration**: [`prisma/migrations/20260915_000001_init/migration.sql`](file:///Users/chotachetan/Documents/MMDP/prisma/migrations/20260915_000001_init/migration.sql)
- **Migration Lock**: [`prisma/migrations/migration_lock.toml`](file:///Users/chotachetan/Documents/MMDP/prisma/migrations/migration_lock.toml) (`provider = "postgresql"`)

### Production Environment Variables (`.env.production`)
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/the_growth_archive?schema=public&sslmode=require"
```

### Applying Migrations in Production / Staging
```bash
# Generate Prisma Client for PostgreSQL
npm run db:generate:pg

# Apply existing migrations to production database
npx prisma migrate deploy

# Seed catalog and initial admin
npm run db:seed
```

---

## 2. Local Development Database (SQLite WAL)

For instantaneous offline development without requiring a local PostgreSQL daemon or Docker container, an SQLite schema is provided:
- **Schema**: [`prisma/schema.sqlite.prisma`](file:///Users/chotachetan/Documents/MMDP/prisma/schema.sqlite.prisma)
- **Database File**: `prisma/dev.db`

### Local Development Environment Variables (`.env.local` / `.env`)
```env
DATABASE_URL="file:./dev.db"
```

### Synchronizing and Seeding Local Development Database
```bash
# Push schema to SQLite dev.db
npm run db:push:sqlite

# Seed products, bundles, and initial admin
npm run db:seed
```

---

## 3. PostgreSQL vs. SQLite Parity Limitations & Rules

> [!WARNING]
> **Never validate race conditions or high-concurrency workflows against SQLite.**  
> SQLite locks the entire database file during writes (`SQLITE_BUSY`). True row-level locking, atomic upserts with concurrency, and webhook race tests must be run against PostgreSQL in staging/CI.

| Feature / Behavior | Production (PostgreSQL 16+) | Local Development (SQLite) | Engineering Parity Rule |
| :--- | :--- | :--- | :--- |
| **Row-Level Locking** | Supported via `SELECT ... FOR UPDATE` and `SKIP LOCKED`. | Unsupported. Uses whole-file write locks. | Background workers (`EmailOutbox`, `WebhookLedger`) rely on atomic row locks in production. |
| **Native Enums** | Native PostgreSQL `CREATE TYPE ... AS ENUM`. | Stored as text strings. | Prisma Client handles runtime validation; application code must use typed enum constants. |
| **Scalar Arrays** | Native `String[]` text arrays. | Stored as JSON strings. | Use helper functions for stringifying/parsing array fields when interacting directly. |
| **Case Insensitivity** | Requires `mode: 'insensitive'` or PostgreSQL `ILIKE`. | Case-insensitive for ASCII strings by default. | All search/lookup Prisma queries MUST explicitly specify `{ mode: 'insensitive' }`. |
| **Date Arithmetic** | Native microsecond intervals (`NOW() - INTERVAL '5 minutes'`). | Epoch or ISO strings. | Application code must compute target timestamps using JavaScript `Date` instances rather than raw DB syntax. |

---

## 4. Admin Provisioning CLI

To provision an initial administrator or update credentials with secure **scrypt** password hashing ($N=16384, r=8, p=1$):

```bash
# Provision default admin (admin@thegrowtharchive.com)
npm run admin:create

# Or provision with custom credentials
npx tsx scripts/create-admin.ts --email "lead@thegrowtharchive.com" --name "Lead Ops" --password "YourStrongPassword123!#" --role "OWNER"
```

Raw passwords and credentials are never written to logs or database tables.
