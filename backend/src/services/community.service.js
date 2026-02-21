/**
 * src/services/community.service.js
 * 
 * Service for managing general community discussions and their replies.
 */

import { CommunityDiscussion, CommunityReply, BaseModel } from '../models/index.js';

export class CommunityService {
  /**
   * Fetch the currently active community discussion topic
   * @returns {Promise<CommunityDiscussion|null>}
   */
  async getActiveDiscussion() {
    const discussion = await CommunityDiscussion.query()
      .where('is_active', true)
      .withGraphFetched('[creator(selectBasic), replies(withUser)]')
      .modifiers({
        ...BaseModel.defaultModifiers,
        withUser(builder) {
          builder
            .withGraphFetched('user(selectBasic)')
            .orderBy('created_at', 'asc')
            .modifyGraph('user', (userBuilder) => {
              userBuilder.select('id', 'name', 'image');
            });
        }
      })
      .first();

    return discussion;
  }

  /**
   * Create a new community discussion. Deactivates any existing active topics.
   * @param {string} userId - ID of the admin/moderator creator
   * @param {object} data - Discussion topic data (title, description)
   * @returns {Promise<CommunityDiscussion>}
   */
  async createDiscussion(userId, data) {
    // Deactivate all existing discussions
    await CommunityDiscussion.query()
      .where('is_active', true)
      .patch({ is_active: false });

    // Create new discussion
    const discussion = await CommunityDiscussion.query().insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      is_active: true
    });

    return discussion;
  }

  /**
   * Update an existing community discussion
   * @param {number} discussionId - Discussion ID
   * @param {object} data - Updated fields
   * @returns {Promise<CommunityDiscussion>}
   */
  async updateDiscussion(discussionId, data) {
    return CommunityDiscussion.query()
      .patchAndFetchById(discussionId, data);
  }

  /**
   * Toggle the active status of a discussion
   * @param {number} discussionId - Discussion ID
   * @param {boolean} isActive - New status
   * @returns {Promise<CommunityDiscussion>}
   */
  async toggleDiscussion(discussionId, isActive) {
    if (isActive) {
      // Deactivate all other discussions first
      await CommunityDiscussion.query()
        .whereNot('discussion_id', discussionId)
        .patch({ is_active: false });
    }

    return CommunityDiscussion.query()
      .patchAndFetchById(discussionId, { is_active: isActive });
  }

  /**
   * Delete a community discussion and all its replies
   * @param {number} discussionId - Discussion ID
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteDiscussion(discussionId) {
    return CommunityDiscussion.query().deleteById(discussionId);
  }

  /**
   * Get a paginated list of all community discussions for administrative management
   * @param {object} [options={}] - Pagination settings
   * @returns {Promise<{discussions: object[], pagination: object}>}
   */
  async getAllDiscussions(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const [discussions, totalResult] = await Promise.all([
      CommunityDiscussion.query()
        .withGraphFetched('[creator(selectBasic)]')
        .modifiers(BaseModel.defaultModifiers)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      CommunityDiscussion.query()
        .count('discussion_id as total')
        .first()
    ]);

    // Get reply count for each discussion
    const discussionsWithCounts = await Promise.all(
      discussions.map(async (discussion) => {
        const replyCount = await CommunityReply.query()
          .where('discussion_id', discussion.discussion_id)
          .count('reply_id as count')
          .first();

        return {
          ...discussion,
          reply_count: parseInt(replyCount.count)
        };
      })
    );

    return {
      discussions: discussionsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        totalPages: Math.ceil(totalResult.total / limit)
      }
    };
  }

  /**
   * Get all replies for a specific community discussion
   * @param {number} discussionId - Discussion ID
   * @returns {Promise<CommunityReply[]>}
   */
  async getDiscussionReplies(discussionId) {
    return CommunityReply.query()
      .where('discussion_id', parseInt(discussionId))
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'asc');
  }

  /**
   * Add a new reply to a community discussion
   * @param {number} discussionId - Discussion ID
   * @param {string} userId - User ID
   * @param {string} content - Reply text
   * @returns {Promise<CommunityReply>} Recorded reply with user info
   */
  async addReply(discussionId, userId, content) {
    const reply = await CommunityReply.query().insert({
      discussion_id: parseInt(discussionId),
      user_id: userId,
      content
    });

    return CommunityReply.query()
      .findById(reply.reply_id)
      .withGraphFetched('user(selectBasic)')
      .modifiers(BaseModel.defaultModifiers);
  }

  /**
   * User: Remove their own reply from a discussion
   * @param {number} replyId - Reply ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<number>} Deleted rows
   */
  async deleteReply(replyId, userId) {
    return CommunityReply.query()
      .where('reply_id', replyId)
      .where('user_id', userId)
      .delete();
  }

  /**
   * Admin/Moderator: Delete any reply from a discussion
   * @param {number} replyId - Reply ID
   * @returns {Promise<number>} Deleted rows
   */
  async deleteReplyByModerator(replyId) {
    return CommunityReply.query()
      .deleteById(replyId);
  }
}

export const communityService = new CommunityService();
