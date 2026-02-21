/**
 * src/models/Role.js
 * 
 * Model for the 'roles' table.
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Role extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'roles';
  }

  /**
   * @returns {string} Primary key column name
   */
  static get idColumn() {
    return 'role_id';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        role_id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] }
      }
    };
  }

  /**
   * Define model relationships (users)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      users: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'User.js'),
        join: {
          from: 'roles.role_id',
          to: 'users.role_id'
        }
      }
    };
  }
}

import { ROLES } from '../config/constants.js';

export { ROLES };

export const ROLE_NAMES = {
  [ROLES.USER]: 'user',
  [ROLES.CREATOR]: 'creator',
  [ROLES.MODERATOR]: 'moderator',
  [ROLES.ADMIN]: 'admin'
};
