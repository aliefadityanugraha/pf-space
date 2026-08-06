import { describe, it, expect } from 'vitest';
import {
  productionFeedQuerySchema,
  productionPostIdParamSchema,
  productionPostNumericIdParamSchema,
  productionPostNumericParamSchema,
  productionTagIdParamSchema,
  productionPostCreateSchema,
  productionPostUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema
} from '../schemas/productionFeed.zod.js';

const ok = (schema, value) => expect(schema.safeParse(value).success).toBe(true);
const fail = (schema, value) => expect(schema.safeParse(value).success).toBe(false);

describe('productionFeedQuerySchema', () => {
  it('accepts an empty query (public feed)', () => {
    ok(productionFeedQuerySchema, {});
  });

  it('accepts valid pagination, filters, sort, and cursor', () => {
    ok(productionFeedQuerySchema, {
      page: 2,
      limit: 20,
      search: 'bts',
      category_id: 1,
      film_id: 2,
      user_id: 'usr-1',
      author: 'Budi',
      tipe: 'progress',
      tag_id: 3,
      sortBy: 'published_at',
      sortOrder: 'desc',
      status: 'published',
      visibility: 'public',
      is_pinned: 'true',
      cursor: 'eyJpZCI6MX0='
    });
  });

  it('rejects an out-of-range limit', () => {
    fail(productionFeedQuerySchema, { limit: 0 });
    fail(productionFeedQuerySchema, { limit: 101 });
  });

  it('rejects a non-numeric page and a page of zero', () => {
    fail(productionFeedQuerySchema, { page: 'abc' });
    fail(productionFeedQuerySchema, { page: 0 });
  });

  it('rejects invalid enum values', () => {
    fail(productionFeedQuerySchema, { tipe: 'news' });
    fail(productionFeedQuerySchema, { sortBy: 'title' });
    fail(productionFeedQuerySchema, { sortOrder: 'sideways' });
    fail(productionFeedQuerySchema, { status: 'review' });
    fail(productionFeedQuerySchema, { visibility: 'hidden' });
    fail(productionFeedQuerySchema, { is_pinned: 'yes' });
  });

  it('rejects malformed dates', () => {
    fail(productionFeedQuerySchema, { date_from: '01-01-2026' });
    fail(productionFeedQuerySchema, { date_from: '2026/01/01' });
  });

  it('rejects date_from after date_to', () => {
    fail(productionFeedQuerySchema, { date_from: '2026-05-01', date_to: '2026-01-01' });
    ok(productionFeedQuerySchema, { date_from: '2026-01-01', date_to: '2026-05-01' });
  });

  it('trims search and author but enforces length', () => {
    ok(productionFeedQuerySchema, { search: '  bts  ' });
    fail(productionFeedQuerySchema, { search: 'x'.repeat(256) });
  });

  it('rejects a cursor longer than 500 chars', () => {
    fail(productionFeedQuerySchema, { cursor: 'x'.repeat(501) });
  });
});

describe('param schemas', () => {
  it('productionPostIdParamSchema accepts numeric ids and slugs', () => {
    ok(productionPostIdParamSchema, { id: '12' });
    ok(productionPostIdParamSchema, { id: 'behind-the-scenes' });
    fail(productionPostIdParamSchema, { id: '' });
  });

  it('numeric param schemas coerce to numbers and reject non-numeric', () => {
    ok(productionPostNumericIdParamSchema, { id: '12' });
    fail(productionPostNumericIdParamSchema, { id: 'abc' });
    ok(productionPostNumericParamSchema, { postId: '3' });
    fail(productionPostNumericParamSchema, { postId: '3.5' });
    ok(productionTagIdParamSchema, { tagId: '7' });
    fail(productionTagIdParamSchema, { tagId: '-1' });
    fail(productionTagIdParamSchema, { tagId: '' });
  });
});

describe('productionPostCreateSchema', () => {
  it('requires judul and accepts a minimal draft', () => {
    fail(productionPostCreateSchema, {});
    fail(productionPostCreateSchema, { judul: '' });
    ok(productionPostCreateSchema, { judul: 'Behind The Scenes' });
  });

  it('accepts a full valid payload', () => {
    ok(productionPostCreateSchema, {
      judul: 'Casting Day',
      isi_konten: 'Proses casting',
      category_id: 1,
      film_id: 2,
      tipe: 'casting',
      visibility: 'public',
      is_pinned: true,
      gambar_cover: '/uploads/images/cover.jpg',
      media: [
        { media_type: 'video', file_path: '/uploads/videos/clip.mp4', duration: 90, thumbnail: '/uploads/images/thumb.jpg' },
        { media_type: 'photo', file_path: '/uploads/images/pic1.jpg', sort_order: 1 }
      ],
      tags: ['casting', 'jakarta']
    });
  });

  it('rejects more than 20 media items and more than 10 tags', () => {
    const media = Array.from({ length: 21 }, () => ({ media_type: 'photo', file_path: '/uploads/images/x.jpg' }));
    fail(productionPostCreateSchema, { judul: 'A', media });
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    fail(productionPostCreateSchema, { judul: 'A', tags });
  });

  it('rejects invalid media items and tag names', () => {
    fail(productionPostCreateSchema, { judul: 'A', media: [{ media_type: 'audio', file_path: '/uploads/images/x.jpg' }] });
    fail(productionPostCreateSchema, { judul: 'A', media: [{ media_type: 'photo', file_path: '../evil' }] });
    fail(productionPostCreateSchema, { judul: 'A', tags: [''] });
    fail(productionPostCreateSchema, { judul: 'A', tags: ['x'.repeat(51)] });
  });

  it('rejects an invalid cover path', () => {
    fail(productionPostCreateSchema, { judul: 'A', gambar_cover: '/uploads/music/x.mp3' });
  });

  it('allows an empty cover and empty media/tags', () => {
    ok(productionPostCreateSchema, { judul: 'A', gambar_cover: '', media: [], tags: [] });
  });
});

describe('productionPostUpdateSchema', () => {
  it('is partial — empty object is valid', () => {
    ok(productionPostUpdateSchema, {});
  });

  it('still validates provided fields', () => {
    ok(productionPostUpdateSchema, { judul: 'New' });
    fail(productionPostUpdateSchema, { judul: '' });
    fail(productionPostUpdateSchema, { visibility: 'secret' });
  });
});

describe('tag schemas', () => {
  it('tagCreateSchema requires a non-empty nama_tag <= 50 chars', () => {
    fail(tagCreateSchema, {});
    fail(tagCreateSchema, { nama_tag: '' });
    fail(tagCreateSchema, { nama_tag: 'x'.repeat(51) });
    ok(tagCreateSchema, { nama_tag: 'Casting' });
  });

  it('tagUpdateSchema validates nama_tag', () => {
    ok(tagUpdateSchema, { nama_tag: 'BTS' });
    fail(tagUpdateSchema, { nama_tag: '' });
  });
});
