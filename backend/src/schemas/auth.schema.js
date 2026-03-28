/**
 * src/schemas/auth.schema.js
 * 
 * Fastify JSON Schema validation for authentication.
 * 
 * @deprecated LEGACY — Zod equivalents exist in `lib/validation.js`.
 * Prefer Zod schemas with `validateRequest` middleware for new features.
 */

export const updateProfileSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      image: { type: 'string' },
      bio: { type: 'string', maxLength: 1000, nullable: true },
      website: { type: 'string', maxLength: 255, nullable: true },
      location: { type: 'string', maxLength: 255, nullable: true },
      instagram: { type: 'string', maxLength: 100, nullable: true },
      linkedin: { type: 'string', maxLength: 255, nullable: true }
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
