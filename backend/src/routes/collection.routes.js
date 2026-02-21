/**
 * src/routes/collection.routes.js
 * 
 * Routes for managing user's personal film collections.
 */

import { collectionController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

/**
 * Register collection routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function collectionRoutes(fastify) {
  // User: Get personal collections list
  fastify.get('/', {
    preHandler: authenticate
  }, collectionController.getMyCollections.bind(collectionController));

  // User: Get collection status for a specific film
  fastify.get('/:filmId/status', {
    preHandler: authenticate
  }, collectionController.getStatus.bind(collectionController));

  // User: Add or remove film from collection (toggle)
  fastify.post('/:filmId/toggle', {
    preHandler: authenticate
  }, collectionController.toggleCollection.bind(collectionController));
}
