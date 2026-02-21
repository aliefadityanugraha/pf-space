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
      file_path: { type: 'string' },
      video_url: { type: 'string', format: 'uri' },
      is_active: { type: 'boolean' }
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
      file_path: { type: 'string' },
      video_url: { type: 'string', format: 'uri' },
      is_active: { type: 'boolean' }
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
