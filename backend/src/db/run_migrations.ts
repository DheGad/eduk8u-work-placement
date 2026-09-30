/**
 * @file run_migrations.ts
 * @description PostgreSQL migration runner for the EDUK8U Work Placement Intelligence Platform.
 *
 * Reads all .sql files from the migrations directory in lexicographic (numeric) order
 * and executes them sequentially within a single transaction per file. Maintains a
 * schema_migrations tracking table to ensure idempotency — already-applied migrations
 * are skipped on subsequent runs.
 *
 * Usage:
 *   npx ts-node src/db/run_migrations.ts
 *   # or with environment variables:
 *   DATABASE_URL=postgres://... npx ts-node src/db/run_migrations.ts
 *
 * Environment variables (loaded from .env if present):
 *   DATABASE_URL   — Full PostgreSQL connection string (preferred)
 *   PGHOST         — Postgres host (fallback)
 *   PGPORT         — Postgres port (fallback)
 *   PGDATABASE     — Database name (fallback)
 *   PGUSER         — Username (fallback)
 *   PGPASSWORD     — Password (fallback)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Client, ClientConfig } from 'pg';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Resolves PostgreSQL client configuration from environment variables.
 * Prefers DATABASE_URL; falls back to individual PG* variables.
 */
function resolveClientConfig(): ClientConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl:
        databaseUrl.includes('ssl=true') ||
        process.env.PGSSL === 'true'
          ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' }
          : undefined,
    };
  }

  return {
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? '5432'),
    database: process.env.PGDATABASE ?? 'eduk8u',
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD,
  };
}

// ---------------------------------------------------------------------------
// Migration Tracking Table
// ---------------------------------------------------------------------------

const CREATE_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
    id              SERIAL       PRIMARY KEY,
    filename        VARCHAR(500) NOT NULL UNIQUE,
    checksum_sha256 VARCHAR(64)  NOT NULL,
    applied_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    execution_ms    INTEGER      NOT NULL
  );

  COMMENT ON TABLE ${MIGRATIONS_TABLE} IS
    'Migration tracking table — records all applied SQL migrations with checksums '
    'to ensure idempotency and detect file tampering.';
`;

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Computes the SHA-256 hex digest of a string.
 * Used to detect if a migration file has changed after being applied.
 */
function sha256(content: string): string {
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Reads all .sql files from the migrations directory, sorted lexicographically.
 * Files must be named with a numeric prefix (e.g. 001_name.sql) for correct ordering.
 */
function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic sort — numeric prefixes guarantee correct order
}

/**
 * Retrieves the set of already-applied migration filenames and their checksums
 * from the schema_migrations tracking table.
 */
async function getAppliedMigrations(
  client: Client
): Promise<Map<string, string>> {
  const result = await client.query<{ filename: string; checksum_sha256: string }>(
    `SELECT filename, checksum_sha256 FROM ${MIGRATIONS_TABLE} ORDER BY applied_at`
  );

  return new Map(result.rows.map((r) => [r.filename, r.checksum_sha256]));
}

/**
 * Executes a single migration file within its own transaction.
 * Records the execution in schema_migrations on success.
 * Rolls back and throws on failure.
 *
 * @param client       - Active pg Client
 * @param filename     - Migration filename (basename only)
 * @param sqlContent   - Full SQL content of the migration file
 */
async function executeMigration(
  client: Client,
  filename: string,
  sqlContent: string
): Promise<void> {
  const checksum = sha256(sqlContent);
  const startMs = Date.now();

  await client.query('BEGIN');

  try {
    await client.query(sqlContent);

    const executionMs = Date.now() - startMs;

    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum_sha256, execution_ms)
       VALUES ($1, $2, $3)`,
      [filename, checksum, executionMs]
    );

    await client.query('COMMIT');

    console.log(
      `  ✓ ${filename} (${executionMs}ms)`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Main Runner
// ---------------------------------------------------------------------------

/**
 * Main migration runner.
 * 1. Connects to PostgreSQL using environment configuration
 * 2. Creates the schema_migrations tracking table if it doesn't exist
 * 3. Discovers all .sql files in the migrations directory
 * 4. Skips already-applied migrations (with checksum validation)
 * 5. Applies pending migrations in order, one transaction per file
 * 6. Exits with code 0 on success, 1 on failure
 */
async function runMigrations(): Promise<void> {
  console.log('\n========================================');
  console.log('  EDUK8U Migration Runner');
  console.log('========================================\n');

  const config = resolveClientConfig();
  const client = new Client(config);

  try {
    console.log(`Connecting to PostgreSQL...`);
    await client.connect();
    console.log(`Connected to: ${
      config.connectionString
        ? config.connectionString.replace(/:[^:@]+@/, ':***@')
        : `${(config as ClientConfig & { host?: string }).host}:${(config as ClientConfig & { port?: number }).port}/${(config as ClientConfig & { database?: string }).database}`
    }\n`);

    // Ensure migration tracking table exists
    await client.query(CREATE_MIGRATIONS_TABLE_SQL);
    console.log(`Migration tracking table: "${MIGRATIONS_TABLE}" ready\n`);

    // Discover migration files
    const files = getMigrationFiles();
    console.log(`Found ${files.length} migration file(s) in: ${MIGRATIONS_DIR}\n`);

    if (files.length === 0) {
      console.log('No migration files found. Nothing to do.');
      return;
    }

    // Load applied migrations state
    const applied = await getAppliedMigrations(client);

    let appliedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('Processing migrations:\n');

    for (const filename of files) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const currentChecksum = sha256(content);

      if (applied.has(filename)) {
        const storedChecksum = applied.get(filename)!;

        if (storedChecksum !== currentChecksum) {
          // Migration was modified after being applied — this is dangerous
          const errorMsg =
            `CHECKSUM MISMATCH: Migration "${filename}" has been modified after it was applied.\n` +
            `  Stored checksum:  ${storedChecksum}\n` +
            `  Current checksum: ${currentChecksum}\n` +
            `  Do NOT modify applied migrations. Create a new migration instead.`;

          console.error(`  ✗ ${filename}`);
          console.error(`    ${errorMsg}`);

          if (process.env.MIGRATION_STRICT !== 'false') {
            throw new Error(errorMsg);
          } else {
            console.warn(`    WARNING: Continuing despite mismatch (MIGRATION_STRICT=false)`);
            skippedCount++;
          }
        } else {
          console.log(`  - ${filename} (already applied — skipped)`);
          skippedCount++;
        }

        continue;
      }

      // Apply pending migration
      try {
        await executeMigration(client, filename, content);
        appliedCount++;
      } catch (err) {
        errorCount++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n  ✗ FAILED: ${filename}`);
        console.error(`    Error: ${message}\n`);
        throw new Error(`Migration failed on "${filename}": ${message}`);
      }
    }

    console.log('\n----------------------------------------');
    console.log(`  Applied:  ${appliedCount} migration(s)`);
    console.log(`  Skipped:  ${skippedCount} already-applied migration(s)`);
    if (errorCount > 0) {
      console.log(`  Errors:   ${errorCount}`);
    }
    console.log('----------------------------------------\n');

    if (appliedCount === 0 && skippedCount === files.length) {
      console.log('✓ Database is up to date. No migrations to apply.\n');
    } else {
      console.log(`✓ Migration run complete. ${appliedCount} new migration(s) applied.\n`);
    }
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

runMigrations().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n✗ Migration runner failed:\n  ${message}\n`);
  process.exit(1);
});
