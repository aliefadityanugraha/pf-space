/**
 * src/models/ProductionPost.js
 * 
 * Model for the 'production_posts' table. Represents a production feed post,
 * with optional links to a film and category, plus media and tags.
 */

import { BaseModel } from './BaseModel.js';

export class ProductionPost extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'production_posts';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'post_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'judul'],
      properties: {
        post_id: { type: 'integer' },
        user_id: { type: 'string' },
        film_id: { type: ['integer', 'null'] },
        category_id: { type: ['integer', 'null'] },
        judul: { type: 'string' },
        slug: { type: ['string', 'null'] },
        isi_konten: { type: ['string', 'null'] },
        tipe: { type: 'string', enum: ['progress', 'behind_the_scenes', 'casting', 'announcement', 'wrap'] },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        visibility: { type: 'string', enum: ['public', 'private'] },
        gambar_cover: { type: ['string', 'null'] },
        is_pinned: { type: ['boolean', 'integer'] },
        published_at: { type: ['string', 'null'] },
        deleted_at: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  /**
   * Define model relationships (creator, film, category, media, tags)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'production_posts.user_id',
          to: 'users.id'
        }
      },
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Film',
        join: {
          from: 'production_posts.film_id',
          to: 'films.film_id'
        }
      },
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Category',
        join: {
          from: 'production_posts.category_id',
          to: 'categories.category_id'
        }
      },
      media: {
        relation: BaseModel.HasManyRelation,
        modelClass: 'ProductionPostMedia',
        join: {
          from: 'production_posts.post_id',
          to: 'production_post_media.post_id'
        }
      },
      tags: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: 'Tag',
        join: {
          from: 'production_posts.post_id',
          through: {
            from: 'production_post_tags.post_id',
            to: 'production_post_tags.tag_id'
          },
          to: 'tags.tag_id'
        }
      }
    };
  }
}
