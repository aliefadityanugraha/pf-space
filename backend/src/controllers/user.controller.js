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
      return ApiResponse.notFound(reply, 'User not found');
    }

    return ApiResponse.success(reply, profile);
  }
}

export const userController = new UserController();
