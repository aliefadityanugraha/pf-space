/**
 * src/services/materialCategory.service.js
 * 
 * Service for managing material categories.
 */

import { MaterialCategory } from '../models/index.js';

export class MaterialCategoryService {
  /**
   * Get all material categories ordered by urutan / category_id
   */
  async getAll() {
    return await MaterialCategory.query()
      .select('material_categories.*')
      .count('materials.materi_id as material_count')
      .leftJoin('learning_materials as materials', 'material_categories.category_id', 'materials.material_category_id')
      .groupBy('material_categories.category_id')
      .orderBy('material_categories.urutan', 'asc')
      .orderBy('material_categories.category_id', 'asc');
  }

  /**
   * Get category by ID
   */
  async getById(id) {
    return await MaterialCategory.query().findById(id);
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug) {
    return await MaterialCategory.query().findOne({ slug });
  }

  /**
   * Create a material category
   */
  async create(data) {
    if (data.urutan !== undefined && data.urutan !== null) {
      data.urutan = parseInt(data.urutan, 10) || 0;
    }

    // Generate slug if not provided
    if (!data.slug && data.nama_kategori) {
      data.slug = data.nama_kategori
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    return await MaterialCategory.query().insert(data);
  }

  /**
   * Update a material category
   */
  async update(id, data) {
    if (data.urutan !== undefined && data.urutan !== null) {
      data.urutan = parseInt(data.urutan, 10) || 0;
    }

    if (data.nama_kategori && !data.slug) {
      data.slug = data.nama_kategori
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    data.updated_at = new Date();
    return await MaterialCategory.query().patchAndFetchById(id, data);
  }

  /**
   * Delete a material category
   */
  async delete(id) {
    return await MaterialCategory.query().deleteById(id);
  }
}

export const materialCategoryService = new MaterialCategoryService();
