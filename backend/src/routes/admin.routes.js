/**
 * src/routes/admin.routes.js
 * 
 * Routes for administrative dashboard and system statistics.
 */

import { adminController } from '../controllers/index.js';
import { requireAdmin } from '../middlewares/index.js';

/**
 * Register administrative routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function adminRoutes(fastify) {
  fastify.get('/stats', {
    preHandler: requireAdmin
  }, adminController.getDashboardStats.bind(adminController));

  fastify.get('/storage', {
    preHandler: requireAdmin
  }, adminController.getStorageStats.bind(adminController));

  fastify.get('/logs', {
    preHandler: requireAdmin
  }, adminController.getAuditLogs.bind(adminController));
}
