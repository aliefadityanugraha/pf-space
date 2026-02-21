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
  DEFAULT_LIMIT: 10
};
