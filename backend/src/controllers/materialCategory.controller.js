/**
 * src/controllers/materialCategory.controller.js
 * 
 * Controller for material categories endpoints.
 */

import { materialCategoryService } from '../services/index.js';
import { recordAuditLog } from '../lib/audit.js';

export class MaterialCategoryController {
  async getAll(request, reply) {
    try {
      const categories = await materialCategoryService.getAll();
      return reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Gagal mengambil data kategori materi'
      });
    }
  }

  async getById(request, reply) {
    try {
      const { id } = request.params;
      const category = await materialCategoryService.getById(id);
      
      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Kategori materi tidak ditemukan'
        });
      }

      return reply.send({
        success: true,
        data: category
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Gagal mengambil detail kategori materi'
      });
    }
  }

  async create(request, reply) {
    try {
      const category = await materialCategoryService.create(request.body);

      await recordAuditLog({
        userId: request.user?.id,
        action: 'CREATE_MATERIAL_CATEGORY',
        targetType: 'category',
        targetId: category.id || category.category_id,
        details: { name: category.name || category.nama_kategori },
        ipAddress: request.ip
      });

      return reply.status(201).send({
        success: true,
        message: 'Kategori materi berhasil dibuat',
        data: category
      });
    } catch (error) {
      request.log.error(error);
      if (error.code === 'ER_DUP_ENTRY') {
        return reply.status(400).send({
          success: false,
          message: 'Nama atau slug kategori sudah ada'
        });
      }
      return reply.status(500).send({
        success: false,
        message: 'Gagal membuat kategori materi'
      });
    }
  }

  async update(request, reply) {
    try {
      const { id } = request.params;
      const category = await materialCategoryService.update(id, request.body);
      
      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Kategori materi tidak ditemukan'
        });
      }

      await recordAuditLog({
        userId: request.user?.id,
        action: 'UPDATE_MATERIAL_CATEGORY',
        targetType: 'category',
        targetId: id,
        details: { name: category.name || category.nama_kategori },
        ipAddress: request.ip
      });

      return reply.send({
        success: true,
        message: 'Kategori materi berhasil diperbarui',
        data: category
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Gagal memperbarui kategori materi'
      });
    }
  }

  async delete(request, reply) {
    try {
      const { id } = request.params;
      const deleted = await materialCategoryService.delete(id);
      
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          message: 'Kategori materi tidak ditemukan'
        });
      }

      await recordAuditLog({
        userId: request.user?.id,
        action: 'DELETE_MATERIAL_CATEGORY',
        targetType: 'category',
        targetId: id,
        details: { categoryId: id },
        ipAddress: request.ip
      });

      return reply.send({
        success: true,
        message: 'Kategori materi berhasil dihapus'
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Gagal menghapus kategori materi'
      });
    }
  }
}

export const materialCategoryController = new MaterialCategoryController();
