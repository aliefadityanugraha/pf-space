import { learningMaterialService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';
import { NotFoundError, AuthorizationError } from '../lib/errors.js';

export class LearningMaterialController {
  /**
   * Public: Fetch all active learning materials
   * Filterable by owner for management purposes
   */
  async getAll(request, reply) {
    const { page, limit, owner, status, category_id, category_slug } = request.query;
    
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isModerator = request.user && request.user.role_id === ROLES.MODERATOR;
    
    // Only admins/moderators can see inactive materials if explicitly requested
    const activeOnly = !(status === 'all' && (isAdmin || isModerator));

    const options = { 
      page, 
      limit, 
      activeOnly,
      category_id,
      category_slug
    };

    // Filter by owner if requested
    if (owner === 'true' && request.user) {
      options.creator_id = request.user.id;
    }

    const result = await learningMaterialService.getAll(options);

    return ApiResponse.success(
      reply,
      result.materials,
      'Materi berhasil diambil',
      200,
      result.pagination
    );
  }

  /**
   * Public: Fetch a single material by ID
   */
  async getById(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Materi tidak ditemukan');
    }

    return ApiResponse.success(reply, material);
  }

  /**
   * Admin/Moderator: Create a new material
   */
  async create(request, reply) {
    const material = await learningMaterialService.create({
      ...request.body,
      creator_id: request.user.id
    });

    return ApiResponse.success(reply, material, 'Materi berhasil dibuat', 201);
  }

  /**
   * Admin/Moderator: Update a material
   */
  async update(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Materi tidak ditemukan');
    }

    // Security: Only owner or Admin can update
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('Anda tidak memiliki izin untuk memperbarui materi ini');
    }

    const updated = await learningMaterialService.update(id, request.body);
    return ApiResponse.success(reply, updated, 'Materi berhasil diperbarui');
  }

  /**
   * Admin/Moderator: Delete a material
   */
  async delete(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Materi tidak ditemukan');
    }

    // Security: Only owner or Admin can delete
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('Anda tidak memiliki izin untuk menghapus materi ini');
    }

    await learningMaterialService.delete(id);
    return ApiResponse.success(reply, null, 'Materi berhasil dihapus');
  }

  /**
   * Admin/Moderator: Toggle material status
   */
  async toggleStatus(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Materi tidak ditemukan');
    }

    // Security: Only owner or Admin can toggle
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('Anda tidak memiliki izin untuk mengubah status materi ini');
    }

    const updated = await learningMaterialService.toggleStatus(id);
    return ApiResponse.success(reply, updated, `Materi ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
  }
}

export const learningMaterialController = new LearningMaterialController();
