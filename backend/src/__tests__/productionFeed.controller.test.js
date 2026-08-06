import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductionFeedController } from '../controllers/productionFeed.controller.js';
import { productionFeedService } from '../services/index.js';
import { NotFoundError } from '../lib/errors.js';

vi.mock('../services/index.js', () => ({
  productionFeedService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
    getByAuthor: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    publish: vi.fn(),
    archive: vi.fn(),
    getTags: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn()
  }
}));

describe('ProductionFeedController', () => {
  const controller = new ProductionFeedController();

  const mockReply = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll — query mapping', () => {
    const feedResult = {
      posts: [{ post_id: 1 }],
      pagination: { page: 2, limit: 20, total: 1 }
    };

    it('maps defaults for an empty public query', async () => {
      productionFeedService.getAll.mockResolvedValue(feedResult);
      const reply = mockReply();
      await controller.getAll({ query: {}, user: null }, reply);

      expect(productionFeedService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: null,
          author: null,
          sortBy: 'created_at',
          sortOrder: 'desc',
          status: undefined,
          requesting_user_id: undefined,
          is_pinned: undefined,
          cursor: null
        })
      );
      expect(reply.status).toHaveBeenCalledWith(200);
    });

    it('parses page/limit and boolean is_pinned', async () => {
      productionFeedService.getAll.mockResolvedValue(feedResult);
      const reply = mockReply();
      await controller.getAll({ query: { page: '2', limit: '20', is_pinned: 'true', status: 'draft' }, user: { id: 'u1' } }, reply);

      expect(productionFeedService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20, is_pinned: true, status: undefined, requesting_user_id: 'u1' })
      );
    });

    it('lets moderators pass a status filter and nulls out "all"', async () => {
      productionFeedService.getAll.mockResolvedValue(feedResult);
      const reply = mockReply();
      await controller.getAll(
        { query: { status: 'archived' }, user: { id: 'm1', role_id: 3 } },
        reply
      );
      expect(productionFeedService.getAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' }));

      await controller.getAll({ query: { status: 'all' }, user: { id: 'a1', role_id: 4 } }, reply);
      expect(productionFeedService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ status: null }));
    });

    it('sends the response envelope with pagination', async () => {
      productionFeedService.getAll.mockResolvedValue(feedResult);
      const reply = mockReply();
      await controller.getAll({ query: {}, user: null }, reply);
      expect(reply.status).toHaveBeenCalledWith(200);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Feed berhasil diambil',
        data: feedResult.posts,
        pagination: feedResult.pagination
      });
    });
  });

  describe('getById', () => {
    it('routes numeric ids to getById and slug to getBySlug', async () => {
      const post = { post_id: 1, user_id: 'u1', status: 'published', visibility: 'public' };
      productionFeedService.getById.mockResolvedValue(post);
      productionFeedService.getBySlug.mockResolvedValue(post);

      const reply = mockReply();
      await controller.getById({ params: { id: '12' }, user: { id: 'u1' } }, reply);
      expect(productionFeedService.getById).toHaveBeenCalledWith(12, expect.objectContaining({ requesterId: 'u1' }));

      await controller.getById({ params: { id: 'my-slug' }, user: null }, reply);
      expect(productionFeedService.getBySlug).toHaveBeenCalledWith('my-slug', expect.objectContaining({ requesterId: null }));
    });

    it('throws NotFoundError when the post is not found or not permitted', async () => {
      productionFeedService.getById.mockResolvedValue(null);
      await expect(controller.getById({ params: { id: '9' }, user: null }, mockReply())).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMyPosts', () => {
    it('passes the current user id and parses pagination', async () => {
      productionFeedService.getByAuthor.mockResolvedValue({ posts: [], pagination: {} });
      const reply = mockReply();
      await controller.getMyPosts({ user: { id: 'u1' }, query: { page: '3', limit: '5' } }, reply);
      expect(productionFeedService.getByAuthor).toHaveBeenCalledWith('u1', { page: 3, limit: 5 });
      expect(reply.status).toHaveBeenCalledWith(200);
    });
  });

  describe('create', () => {
    it('passes the user id and body, returns 201', async () => {
      const created = { post_id: 1, status: 'draft' };
      productionFeedService.create.mockResolvedValue(created);
      const reply = mockReply();
      await controller.create({ user: { id: 'u1' }, body: { judul: 'A' } }, reply);
      expect(productionFeedService.create).toHaveBeenCalledWith('u1', { judul: 'A' });
      expect(reply.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update / delete / publish / archive — ownership check first', () => {
    const params = { id: '5' };
    const request = (roleId = 2) => ({ params, user: { id: 'u1', role_id: roleId }, ip: '1.1.1.1' });

    it('update throws 404 before patching when not permitted', async () => {
      productionFeedService.getById.mockResolvedValue(null);
      await expect(controller.update(request(), mockReply())).rejects.toThrow(NotFoundError);
      expect(productionFeedService.update).not.toHaveBeenCalled();
    });

    it('update fetches then patches', async () => {
      productionFeedService.getById.mockResolvedValue({ post_id: 5, user_id: 'u1' });
      productionFeedService.update.mockResolvedValue({ post_id: 5, judul: 'B' });
      const reply = mockReply();
      await controller.update(request(), reply);
      expect(productionFeedService.getById).toHaveBeenCalledWith(5, expect.objectContaining({ requesterId: 'u1' }));
      expect(productionFeedService.update).toHaveBeenCalledWith(5, undefined);
    });

    it('delete calls softDelete with actorId and ip', async () => {
      productionFeedService.getById.mockResolvedValue({ post_id: 5, user_id: 'u1' });
      productionFeedService.softDelete.mockResolvedValue({});
      await controller.delete(request(), mockReply());
      expect(productionFeedService.softDelete).toHaveBeenCalledWith(5, { actorId: 'u1', ipAddress: '1.1.1.1' });
    });

    it('publish and archive pass actor context', async () => {
      productionFeedService.getById.mockResolvedValue({ post_id: 5, user_id: 'u1' });
      productionFeedService.publish.mockResolvedValue({});
      productionFeedService.archive.mockResolvedValue({});
      await controller.publish(request(), mockReply());
      await controller.archive(request(), mockReply());
      expect(productionFeedService.publish).toHaveBeenCalledWith(5, { actorId: 'u1', ipAddress: '1.1.1.1' });
      expect(productionFeedService.archive).toHaveBeenCalledWith(5, { actorId: 'u1', ipAddress: '1.1.1.1' });
    });
  });

  describe('tags', () => {
    it('getTags returns the list', async () => {
      productionFeedService.getTags.mockResolvedValue([{ tag_id: 1 }]);
      await controller.getTags({}, mockReply());
    });

    it('createTag returns 201', async () => {
      productionFeedService.createTag.mockResolvedValue({ tag_id: 1 });
      const reply = mockReply();
      await controller.createTag({ body: { nama_tag: 'BTS' } }, reply);
      expect(productionFeedService.createTag).toHaveBeenCalledWith({ nama_tag: 'BTS' });
      expect(reply.status).toHaveBeenCalledWith(201);
    });

    it('updateTag and deleteTag throw NotFoundError when missing', async () => {
      productionFeedService.updateTag.mockResolvedValue(null);
      productionFeedService.deleteTag.mockResolvedValue(0);
      await expect(controller.updateTag({ params: { tagId: '1' }, body: {} }, mockReply())).rejects.toThrow(NotFoundError);
      await expect(controller.deleteTag({ params: { tagId: '1' } }, mockReply())).rejects.toThrow(NotFoundError);
    });

    it('updateTag and deleteTag succeed', async () => {
      productionFeedService.updateTag.mockResolvedValue({ tag_id: 1 });
      productionFeedService.deleteTag.mockResolvedValue(1);
      await controller.updateTag({ params: { tagId: '1' }, body: { nama_tag: 'X' } }, mockReply());
      await controller.deleteTag({ params: { tagId: '1' } }, mockReply());
    });
  });

  describe('_isModerator', () => {
    it('is true only for moderator and admin roles', () => {
      expect(controller._isModerator({ user: { role_id: 3 } })).toBe(true);
      expect(controller._isModerator({ user: { role_id: 4 } })).toBe(true);
      expect(controller._isModerator({ user: { role_id: 2 } })).toBe(false);
      expect(controller._isModerator({ user: null })).toBe(false);
      expect(controller._isModerator({})).toBe(false);
    });
  });
});
