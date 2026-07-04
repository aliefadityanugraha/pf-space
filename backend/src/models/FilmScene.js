/**
 * src/models/FilmScene.js
 */

import { BaseModel } from './BaseModel.js';

export class FilmScene extends BaseModel {
  static get tableName() {
    return 'film_scenes';
  }

  static get idColumn() {
    return 'scene_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['film_id', 'title', 'start_time'],
      properties: {
        scene_id: { type: 'integer' },
        film_id: { type: 'integer' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        start_time: { type: 'number', minimum: 0 },
        end_time: { type: ['number', 'null'], minimum: 0 },
        description: { type: ['string', 'null'], maxLength: 1000 }
      }
    };
  }
}
