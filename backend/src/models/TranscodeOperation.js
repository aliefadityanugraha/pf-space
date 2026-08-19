/**
 * backend/src/models/TranscodeOperation.js
 *
 * Objection.js Model for transcode_operations audit table.
 */

import { BaseModel } from './BaseModel.js';
import { Film } from './Film.js';

export class TranscodeOperation extends BaseModel {
  static get tableName() {
    return 'transcode_operations';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['film_id', 'operation_type'],
      properties: {
        id: { type: 'integer' },
        film_id: { type: 'integer' },
        job_id: { type: ['string', 'null'] },
        operation_type: {
          type: 'string',
          enum: [
            'enqueue',
            'processing',
            'progress',
            'completed',
            'failed',
            'cancelled',
            'retranscode',
            'recovery',
            'reconciliation',
            'cleanup',
          ],
        },
        previous_status: { type: ['string', 'null'] },
        new_status: { type: ['string', 'null'] },
        progress: { type: 'integer', default: 0 },
        attempt: { type: 'integer', default: 1 },
        reason: { type: ['string', 'null'] },
        error_code: { type: ['string', 'null'] },
        error_message: { type: ['string', 'null'] },
        metadata_json: { type: ['string', 'object', 'null'] },
        created_at: { type: 'string' },
      },
    };
  }

  static get relationMappings() {
    return {
      film: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Film,
        join: {
          from: 'transcode_operations.film_id',
          to: 'films.film_id',
        },
      },
    };
  }
}
