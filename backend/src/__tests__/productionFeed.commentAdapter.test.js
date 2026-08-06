import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  productionFeedCommentAdapter,
  ProductionFeedCommentAdapter
} from '../services/productionFeed.commentAdapter.js';
import { notificationService } from '../services/notification.service.js';
import { User, Discussion, ProductionPost } from '../models/index.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';

vi.mock('../models/index.js', () => ({
  ProductionPost: { query: vi.fn() },
  Discussion: { query: vi.fn() },
  User: { query: vi.fn() },
  BaseModel: { defaultModifiers: {} }
}));

vi.mock('../services/notification.service.js', () => ({
  notificationService: { create: vi.fn() }
}));

vi.mock('../lib/sanitize.js', () => ({
  sanitizeRichText: vi.fn((text) => text),
  sanitizePlainText: vi.fn((text) => text)
}));

vi.mock('../config/constants.js', () => ({
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20 },
  buildPagination: vi.fn((total, page, limit) => ({ page, limit, total }))
}));

vi.mock('../lib/upload.js', () => ({
  deleteFile: vi.fn(),
  fileExists: vi.fn(),
  getSubfolderForMediaType: vi.fn()
}));

vi.mock('../lib/audit.js', () => ({
  recordAuditLog: vi.fn()
}));

describe('ProductionFeedCommentAdapter', () => {
  const post = {
    post_id: 1,
    user_id: 'author-1',
    judul: 'Progres Episode 3',
    status: 'published',
    visibility: 'public'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPostQuery = (result) =>
    ProductionPost.query.mockReturnValue({
      findById: vi.fn().mockReturnValue({
        whereNull: vi.fn().mockResolvedValue(result)
      })
    });

  const mockCommentInsertAndFetch = (inserted) => {
    Discussion.query
      .mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue(inserted)
      })
      .mockReturnValueOnce({
        findById: vi.fn().mockReturnValue({
          withGraphFetched: vi.fn().mockReturnValue({
            modifiers: vi.fn().mockResolvedValue({ ...inserted })
          })
        })
      });
  };

  const mockUserQuery = (users) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      whereIn: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(users)
    };
    User.query.mockReturnValue(chain);
    return chain;
  };

  describe('_extractMentionCandidates', () => {
    it('extracts single-word and two-word display names without duplicates', () => {
      const adapter = new ProductionFeedCommentAdapter();
      const result = adapter._extractMentionCandidates('Terima kasih @Doni dan @Sinta Dewi!');
      // "Doni dan" is a harmless two-token candidate: it never matches a real
      // `users.name`, so the DB whereIn silently ignores it.
      expect(result.sort()).toEqual(['Doni', 'Doni dan', 'Sinta', 'Sinta Dewi'].sort());
    });

    it('returns empty array when no mention', () => {
      const adapter = new ProductionFeedCommentAdapter();
      expect(adapter._extractMentionCandidates('Halo semua, tanpa mention')).toEqual([]);
    });
  });

  describe('getByPost', () => {
    it('returns comments with pagination', async () => {
      Discussion.query
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          withGraphFetched: vi.fn().mockReturnThis(),
          modifiers: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([{ diskusi_id: 1 }])
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({ total: '1' })
        });

      const result = await productionFeedCommentAdapter.getByPost(1, { page: 1, limit: 50 });
      expect(result.comments).toEqual([{ diskusi_id: 1 }]);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getCommentCount', () => {
    it('returns parsed count', async () => {
      Discussion.query.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ total: '7' })
      });

      const count = await productionFeedCommentAdapter.getCommentCount(1);
      expect(count).toBe(7);
    });
  });

  describe('addComment', () => {
    it('inserts comment and notifies the post author (production_comment)', async () => {
      mockPostQuery(post);
      mockCommentInsertAndFetch({ diskusi_id: 10, isi_pesan: 'Mantap banget!' });
      mockUserQuery([]);

      const result = await productionFeedCommentAdapter.addComment(1, 'commenter-1', 'Mantap banget!');

      expect(result.diskusi_id).toBe(10);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'author-1',
          type: 'production_comment',
          data: { post_id: 1, discussion_id: 10 }
        })
      );
      expect(notificationService.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'production_mention' })
      );
    });

    it('notifies mentioned users (production_mention) and excludes the commenter', async () => {
      mockPostQuery(post);
      mockCommentInsertAndFetch({ diskusi_id: 10, isi_pesan: '@Doni Saputra @Rina check ini' });
      const userChain = mockUserQuery([{ id: 'ment-2', name: 'Rina' }]);

      await productionFeedCommentAdapter.addComment(1, 'commenter-1', '@Doni Saputra @Rina check ini');

      expect(userChain.whereIn).toHaveBeenCalledWith('name', expect.arrayContaining(['Doni Saputra', 'Doni', 'Rina']));
      expect(userChain.where).toHaveBeenCalledWith('id', '!=', 'commenter-1');

      const mentionCalls = notificationService.create.mock.calls.filter(([c]) => c.type === 'production_mention');
      expect(mentionCalls.map(([c]) => c.user_id)).toEqual(['ment-2']);
      expect(mentionCalls[0][0]).toMatchObject({
        type: 'production_mention',
        title: 'Anda disebut dalam komentar',
        data: { post_id: 1, discussion_id: 10 }
      });
    });

    it('sends no notification when the commenter is the post author and no mention exists', async () => {
      mockPostQuery(post);
      mockCommentInsertAndFetch({ diskusi_id: 11, isi_pesan: 'Catatan pribadi saya' });

      await productionFeedCommentAdapter.addComment(1, 'author-1', 'Catatan pribadi saya');

      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('throws ValidationError for a draft post', async () => {
      mockPostQuery({ ...post, status: 'draft' });

      await expect(
        productionFeedCommentAdapter.addComment(1, 'commenter-1', 'Halo')
      ).rejects.toThrow(ValidationError);
      expect(Discussion.query).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the post does not exist', async () => {
      mockPostQuery(null);

      await expect(
        productionFeedCommentAdapter.addComment(999, 'commenter-1', 'Halo')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
