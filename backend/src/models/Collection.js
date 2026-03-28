/**
 * src/models/Collection.js
 * 
 * Model for the 'collections' table (bookmarks).
 */

import { BaseModel } from './BaseModel.js';

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
        modelClass: 'User',
        join: {
          from: 'collections.user_id',
          to: 'users.id'
        }
      },
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Film',
        join: {
          from: 'collections.film_id',
          to: 'films.film_id'
        }
      }
    };
  }
}
