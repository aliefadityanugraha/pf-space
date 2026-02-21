/**
 * src/lib/errors.js
 * 
 * Custom error classes for application-wide error handling.
 * Inherits from native Error to maintain stack traces.
 */

/**
 * Base application error class
 * @extends Error
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Internal error code
   * @param {any} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found error
 * @extends AppError
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 400 Validation error
 * @extends AppError
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {any} details - Validation error details
   */
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Authentication error
 * @extends AppError
 */
export class AuthenticationError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Authorization error
 * @extends AppError
 */
export class AuthorizationError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 409 Conflict error
 * @extends AppError
 */
export class ConflictError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}
