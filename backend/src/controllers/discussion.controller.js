/**
 * src/controllers/discussion.controller.js
 * 
 * Controller for managing film discussions, comments, and replies.
 */

import { discussionService } from '../services/index.js';
import { filmService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES, FILM_STATUS } from '../config/constants.js';
import { sanitizePlainText } from '../lib/sanitize.js';

export class DiscussionController {
  /**
   * Public: Fetch all root comments and nested replies for a film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getByFilm(request, reply) {
    const { filmId } = request.params;
    const { page, limit } = request.query;

    // Check film exists
    const film = await filmService.getById(filmId);
    
    if (!film) {
      return ApiResponse.notFound(reply, 'Film not found');
    }

    if (film.status !== FILM_STATUS.PUBLISHED) {
      return ApiResponse.error(reply, 'Film belum di publish anda tidak dapat memberi komentar', 403);
    }

    const result = await discussionService.getByFilm(filmId, { page, limit });

    return ApiResponse.success(
      reply, 
      result.comments, 
      'Comments retrieved successfully', 
      200, 
      result.pagination
    );
  }

  /**
   * Public: Get total comment count for a film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getCommentCount(request, reply) {
    const { filmId } = request.params;
    const count = await discussionService.getCommentCount(filmId);
    return ApiResponse.success(reply, { comment_count: count });
  }

  /**
   * User: Post a new comment or reply to an existing one
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const { filmId } = request.params;
    
    const { isi_pesan, parent_id } = request.body;

    // Check film exists
    const film = await filmService.getById(filmId);
    
    if (!film) {
      return ApiResponse.notFound(reply, 'Film not found');
    }

    if (film.status !== FILM_STATUS.PUBLISHED) {
      return ApiResponse.error(reply, 'Film belum di publish anda tidak dapat memberi komentar', 403);
    }

    // If replying, check parent exists and depth limit
    if (parent_id) {
      const parent = await discussionService.getById(parent_id);
      if (!parent || parent.film_id !== parseInt(filmId)) {
        return ApiResponse.badRequest(reply, 'Invalid parent comment');
      }

      // Check depth
      const depth = await discussionService.getCommentDepth(parent_id);
      if (depth >= 5) {
        return ApiResponse.badRequest(reply, 'Maximum reply depth reached (max 5)');
      }
    }

    const comment = await discussionService.create({
      film_id: parseInt(filmId),
      user_id: request.user.id,
      isi_pesan: sanitizePlainText(isi_pesan.trim()),
      parent_id: parent_id || null
    });

    const created = await discussionService.getById(comment.diskusi_id);

    return ApiResponse.success(reply, created, parent_id ? 'Reply posted successfully' : 'Comment posted successfully', 201);
  }

  /**
   * User: Edit the content of an existing comment (ownership verified)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async update(request, reply) {
    const { id } = request.params;
    
    const comment = await discussionService.getById(id);
    if (!comment) {
      return ApiResponse.notFound(reply, 'Comment not found');
    }

    // Only owner can edit
    if (comment.user_id !== request.user.id) {
      return ApiResponse.error(reply, 'You can only edit your own comments', 403);
    }

    const updated = await discussionService.update(id, sanitizePlainText(request.body.isi_pesan.trim()));
    return ApiResponse.success(reply, updated, 'Comment updated successfully');
  }

  /**
   * User/Moderator: Delete a comment (Ownership or Moderation permission verified)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async delete(request, reply) {
    const { id } = request.params;

    const comment = await discussionService.getById(id);
    if (!comment) {
      return ApiResponse.notFound(reply, 'Comment not found');
    }

    // Owner, Moderator, or Admin can delete
    const isOwner = comment.user_id === request.user.id;
    const isModerator = request.user.role_id === ROLES.MODERATOR;
    const isAdmin = request.user.role_id === ROLES.ADMIN;

    const canDelete = isOwner || isModerator || isAdmin;

    if (!canDelete) {
      return ApiResponse.error(reply, 'You do not have permission to delete this comment', 403);
    }

    await discussionService.delete(id);
    return ApiResponse.success(reply, null, 'Comment deleted successfully');
  }

  /**
   * Administrative: Fetch a flat list of all comments for moderation
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAllFlat(request, reply) {
    const { page, limit, film_id } = request.query;
    const result = await discussionService.getAllFlat({ page, limit, film_id });

    return ApiResponse.success(
      reply, 
      result.comments, 
      'All comments retrieved successfully', 
      200, 
      result.pagination
    );
  }
}

export const discussionController = new DiscussionController();
