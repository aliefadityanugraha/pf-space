import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Evaluation extends BaseModel {
  static get tableName() {
    return 'film_evaluations';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['film_id'],

      properties: {
        id: { type: 'integer' },
        film_id: { type: 'integer' },
        moderator_id: { type: 'string' },
        
        script_score: { type: 'integer', minimum: 0, maximum: 10 },
        script_comment: { type: ['string', 'null'] },
        
        cinematography_score: { type: 'integer', minimum: 0, maximum: 10 },
        cinematography_comment: { type: ['string', 'null'] },
        
        editing_score: { type: 'integer', minimum: 0, maximum: 10 },
        editing_comment: { type: ['string', 'null'] },
        
        production_score: { type: 'integer', minimum: 0, maximum: 10 },
        production_comment: { type: ['string', 'null'] },
        
        overall_feedback: { type: ['string', 'null'] }
      }
    };
  }

  static get relationMappings() {
    return {
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Film.js'),
        join: {
          from: 'film_evaluations.film_id',
          to: 'films.film_id'
        }
      },
      moderator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'film_evaluations.moderator_id',
          to: 'users.id'
        }
      }
    };
  }
}
