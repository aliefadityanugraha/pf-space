/**
 * src/services/learningMaterial.service.js
 * 
 * Service for managing learning materials (PDFs and Videos).
 */

import { LearningMaterial } from '../models/index.js';

export class LearningMaterialService {
  /**
   * Create a new learning material
   * @param {object} data - Material data
   */
  async create(data) {
    return await LearningMaterial.query().insert(data);
  }

  /**
   * Get all learning materials with pagination
   * @param {object} options - Pagination options
   */
  async getAll({ page = 1, limit = 20, activeOnly = true }) {
    let query = LearningMaterial.query()
      .withGraphFetched('creator')
      .orderBy('created_at', 'desc');

    if (activeOnly) {
      query = query.where('is_active', true);
    }

    const results = await query.page(page - 1, limit);

    return {
      materials: results.results,
      pagination: {
        total: results.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(results.total / limit)
      }
    };
  }

  /**
   * Get material by ID
   * @param {number} id 
   */
  async getById(id) {
    return await LearningMaterial.query()
      .findById(id)
      .withGraphFetched('creator');
  }

  /**
   * Update a learning material
   * @param {number} id 
   * @param {object} data 
   */
  async update(id, data) {
    return await LearningMaterial.query()
      .patchAndFetchById(id, data);
  }

  /**
   * Delete a learning material
   * @param {number} id 
   */
  async delete(id) {
    return await LearningMaterial.query().deleteById(id);
  }

  /**
   * Toggle active status
   * @param {number} id 
   */
  async toggleStatus(id) {
    const material = await this.getById(id);
    if (!material) return null;

    return await this.update(id, { is_active: !material.is_active });
  }
}

export const learningMaterialService = new LearningMaterialService();
