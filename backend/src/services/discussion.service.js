/**
 * src/services/discussion.service.js
 * 
 * Service for managing discussions, comments, and nested replies.
 */

import { Discussion, Film, BaseModel } from '../models/index.js';
import { notificationService } from './notification.service.js';
import { knex } from '../database/index.js';

export class DiscussionService {
  async getByFilm(filmId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Run 3 queries in parallel: count roots, paginated root comments, all replies
    const [countResult, rootComments, allReplies] = await Promise.all([
      // Count only root-level comments for accurate pagination
      Discussion.query()
        .where('film_id', filmId)
        .whereNull('parent_id')
        .count('diskusi_id as total')
        .first(),

      // DB-paginated root comments — avoids loading all roots into memory
      Discussion.query()
        .where('film_id', filmId)
        .whereNull('parent_id')
        .withGraphFetched('user(selectBasic)')
        .modifiers(BaseModel.defaultModifiers)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),

      // All replies for this film (for tree assembly)
      Discussion.query()
        .where('film_id', filmId)
        .whereNotNull('parent_id')
        .withGraphFetched('user(selectBasic)')
        .modifiers(BaseModel.defaultModifiers)
        .orderBy('created_at', 'asc')
    ]);

    const totalRoots = parseInt(countResult?.total || 0);

    if (rootComments.length === 0) {
      return {
        comments: [],
        pagination: {
          page: parseInt(page), limit: parseInt(limit),
          total: totalRoots, totalPages: Math.ceil(totalRoots / limit)
        }
      };
    }

    // Build a flat map of all nodes so we can link replies to parents in O(n)
    const nodeMap = new Map();
    for (const root of rootComments) {
      nodeMap.set(root.diskusi_id, { ...root, replies: [] });
    }
    for (const reply of allReplies) {
      nodeMap.set(reply.diskusi_id, { ...reply, replies: [] });
    }

    // Link each reply to its parent
    for (const reply of allReplies) {
      const parent = nodeMap.get(reply.parent_id);
      if (parent) {
        parent.replies.push(nodeMap.get(reply.diskusi_id));
      }
    }

    // Attach recursive reply_count to each root
    const enhancedRoots = rootComments.map(root => {
      const node = nodeMap.get(root.diskusi_id);
      return { ...node, reply_count: this.countReplies(node.replies) };
    });

    return {
      comments: enhancedRoots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRoots,
        totalPages: Math.ceil(totalRoots / limit)
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

      // Fetch parent comment ONCE and reuse for both notification checks
      const parentComment = parent_id
        ? await Discussion.query().findById(parent_id).select('user_id')
        : null;
      const parentAuthorId = parentComment?.user_id ?? null;

      // 1. If Reply: Notify Parent Comment Author
      if (parentComment && parentAuthorId !== user_id) {
        await notificationService.create({
          user_id: parentAuthorId,
          type: 'reply',
          title: 'Balasan Baru di Komentar Anda',
          message: `Seseorang membalas komentar Anda di film "${film.judul}": "${isi_pesan.substring(0, 50)}${isi_pesan.length > 50 ? '...' : ''}"`,
          data: { film_id, discussion_id: discussion.diskusi_id }
        });
      }

      // 2. Notify Film Creator (if not self, and not already notified as parent author)
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
  /**
   * Delete a comment and all its nested replies using a single recursive CTE query
   * @param {number} id - Comment ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    return Discussion.transaction(async (trx) => {
      // Collect all descendant IDs in one recursive CTE — avoids N+1 per-reply queries
      const [rows] = await knex.raw(`
        WITH RECURSIVE subtree AS (
          SELECT diskusi_id FROM discussions WHERE diskusi_id = ?
          UNION ALL
          SELECT d.diskusi_id FROM discussions d
          INNER JOIN subtree s ON d.parent_id = s.diskusi_id
        )
        SELECT diskusi_id FROM subtree
      `, [id]).transacting(trx);

      const ids = rows.map(r => r.diskusi_id);
      if (ids.length > 0) {
        await Discussion.query(trx).whereIn('diskusi_id', ids).delete();
      }
    });
  }

  /**
   * Determine the nesting depth level of a comment
   * @param {number} id - Comment ID
   * @returns {Promise<number>} Depth level (1 based)
   */
  async getCommentDepth(id) {
    // Use a single Recursive CTE query instead of a loop of N queries
    const { knex } = await import('../database/index.js');
    const result = await knex.raw(`
      WITH RECURSIVE ancestors AS (
        SELECT diskusi_id, parent_id, 1 AS depth
        FROM discussions
        WHERE diskusi_id = ?
        UNION ALL
        SELECT d.diskusi_id, d.parent_id, a.depth + 1
        FROM discussions d
        INNER JOIN ancestors a ON d.diskusi_id = a.parent_id
      )
      SELECT MAX(depth) AS depth FROM ancestors
    `, [id]);

    return result[0]?.[0]?.depth ?? 1;
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
