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
    const { page, limit, owner } = request.query;
    
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isModerator = request.user && request.user.role_id === ROLES.MODERATOR;
    
    // Only admins/moderators can see inactive materials
    const activeOnly = !(isAdmin || isModerator);

    const options = { 
      page, 
      limit, 
      activeOnly 
    };

    // Filter by owner if requested
    if (owner === 'true' && request.user) {
      options.creator_id = request.user.id;
    }

    const result = await learningMaterialService.getAll(options);

    return ApiResponse.success(
      reply,
      result.materials,
      'Materials retrieved successfully',
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
      throw new NotFoundError('Material not found');
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

    return ApiResponse.success(reply, material, 'Material created successfully', 201);
  }

  /**
   * Admin/Moderator: Update a material
   */
  async update(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Security: Only owner or Admin can update
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('You do not have permission to update this material');
    }

    const updated = await learningMaterialService.update(id, request.body);
    return ApiResponse.success(reply, updated, 'Material updated successfully');
  }

  /**
   * Admin/Moderator: Delete a material
   */
  async delete(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Security: Only owner or Admin can delete
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('You do not have permission to delete this material');
    }

    await learningMaterialService.delete(id);
    return ApiResponse.success(reply, null, 'Material deleted successfully');
  }

  /**
   * Admin/Moderator: Toggle material status
   */
  async toggleStatus(request, reply) {
    const { id } = request.params;
    const material = await learningMaterialService.getById(id);

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Security: Only owner or Admin can toggle
    const isAdmin = request.user && request.user.role_id === ROLES.ADMIN;
    const isOwner = request.user && material.creator_id === request.user.id;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('You do not have permission to modify this material');
    }

    const updated = await learningMaterialService.toggleStatus(id);
    return ApiResponse.success(reply, updated, `Material ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
  }
}

export const learningMaterialController = new LearningMaterialController();
