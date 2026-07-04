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
  // Public profile lookup by ID
  fastify.get('/:id', userController.getProfile.bind(userController));
}
