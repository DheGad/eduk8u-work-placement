import winston from 'winston';
import { env } from './env';

// ============================================================
// Custom log format
// ============================================================

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/** Pretty format for development console output */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${ts}] ${level}: ${message}${metaStr}${stackStr}`;
  })
);

/** Structured JSON format for production */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ============================================================
// Transports
// ============================================================

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
    silent: env.NODE_ENV === 'test',
  }),
];

if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/errors.log',
      level: 'error',
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
      maxsize: 50 * 1024 * 1024, // 50 MB
      maxFiles: 10,
    })
  );
}

// ============================================================
// Logger instance
// ============================================================

/**
 * Application-wide Winston logger.
 * Use logger.info / logger.warn / logger.error / logger.debug throughout the app.
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'eduk8u-api',
    environment: env.NODE_ENV,
  },
  transports,
  exitOnError: false,
});
