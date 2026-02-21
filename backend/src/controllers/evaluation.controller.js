import { evaluationService, filmService, notificationService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';
import { NotFoundError, AuthorizationError } from '../lib/errors.js';

export class EvaluationController {
  /**
   * Protected: Get evaluation for a film. 
   * Accessible by Admin, Moderator, or the Film's Creator.
   */
  async getByFilm(request, reply) {
    const { id } = request.params; // film_id or slug
    
    // Resolve film
    const isNumeric = /^\d+$/.test(id);
    const film = isNumeric 
      ? await filmService.getById(id)
      : await filmService.getBySlug(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    // Auth check: Admin/Moderator can see, or the Creator of this film
    const isOwner = request.user && request.user.id === film.user_id;
    const isStaff = request.user && (request.user.role_id === ROLES.ADMIN || request.user.role_id === ROLES.MODERATOR);

    if (!isOwner && !isStaff) {
      // Forbidden but to hide existence we throw NotFound or simple Auth error
      throw new AuthorizationError('You do not have permission to view this evaluation');
    }

    const evaluation = await evaluationService.getByFilmId(film.film_id);
    // If not found, still return success but with null or message
    return ApiResponse.success(reply, evaluation || null);
  }

  /**
   * Protected: Create or update a film evaluation.
   * Only accessible by Admin or Moderator.
   */
  async upsert(request, reply) {
    const { id } = request.params; // film_id or slug
    const data = request.body;

    const isNumeric = /^\d+$/.test(id);
    const film = isNumeric 
      ? await filmService.getById(id)
      : await filmService.getBySlug(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    const moderatorId = request.user.id;
    
    // Pick only the fields we want to save, to avoid Objection validation errors
    const evaluationFields = [
      'script_score', 'script_comment',
      'cinematography_score', 'cinematography_comment',
      'editing_score', 'editing_comment',
      'production_score', 'production_comment',
      'overall_feedback'
    ];
    
    const saveData = {};
    evaluationFields.forEach(field => {
      if (data[field] !== undefined) {
        saveData[field] = data[field];
      }
    });

    const evaluation = await evaluationService.upsert(film.film_id, saveData, moderatorId);

    // Send notification to the creator
    await notificationService.create({
      user_id: film.user_id,
      type: 'EVALUATION_POSTED',
      title: 'Karya Anda telah dinilai',
      message: `Moderator telah memberikan penilaian dan masukan untuk karya "${film.judul}". Lihat di Mode Studi.`,
      data: { link: `/archive/${film.slug}/study` }
    });

    return ApiResponse.success(reply, evaluation, 'Evaluation saved successfully');
  }
}

export const evaluationController = new EvaluationController();
