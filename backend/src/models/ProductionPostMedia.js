/**
 * src/models/ProductionPostMedia.js
 * 
 * Model for the 'production_post_media' table. Represents media items
 * (photo, video, pdf) belonging to a production post.
 */

import { BaseModel } from './BaseModel.js';

export class ProductionPostMedia extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'production_post_media';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'media_id';
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
      required: ['post_id', 'media_type', 'file_path'],
      properties: {
        media_id: { type: 'integer' },
        post_id: { type: 'integer' },
        media_type: { type: 'string', enum: ['photo', 'video', 'pdf'] },
        file_path: { type: 'string' },
        mime_type: { type: ['string', 'null'] },
        file_size: { type: ['integer', 'null'] },
        thumbnail: { type: ['string', 'null'] },
        duration: { type: ['integer', 'null'] },
        sort_order: { type: 'integer' },
        created_at: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (post)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      post: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'ProductionPost',
        join: {
          from: 'production_post_media.post_id',
          to: 'production_posts.post_id'
        }
      }
    };
  }
}
