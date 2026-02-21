/**
 * src/services/notification.service.js
 * 
 * Service for handling notification operations, including creation, 
 * retrieval, and read-status management.
 */

import { Notification } from '../models/index.js';

export class NotificationService {
  /**
   * Create a new notification for a specific user
   * @param {object} payload - Notification payload
   * @param {string} payload.user_id - Target user ID
   * @param {string} payload.type - Notification type (e.g., 'comment', 'reply', 'vote')
   * @param {string} payload.title - Notification title
   * @param {string} payload.message - Notification detailed message
   * @param {object|null} [payload.data] - Additional metadata for deep linking (e.g., film_id)
   * @returns {Promise<Notification>} Newly created notification record
   */
  async create({ user_id, type, title, message, data = null }) {
    return Notification.query().insert({
      user_id,
      type,
      title,
      message,
      data,
      is_read: false
    });
  }

  /**
   * Get a paginated list of notifications for a user, including total and unread counts
   * @param {string} userId - User ID
   * @param {object} options - Pagination options
   * @param {number} [options.page=1] - Current page
   * @param {number} [options.limit=20] - Page size
   * @returns {Promise<{notifications: Notification[], unreadCount: number, pagination: object}>}
   */
  async getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
    const query = Notification.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    const offset = (page - 1) * limit;
    
    const [notifications, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      Notification.query().where('user_id', userId).count('id as total').first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    // Get unread count
    const unreadResult = await Notification.query()
      .where('user_id', userId)
      .where('is_read', false)
      .count('id as total')
      .first();
      
    const unreadCount = parseInt(unreadResult?.total || 0);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark a specific notification as 'read'
   * @param {number} id - Notification ID
   * @param {string} userId - User ID (to ensure ownership)
   * @returns {Promise<number>} Number of updated rows
   */
  async markAsRead(id, userId) {
    return Notification.query()
      .patch({ is_read: true })
      .where('id', id)
      .where('user_id', userId);
  }

  /**
   * Mark all unread notifications for a user as 'read'
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of updated rows
   */
  async markAllAsRead(userId) {
    return Notification.query()
      .patch({ is_read: true })
      .where('user_id', userId)
      .where('is_read', false);
  }
}

export const notificationService = new NotificationService();
