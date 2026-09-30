import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { DatabaseError } from 'pg';
import { logger } from '../config/logger';
import { env } from '../config/env';

// ============================================================
// PostgreSQL error codes
// ============================================================

const PG_ERROR_CODES: Record<string, string> = {
  '23505': 'A record with that value already exists',          // unique_violation
  '23503': 'Referenced record does not exist',                 // foreign_key_violation
  '23502': 'A required field is missing',                      // not_null_violation
  '23514': 'Value violates a check constraint',                // check_violation
  '42P01': 'Database table not found — run migrations',        // undefined_table
  '42703': 'Database column not found — check your schema',    // undefined_column
  '28P01': 'Database authentication failed',                   // invalid_password
  '53300': 'Database connection pool exhausted',               // too_many_connections
  '40001': 'Serialisation failure — please retry the request', // serialization_failure
  '40P01': 'Database deadlock detected',                       // deadlock_detected
};

// ============================================================
// Custom application error class
// ============================================================

/**
 * Structured application error.
 * Throw this class from service/controller layers for predictable HTTP responses.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// Global error handler middleware
// ============================================================

/**
 * Express global error handler.
 * Must be registered LAST in the middleware chain.
 *
 * Handles:
 * - AppError (structured application errors)
 * - ZodError (validation failures)
 * - JWT errors (invalid / expired tokens)
 * - pg DatabaseError (SQL errors with PostgreSQL error codes)
 * - Generic unexpected errors
 *
 * Never leaks stack traces or raw SQL in production.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isProd = env.NODE_ENV === 'production';

  // ---- AppError ----
  if (err instanceof AppError) {
    logger.warn('Application error', {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // ---- Zod validation error ----
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.info('Validation error', { path: req.path, errors: formattedErrors });

    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  // ---- JWT errors ----
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ success: false, error: 'Token has expired' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  // ---- PostgreSQL errors ----
  if (err instanceof DatabaseError && err.code) {
    const userMessage = PG_ERROR_CODES[err.code];
    if (userMessage) {
      logger.warn('Database constraint error', {
        code: err.code,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint,
      });

      res.status(409).json({
        success: false,
        error: userMessage,
        code: `DB_${err.code}`,
      });
      return;
    }
  }

  // ---- Unhandled / unexpected errors ----
  logger.error('Unhandled error', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: isProd ? 'An unexpected error occurred' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};
