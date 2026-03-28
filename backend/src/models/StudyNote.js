/**
 * src/models/StudyNote.js
 */

import { BaseModel } from './BaseModel.js';

export class StudyNote extends BaseModel {
  static get tableName() {
    return 'study_notes';
  }

  static get idColumn() {
    return 'note_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'film_id', 'timestamp', 'content'],
      properties: {
        note_id: { type: 'integer' },
        user_id: { type: 'string', minLength: 1, maxLength: 36 },
        film_id: { type: 'integer' },
        timestamp: { type: 'number' },
        content: { type: 'string', minLength: 1, maxLength: 2000 }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'study_notes.user_id',
          to: 'users.id'
        }
      },
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'Film',
        join: {
          from: 'study_notes.film_id',
          to: 'films.film_id'
        }
      }
    };
  }
}
