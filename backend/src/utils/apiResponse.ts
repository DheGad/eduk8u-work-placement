import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/**
 * Send a successful JSON response.
 *
 * @param res - Express Response object
 * @param data - Response payload
 * @param message - Optional human-readable message
 * @param statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  res.status(statusCode).json(response);
};

/**
 * Send a created (201) JSON response.
 *
 * @param res - Express Response object
 * @param data - Newly created resource
 * @param message - Optional message
 */
export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
  sendSuccess(res, data, message ?? 'Resource created successfully', 201);
};

/**
 * Send an error JSON response.
 *
 * @param res - Express Response object
 * @param error - Error message string
 * @param statusCode - HTTP status code (default: 400)
 * @param code - Optional machine-readable error code
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode = 400,
  code?: string
): void => {
  const response: ApiResponse<never> = {
    success: false,
    error,
    ...(code ? { code } : {}),
  };
  res.status(statusCode).json(response);
};

/**
 * Send a 404 not found response.
 *
 * @param res - Express Response object
 * @param entity - Name of the entity that was not found (e.g. 'Student')
 */
export const sendNotFound = (res: Response, entity = 'Resource'): void => {
  sendError(res, `${entity} not found`, 404);
};

/**
 * Send a paginated list response.
 *
 * @param res - Express Response object
 * @param data - Array of items for the current page
 * @param meta - Pagination metadata
 * @param message - Optional message
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
): void => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta,
    ...(message ? { message } : {}),
  };
  res.status(200).json(response);
};

/**
 * Send a 204 No Content response (used for DELETE operations).
 *
 * @param res - Express Response object
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
