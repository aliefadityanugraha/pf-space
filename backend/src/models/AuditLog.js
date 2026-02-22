import { BaseModel } from './BaseModel.js';

export class AuditLog extends BaseModel {
  static get tableName() {
    return 'audit_logs';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['action', 'target_type'],
      properties: {
        id: { type: 'string' },
        user_id: { type: ['string', 'null'] },
        action: { type: 'string' },
        target_type: { type: 'string' },
        target_id: { type: ['string', 'null'] },
        details: { type: ['string', 'null'] },
        ip_address: { type: ['string', 'null'] },
        created_at: { type: 'string' }
      }
    };
  }

  static get relationMappings() {
    const { User } = require('./User.js');
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'audit_logs.user_id',
          to: 'users.id'
        }
      }
    };
  }
}
