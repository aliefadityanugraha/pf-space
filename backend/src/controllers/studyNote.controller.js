/**
 * src/controllers/studyNote.controller.js
 */

import { studyNoteService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class StudyNoteController {
  async getByFilmId(request, reply) {
    const { filmId } = request.params;
    const notes = await studyNoteService.getByFilmId(filmId, request.user.id);
    return ApiResponse.success(reply, notes);
  }

  async create(request, reply) {
    const { filmId } = request.params;
    const { timestamp, content } = request.body;
    
    const note = await studyNoteService.create({
      film_id: parseInt(filmId),
      user_id: request.user.id,
      timestamp,
      content
    });

    return ApiResponse.success(reply, note, 'Catatan disimpan', 201);
  }

  async delete(request, reply) {
    const { id } = request.params;
    await studyNoteService.delete(id, request.user.id);
    return ApiResponse.success(reply, null, 'Catatan dihapus');
  }

  async update(request, reply) {
    const { id } = request.params;
    const { content } = request.body;
    const note = await studyNoteService.update(id, request.user.id, content);
    return ApiResponse.success(reply, note, 'Catatan diperbarui');
  }
}

export const studyNoteController = new StudyNoteController();
