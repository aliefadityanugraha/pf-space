/**
 * src/services/productionFeed.commentAdapter.js
 *
 * Adapter yang menghubungkan komentar Production Feed dengan Comment System
 * existing (tabel `discussions` + model `Discussion`).
 *
 * - Tidak membuat tabel baru: komentar post disimpan di `discussions.post_id`.
 * - Tidak menduplikasi endpoint: rute komentar post ada di `/discussions/post/*`
 *   (sistem komentar existing); penghapusan komentar memakai `DELETE /discussions/:id`
 *   yang sudah ada (owner/moderator/admin + delete rekursif CTE).
 * - Aturan domain feed dipertahankan di sini: post harus `published` & `public`
 *   agar dapat dikomentari; notifikasi dikirim ke author post.
 * - Event notifikasi (reuse `notificationService.create`, tanpa duplikasi):
 *   Feed Comment (`production_comment`) ke author post & Feed Mention
 *   (`production_mention`) ke setiap user yang `@Nama`-nya disebut di komentar.
 */

import {
  ProductionPost,
  Discussion,
  User,
  BaseModel
} from '../models/index.js';
import { notificationService } from './notification.service.js';
import { sanitizePlainText } from '../lib/sanitize.js';
import { PAGINATION, buildPagination } from '../config/constants.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { POST_STATUS, POST_VISIBILITY } from './productionFeed.service.js';

export class ProductionFeedCommentAdapter {
  /**
   * List comments of a post (flat, paginated, ascending — pola feed)
   * @param {number} postId - Post ID
   * @param {object} [options={}] - Pagination options
   * @returns {Promise<{comments: object[], pagination: object}>}
   */
  async getByPost(postId, { page = PAGINATION.DEFAULT_PAGE, limit = 50 } = {}) {
    const offset = (page - 1) * limit;

    const [comments, totalResult] = await Promise.all([
      Discussion.query()
        .where('post_id', postId)
        .withGraphFetched('user(selectBasic)')
        .modifiers(BaseModel.defaultModifiers)
        .orderBy('created_at', 'asc')
        .limit(limit)
        .offset(offset),
      Discussion.query()
        .where('post_id', postId)
        .count('diskusi_id as total')
        .first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      comments,
      pagination: buildPagination(total, parseInt(page), parseInt(limit))
    };
  }

  /**
   * Total comment count for a post
   * @param {number} postId - Post ID
   * @returns {Promise<number>}
   */
  async getCommentCount(postId) {
    const result = await Discussion.query()
      .where('post_id', postId)
      .count('diskusi_id as total')
      .first();
    return parseInt(result?.total || 0);
  }

  /**
   * Add a comment to a published public post via the existing comment system.
   * @param {number} postId - Post ID
   * @param {string} userId - Commenter user ID
   * @param {string} isiPesan - Comment text
   * @returns {Promise<object>} Comment with user info
   */
  async addComment(postId, userId, isiPesan) {
    const post = await ProductionPost.query()
      .findById(postId)
      .whereNull('deleted_at');
    if (!post) throw new NotFoundError('Post tidak ditemukan');

    if (
      post.status !== POST_STATUS.PUBLISHED ||
      post.visibility !== POST_VISIBILITY.PUBLIC
    ) {
      throw new ValidationError('Post tidak dapat dikomentari');
    }

    const comment = await Discussion.query().insert({
      post_id: post.post_id,
      user_id: userId,
      isi_pesan: sanitizePlainText(isiPesan.trim())
    });

    // Reuse Notification: notify the post author (side-effect, must not fail the request)
    if (post.user_id && post.user_id !== userId) {
      try {
        await notificationService.create({
          user_id: post.user_id,
          type: 'production_comment',
          title: 'Ada komentar di post Anda',
          message: `Seseorang mengomentari post "${post.judul}".`,
          data: {
            post_id: post.post_id,
            discussion_id: comment.diskusi_id
          }
        });
      } catch (err) {
        console.error('Failed to send comment notification:', err.message);
      }
    }

    // Reuse Notification: Feed Mention (side-effect, must not fail the request)
    try {
      await this._notifyMentionedUsers(comment.isi_pesan, {
        actorId: userId,
        post,
        discussionId: comment.diskusi_id
      });
    } catch (err) {
      console.error('Failed to send production_mention notification:', err.message);
    }

    return Discussion.query()
      .findById(comment.diskusi_id)
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers);
  }

  /**
   * Extract unique @mention candidates (max 2 tokens to support display names
   * with spaces) from plain text. Matching is exact against `users.name`
   * (case-insensitive via MySQL default collation).
   * @param {string} text - Sanitized comment text
   * @returns {string[]} Candidate display names
   */
  _extractMentionCandidates(text) {
    const candidates = [];
    for (const match of text.matchAll(/@([\p{L}\p{N}_.'-]+)(?:\s+([\p{L}\p{N}_.'-]+))?/gu)) {
      const first = match[1];
      const second = match[2];
      if (second) candidates.push(`${first} ${second}`);
      candidates.push(first);
    }
    return [...new Set(candidates)];
  }

  /**
   * Notify every user whose display name is mentioned (via `@Nama`) in a comment.
   * Reuses the existing Notification service; per-recipient failures are logged
   * and never fail the comment request (pola side-effect `try/catch`).
   * @param {string} text - Sanitized comment text
   * @param {object} params
   * @param {string} params.actorId - Commenter user ID (never notified)
   * @param {object} params.post - ProductionPost being commented
   * @param {number} params.discussionId - Created discussion ID
   * @returns {Promise<void>}
   */
  async _notifyMentionedUsers(text, { actorId, post, discussionId }) {
    const candidates = this._extractMentionCandidates(text);
    if (!candidates.length) return;

    const mentionedUsers = await User.query()
      .select('id', 'name')
      .whereIn('name', candidates)
      .where('id', '!=', actorId);

    for (const user of mentionedUsers) {
      try {
        await notificationService.create({
          user_id: user.id,
          type: 'production_mention',
          title: 'Anda disebut dalam komentar',
          message: `Seseorang menyebut Anda dalam komentar di post "${post.judul}".`,
          data: {
            post_id: post.post_id,
            discussion_id: discussionId
          }
        });
      } catch (err) {
        console.error('Failed to send production_mention notification:', err.message);
      }
    }
  }
}

export const productionFeedCommentAdapter = new ProductionFeedCommentAdapter();
