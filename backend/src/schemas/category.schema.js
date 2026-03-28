/**
 * src/schemas/category.schema.js
 * 
 * Fastify JSON Schema validation for film categories.
 * 
 * @deprecated LEGACY — Zod equivalents exist in `lib/validation.js`.
 * Prefer Zod schemas with `validateRequest` middleware for new features.
 */

export const categorySchema = {
  body: {
    type: 'object',
    required: ['nama_kategori'],
    properties: {
      nama_kategori: { type: 'string', minLength: 1, maxLength: 100 },
      deskripsi: { type: 'string', maxLength: 500 }
    },
    additionalProperties: false
  }
};
