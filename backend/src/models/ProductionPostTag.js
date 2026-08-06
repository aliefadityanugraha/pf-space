/**
 * src/models/ProductionPostTag.js
 * 
 * Model for the 'production_post_tags' junction table.
 * Links production posts to tags (many-to-many).
 */

import { BaseModel } from './BaseModel.js';

export class ProductionPostTag extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'production_post_tags';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'post_id';
  }

  /**
   * Junction table has no timestamp columns
   */
  $beforeInsert() {
    // Junction table has no timestamp columns
  }

  $beforeUpdate() {
    // Junction table has no timestamp columns
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['post_id', 'tag_id'],
      properties: {
        post_id: { type: 'integer' },
        tag_id: { type: 'integer' }
      }
    };
  }

  /**
   * Define model relationships (post, tag)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      post: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'ProductionPost',
        join: {
          from: 'production_post_tags.post_id',
          to: 'production_posts.post_id'
        }
      },
      tag: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Tag',
        join: {
          from: 'production_post_tags.tag_id',
          to: 'tags.tag_id'
        }
      }
    };
  }
}
