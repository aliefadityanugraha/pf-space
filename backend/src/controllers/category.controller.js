/**
 * src/controllers/category.controller.js
 * 
 * Controller for managing film categories.
 */

import { categoryService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { recordAuditLog } from '../lib/audit.js';

export class CategoryController {
  /**
   * Fetch all available film categories
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAll(request, reply) {
    const categories = await categoryService.getAll();
    return ApiResponse.success(reply, categories);
  }

  /**
   * Fetch a single category by its unique ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getById(request, reply) {
    const { id } = request.params;
    const category = await categoryService.getById(id);

    if (!category) {
      return ApiResponse.notFound(reply, 'Kategori tidak ditemukan');
    }

    return ApiResponse.success(reply, category);
  }

  /**
   * Administrative endpoint to create a new category
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const category = await categoryService.create(request.body);

    await recordAuditLog({
      userId: request.user?.id,
      action: 'CREATE_CATEGORY',
      targetType: 'category',
      targetId: category.category_id,
      details: { name: category.nama_kategori, description: category.deskripsi },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, category, 'Kategori berhasil dibuat', 201);
  }

  /**
   * Administrative endpoint to update an existing category's name or description
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async update(request, reply) {
    const { id } = request.params;
    
    const existing = await categoryService.getById(id);
    if (!existing) {
      return ApiResponse.notFound(reply, 'Kategori tidak ditemukan');
    }

    const category = await categoryService.update(id, request.body);

    await recordAuditLog({
      userId: request.user?.id,
      action: 'UPDATE_CATEGORY',
      targetType: 'category',
      targetId: id,
      details: { previous: { name: existing.nama_kategori }, updated: { name: category.nama_kategori } },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, category, 'Kategori berhasil diperbarui');
  }

  /**
   * Administrative endpoint to delete a category
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async delete(request, reply) {
    const { id } = request.params;

    const existing = await categoryService.getById(id);
    if (!existing) {
      return ApiResponse.notFound(reply, 'Kategori tidak ditemukan');
    }

    await categoryService.delete(id);

    await recordAuditLog({
      userId: request.user?.id,
      action: 'DELETE_CATEGORY',
      targetType: 'category',
      targetId: id,
      details: { name: existing.nama_kategori },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, null, 'Kategori berhasil dihapus');
  }

  /**
   * Fetch categories along with the count of published films in each
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getWithFilmCount(request, reply) {
    const categories = await categoryService.getWithFilmCount();

    const data = categories.map(cat => ({
      ...cat,
      film_count: cat.films?.length || 0,
      films: undefined
    }));

    return ApiResponse.success(reply, data);
  }
}

export const categoryController = new CategoryController();
