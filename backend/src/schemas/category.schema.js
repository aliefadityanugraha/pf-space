/**
 * src/schemas/category.schema.js
 * 
 * Validation schemas for film categories.
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
