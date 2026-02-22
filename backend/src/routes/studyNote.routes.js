/**
 * src/routes/studyNote.routes.js
 */

import { studyNoteController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

export default async function studyNoteRoutes(fastify) {
  fastify.get('/:filmId', {
    preHandler: authenticate
  }, studyNoteController.getByFilmId.bind(studyNoteController));

  fastify.post('/:filmId', {
    preHandler: authenticate
  }, studyNoteController.create.bind(studyNoteController));

  fastify.put('/:id', {
    preHandler: authenticate
  }, studyNoteController.update.bind(studyNoteController));

  fastify.delete('/:id', {
    preHandler: authenticate
  }, studyNoteController.delete.bind(studyNoteController));
}
