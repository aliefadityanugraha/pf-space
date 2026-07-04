/**
 * src/routes/filmScene.routes.js
 */

import { filmSceneController } from '../controllers/index.js';
import { authenticate, validateRequest } from '../middlewares/index.js';
import { filmIdNumericParamSchema } from '../schemas/film.zod.js';

export default async function filmSceneRoutes(fastify) {
  // Public: Get scenes for a film
  fastify.get('/:filmId', {
    preHandler: validateRequest(filmIdNumericParamSchema, 'params')
  }, filmSceneController.getByFilmId.bind(filmSceneController));

  // Protected: Save breakdown (Bulk)
  fastify.post('/:filmId', {
    preHandler: [validateRequest(filmIdNumericParamSchema, 'params'), authenticate]
  }, filmSceneController.saveScenes.bind(filmSceneController));
}
