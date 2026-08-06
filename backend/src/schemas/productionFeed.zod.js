/**
 * src/schemas/productionFeed.zod.js
 *
 * Zod validation schemas for Production Feed operations
 * (posts, media, tags, and comments). Reuses shared validators
 * from lib/validation.js (uploadOrUrl, commentSchema).
 */

import { z } from 'zod';
import { uploadOrUrl } from '../lib/validation.js';

// --- PARAMS ---

export const productionPostIdParamSchema = z.object({
  id: z.string().min(1) // Numeric ID or slug
});

export const productionPostNumericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be numeric').transform(Number)
});

export const productionPostNumericParamSchema = z.object({
  postId: z.string().regex(/^\d+$/, 'Post ID must be numeric').transform(Number)
});

export const productionTagIdParamSchema = z.object({
  tagId: z.string().regex(/^\d+$/, 'Tag ID must be numeric').transform(Number)
});

// --- QUERY (list / filter / search) ---

export const productionFeedQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(255).optional(),
    category_id: z.coerce.number().int().positive().optional(),
    film_id: z.coerce.number().int().positive().optional(),
    user_id: z.string().min(1).optional(),
    author: z.string().trim().max(255).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from harus YYYY-MM-DD').optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to harus YYYY-MM-DD').optional(),
    tipe: z.enum(['progress', 'behind_the_scenes', 'casting', 'announcement', 'wrap']).optional(),
    tag_id: z.coerce.number().int().positive().optional(),
    sortBy: z.enum(['created_at', 'published_at', 'judul', 'is_pinned']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
    visibility: z.enum(['public', 'private']).optional(),
    is_pinned: z.enum(['true', 'false']).optional(),
    cursor: z.string().min(1).max(500).optional()
  })
  .refine((data) => !data.date_from || !data.date_to || data.date_from <= data.date_to, {
    message: 'date_from tidak boleh lebih dari date_to',
    path: ['date_from']
  });

// --- BODY (post / media / tag) ---

const mediaItemSchema = z.object({
  media_type: z.enum(['photo', 'video', 'pdf']),
  file_path: uploadOrUrl,
  mime_type: z.string().max(255).optional(),
  file_size: z.coerce.number().int().nonnegative().optional(),
  thumbnail: uploadOrUrl.optional().nullable(),
  duration: z.coerce.number().nonnegative().optional(),
  sort_order: z.coerce.number().int().min(0).optional()
});

export const productionPostCreateSchema = z.object({
  judul: z.string().min(1, 'Judul is required').max(255),
  isi_konten: z.string().max(50000).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  film_id: z.coerce.number().int().positive().optional(),
  tipe: z.enum(['progress', 'behind_the_scenes', 'casting', 'announcement', 'wrap']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  is_pinned: z.coerce.boolean().optional(),
  gambar_cover: uploadOrUrl.optional().or(z.literal('')),
  media: z.array(mediaItemSchema).max(20).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional()
});

export const productionPostUpdateSchema = productionPostCreateSchema.partial();

export const tagCreateSchema = z.object({
  nama_tag: z.string().min(1, 'Nama tag is required').max(50)
});

export const tagUpdateSchema = z.object({
  nama_tag: z.string().min(1, 'Nama tag is required').max(50)
});
