/**
 * src/models/CommunityDiscussion.js
 * 
 * Model for community discussions (general topics by admin/moderator)
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommunityDiscussion extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'community_discussions';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'discussion_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'title'],
      properties: {
        discussion_id: { type: 'integer' },
        user_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: ['string', 'null'] },
        is_active: { type: 'boolean' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (creator, replies)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'community_discussions.user_id',
          to: 'users.id'
        }
      },
      replies: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'CommunityReply.js'),
        join: {
          from: 'community_discussions.discussion_id',
          to: 'community_replies.discussion_id'
        }
      }
    };
  }
}
