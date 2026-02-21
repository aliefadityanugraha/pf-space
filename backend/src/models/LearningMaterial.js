/**
 * src/models/LearningMaterial.js
 * 
 * Model for 'learning_materials' table.
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LearningMaterial extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'learning_materials';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'materi_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['judul', 'tipe', 'creator_id'],
      properties: {
        materi_id: { type: 'integer' },
        judul: { type: 'string', minLength: 1, maxLength: 255 },
        deskripsi: { type: ['string', 'null'] },
        tipe: { type: 'string', enum: ['pdf', 'video'] },
        file_path: { type: ['string', 'null'] },
        video_url: { type: ['string', 'null'] },
        thumbnail: { type: ['string', 'null'] },
        is_active: { type: 'boolean' },
        creator_id: { type: 'string', minLength: 1, maxLength: 36 }
      }
    };
  }

  /**
   * Define model relationships
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'learning_materials.creator_id',
          to: 'users.id'
        }
      }
    };
  }
}
