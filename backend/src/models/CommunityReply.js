/**
 * src/models/CommunityReply.js
 * 
 * Model for community discussion replies
 */

import { BaseModel } from './BaseModel.js';

export class CommunityReply extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'community_replies';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'reply_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['discussion_id', 'user_id', 'content'],
      properties: {
        reply_id: { type: 'integer' },
        discussion_id: { type: 'integer' },
        user_id: { type: 'string' },
        content: { type: 'string' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (user, discussion)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'community_replies.user_id',
          to: 'users.id'
        }
      },
      discussion: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'CommunityDiscussion',
        join: {
          from: 'community_replies.discussion_id',
          to: 'community_discussions.discussion_id'
        }
      }
    };
  }
}
