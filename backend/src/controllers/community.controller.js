/**
 * src/controllers/community.controller.js
 * 
 * Controller for managing community discussions and topics.
 */

import { communityService, notificationService } from '../services/index.js';
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
      return ApiResponse.success(reply, null, 'Tidak ada diskusi aktif');
    }

    return ApiResponse.success(reply, discussion);
  }

  /**
   * Public: Retrieve a single community discussion topic by ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getById(request, reply) {
    const { id } = request.params;
    const discussion = await communityService.getById(id);
    
    if (!discussion) {
      return ApiResponse.notFound(reply, 'Diskusi tidak ditemukan');
    }
    
    return ApiResponse.success(reply, discussion);
  }

  /**
   * Administrative: Fetch a paginated list of all historical community topics
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAll(request, reply) {
    const { page, limit } = request.query;
    const result = await communityService.getAllDiscussions({ page, limit });
    
    return ApiResponse.success(
      reply,
      result.discussions,
      'Diskusi berhasil diambil',
      200,
      result.pagination
    );
  }

  /**
   * Fetch all user replies for a specific community discussion
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getReplies(request, reply) {
    const { id } = request.params;
    const replies = await communityService.getDiscussionReplies(id);
    
    return ApiResponse.success(reply, replies, 'Balasan berhasil diambil');
  }

  /**
   * Administrative: Create a new community discussion topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const discussion = await communityService.createDiscussion(
      request.user.id,
      {
        title: sanitizePlainText(request.body.title),
        description: sanitizePlainText(request.body.description),
      }
    );

    return ApiResponse.success(reply, discussion, 'Diskusi berhasil dibuat', 201);
  }

  /**
   * Administrative: Update an existing community topic's title or description
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async update(request, reply) {
    const { id } = request.params;
    const discussion = await communityService.updateDiscussion(id, request.body);

    if (!discussion) {
      return ApiResponse.notFound(reply, 'Diskusi tidak ditemukan');
    }

    return ApiResponse.success(reply, discussion, 'Diskusi berhasil diperbarui');
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
      return ApiResponse.notFound(reply, 'Diskusi tidak ditemukan');
    }

    return ApiResponse.success(
      reply,
      discussion,
      is_active ? 'Diskusi diaktifkan' : 'Diskusi dinonaktifkan'
    );
  }

  /**
   * Administrative: Permanently delete a community topic
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async delete(request, reply) {
    const { id } = request.params;
    const deleted = await communityService.deleteDiscussion(id);

    if (!deleted) {
      return ApiResponse.notFound(reply, 'Diskusi tidak ditemukan');
    }

    return ApiResponse.success(reply, null, 'Diskusi berhasil dihapus');
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
      return ApiResponse.badRequest(reply, 'Konten tidak boleh kosong');
    }

    // Check if discussion exists and is active
    const discussion = await communityService.getActiveDiscussion();
    if (!discussion || discussion.discussion_id !== parseInt(id)) {
      return ApiResponse.notFound(reply, 'Diskusi tidak ditemukan atau tidak aktif');
    }

    const replyData = await communityService.addReply(
      id,
      request.user.id,
      sanitizePlainText(content.trim())
    );

    // Notify the discussion creator
    try {
      if (discussion.user_id && discussion.user_id !== request.user.id) {
        await notificationService.create({
          user_id: discussion.user_id,
          type: 'community_reply',
          title: 'Ada balasan di diskusi Anda',
          message: `${request.user.name} membalas diskusi komunitas "${discussion.title}".`,
          data: { discussion_id: discussion.discussion_id, reply_id: replyData.reply_id }
        });
      }
    } catch (err) {
      console.error('Failed to send notification for community reply:', err.message);
    }

    return ApiResponse.success(reply, replyData, 'Balasan berhasil ditambahkan', 201);
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
      return ApiResponse.notFound(reply, 'Balasan tidak ditemukan atau tidak diizinkan');
    }

    return ApiResponse.success(reply, null, 'Balasan berhasil dihapus');
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
      return ApiResponse.notFound(reply, 'Balasan tidak ditemukan');
    }

    return ApiResponse.success(reply, null, 'Balasan berhasil dihapus');
  }

  /**
   * Fetch a single community reply by ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getReplyById(request, reply) {
    const { replyId } = request.params;
    const replyData = await communityService.getReplyById(replyId);
    
    if (!replyData) {
      return ApiResponse.notFound(reply, 'Balasan tidak ditemukan');
    }

    return ApiResponse.success(reply, replyData);
  }
}

export const communityController = new CommunityController();
