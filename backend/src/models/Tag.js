/**
 * src/models/Tag.js
 * 
 * Model for the 'tags' table. Represents tags that can be
 * attached to production posts.
 */

import { BaseModel } from './BaseModel.js';

export class Tag extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'tags';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'tag_id';
  }

  /**
   * Hook: Auto-set created_at before insert (no updated_at column in table)
   */
  $beforeInsert() {
    this.created_at = new Date();
  }

  $beforeUpdate() {
    // Table has no updated_at column
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nama_tag', 'slug'],
      properties: {
        tag_id: { type: 'integer' },
        nama_tag: { type: 'string' },
        slug: { type: 'string' },
        created_at: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (posts)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      posts: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: 'ProductionPost',
        join: {
          from: 'tags.tag_id',
          through: {
            from: 'production_post_tags.tag_id',
            to: 'production_post_tags.post_id'
          },
          to: 'production_posts.post_id'
        }
      }
    };
  }
}
