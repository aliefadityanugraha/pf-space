import { evaluationController } from '../controllers/index.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/constants.js';
import { getEvaluationSchema, upsertEvaluationSchema } from '../schemas/evaluation.schema.js';

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function evaluationRoutes(fastify) {
  // Get evaluation (Owner, Admin, Moderator)
  fastify.get('/:id', {
    preHandler: [authenticate],
    schema: getEvaluationSchema
  }, evaluationController.getByFilm);

  // Upsert evaluation (Admin, Moderator)
  fastify.post('/:id', {
    preHandler: [
      requireRole(ROLES.ADMIN, ROLES.MODERATOR)
    ],
    schema: upsertEvaluationSchema
  }, evaluationController.upsert);
}
