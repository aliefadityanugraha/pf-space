/**
 * src/models/Category.js
 * 
 * Model for the 'categories' table.
 */

import { BaseModel } from './BaseModel.js';

export class Category extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'categories';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'category_id';
  }

  /**
   * Define model relationships (films)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      films: {
        relation: BaseModel.HasManyRelation,
        modelClass: 'Film',
        join: {
          from: 'categories.category_id',
          to: 'films.category_id'
        }
      }
    };
  }
}
