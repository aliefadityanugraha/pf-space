/**
 * src/routes/materialCategory.routes.js
 * 
 * Fastify routes for material categories.
 */

import { materialCategoryController } from '../controllers/index.js';
import { requireModerator } from '../middlewares/auth.middleware.js';

export default async function materialCategoryRoutes(fastify) {
  // Public routes
  fastify.get('/', materialCategoryController.getAll.bind(materialCategoryController));
  fastify.get('/:id', materialCategoryController.getById.bind(materialCategoryController));

  // Admin/Moderator routes
  fastify.post('/', {
    preHandler: [requireModerator]
  }, materialCategoryController.create.bind(materialCategoryController));

  fastify.put('/:id', {
    preHandler: [requireModerator]
  }, materialCategoryController.update.bind(materialCategoryController));

  fastify.delete('/:id', {
    preHandler: [requireModerator]
  }, materialCategoryController.delete.bind(materialCategoryController));
}
