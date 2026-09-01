/**
 * src/routes/user.routes.js
 * 
 * Routes for public user profile information.
 */

import { userController } from '../controllers/index.js';

/**
 * Register user-focused routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function userRoutes(fastify) {
  // Search users for autocomplete
  fastify.get('/search', userController.searchUsers.bind(userController));

  // Top active curators showcase (must be registered before /:id)
  fastify.get('/top-curators', userController.getTopCurators.bind(userController));

  // Get contributions for a specific user ID
  fastify.get('/:id/contributions', userController.getContributions.bind(userController));

  // Public profile lookup by ID
  fastify.get('/:id', userController.getProfile.bind(userController));
}
