import { evaluationController } from '../controllers/index.js';
import { authenticate, requireRole, validateRequest } from '../middlewares/index.js';
import { ROLES } from '../config/constants.js';
import { evaluationParamSchema, evaluationUpsertSchema } from '../lib/validation.js';

export default async function evaluationRoutes(fastify) {
  fastify.get('/:id', {
    preHandler: [authenticate, validateRequest(evaluationParamSchema, 'params')]
  }, evaluationController.getByFilm.bind(evaluationController));

  fastify.post('/:id', {
    preHandler: [
      requireRole(ROLES.ADMIN, ROLES.MODERATOR),
      validateRequest(evaluationParamSchema, 'params'),
      validateRequest(evaluationUpsertSchema, 'body')
    ]
  }, evaluationController.upsert.bind(evaluationController));
}
