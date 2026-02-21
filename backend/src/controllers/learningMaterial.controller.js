/**
 * src/controllers/learningMaterial.controller.js
 * 
 * Controller for managing learning materials.
 */

import { learningMaterialService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';

export class LearningMaterialController {
  /**
   * Public: Fetch all active learning materials
   */
  async getAll(request, reply) {
    const { page, limit } = request.query;
    
    // Only admins/moderators can see inactive materials
    const activeOnly = !(request.user && (request.user.role_id === ROLES.ADMIN || request.user.role_id === ROLES.MODERATOR));

    const result = await learningMaterialService.getAll({ 
      page, 
      limit, 
      activeOnly 
    });

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
      return ApiResponse.notFound(reply, 'Material not found');
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
    const updated = await learningMaterialService.update(id, request.body);

    if (!updated) {
      return ApiResponse.notFound(reply, 'Material not found');
    }

    return ApiResponse.success(reply, updated, 'Material updated successfully');
  }

  /**
   * Admin/Moderator: Delete a material
   */
  async delete(request, reply) {
    const { id } = request.params;
    await learningMaterialService.delete(id);
    return ApiResponse.success(reply, null, 'Material deleted successfully');
  }

  /**
   * Admin/Moderator: Toggle material status
   */
  async toggleStatus(request, reply) {
    const { id } = request.params;
    const updated = await learningMaterialService.toggleStatus(id);

    if (!updated) {
      return ApiResponse.notFound(reply, 'Material not found');
    }

    return ApiResponse.success(reply, updated, `Material ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
  }
}

export const learningMaterialController = new LearningMaterialController();
