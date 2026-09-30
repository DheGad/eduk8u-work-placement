import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

// ============================================================
// Morgan → Winston bridge
// ============================================================

/** Write Morgan output into Winston at 'http' level */
const morganStream: StreamOptions = {
  write: (message: string): void => {
    logger.http(message.trimEnd());
  },
};

/**
 * Skip logging for health-check endpoint to reduce noise.
 */
const skipHealthCheck = (req: Request, _res: Response): boolean => {
  return req.url === '/health';
};

/**
 * HTTP request logger middleware.
 *
 * - Development: Morgan 'dev' format (coloured, compact)
 * - Production:  Morgan 'combined' format (full Apache Combined Log)
 *
 * Output is piped through Winston so it respects the LOG_LEVEL and
 * transports (file, console, etc.) configured in logger.ts.
 */
export const requestLogger = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
  {
    stream: morganStream,
    skip: skipHealthCheck,
  }
);
