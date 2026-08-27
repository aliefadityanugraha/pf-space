/**
 * src/controllers/user.controller.js
 * 
 * Controller for public user profile lookups.
 */

import { userService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class UserController {
  /**
   * Fetch public profile information for a specific user ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getProfile(request, reply) {
    const { id } = request.params;
    
    const profile = await userService.getProfileById(id);
    
    if (!profile) {
      return ApiResponse.notFound(reply, 'Pengguna tidak ditemukan');
    }

    return ApiResponse.success(reply, profile);
  }

  /**
   * Search users by name for autocomplete tagging
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async searchUsers(request, reply) {
    const { q } = request.query;
    const users = await userService.searchUsers(q);
    return ApiResponse.success(reply, users);
  }

  /**
   * Fetch contributions for a specific user ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getContributions(request, reply) {
    const { id } = request.params;
    const contributions = await userService.getContributionsByUserId(id);
    return ApiResponse.success(reply, contributions);
  }
}

export const userController = new UserController();
