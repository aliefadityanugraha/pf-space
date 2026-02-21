/**
 * src/models/ChatHistory.js
 * 
 * Model for the 'chat_history' table.
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ChatHistory extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'chat_history';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'chat_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'user_prompt', 'ai_response'],
      properties: {
        chat_id: { type: 'integer' },
        user_id: { type: 'string' },
        user_prompt: { type: 'string' },
        ai_response: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (user)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'chat_history.user_id',
          to: 'users.id'
        }
      }
    };
  }

  /**
   * Hook: Auto-set created_at before insert
   */
  $beforeInsert() {
    this.created_at = new Date();
  }

  /**
   * Hook override: chat_history table doesn't have updated_at column
   */
  $beforeUpdate() {
    // No updated_at column
  }
}
