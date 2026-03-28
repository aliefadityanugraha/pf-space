/**
 * src/schemas/discussion.schema.js
 * 
 * Fastify JSON Schema validation for discussions and comments.
 * 
 * @deprecated LEGACY — Zod equivalents exist in `lib/validation.js`.
 * Prefer Zod schemas with `validateRequest` middleware for new features.
 */

export const createCommentSchema = {
  params: {
    type: 'object',
    required: ['filmId'],
    properties: {
      filmId: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['isi_pesan'],
    properties: {
      isi_pesan: { type: 'string', minLength: 1, maxLength: 1000 },
      parent_id: { type: ['integer', 'string', 'null'] }
    },
    additionalProperties: false
  }
};

export const updateCommentSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['isi_pesan'],
    properties: {
      isi_pesan: { type: 'string', minLength: 1, maxLength: 1000 }
    },
    additionalProperties: false
  }
};
