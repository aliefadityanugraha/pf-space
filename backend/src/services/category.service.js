/**
 * src/services/category.service.js
 * 
 * Service for managing film categories.
 */

import { Category } from '../models/index.js';

export class CategoryService {
  /**
   * Get all film categories sorted by name
   * @returns {Promise<Category[]>}
   */
  async getAll() {
    return Category.query().orderBy('nama_kategori');
  }

  /**
   * Get a single category by its ID
   * @param {number} id - Category ID
   * @returns {Promise<Category|null>}
   */
  async getById(id) {
    return Category.query().findById(id);
  }

  /**
   * Create a new category
   * @param {object} data - Category data
   * @returns {Promise<Category>}
   */
  async create(data) {
    return Category.query().insert(data);
  }

  /**
   * Update an existing category
   * @param {number} id - Category ID
   * @param {object} data - Update data
   * @returns {Promise<Category>}
   */
  async update(id, data) {
    return Category.query().patchAndFetchById(id, data);
  }

  /**
   * Delete a category
   * @param {number} id - Category ID
   * @returns {Promise<number>} Number of deleted rows
   */
  async delete(id) {
    return Category.query().deleteById(id);
  }

  /**
   * Get all categories with a count of published films in each
   * @returns {Promise<Category[]>} Categories with films attached
   */
  async getWithFilmCount() {
    return Category.query()
      .select('categories.*')
      .withGraphFetched('films(onlyPublished)')
      .modifiers({
        onlyPublished(builder) {
          builder.where('status', 'published').select('film_id');
        }
      });
  }
}

export const categoryService = new CategoryService();
