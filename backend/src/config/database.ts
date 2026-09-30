import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';
import { logger } from './logger';

// ============================================================
// Connection Pool
// ============================================================

/**
 * Global PostgreSQL connection pool.
 * Uses environment-configured pool size and SSL settings.
 */
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Log pool errors so they don't swallow silently
pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message, stack: err.stack });
});

// ============================================================
// Database helper namespace
// ============================================================

/**
 * Lightweight database helper that wraps the pg Pool.
 * Provides parameterised query execution, transactions, and health checks.
 */
export const db = {
  /**
   * Execute a parameterised SQL query against the pool.
   *
   * @param text - SQL query string with $1, $2... placeholders
   * @param params - Ordered array of parameter values
   * @returns QueryResult
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (env.NODE_ENV === 'development') {
        logger.debug('Executed query', { query: text, duration_ms: duration, rows: result.rowCount });
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Query failed', {
        query: text,
        params,
        duration_ms: duration,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  /**
   * Execute multiple statements inside a single serialisable transaction.
   * Automatically rolls back on any error and re-throws.
   *
   * @param callback - Async function receiving a PoolClient pre-configured to the transaction
   * @returns Whatever the callback returns
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Return a raw PoolClient for use cases that require manual connection management.
   * Caller MUST call client.release() in a finally block.
   */
  async getClient(): Promise<PoolClient> {
    return pool.connect();
  },

  /**
   * Verify the database is reachable by running a trivial SELECT.
   * Returns true on success, throws on failure.
   */
  async healthCheck(): Promise<boolean> {
    await pool.query('SELECT 1');
    return true;
  },

  /**
   * Gracefully drain and close all pool connections.
   * Call during process shutdown.
   */
  async end(): Promise<void> {
    await pool.end();
    logger.info('PostgreSQL pool closed');
  },
};

// ============================================================
// Connection retry helper (for startup)
// ============================================================

const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2_000;

/**
 * Attempt to connect to the database with exponential back-off.
 * Used at server startup to wait for PostgreSQL to become available.
 */
export async function connectWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await db.healthCheck();
      logger.info('✅ Database connection established');
      return;
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        logger.error(`❌ Database connection failed after ${RETRY_ATTEMPTS} attempts`);
        throw error;
      }
      const delay = RETRY_DELAY_MS * attempt;
      logger.warn(`Database unavailable, retrying in ${delay}ms (attempt ${attempt}/${RETRY_ATTEMPTS})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
