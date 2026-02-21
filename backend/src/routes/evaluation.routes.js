import { evaluationController } from '../controllers/index.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/constants.js';

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function evaluationRoutes(fastify) {
  // Get evaluation (Owner, Admin, Moderator)
  fastify.get('/:id', {
    preHandler: [authenticate]
  }, evaluationController.getByFilm);

  // Upsert evaluation (Admin, Moderator)
  fastify.post('/:id', {
    preHandler: [
      requireRole(ROLES.ADMIN, ROLES.MODERATOR)
    ]
  }, evaluationController.upsert);
}
