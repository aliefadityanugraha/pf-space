/**
 * src/routes/notification.routes.js
 * 
 * Routes for retrieving and managing user notifications.
 */

import { notificationController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

/**
 * Register notification-related routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function notificationRoutes(fastify) {
  // User: Get personal notifications
  fastify.get('/', {
    preHandler: authenticate
  }, notificationController.getNotifications.bind(notificationController));

  // User: Mark a specific notification as read
  fastify.patch('/:id/read', {
    preHandler: authenticate
  }, notificationController.markAsRead.bind(notificationController));

  // User: Mark all personal notifications as read
  fastify.patch('/read-all', {
    preHandler: authenticate
  }, notificationController.markAllAsRead.bind(notificationController));
}
