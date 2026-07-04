import { reportController } from '../controllers/index.js';
import { authenticate, requireModerator, validateRequest } from '../middlewares/index.js';
import { reportCreateSchema, reportStatusSchema } from '../lib/validation.js';

export default async function reportRoutes(fastify) {
  fastify.post('/', {
    preHandler: [authenticate, validateRequest(reportCreateSchema, 'body')]
  }, reportController.create.bind(reportController));

  fastify.get('/', {
    preHandler: requireModerator
  }, reportController.getAll.bind(reportController));

  fastify.patch('/:id/status', {
    preHandler: [requireModerator, validateRequest(reportStatusSchema, 'body')]
  }, reportController.updateStatus.bind(reportController));
}
