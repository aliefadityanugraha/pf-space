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
  bio: z.string().max(1000).optional().nullable(),
  website: z.string().max(255).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  linkedin: z.string().max(255).optional().nullable(),
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

// --- EVALUATION SCHEMAS ---

export const evaluationParamSchema = z.object({
  id: z.string().min(1, 'Film ID is required'),
});

export const evaluationUpsertSchema = z.object({
  script_score: z.coerce.number().int().min(0).max(10),
  script_comment: z.string().max(1000).optional(),
  cinematography_score: z.coerce.number().int().min(0).max(10),
  cinematography_comment: z.string().max(1000).optional(),
  editing_score: z.coerce.number().int().min(0).max(10),
  editing_comment: z.string().max(1000).optional(),
  production_score: z.coerce.number().int().min(0).max(10),
  production_comment: z.string().max(1000).optional(),
  overall_feedback: z.string().max(2000).optional(),
}).strip();

// --- LEARNING MATERIAL SCHEMAS ---

export const materialCreateSchema = z.object({
  judul: z.string().min(3, 'Title is required').max(255),
  deskripsi: z.string().max(1000).optional(),
  tipe: z.enum(['pdf', 'video']),
  file_path: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  is_active: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  kategori: z.string().max(100).nullable().optional(),
}).strip();

export const materialUpdateSchema = z.object({
  judul: z.string().min(3).max(255).optional(),
  deskripsi: z.string().max(1000).optional(),
  tipe: z.enum(['pdf', 'video']).optional(),
  file_path: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  is_active: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  kategori: z.string().max(100).nullable().optional(),
}).strip();

export const materialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  owner: z.enum(['true', 'false']).optional(),
  status: z.enum(['all']).optional(),
});

export const materialIdParamSchema = z.object({
  id: z.string().min(1, 'Material ID is required'),
});

// --- REPORT SCHEMAS ---

export const reportCreateSchema = z.object({
  target_type: z.enum(['film', 'comment', 'discussion', 'reply', 'material']),
  target_id: z.coerce.number().int().positive(),
  reason: z.string().min(1, 'Reason is required').max(500),
  description: z.string().max(2000).optional(),
}).strip();

export const reportStatusSchema = z.object({
  status: z.enum(['pending', 'dismissed', 'resolved']),
  admin_notes: z.string().max(1000).optional(),
}).strip();

// --- COMMUNITY REPLY SCHEMA ---

export const communityReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
}).strip();
