import { reportController } from '../controllers/index.js';
import { authenticate, requireModerator } from '../middlewares/index.js';

/**
 * Register report-related routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function reportRoutes(fastify) {
  // Protected: Submit a report
  fastify.post('/', {
    preHandler: authenticate
  }, reportController.create.bind(reportController));

  // Admin: List all reports
  fastify.get('/', {
    preHandler: requireModerator,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string' },
          limit: { type: 'string' },
          status: { type: 'string' },
          target_type: { type: 'string' }
        }
      }
    }
  }, reportController.getAll.bind(reportController));

  // Admin: Process a report
  fastify.patch('/:id/status', {
    preHandler: requireModerator
  }, reportController.updateStatus.bind(reportController));
}
