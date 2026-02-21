/**
 * src/controllers/notification.controller.js
 * 
 * Controller for managing user notifications.
 */

import { notificationService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class NotificationController {
  /**
   * Fetch all notifications for the current user (paginated)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getNotifications(request, reply) {
    const { page, limit } = request.query;
    const userId = request.user.id;

    const result = await notificationService.getUserNotifications(userId, { page, limit });
    return ApiResponse.success(reply, result);
  }

  /**
   * Mark a single notification as read
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async markAsRead(request, reply) {
    const { id } = request.params;
    const userId = request.user.id;

    await notificationService.markAsRead(id, userId);
    return ApiResponse.success(reply, { message: 'Notification marked as read' });
  }

  /**
   * Mark all unread notifications for the current user as read
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async markAllAsRead(request, reply) {
    const userId = request.user.id;

    await notificationService.markAllAsRead(userId);
    return ApiResponse.success(reply, { message: 'All notifications marked as read' });
  }
}

export const notificationController = new NotificationController();
