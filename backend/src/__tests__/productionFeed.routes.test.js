import Fastify from 'fastify';
import productionFeedRoutes from '../routes/productionFeed.routes.js';
import { globalErrorHandler } from '../middlewares/errorHandler.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const authCtx = vi.hoisted(() => ({ user: null }));

const svc = vi.hoisted(() => ({
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

vi.mock('../services/index.js', () => svc);

vi.mock('../middlewares/auth.middleware.js', async () => {
  const { AuthenticationError, AuthorizationError } = await import('../lib/errors.js');
  return {
    authenticate: vi.fn(async (request) => {
      if (!authCtx.user) throw new AuthenticationError('Unauthorized');
      request.user = authCtx.user;
    }),
    optionalAuth: vi.fn(async (request) => {
      if (authCtx.user) request.user = authCtx.user;
    }),
    requireCreator: vi.fn(async (request) => {
      if (!authCtx.user) throw new AuthenticationError('Unauthorized');
      if (authCtx.user.role_id === 1) throw new AuthorizationError('Forbidden');
      request.user = authCtx.user;
    }),
    requireModerator: vi.fn(async (request) => {
      if (!authCtx.user) throw new AuthenticationError('Unauthorized');
      if (![3, 4].includes(authCtx.user.role_id)) throw new AuthorizationError('Forbidden');
      request.user = authCtx.user;
    }),
    requireAdmin: vi.fn(async (request) => {
      request.user = authCtx.user;
    }),
    requireRole: vi.fn(() => vi.fn(async () => {}))
  };
});

const { productionFeedService } = svc;

describe('Production Feed Routes — integration & API', () => {
  let fastify;
  const creator = { id: 'u1', role_id: 2, name: 'Budi' };
  const moderator = { id: 'm1', role_id: 3, name: 'Mod' };
  const post = { post_id: 1, user_id: 'u1', judul: 'Post', status: 'published', visibility: 'public' };

  beforeAll(async () => {
    fastify = Fastify({ logger: false });
    fastify.setErrorHandler(globalErrorHandler);
    await fastify.register(productionFeedRoutes, { prefix: '/production-feed' });
    await fastify.ready();
  });

  afterAll(async () => {
    if (fastify) await fastify.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authCtx.user = creator;
    productionFeedService.getAll.mockResolvedValue({ posts: [], pagination: { page: 1, limit: 10, total: 0 } });
  });

  describe('integration — GET feed', () => {
    it('returns the API Standard envelope for an empty public query', async () => {
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toEqual({
        success: true,
        message: 'Feed berhasil diambil',
        data: [],
        pagination: { page: 1, limit: 10, total: 0 }
      });
      expect(productionFeedService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, status: undefined })
      );
    });

    it('passes filters, sort, pagination, and cursor through', async () => {
      const url = '/production-feed/?page=2&limit=5&tipe=progress&sortBy=published_at&sortOrder=asc&is_pinned=true&cursor=abc';
      await fastify.inject({ method: 'GET', url });
      expect(productionFeedService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 5,
          tipe: 'progress',
          sortBy: 'published_at',
          sortOrder: 'asc',
          is_pinned: true,
          cursor: 'abc'
        })
      );
    });
  });

  describe('integration — single post', () => {
    it('routes a numeric id to getById', async () => {
      productionFeedService.getById.mockResolvedValue(post);
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/1' });
      expect(res.statusCode).toBe(200);
      expect(productionFeedService.getById).toHaveBeenCalledWith(1, expect.objectContaining({ requesterId: 'u1' }));
      expect(res.json().data.post_id).toBe(1);
    });

    it('routes a slug to getBySlug', async () => {
      productionFeedService.getBySlug.mockResolvedValue(post);
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/behind-the-scenes' });
      expect(res.statusCode).toBe(200);
      expect(productionFeedService.getBySlug).toHaveBeenCalledWith('behind-the-scenes', expect.any(Object));
    });
  });

  describe('integration — creator mutations', () => {
    it('creates a post as a creator (201)', async () => {
      productionFeedService.create.mockResolvedValue({ post_id: 9, status: 'draft' });
      const res = await fastify.inject({
        method: 'POST',
        url: '/production-feed/',
        payload: { judul: 'BTS Sesi 2', tipe: 'behind_the_scenes' }
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().success).toBe(true);
      expect(productionFeedService.create).toHaveBeenCalledWith('u1', { judul: 'BTS Sesi 2', tipe: 'behind_the_scenes' });
    });

    it('updates a post (ownership check then patch)', async () => {
      productionFeedService.getById.mockResolvedValue(post);
      productionFeedService.update.mockResolvedValue({ post_id: 1, judul: 'Updated' });
      const res = await fastify.inject({
        method: 'PUT',
        url: '/production-feed/1',
        payload: { judul: 'Updated' }
      });
      expect(res.statusCode).toBe(200);
      expect(productionFeedService.update).toHaveBeenCalledWith(1, { judul: 'Updated' });
    });

    it('soft deletes a post', async () => {
      productionFeedService.getById.mockResolvedValue(post);
      productionFeedService.softDelete.mockResolvedValue({ post_id: 1, deleted_at: new Date().toISOString() });
      const res = await fastify.inject({ method: 'DELETE', url: '/production-feed/1' });
      expect(res.statusCode).toBe(200);
      expect(productionFeedService.softDelete).toHaveBeenCalledWith(1, { actorId: 'u1', ipAddress: '127.0.0.1' });
    });

    it('publishes and archives a post', async () => {
      productionFeedService.getById.mockResolvedValue(post);
      productionFeedService.publish.mockResolvedValue({ ...post, status: 'published' });
      productionFeedService.archive.mockResolvedValue({ ...post, status: 'archived' });
      const pub = await fastify.inject({ method: 'PATCH', url: '/production-feed/1/publish' });
      const arch = await fastify.inject({ method: 'PATCH', url: '/production-feed/1/archive' });
      expect(pub.statusCode).toBe(200);
      expect(arch.statusCode).toBe(200);
      expect(productionFeedService.publish).toHaveBeenCalled();
      expect(productionFeedService.archive).toHaveBeenCalled();
    });

    it('fetches my posts', async () => {
      productionFeedService.getByAuthor.mockResolvedValue({ posts: [post], pagination: { page: 1, limit: 10, total: 1 } });
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/my' });
      expect(res.statusCode).toBe(200);
      expect(productionFeedService.getByAuthor).toHaveBeenCalledWith('u1', { page: 1, limit: 10 });
    });
  });

  describe('integration — tags', () => {
    it('lists tags publicly', async () => {
      productionFeedService.getTags.mockResolvedValue([{ tag_id: 1, nama_tag: 'Casting' }]);
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/tags' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([{ tag_id: 1, nama_tag: 'Casting' }]);
    });

    it('creates a tag as moderator (201)', async () => {
      authCtx.user = moderator;
      productionFeedService.createTag.mockResolvedValue({ tag_id: 5, nama_tag: 'BTS' });
      const res = await fastify.inject({
        method: 'POST',
        url: '/production-feed/tags',
        payload: { nama_tag: 'BTS' }
      });
      expect(res.statusCode).toBe(201);
      expect(productionFeedService.createTag).toHaveBeenCalledWith({ nama_tag: 'BTS' });
    });

    it('updates and deletes a tag as moderator', async () => {
      authCtx.user = moderator;
      productionFeedService.updateTag.mockResolvedValue({ tag_id: 5, nama_tag: 'Bts' });
      productionFeedService.deleteTag.mockResolvedValue(1);
      const upd = await fastify.inject({
        method: 'PUT',
        url: '/production-feed/tags/5',
        payload: { nama_tag: 'Bts' }
      });
      const del = await fastify.inject({ method: 'DELETE', url: '/production-feed/tags/5' });
      expect(upd.statusCode).toBe(200);
      expect(del.statusCode).toBe(200);
      expect(productionFeedService.updateTag).toHaveBeenCalledWith(5, { nama_tag: 'Bts' });
      expect(productionFeedService.deleteTag).toHaveBeenCalledWith(5);
    });
  });

  describe('API — validation errors (400)', () => {
    it('rejects an out-of-range limit with a validation envelope', async () => {
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/?limit=0' });
      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.message).toBe('Validation failed');
      expect(Array.isArray(body.details)).toBe(true);
      expect(productionFeedService.getAll).not.toHaveBeenCalled();
    });

    it('rejects date_from after date_to', async () => {
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/?date_from=2026-05-01&date_to=2026-01-01' });
      expect(res.statusCode).toBe(400);
    });

    it('rejects a non-numeric id on update (params schema)', async () => {
      authCtx.user = creator;
      const res = await fastify.inject({
        method: 'PUT',
        url: '/production-feed/abc',
        payload: { judul: 'X' }
      });
      expect(res.statusCode).toBe(400);
      expect(productionFeedService.update).not.toHaveBeenCalled();
    });

    it('rejects a create body without judul', async () => {
      const res = await fastify.inject({ method: 'POST', url: '/production-feed/', payload: {} });
      expect(res.statusCode).toBe(400);
      expect(productionFeedService.create).not.toHaveBeenCalled();
    });
  });

  describe('API — authentication & authorization (401/403)', () => {
    it('returns 401 when no user is authenticated on a protected route', async () => {
      authCtx.user = null;
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/my' });
      expect(res.statusCode).toBe(401);
      expect(res.json().success).toBe(false);
    });

    it('returns 403 when a non-moderator tries to manage tags', async () => {
      authCtx.user = creator;
      const res = await fastify.inject({ method: 'POST', url: '/production-feed/tags', payload: { nama_tag: 'X' } });
      expect(res.statusCode).toBe(403);
      expect(productionFeedService.createTag).not.toHaveBeenCalled();
    });
  });

  describe('API — not found (404)', () => {
    it('returns 404 for a missing post', async () => {
      productionFeedService.getById.mockResolvedValue(null);
      const res = await fastify.inject({ method: 'GET', url: '/production-feed/999' });
      expect(res.statusCode).toBe(404);
      expect(res.json().message).toBe('Post tidak ditemukan');
    });
  });
});
