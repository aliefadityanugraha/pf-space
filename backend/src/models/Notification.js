/**
 * src/models/Notification.js
 * 
 * Model for the 'notifications' table.
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Notification extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'notifications';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'type', 'title', 'message'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'string' },
        type: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        is_read: { type: 'boolean' },
        data: { type: ['object', 'null'] }
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
          from: 'notifications.user_id',
          to: 'users.id'
        }
      }
    };
  }
}
