import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Film extends BaseModel {
  static get tableName() {
    return 'films';
  }

  static get idColumn() {
    return 'film_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'judul'],
      properties: {
        film_id: { type: 'integer' },
        user_id: { type: 'string' },
        category_id: { type: ['integer', 'null'] },
        judul: { type: 'string' },
        slug: { type: ['string', 'null'] },
        sinopsis: { type: ['string', 'null'] },
        tahun_karya: { type: ['integer', 'null'] },
        link_video_utama: { type: ['string', 'null'] },
        link_trailer: { type: ['string', 'null'] },
        gambar_poster: { type: ['string', 'null'] },
        deskripsi_lengkap: { type: ['string', 'null'] },
        file_naskah: { type: ['string', 'null'] },
        file_storyboard: { type: ['string', 'null'] },
        file_rab: { type: ['string', 'null'] },
        crew: { type: ['object', 'array', 'null'] },
        status: { type: 'string', enum: ['pending', 'published', 'rejected'] },
        rejection_reason: { type: ['string', 'null'] },
        banner_url: { type: ['string', 'null'] },
        is_banner_active: { type: ['boolean', 'integer'] }
      }
    };
  }

  // Generate slug from title
  static generateSlug(title, id = null) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return id ? `${base}-${id}` : base;
  }

  // Hook to auto-generate slug before insert
  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
    // Slug will be generated after insert when we have the ID
  }

  static get relationMappings() {
    return {
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'films.user_id',
          to: 'users.id'
        }
      },
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Category.js'),
        join: {
          from: 'films.category_id',
          to: 'categories.category_id'
        }
      },
      discussions: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Discussion.js'),
        join: {
          from: 'films.film_id',
          to: 'discussions.film_id'
        }
      },
      votes: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Vote.js'),
        join: {
          from: 'films.film_id',
          to: 'votes.film_id'
        }
      }
    };
  }
}
