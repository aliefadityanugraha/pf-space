/**
 * src/models/User.js
 * 
 * Model for the 'users' table. Represents application users and 
 * their associated roles.
 */

import { BaseModel } from './BaseModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class User extends BaseModel {
  /**
   * @returns {string} Table name
   */
  static get tableName() {
    return 'users';
  }

  /**
   * JSON schema for validation
   * @returns {object} JSON schema definition
   */
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'name'],
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1 },
        emailVerified: { type: 'boolean' },
        image: { type: ['string', 'null'] },
        role_id: { type: 'integer', default: 1 },
        bio: { type: ['string', 'null'], maxLength: 1000 },
        website: { type: ['string', 'null'], maxLength: 255 },
        location: { type: ['string', 'null'], maxLength: 100 },
        instagram: { type: ['string', 'null'], maxLength: 100 },
        linkedin: { type: ['string', 'null'], maxLength: 100 },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    };
  }

  /**
   * Hook: Auto-set createdAt and updatedAt before insert
   */
  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    if (this.role_id === undefined) {
      this.role_id = 1;
    }
  }

  /**
   * Hook: Auto-update updatedAt before update
   */
  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  /**
   * Define model relationships (role, films, discussions, votes, chatHistory)
   * @returns {object} Relation mappings
   */
  static get relationMappings() {
    return {
      role: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Role.js'),
        join: {
          from: 'users.role_id',
          to: 'roles.role_id'
        }
      },
      films: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Film.js'),
        join: {
          from: 'users.id',
          to: 'films.user_id'
        }
      },
      discussions: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Discussion.js'),
        join: {
          from: 'users.id',
          to: 'discussions.user_id'
        }
      },
      votes: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Vote.js'),
        join: {
          from: 'users.id',
          to: 'votes.user_id'
        }
      },
      chatHistory: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'ChatHistory.js'),
        join: {
          from: 'users.id',
          to: 'chat_history.user_id'
        }
      }
    };
  }
}
