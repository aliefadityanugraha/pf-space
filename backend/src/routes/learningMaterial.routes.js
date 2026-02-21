/**
 * src/routes/learningMaterial.routes.js
 * 
 * Routes for learning materials.
 */

import { learningMaterialController } from '../controllers/index.js';
import { authenticate, requireModerator, optionalAuth } from '../middlewares/index.js';

/**
 * Register learning material routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function learningMaterialRoutes(fastify) {
  // Public: Get all materials
  fastify.get('/', {
    preHandler: optionalAuth
  }, learningMaterialController.getAll.bind(learningMaterialController));

  // Public: Get single material
  fastify.get('/:id', learningMaterialController.getById.bind(learningMaterialController));

  // Admin/Moderator: Create material
  fastify.post('/', {
    preHandler: requireModerator
  }, learningMaterialController.create.bind(learningMaterialController));

  // Admin/Moderator: Update material
  fastify.put('/:id', {
    preHandler: requireModerator
  }, learningMaterialController.update.bind(learningMaterialController));

  // Admin/Moderator: Delete material
  fastify.delete('/:id', {
    preHandler: requireModerator
  }, learningMaterialController.delete.bind(learningMaterialController));

  // Admin/Moderator: Toggle status
  fastify.patch('/:id/toggle', {
    preHandler: requireModerator
  }, learningMaterialController.toggleStatus.bind(learningMaterialController));
}
