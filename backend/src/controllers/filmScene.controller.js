/**
 * src/controllers/filmScene.controller.js
 */

import { filmSceneService, filmService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';

export class FilmSceneController {
  /**
   * Retrieves all scenes for a specific film.
   * GET /api/film-scenes/:filmId
   */
  async getByFilmId(request, reply) {
    const { filmId } = request.params;
    try {
      const scenes = await filmSceneService.getByFilmId(filmId);
      return ApiResponse.success(reply, scenes);
    } catch (err) {
      console.error('[FilmSceneController] Error fetching scenes:', err);
      return ApiResponse.error(reply, 'Gagal mengambil data adegan', 500);
    }
  }

  /**
   * Saves or updates the entire scene structure for a film.
   * Requires appropriate owner or staff authorization.
   * POST /api/film-scenes/:filmId
   */
  async saveScenes(request, reply) {
    const { filmId } = request.params;
    const id = parseInt(filmId);
    
    if (isNaN(id)) {
      return ApiResponse.error(reply, 'ID Film tidak valid', 400);
    }

    try {
      const film = await filmService.getById(id);
      
      if (!film) {
        return ApiResponse.notFound(reply, 'Film tidak ditemukan');
      }

      // Authorization Check: Must be owner or staff (Admin/Moderator)
      const isOwner = request.user?.id === film.user_id;
      const userRoleId = request.user?.role_id;
      const isStaff = [ROLES.ADMIN, ROLES.MODERATOR].includes(userRoleId);

      if (!isOwner && !isStaff) {
        return ApiResponse.error(reply, 'Anda tidak memiliki akses untuk mengelola adegan film ini', 403);
      }

      const scenes = Array.isArray(request.body) ? request.body : [];
      const result = await filmSceneService.bulkCreate(id, scenes);
      
      return ApiResponse.success(reply, result, 'Struktur adegan berhasil disimpan');
    } catch (err) {
      console.error('[FilmSceneController] Error saving scenes:', err);
      return ApiResponse.error(reply, 'Gagal menyimpan struktur adegan: ' + (err.message || 'Server Error'), 500);
    }
  }
}

export const filmSceneController = new FilmSceneController();
