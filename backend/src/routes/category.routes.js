import { categoryController } from '../controllers/index.js';
import { requireAdmin } from '../middlewares/index.js';
import { categorySchema } from '../schemas/category.schema.js';

/**
 * Register film category routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function categoryRoutes(fastify) {
  // Public: Get all categories
  fastify.get('/', categoryController.getAll.bind(categoryController));

  // Public: Get categories with film counts
  fastify.get('/with-count', categoryController.getWithFilmCount.bind(categoryController));

  // Public: Get category by ID
  fastify.get('/:id', categoryController.getById.bind(categoryController));

  // Admin: Create new category
  fastify.post('/', {
    preHandler: [requireAdmin],
    schema: categorySchema
  }, categoryController.create.bind(categoryController));

  // Admin: Update category
  fastify.put('/:id', {
    preHandler: [requireAdmin],
    schema: categorySchema
  }, categoryController.update.bind(categoryController));

  // Admin: Delete category
  fastify.delete('/:id', {
    preHandler: requireAdmin
  }, categoryController.delete.bind(categoryController));
}
