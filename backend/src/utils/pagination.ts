import { PaginationMeta, PaginationQuery } from '../types';

/** Absolute maximum items per page to protect against resource abuse */
const ABSOLUTE_MAX_LIMIT = 100;

/** Default items per page */
const DEFAULT_LIMIT = 20;

/**
 * Normalise and clamp raw pagination query parameters.
 *
 * @param query - Raw pagination query (page, limit, sortBy, sortOrder)
 * @returns Validated page, limit, and SQL offset
 */
export const getPaginationParams = (
  query: PaginationQuery
): { page: number; limit: number; offset: number } => {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(
    ABSOLUTE_MAX_LIMIT,
    Math.max(1, Math.floor(Number(query.limit) || DEFAULT_LIMIT))
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Build a PaginationMeta object from current page/limit and total count.
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of records matching the query
 * @returns PaginationMeta
 */
export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

/**
 * Generate ORDER BY clause from sortBy / sortOrder query params.
 * Validates sortBy against an allowlist of column names to prevent SQL injection.
 *
 * @param query - Pagination query
 * @param allowedColumns - Set of column names that may be sorted
 * @param defaultColumn - Fallback column (default: 'created_at')
 * @returns SQL ORDER BY clause string
 */
export const buildOrderByClause = (
  query: PaginationQuery,
  allowedColumns: Set<string>,
  defaultColumn = 'created_at'
): string => {
  const column = query.sortBy && allowedColumns.has(query.sortBy)
    ? query.sortBy
    : defaultColumn;
  const direction = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${column} ${direction}`;
};
