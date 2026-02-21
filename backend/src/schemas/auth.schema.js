/**
 * src/schemas/auth.schema.js
 * 
 * Validation schemas for authentication and user management.
 */

export const updateProfileSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      image: { type: 'string' }
    },
    additionalProperties: false
  }
};

export const updateRoleSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', minLength: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['role_id'],
    properties: {
      role_id: { type: 'integer', minimum: 1, maximum: 5 }
    },
    additionalProperties: false
  }
};
