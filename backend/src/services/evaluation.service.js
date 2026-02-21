import { Evaluation, Film } from '../models/index.js';
import { NotFoundError } from '../lib/errors.js';

export class EvaluationService {
  async getByFilmId(filmId) {
    return Evaluation.query()
      .where('film_id', filmId)
      .withGraphFetched('moderator(selectBasic)')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      })
      .first();
  }

  async upsert(filmId, data, moderatorId) {
    const existing = await Evaluation.query().where('film_id', filmId).first();

    if (existing) {
      return Evaluation.query().patchAndFetchById(existing.id, {
        ...data,
        moderator_id: moderatorId
      });
    }

    return Evaluation.query().insertAndFetch({
      ...data,
      film_id: filmId,
      moderator_id: moderatorId
    });
  }
}

export const evaluationService = new EvaluationService();
