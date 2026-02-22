/**
 * src/schemas/learningMaterial.schema.js
 * 
 * Validation schemas for learning materials.
 */

export const createMaterialSchema = {
  body: {
    type: 'object',
    required: ['judul', 'tipe'],
    properties: {
      judul: { type: 'string', minLength: 3, maxLength: 255 },
      deskripsi: { type: 'string', maxLength: 1000 },
      tipe: { type: 'string', enum: ['pdf', 'video'] },
      file_path: { type: ['string', 'null'] },
      video_url: { type: ['string', 'null'] },
      is_active: { type: 'boolean' },
      is_featured: { type: 'boolean' },
      kategori: { type: ['string', 'null'], maxLength: 100 }
    },
    additionalProperties: false
  }
};

export const updateMaterialSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: {
      judul: { type: 'string', minLength: 3, maxLength: 255 },
      deskripsi: { type: 'string', maxLength: 1000 },
      tipe: { type: 'string', enum: ['pdf', 'video'] },
      file_path: { type: ['string', 'null'] },
      video_url: { type: ['string', 'null'] },
      is_active: { type: 'boolean' },
      is_featured: { type: 'boolean' },
      kategori: { type: ['string', 'null'], maxLength: 100 }
    },
    additionalProperties: false
  }
};

export const queryMaterialSchema = {
  query: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      owner: { type: 'string', enum: ['true', 'false'] }
    }
  }
};
