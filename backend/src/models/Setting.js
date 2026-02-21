import { Model } from 'objection';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Setting extends Model {
  static get tableName() {
    return 'settings';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonAttributes() {
    return ['value'];
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['key'],

      properties: {
        id: { type: 'integer' },
        key: { type: 'string', minLength: 1, maxLength: 255 },
        value: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
        description: { type: ['string', 'null'] },
        is_public: { type: 'boolean' },
        updated_at: { type: 'string' }
      }
    };
  }
}
