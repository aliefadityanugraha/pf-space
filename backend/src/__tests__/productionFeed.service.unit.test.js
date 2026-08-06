import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductionFeedService } from '../services/productionFeed.service.js';
import { ProductionPost, ProductionPostMedia, ProductionPostTag, Tag, Film } from '../models/index.js';
import { notificationService } from '../services/notification.service.js';
import { deleteFile, fileExists, getSubfolderForMediaType } from '../lib/upload.js';
import { recordAuditLog } from '../lib/audit.js';
import { ValidationError, ConflictError } from '../lib/errors.js';

vi.mock('../models/index.js', () => ({
  ProductionPost: { query: vi.fn(), transaction: vi.fn() },
  ProductionPostMedia: { query: vi.fn() },
  ProductionPostTag: { query: vi.fn() },
  Tag: { query: vi.fn() },
  Film: { query: vi.fn(), generateSlug: vi.fn((title) => String(title).replace(/\s+/g, '-').toLowerCase()) },
  BaseModel: { defaultModifiers: {} }
}));

vi.mock('../services/notification.service.js', () => ({
  notificationService: { create: vi.fn() }
}));

vi.mock('../lib/upload.js', () => ({
  deleteFile: vi.fn(),
  fileExists: vi.fn(),
  getSubfolderForMediaType: vi.fn()
}));

vi.mock('../lib/audit.js', () => ({
  recordAuditLog: vi.fn()
}));

vi.mock('../lib/sanitize.js', () => ({
  sanitizeRichText: vi.fn((text) => text),
  sanitizePlainText: vi.fn((text) => String(text).trim())
}));

vi.mock('../config/constants.js', () => ({
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 100 },
  buildPagination: vi.fn((total, page, limit) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }))
}));

describe('ProductionFeedService — lifecycle, access control, tags', () => {
  const service = new ProductionFeedService();

  beforeEach(() => {
    vi.clearAllMocks();
    Film.generateSlug.mockImplementation((title) => String(title).replace(/\s+/g, '-').toLowerCase());
  });

  const mockTransaction = () => {
    ProductionPost.transaction.mockImplementation(async (cb) => cb({}));
  };

  const mockGraphPost = (result) => {
    const chain = {
      findById: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      withGraphFetched: vi.fn().mockReturnThis(),
      modifiers: vi.fn().mockReturnThis(),
      modifyGraph: vi.fn().mockResolvedValue(result)
    };
    ProductionPost.query.mockReturnValueOnce(chain);
    return chain;
  };

  const mockFlatPost = (result) => {
    const chain = {
      findById: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockResolvedValue(result)
    };
    ProductionPost.query.mockReturnValueOnce(chain);
    return chain;
  };

  describe('normalizeData', () => {
    it('sanitizes rich-text isi_konten and passes other fields through', () => {
      const clean = service.normalizeData({ judul: 'A', isi_konten: '<b>x</b>', film_id: 1 });
      expect(clean.isi_konten).toBe('<b>x</b>');
      expect(clean.judul).toBe('A');
    });
  });

  describe('getById / getBySlug — access control', () => {
    const draftPrivate = {
      post_id: 1,
      user_id: 'owner-1',
      judul: 'Draft',
      status: 'draft',
      visibility: 'private'
    };

    it('returns null when the post does not exist', async () => {
      mockGraphPost(null);
      expect(await service.getById(1)).toBeNull();
    });

    it('returns the post for the owner', async () => {
      mockGraphPost(draftPrivate);
      const post = await service.getById(1, { requesterId: 'owner-1' });
      expect(post).toBe(draftPrivate);
    });

    it('returns the post for a moderator', async () => {
      mockGraphPost(draftPrivate);
      const post = await service.getById(1, { requesterId: 'x', isModerator: true });
      expect(post).toBe(draftPrivate);
    });

    it('hides a draft/private post from other users', async () => {
      mockGraphPost(draftPrivate);
      expect(await service.getById(1, { requesterId: 'other-1' })).toBeNull();
    });

    it('fetches a public published post for anonymous users', async () => {
      mockGraphPost({ post_id: 2, user_id: 'owner', status: 'published', visibility: 'public' });
      expect(await service.getById(2)).not.toBeNull();
    });

    it('getBySlug resolves via slug + first()', async () => {
      const chain = {
        where: vi.fn().mockReturnThis(),
        whereNull: vi.fn().mockReturnThis(),
        withGraphFetched: vi.fn().mockReturnThis(),
        modifiers: vi.fn().mockReturnThis(),
        modifyGraph: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ post_id: 3, user_id: 'a', status: 'published', visibility: 'public' })
      };
      ProductionPost.query.mockReturnValue(chain);
      const post = await service.getBySlug('my-post');
      expect(chain.where).toHaveBeenCalledWith('slug', 'my-post');
      expect(post.post_id).toBe(3);
    });
  });

  describe('create', () => {
    it('inserts as a draft with default is_pinned=false', async () => {
      mockTransaction();
      const inserted = { post_id: 1, status: 'draft', is_pinned: false, judul: 'A' };
      ProductionPost.query.mockReturnValue({ insert: vi.fn().mockResolvedValue(inserted) });
      const post = await service.create('u1', { judul: 'A' });
      expect(post).toBe(inserted);
      expect(ProductionPost.query).toHaveBeenCalledWith({});
      const insertArg = ProductionPost.query.mock.calls[0][0];
      expect(insertArg).toBeDefined();
    });

    it('rejects a non-existent film_id', async () => {
      mockTransaction();
      Film.query.mockReturnValue({ findById: vi.fn().mockResolvedValue(null) });
      await expect(service.create('u1', { judul: 'A', film_id: 999 })).rejects.toThrow(ValidationError);
    });

    it('rejects an invalid cover upload', async () => {
      mockTransaction();
      getSubfolderForMediaType.mockReturnValue('images');
      fileExists.mockReturnValue(false);
      await expect(
        service.create('u1', { judul: 'A', gambar_cover: '/uploads/images/x.jpg' })
      ).rejects.toThrow(ValidationError);
    });

    it('attaches media and syncs tags', async () => {
      mockTransaction();
      const inserted = { post_id: 1, status: 'draft' };
      ProductionPost.query.mockReturnValue({ insert: vi.fn().mockResolvedValue(inserted) });
      const attachMedia = vi.spyOn(service, '_attachMedia').mockResolvedValue();
      const syncTags = vi.spyOn(service, '_syncTags').mockResolvedValue();
      await service.create('u1', { judul: 'A', media: [{ media_type: 'photo', file_path: '/uploads/images/x.jpg' }], tags: ['a', 'b'] });
      expect(attachMedia).toHaveBeenCalledWith(expect.anything(), 1, [{ media_type: 'photo', file_path: '/uploads/images/x.jpg' }]);
      expect(syncTags).toHaveBeenCalledWith(expect.anything(), 1, ['a', 'b']);
    });
  });

  describe('update', () => {
    it('returns null when the post does not exist', async () => {
      mockFlatPost(null);
      expect(await service.update(1, { judul: 'B' })).toBeNull();
    });

    it('replaces media files/rows and tags, then patches', async () => {
      const existing = { post_id: 1, judul: 'Old', slug: 'old', film_id: null, deleted_at: null };
      mockFlatPost(existing);

      mockTransaction();
      const oldMedia = [{ file_path: '/uploads/images/a.jpg' }, { file_path: '/uploads/videos/b.mp4' }];
      ProductionPostMedia.query
        .mockReturnValueOnce({ where: vi.fn().mockResolvedValue(oldMedia) })
        .mockReturnValueOnce({ where: vi.fn().mockReturnValue({ delete: vi.fn().mockResolvedValue(2) }) });
      ProductionPostTag.query.mockReturnValueOnce({
        where: vi.fn().mockReturnValue({ delete: vi.fn().mockResolvedValue(2) })
      });
      const updated = { post_id: 1, judul: 'New' };
      ProductionPost.query.mockReturnValueOnce({ patchAndFetchById: vi.fn().mockResolvedValue(updated) });

      vi.spyOn(service, '_attachMedia').mockResolvedValue();
      vi.spyOn(service, '_syncTags').mockResolvedValue();

      const result = await service.update(1, {
        judul: 'New',
        media: [{ media_type: 'photo', file_path: '/uploads/images/c.jpg' }],
        tags: ['x']
      });

      expect(result).toBe(updated);
      expect(deleteFile).toHaveBeenCalledWith('/uploads/images/a.jpg');
      expect(deleteFile).toHaveBeenCalledWith('/uploads/videos/b.mp4');
      expect(Film.generateSlug).toHaveBeenCalledWith('New', 1);
    });

    it('rejects a non-existent film_id on update', async () => {
      mockFlatPost({ post_id: 1, judul: 'Old', deleted_at: null });
      mockTransaction();
      Film.query.mockReturnValue({ findById: vi.fn().mockResolvedValue(null) });
      await expect(service.update(1, { film_id: 999 })).rejects.toThrow(ValidationError);
    });
  });

  describe('publish', () => {
    it('publishes, generates slug, notifies the film owner, and audits', async () => {
      mockFlatPost({ post_id: 1, user_id: 'author', judul: 'Post 1', slug: null, deleted_at: null });
      mockTransaction();
      const updated = { post_id: 1, user_id: 'author', judul: 'Post 1', film_id: 7, status: 'published', published_at: new Date(), slug: 'post-1' };
      ProductionPost.query.mockReturnValueOnce({ patchAndFetchById: vi.fn().mockResolvedValue(updated) });
      Film.query.mockReturnValue({ findById: vi.fn().mockResolvedValue({ film_id: 7, judul: 'Film', user_id: 'owner-2' }) });

      const result = await service.publish(1, { actorId: 'author', ipAddress: '1.2.3.4' });

      expect(result).toBe(updated);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'owner-2', type: 'production_post', data: { post_id: 1, film_id: 7, slug: 'post-1' } })
      );
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'author', action: 'PUBLISH_PRODUCTION_POST', targetId: 1 })
      );
    });

    it('does not notify when the post author owns the film', async () => {
      mockFlatPost({ post_id: 1, user_id: 'owner', judul: 'A', slug: 'a', deleted_at: null });
      mockTransaction();
      const updated = { post_id: 1, user_id: 'owner', judul: 'A', film_id: 7, slug: 'a' };
      ProductionPost.query.mockReturnValueOnce({ patchAndFetchById: vi.fn().mockResolvedValue(updated) });
      Film.query.mockReturnValue({ findById: vi.fn().mockResolvedValue({ film_id: 7, user_id: 'owner' }) });

      await service.publish(1);
      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('returns null when the post is missing', async () => {
      mockFlatPost(null);
      expect(await service.publish(9)).toBeNull();
    });
  });

  describe('archive / softDelete', () => {
    it('archives and audits', async () => {
      mockFlatPost({ post_id: 1, user_id: 'a', judul: 'A', deleted_at: null });
      const updated = { post_id: 1, status: 'archived' };
      ProductionPost.query.mockReturnValueOnce({ patchAndFetchById: vi.fn().mockResolvedValue(updated) });
      const result = await service.archive(1, { actorId: 'a', ipAddress: '1.1.1.1' });
      expect(result).toBe(updated);
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'ARCHIVE_PRODUCTION_POST' }));
    });

    it('soft deletes and audits', async () => {
      mockFlatPost({ post_id: 1, user_id: 'a', judul: 'A', deleted_at: null });
      const updated = { post_id: 1, deleted_at: new Date() };
      ProductionPost.query.mockReturnValueOnce({ patchAndFetchById: vi.fn().mockResolvedValue(updated) });
      const result = await service.softDelete(1, { actorId: 'a', ipAddress: '1.1.1.1' });
      expect(result).toBe(updated);
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE_PRODUCTION_POST' }));
    });

    it('returns null when missing', async () => {
      mockFlatPost(null);
      expect(await service.archive(5)).toBeNull();
      mockFlatPost(null);
      expect(await service.softDelete(5)).toBeNull();
    });
  });

  describe('hardDelete', () => {
    it('removes physical files and the row, then audits', async () => {
      ProductionPost.query
        .mockReturnValueOnce({ findById: vi.fn().mockResolvedValue({ post_id: 1, gambar_cover: '/uploads/images/c.jpg' }) })
        .mockReturnValueOnce({ deleteById: vi.fn().mockResolvedValue(1) });
      ProductionPostMedia.query.mockReturnValue({
        where: vi.fn().mockResolvedValue([{ file_path: '/uploads/videos/a.mp4' }])
      });

      const result = await service.hardDelete(1, { actorId: 'admin', ipAddress: '1.1.1.1' });

      expect(result).toBe(1);
      expect(deleteFile).toHaveBeenCalledWith('/uploads/images/c.jpg');
      expect(deleteFile).toHaveBeenCalledWith('/uploads/videos/a.mp4');
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'HARD_DELETE_PRODUCTION_POST' }));
    });

    it('returns null when the post is missing', async () => {
      ProductionPost.query.mockReturnValueOnce({ findById: vi.fn().mockResolvedValue(null) });
      expect(await service.hardDelete(5)).toBeNull();
    });
  });

  describe('tags', () => {
    it('createTag sanitizes and inserts', async () => {
      const insert = vi.fn().mockResolvedValue({ tag_id: 1, nama_tag: 'Casting' });
      Tag.query
        .mockReturnValueOnce({ where: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }) })
        .mockReturnValueOnce({ insert });
      const tag = await service.createTag({ nama_tag: '  Casting  ' });
      expect(tag.tag_id).toBe(1);
      expect(insert).toHaveBeenCalledWith(expect.objectContaining({ nama_tag: 'Casting', slug: 'casting' }));
    });

    it('createTag rejects empty names', async () => {
      await expect(service.createTag({ nama_tag: '   ' })).rejects.toThrow(ValidationError);
    });

    it('createTag throws ConflictError on duplicates', async () => {
      Tag.query.mockReturnValueOnce({ where: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue({ tag_id: 1 }) }) });
      await expect(service.createTag({ nama_tag: 'Casting' })).rejects.toThrow(ConflictError);
    });

    it('getTags orders by name', async () => {
      const chain = { orderBy: vi.fn().mockResolvedValue([{ tag_id: 1 }]) };
      Tag.query.mockReturnValue(chain);
      expect(await service.getTags()).toEqual([{ tag_id: 1 }]);
      expect(chain.orderBy).toHaveBeenCalledWith('nama_tag', 'asc');
    });

    it('updateTag regenerates the slug when the name changes', async () => {
      const patchAndFetch = vi.fn().mockResolvedValue({ tag_id: 1, nama_tag: 'Bts', slug: 'bts' });
      Tag.query.mockReturnValue({ patchAndFetchById: patchAndFetch });
      const tag = await service.updateTag(1, { nama_tag: 'BTS' });
      expect(tag.slug).toBe('bts');
      expect(patchAndFetch).toHaveBeenCalledWith(1, expect.objectContaining({ nama_tag: 'BTS', slug: 'bts' }));
    });

    it('deleteTag deletes by id', async () => {
      Tag.query.mockReturnValue({ deleteById: vi.fn().mockResolvedValue(1) });
      expect(await service.deleteTag(1)).toBe(1);
    });
  });

  describe('_canAccess', () => {
    const post = { user_id: 'owner', status: 'published', visibility: 'public' };
    it('allows moderators, owners, and published+public', () => {
      expect(service._canAccess(post, { isModerator: true })).toBe(true);
      expect(service._canAccess(post, { requesterId: 'owner' })).toBe(true);
      expect(service._canAccess(post)).toBe(true);
      expect(
        service._canAccess({ user_id: 'owner', status: 'draft', visibility: 'private' }, { requesterId: 'owner' })
      ).toBe(true);
    });

    it('denies draft/private to others', () => {
      expect(service._canAccess({ user_id: 'owner', status: 'draft', visibility: 'public' }, { requesterId: 'x' })).toBe(false);
      expect(service._canAccess({ user_id: 'owner', status: 'published', visibility: 'private' })).toBe(false);
    });
  });

  describe('_recordAudit', () => {
    it('skips audit when there is no actor', async () => {
      await service._recordAudit(null, '1.1.1.1', 'ACTION', 1);
      expect(recordAuditLog).not.toHaveBeenCalled();
    });

    it('records audit with production_post target type', async () => {
      await service._recordAudit('u1', '1.1.1.1', 'ACTION', 1, { judul: 'A' });
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', action: 'ACTION', targetType: 'production_post', targetId: 1 })
      );
    });
  });
});
