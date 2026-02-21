/**
 * src/lib/validation.js
 * 
 * Shared validation schemas and utility functions using Zod.
 */

import { z } from 'zod';
import { ApiResponse } from './response.js';

/**
 * Common validation helper for controllers
 * @param {z.ZodSchema} schema 
 * @param {object} data 
 * @param {import('fastify').FastifyReply} reply 
 * @returns {object|null} Validated data or null if validation fails
 */
export const validate = (schema, data, reply) => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    ApiResponse.badRequest(reply, 'Validation failed', errors);
    return null;
  }
  
  return result.data;
};

// --- AUTH SCHEMAS ---

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
});

// --- FILM SCHEMAS ---

const isUrl = (v) => {
  try {
    const u = new URL(v);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
};

const uploadOrUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || isUrl(v) || v.startsWith('/uploads/'),
    'Invalid URL or upload path'
  );

export const filmCreateSchema = z.object({
  category_id: z.coerce.number().int().positive().optional(),
  judul: z.string().min(1, 'Judul is required').max(255),
  sinopsis: z.string().max(2000).optional(),
  tahun_karya: z.coerce.number().int().min(1900).max(2100).optional(),
  link_video_utama: uploadOrUrl.optional().or(z.literal('')),
  link_trailer: uploadOrUrl.optional().or(z.literal('')),
  link_bts: uploadOrUrl.optional().or(z.literal('')),
  gambar_poster: z.string().optional(),
  banner_url: z.string().optional(),
  deskripsi_lengkap: z.string().optional(),
  file_naskah: z.string().optional(),
  file_storyboard: z.string().optional(),
  file_rab: z.string().optional(),
  crew: z.any().optional(),
});

export const filmUpdateSchema = filmCreateSchema.partial().extend({
  is_banner_active: z.coerce.boolean().optional(),
});

// --- DISCUSSION SCHEMAS ---

export const commentSchema = z.object({
  isi_pesan: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
  parent_id: z.coerce.number().int().positive().optional().nullable(),
});

// --- CATEGORY SCHEMAS ---

export const categorySchema = z.object({
  nama_kategori: z.string().min(1, 'Category name is required').max(100),
  deskripsi: z.string().max(500).optional(),
});

// --- CHAT SCHEMAS ---

export const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message is too long'),
});

// --- ADMIN SCHEMAS ---

export const updateRoleSchema = z.object({
  role_id: z.coerce.number().int().min(1).max(4),
});

export const rejectionSchema = z.object({
  rejection_reason: z.string().min(1, 'Reason is required').max(1000),
});
