import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic request validation middleware factory.
 *
 * Validates req.body, req.query, and req.params against a Zod schema.
 * The schema should be an object schema with optional `body`, `query`, and `params` keys.
 * On validation failure, passes a ZodError to the error handler which returns 422.
 *
 * @param schema - A Zod object schema with body/query/params sub-schemas
 *
 * @example
 * router.post('/', validateRequest(createPlacementSchema), createPlacement);
 */
export const validateRequest = <T extends ZodSchema>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Attach parsed/coerced values back to request so controllers use validated data
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      // Pass ZodError to the global error handler which formats it as 422
      next(err);
    }
  };
};
