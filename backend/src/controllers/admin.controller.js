/**
 * src/controllers/admin.controller.js
 * 
 * Controller for administrative tasks and dashboard statistics.
 */

import { User } from '../models/User.js';
import { Film } from '../models/Film.js';
import { Discussion } from '../models/Discussion.js';
import { Category } from '../models/Category.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../lib/response.js';
import { getStorageStats } from '../lib/upload.js';

export class AdminController {
  /**
   * Get administrative audit logs
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAuditLogs(request, reply) {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;

      const logs = await AuditLog.query()
        .withGraphFetched('user')
        .orderBy('created_at', 'desc')
        .page(page - 1, limit);

      return ApiResponse.success(reply, logs.results, 'Audit logs retrieved', 200, {
        total: logs.total,
        page,
        limit,
        totalPages: Math.ceil(logs.total / limit)
      });
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Gagal mengambil log audit');
    }
  }

  /**
   * Get storage usage statistics
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getStorageStats(request, reply) {
    try {
      const stats = await getStorageStats();
      return ApiResponse.success(reply, stats);
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Gagal mengambil statistik penyimpanan');
    }
  }

  /**
   * Fetch aggregate statistics and recent activity for the admin dashboard
   * @param {import('fastify').FastifyRequest} request - Fastify request object
   * @param {import('fastify').FastifyReply} reply - Fastify reply object
   * @returns {Promise<import('fastify').FastifyReply>} Standard API response with stats
   */
  async getDashboardStats(request, reply) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalFilms,
        newFilms,
        totalUsers,
        newUsers,
        pendingFilms,
        totalCategories,
        newCategories,
        recentPendingFilms,
        recentActivities
      ] = await Promise.all([
        Film.query().resultSize(),
        Film.query().where('created_at', '>=', thirtyDaysAgo).resultSize(),
        User.query().resultSize(),
        User.query().where('createdAt', '>=', thirtyDaysAgo).resultSize(),
        Film.query().where('status', 'pending').resultSize(),
        Category.query().resultSize(),
        Category.query().where('created_at', '>=', thirtyDaysAgo).resultSize(),
        Film.query()
          .where('status', 'pending')
          .withGraphFetched('creator')
          .orderBy('created_at', 'desc')
          .limit(5),
        Film.query()
          .withGraphFetched('creator')
          .orderBy('updated_at', 'desc')
          .limit(5)
      ]);

      return ApiResponse.success(reply, {
        totalFilms,
        newFilms,
        totalUsers,
        newUsers,
        pendingFilms,
        totalCategories,
        newCategories,
        recentPendingFilms,
        recentActivities: recentActivities.map(f => ({
          user: f.creator?.name || 'Unknown',
          action: f.status === 'published' ? 'published' : 'uploaded',
          target: f.judul,
          time: f.updated_at
        }))
      });
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Internal server error while fetching dashboard stats');
    }
  }
}

export const adminController = new AdminController();
