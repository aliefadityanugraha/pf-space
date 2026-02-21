/**
 * src/schemas/film.schema.js
 * 
 * Validation schemas for film operations.
 */

const filmBodyProperties = {
  category_id: { type: 'integer', minimum: 1 },
  judul: { type: 'string', minLength: 1, maxLength: 255 },
  sinopsis: { type: 'string', maxLength: 2000 },
  tahun_karya: { type: 'integer', minimum: 1900, maximum: 2100 },
  link_video_utama: { type: 'string' },
  link_trailer: { type: 'string' },
  link_bts: { type: 'string' },
  gambar_poster: { type: 'string' },
  banner_url: { type: 'string' },
  deskripsi_lengkap: { type: 'string' },
  file_naskah: { type: 'string' },
  file_storyboard: { type: 'string' },
  file_rab: { type: 'string' },
  crew: { type: 'array' },
  is_banner_active: { type: 'boolean' }
};

export const createFilmSchema = {
  body: {
    type: 'object',
    required: ['judul'],
    properties: filmBodyProperties,
    additionalProperties: false
  }
};

export const updateFilmSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: filmBodyProperties,
    additionalProperties: false
  }
};

export const rejectionSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['rejection_reason'],
    properties: {
      rejection_reason: { type: 'string', minLength: 1, maxLength: 1000 }
    },
    additionalProperties: false
  }
};
