/**
 * src/models/Report.js
 * 
 * Model for the 'reports' table.
 */

import { BaseModel } from './BaseModel.js';

export class Report extends BaseModel {
  static get tableName() {
    return 'reports';
  }

  static get idColumn() {
    return 'report_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'target_type', 'target_id', 'reason'],
      properties: {
        report_id: { type: 'integer' },
        user_id: { type: 'string' },
        target_type: { type: 'string', enum: ['film', 'comment', 'discussion', 'reply', 'material'] },
        target_id: { type: 'integer' },
        reason: { type: 'string' },
        description: { type: ['string', 'null'] },
        status: { type: 'string', default: 'pending' },
        admin_notes: { type: ['string', 'null'] },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    return {
      reporter: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: 'User',
        join: {
          from: 'reports.user_id',
          to: 'users.id'
        }
      }
    };
  }
}
