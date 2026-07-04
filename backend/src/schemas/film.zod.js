/**
 * src/schemas/film.zod.js
 * 
 * Zod validation schemas for film operations.
 */

import { z } from 'zod';

export const filmIdParamSchema = z.object({
  id: z.string().min(1) // Can be ID or slug
});

export const numericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be numeric').transform(Number)
});

export const filmIdNumericParamSchema = z.object({
  filmId: z.string().regex(/^\d+$/, 'Film ID must be numeric').transform(Number)
});

export const filmBodySchema = z.object({
  category_id: z.number().int().positive().optional(),
  judul: z.string().min(1).max(255).optional(),
  sinopsis: z.string().max(2000).optional(),
  tahun_karya: z.number().int().min(1900).max(2100).optional(),
  link_video_utama: z.string().optional(),
  link_trailer: z.string().optional(),
  link_bts: z.string().optional(),
  gambar_poster: z.string().optional(),
  banner_url: z.string().optional(),
  deskripsi_lengkap: z.string().optional(),
  file_naskah: z.string().optional(),
  file_storyboard: z.string().optional(),
  file_rab: z.string().optional(),
  crew: z.array(z.any()).optional(),
  is_banner_active: z.boolean().optional()
});

export const createFilmSchema = filmBodySchema.extend({
  judul: z.string().min(1).max(255)
});
