/**
 * src/controllers/community.controller.js
 * 
 * Controller for managing community discussions and topics.
 */

import { communityService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { sanitizePlainText } from '../lib/sanitize.js';

export class CommunityController {
  /**
   * Public: Retrieve the currently active community discussion topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getActiveDiscussion(request, reply) {
    const discussion = await communityService.getActiveDiscussion();
    
    if (!discussion) {
      return ApiResponse.success(reply, null, 'No active discussion');
    }

    return ApiResponse.success(reply, discussion);
  }

  /**
   * Administrative: Fetch a paginated list of all historical community topics
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAllDiscussions(request, reply) {
    const { page, limit } = request.query;
    const result = await communityService.getAllDiscussions({ page, limit });
    
    return ApiResponse.success(
      reply,
      result.discussions,
      'Discussions retrieved successfully',
      200,
      result.pagination
    );
  }

  /**
   * Fetch all user replies for a specific community discussion
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getDiscussionReplies(request, reply) {
    const { id } = request.params;
    const replies = await communityService.getDiscussionReplies(id);
    
    return ApiResponse.success(reply, replies, 'Replies retrieved successfully');
  }

  /**
   * Administrative: Create a new community discussion topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async createDiscussion(request, reply) {
    const discussion = await communityService.createDiscussion(
      request.user.id,
      {
        title: sanitizePlainText(request.body.title),
        description: sanitizePlainText(request.body.description),
      }
    );

    return ApiResponse.success(reply, discussion, 'Discussion created successfully', 201);
  }

  /**
   * Administrative: Update an existing community topic's title or description
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async updateDiscussion(request, reply) {
    const { id } = request.params;
    const discussion = await communityService.updateDiscussion(id, request.body);

    if (!discussion) {
      return ApiResponse.notFound(reply, 'Discussion not found');
    }

    return ApiResponse.success(reply, discussion, 'Discussion updated successfully');
  }

  /**
   * Administrative: Toggle the active visibility of a community topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async toggleDiscussion(request, reply) {
    const { id } = request.params;
    const { is_active } = request.body;

    const discussion = await communityService.toggleDiscussion(id, is_active);

    if (!discussion) {
      return ApiResponse.notFound(reply, 'Discussion not found');
    }

    return ApiResponse.success(
      reply,
      discussion,
      is_active ? 'Discussion activated' : 'Discussion deactivated'
    );
  }

  /**
   * Administrative: Permanently delete a community topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async deleteDiscussion(request, reply) {
    const { id } = request.params;
    const deleted = await communityService.deleteDiscussion(id);

    if (!deleted) {
      return ApiResponse.notFound(reply, 'Discussion not found');
    }

    return ApiResponse.success(reply, null, 'Discussion deleted successfully');
  }

  /**
   * User: Add a new reply/message to an active community topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async addReply(request, reply) {
    const { id } = request.params;
    const { content } = request.body;

    // Validate content
    if (!content || !content.trim()) {
      return ApiResponse.badRequest(reply, 'Content is required');
    }

    // Check if discussion exists and is active
    const discussion = await communityService.getActiveDiscussion();
    if (!discussion || discussion.discussion_id !== parseInt(id)) {
      return ApiResponse.notFound(reply, 'Discussion not found or not active');
    }

    const replyData = await communityService.addReply(
      id,
      request.user.id,
      sanitizePlainText(content.trim())
    );

    return ApiResponse.success(reply, replyData, 'Reply added successfully', 201);
  }

  /**
   * User: Delete their own reply from a topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async deleteReply(request, reply) {
    const { replyId } = request.params;
    const deleted = await communityService.deleteReply(replyId, request.user.id);

    if (!deleted) {
      return ApiResponse.notFound(reply, 'Reply not found or unauthorized');
    }

    return ApiResponse.success(reply, null, 'Reply deleted successfully');
  }

  /**
   * Administrative: Delete any user reply (for moderation)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async deleteReplyByModerator(request, reply) {
    const { replyId } = request.params;
    const deleted = await communityService.deleteReplyByModerator(replyId);

    if (!deleted) {
      return ApiResponse.notFound(reply, 'Reply not found');
    }

    return ApiResponse.success(reply, null, 'Reply deleted successfully');
  }
}

export const communityController = new CommunityController();
