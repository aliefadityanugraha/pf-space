/**
 * src/services/discussion.service.js
 * 
 * Service for managing discussions, comments, and nested replies.
 */

import { Discussion, Film, BaseModel } from '../models/index.js';
import { notificationService } from './notification.service.js';

export class DiscussionService {
  /**
   * Get all root comments for a film with pagination and nested replies
   * @param {number} filmId - Film ID
   * @param {object} options - Pagination options
   * @returns {Promise<{comments: object[], pagination: object}>} Paginated results with nested replies
   */
  async getByFilm(filmId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Get root comments (parent_id = null)
    const rootComments = await Discussion.query()
      .where('film_id', filmId)
      .whereNull('parent_id')
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await Discussion.query()
      .where('film_id', filmId)
      .whereNull('parent_id')
      .count('diskusi_id as total')
      .first();

    // Fetch replies for each root comment (nested)
    const commentsWithReplies = await Promise.all(
      rootComments.map(async (comment) => {
        const replies = await this.getRepliesRecursive(comment.diskusi_id);
        return {
          ...comment,
          replies,
          reply_count: this.countReplies(replies)
        };
      })
    );

    return {
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        totalPages: Math.ceil(totalResult.total / limit)
      }
    };
  }

  /**
   * Recursively fetch replies for a comment up to a certain depth
   * @param {number} parentId - Parent comment ID
   * @param {number} [depth=0] - Current recursion depth
   * @param {number} [maxDepth=5] - Maximum recursion depth
   * @returns {Promise<object[]>} Array of nested replies
   */
  async getRepliesRecursive(parentId, depth = 0, maxDepth = 5) {
    if (depth >= maxDepth) return [];

    const replies = await Discussion.query()
      .where('parent_id', parentId)
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'asc');

    // Recursively get nested replies
    return Promise.all(
      replies.map(async (reply) => {
        const nestedReplies = await this.getRepliesRecursive(reply.diskusi_id, depth + 1, maxDepth);
        return {
          ...reply,
          replies: nestedReplies,
          depth: depth + 1
        };
      })
    );
  }

  /**
   * Calculate the total number of replies in a nested comment tree
   * @param {object[]} replies - Nested reply structure
   * @returns {number} Total reply count
   */
  countReplies(replies) {
    let count = replies.length;
    for (const reply of replies) {
      if (reply.replies) {
        count += this.countReplies(reply.replies);
      }
    }
    return count;
  }

  /**
   * Get a single discussion/comment by its ID
   * @param {number} id - Comment ID
   * @returns {Promise<Discussion|null>} Discussion object or null
   */
  async getById(id) {
    return Discussion.query()
      .findById(id)
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers);
  }

  /**
   * Create a new comment/reply and send relevant notifications
   * @param {object} data - Comment data (film_id, user_id, isi_pesan, parent_id)
   * @returns {Promise<Discussion>} Created discussion object
   */
  async create(data) {
    const discussion = await Discussion.query().insert(data);

    // Send notifications
    try {
      const { film_id, user_id, parent_id, isi_pesan } = data;
      const film = await Film.query().findById(film_id).select('user_id', 'judul');

      if (!film) return discussion;

      // 1. If Reply: Notify Parent Comment Author
      if (parent_id) {
        const parentComment = await Discussion.query().findById(parent_id).select('user_id');
        if (parentComment && parentComment.user_id !== user_id) {
          await notificationService.create({
            user_id: parentComment.user_id,
            type: 'reply',
            title: 'Balasan Baru di Komentar Anda',
            message: `Seseorang membalas komentar Anda di film "${film.judul}": "${isi_pesan.substring(0, 50)}${isi_pesan.length > 50 ? '...' : ''}"`,
            data: { film_id, discussion_id: discussion.diskusi_id }
          });
        }
      }

      // 2. Notify Film Creator (if not self and not already notified as parent)
      // If parent author is film creator, they already got reply notification, so skip.
      const parentAuthorId = parent_id ? (await Discussion.query().findById(parent_id).select('user_id'))?.user_id : null;
      
      if (film.user_id !== user_id && film.user_id !== parentAuthorId) {
        await notificationService.create({
          user_id: film.user_id,
          type: 'comment',
          title: 'Komentar Baru di Film Anda',
          message: `Seseorang mengomentari film Anda "${film.judul}": "${isi_pesan.substring(0, 50)}${isi_pesan.length > 50 ? '...' : ''}"`,
          data: { film_id, discussion_id: discussion.diskusi_id }
        });
      }

    } catch (error) {
      console.error('Failed to send discussion notification:', error);
    }

    return discussion;
  }

  /**
   * Update the content of an existing comment
   * @param {number} id - Comment ID
   * @param {string} isiPesan - New message content
   * @returns {Promise<Discussion>} Updated discussion object
   */
  async update(id, isiPesan) {
    return Discussion.query().patchAndFetchById(id, { isi_pesan: isiPesan });
  }

  /**
   * Delete a comment and all its nested replies recursively within a transaction
   * @param {number} id - Comment ID
   * @returns {Promise<number>} Number of deleted rows
   */
  async delete(id) {
    return Discussion.transaction(async (trx) => {
      // Delete all nested replies first (cascade)
      await this.deleteRepliesRecursive(id, trx);
      return Discussion.query(trx).deleteById(id);
    });
  }

  /**
   * Helper to delete all replies for a parent comment recursively
   * @param {number} parentId - Parent comment ID
   * @param {import('objection').Transaction} trx - Transaction object
   */
  async deleteRepliesRecursive(parentId, trx) {
    const replies = await Discussion.query(trx).where('parent_id', parentId);
    
    for (const reply of replies) {
      await this.deleteRepliesRecursive(reply.diskusi_id, trx);
      await Discussion.query(trx).deleteById(reply.diskusi_id);
    }
  }

  /**
   * Determine the nesting depth level of a comment
   * @param {number} id - Comment ID
   * @returns {Promise<number>} Depth level (1 based)
   */
  async getCommentDepth(id) {
    let depth = 1;
    let current = await Discussion.query().findById(id).select('parent_id');
    
    while (current && current.parent_id) {
      depth++;
      current = await Discussion.query().findById(current.parent_id).select('parent_id');
    }
    
    return depth;
  }

  /**
   * Get the total count of comments (including replies) for a film
   * @param {number} filmId - Film ID
   * @returns {Promise<number>} Comment count
   */
  async getCommentCount(filmId) {
    const result = await Discussion.query()
      .where('film_id', filmId)
      .count('diskusi_id as total')
      .first();
    return parseInt(result.total);
  }

  /**
   * Get a flat list of comments for moderation purposes
   * @param {object} options - Filtering and pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=50] - Items per page
   * @param {number} [options.film_id] - Filter by film
   * @returns {Promise<{comments: Discussion[], pagination: object}>} Flat list of comments
   */
  async getAllFlat(options = {}) {
    const { page = 1, limit = 50, film_id } = options;
    const offset = (page - 1) * limit;

    const query = Discussion.query()
      .withGraphFetched('[user(selectBasic), film(selectFilm)]')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'desc');

    if (film_id) {
      query.where('film_id', film_id);
    }

    const [comments, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      Discussion.query()
        .modify(q => { if (film_id) q.where('film_id', film_id); })
        .count('diskusi_id as total')
        .first()
    ]);

    return {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        totalPages: Math.ceil(totalResult.total / limit)
      }
    };
  }
}

export const discussionService = new DiscussionService();
