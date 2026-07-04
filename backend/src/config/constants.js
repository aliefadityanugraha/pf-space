/**
 * src/config/constants.js
 * 
 * Centralized constants for the application to avoid hardcoded strings.
 */

export const ROLES = {
  USER: 1,
  CREATOR: 2,
  MODERATOR: 3,
  ADMIN: 4
};

export const FILM_STATUS = {
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected'
};

export const VOTE_TYPE = {
  UP: 'up',
  DOWN: 'down'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

/**
 * Helper to parse pagination params from query string
 * @param {object} query - Request query object
 * @param {number} [defaultLimit=10] - Default items per page
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query, defaultLimit = PAGINATION.DEFAULT_LIMIT) {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(PAGINATION.MAX_LIMIT, parseInt(query.limit) || defaultLimit);
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Build pagination metadata object
 * @param {number} total - Total items count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export function buildPagination(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Parse ALLOWED_ORIGINS env var into an array
 * @returns {string[]}
 */
export function parseAllowedOrigins() {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:5173'];
}
