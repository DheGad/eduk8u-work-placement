import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ============================================================
// Request Body Validator
// ============================================================

/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 *
 * On success the body is replaced with the parsed (and coerced) data from Zod,
 * guaranteeing downstream handlers receive type-safe, sanitised input.
 *
 * On failure a 400 response is returned with a machine-readable `details` array
 * mapping each field path to its validation message.
 *
 * @param schema - Zod schema to validate the request body against
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

// ============================================================
// Query String Validator
// ============================================================

/**
 * Express middleware factory that validates `req.query` against a Zod schema.
 *
 * Zod coercion transforms are supported (e.g. z.string().transform(Number)),
 * so the parsed query object replaces the raw string-only Express query map.
 *
 * @param schema - Zod schema to validate query parameters against
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: errors,
      });
      return;
    }

    req.query = result.data as Record<string, string>;
    next();
  };
};

// ============================================================
// Route Params Validator
// ============================================================

/**
 * Express middleware factory that validates `req.params` against a Zod schema.
 *
 * Useful for validating that route parameters match expected patterns (e.g. UUID).
 *
 * @param schema - Zod schema to validate route params against
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      res.status(400).json({
        success: false,
        error: 'Invalid route parameters',
        details: errors,
      });
      return;
    }

    req.params = result.data as Record<string, string>;
    next();
  };
};
