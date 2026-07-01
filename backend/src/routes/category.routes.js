import { categoryController } from '../controllers/index.js';
import { requireAdmin, validateRequest } from '../middlewares/index.js';
import { categorySchema } from '../lib/validation.js';

export default async function categoryRoutes(fastify) {
  fastify.get('/', categoryController.getAll.bind(categoryController));

  fastify.get('/with-count', categoryController.getWithFilmCount.bind(categoryController));

  fastify.get('/:id', categoryController.getById.bind(categoryController));

  fastify.post('/', {
    preHandler: [requireAdmin, validateRequest(categorySchema, 'body')]
  }, categoryController.create.bind(categoryController));

  fastify.put('/:id', {
    preHandler: [requireAdmin, validateRequest(categorySchema, 'body')]
  }, categoryController.update.bind(categoryController));

  fastify.delete('/:id', {
    preHandler: requireAdmin
  }, categoryController.delete.bind(categoryController));
}
