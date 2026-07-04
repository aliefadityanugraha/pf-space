/**
 * src/services/studyNote.service.js
 */

import { StudyNote } from '../models/index.js';

export class StudyNoteService {
  async create(data) {
    return await StudyNote.query().insert(data).withGraphFetched('user');
  }

  async getByFilmId(film_id, user_id) {
    return await StudyNote.query()
      .where({ film_id, user_id })
      .orderBy('timestamp', 'asc')
      .withGraphFetched('user');
  }

  async delete(note_id, user_id) {
    return await StudyNote.query()
      .delete()
      .where({ note_id, user_id });
  }

  async update(note_id, user_id, content) {
    return await StudyNote.query()
      .patchAndFetchById(note_id, { content })
      .where({ user_id });
  }
}

export const studyNoteService = new StudyNoteService();
