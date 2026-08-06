/**
 * src/controllers/productionFeed.controller.js
 * 
 * Controller for Production Feed: posts, media, and tags.
 * Thin controller — only maps request data to the service and
 * formats responses (no business logic). Comments are handled by
 * discussion.controller.js via the comment adapter (see docs/feed/COMMENTS_PRODUCTION_FEED.md).
 */

import { productionFeedService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';
import { NotFoundError } from '../lib/errors.js';

export class ProductionFeedController {
  /**
   * Public: Fetch a paginated feed of posts with filters
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAll(request, reply) {
    const { page, limit, search, category_id, film_id, user_id, author, date_from, date_to, tipe, tag_id, sortBy, sortOrder, status, visibility, is_pinned, cursor } = request.query;

    // Admin/Moderator can filter by any status; public only sees published
    let filterStatus;
    if (this._isModerator(request)) {
      filterStatus = status && status !== 'all' ? status : null;
    }

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || null,
      category_id,
      film_id,
      user_id,
      author: author || null,
      date_from,
      date_to,
      tipe,
      tag_id,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc',
      status: filterStatus,
      visibility,
      requesting_user_id: request.user?.id,
      is_pinned: is_pinned === 'true' ? true : (is_pinned === 'false' ? false : undefined),
      cursor: cursor || null
    };

    const result = await productionFeedService.getAll(options);

    return ApiResponse.success(
      reply,
      result.posts,
      'Feed berhasil diambil',
      200,
      result.pagination
    );
  }

  /**
   * Public: Fetch a single post by its ID or slug (with access control)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getById(request, reply) {
    const { id } = request.params;

    // Check if id is numeric (post_id) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const opts = {
      requesterId: request.user?.id || null,
      isModerator: this._isModerator(request)
    };

    const post = isNumeric
      ? await productionFeedService.getById(parseInt(id), opts)
      : await productionFeedService.getBySlug(id, opts);

    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    return ApiResponse.success(reply, post);
  }

  /**
   * Creator: Fetch all posts owned by the current user
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getMyPosts(request, reply) {
    const { page, limit } = request.query;

    const result = await productionFeedService.getByAuthor(request.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    return ApiResponse.success(
      reply,
      result.posts,
      'Post Anda berhasil diambil',
      200,
      result.pagination
    );
  }

  /**
   * Creator: Create a new post (starts as draft)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const post = await productionFeedService.create(request.user.id, request.body);
    return ApiResponse.success(reply, post, 'Post berhasil dibuat', 201);
  }

  /**
   * Creator/Moderator: Update an existing post (ownership enforced via access control)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async update(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.update(parseInt(id), request.body);
    return ApiResponse.success(reply, updated, 'Post berhasil diperbarui');
  }

  /**
   * Creator/Moderator: Soft delete a post
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async delete(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    await productionFeedService.softDelete(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, null, 'Post berhasil dihapus');
  }

  /**
   * Creator/Moderator: Publish a draft post
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async publish(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.publish(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Post berhasil dipublikasikan');
  }

  /**
   * Creator/Moderator: Archive a post
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async archive(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.archive(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Post berhasil diarsipkan');
  }

  /**
   * Public: Fetch all tags
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getTags(request, reply) {
    const tags = await productionFeedService.getTags();
    return ApiResponse.success(reply, tags, 'Tag berhasil diambil');
  }

  /**
   * Moderator/Admin: Create a tag
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async createTag(request, reply) {
    const tag = await productionFeedService.createTag(request.body);
    return ApiResponse.success(reply, tag, 'Tag berhasil dibuat', 201);
  }

  /**
   * Moderator/Admin: Update a tag
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async updateTag(request, reply) {
    const { tagId } = request.params;

    const tag = await productionFeedService.updateTag(parseInt(tagId), request.body);
    if (!tag) {
      throw new NotFoundError('Tag tidak ditemukan');
    }

    return ApiResponse.success(reply, tag, 'Tag berhasil diperbarui');
  }

  /**
   * Moderator/Admin: Delete a tag
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async deleteTag(request, reply) {
    const { tagId } = request.params;

    const deleted = await productionFeedService.deleteTag(parseInt(tagId));
    if (!deleted) {
      throw new NotFoundError('Tag tidak ditemukan');
    }

    return ApiResponse.success(reply, null, 'Tag berhasil dihapus');
  }

  /**
   * Authorization check: moderator or admin
   * @param {import('fastify').FastifyRequest} request
   * @returns {boolean}
   */
  _isModerator(request) {
    return !!request.user && (request.user.role_id === ROLES.MODERATOR || request.user.role_id === ROLES.ADMIN);
  }
}

export const productionFeedController = new ProductionFeedController();
