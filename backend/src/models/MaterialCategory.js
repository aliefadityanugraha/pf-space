/**
 * src/models/MaterialCategory.js
 * 
 * Model for 'material_categories' table.
 */

import { BaseModel } from './BaseModel.js';

export class MaterialCategory extends BaseModel {
  static get tableName() {
    return 'material_categories';
  }

  static get idColumn() {
    return 'category_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['nama_kategori', 'slug'],
      properties: {
        category_id: { type: 'integer' },
        nama_kategori: { type: 'string', minLength: 1, maxLength: 100 },
        slug: { type: 'string', minLength: 1, maxLength: 100 },
        deskripsi: { type: ['string', 'null'] },
        icon: { type: ['string', 'null'], maxLength: 50 },
        urutan: { type: ['integer', 'string', 'null'] }
      }
    };
  }

  static get relationMappings() {
    return {
      materials: {
        relation: BaseModel.HasManyRelation,
        modelClass: 'LearningMaterial',
        join: {
          from: 'material_categories.category_id',
          to: 'learning_materials.material_category_id'
        }
      }
    };
  }
}
