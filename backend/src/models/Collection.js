/**
 * src/models/Collection.js
 * 
 * Model for the 'collections' table (bookmarks).
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Collection extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'collections';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'collection_id';
  }

  /**
   * Hook: Auto-set created_at before insert
   */
  $beforeInsert() {
    this.created_at = new Date();
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['film_id', 'user_id'],
      properties: {
        collection_id: { type: 'integer' },
        film_id: { type: 'integer' },
        user_id: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (user, film)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'collections.user_id',
          to: 'users.id'
        }
      },
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Film.js'),
        join: {
          from: 'collections.film_id',
          to: 'films.film_id'
        }
      }
    };
  }
}
