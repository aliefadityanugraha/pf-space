import { describe, it, expect, vi, beforeEach } from 'vitest';
import knex from 'knex';
import { ProductionFeedService } from '../services/productionFeed.service.js';
import { ProductionPost, ProductionPostTag, Tag } from '../models/index.js';
import { ValidationError } from '../lib/errors.js';

vi.mock('../models/index.js', () => ({
  ProductionPost: { query: vi.fn() },
  ProductionPostMedia: { query: vi.fn() },
  ProductionPostTag: { query: vi.fn() },
  Tag: { query: vi.fn() },
  Film: { generateSlug: vi.fn() },
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
  sanitizePlainText: vi.fn((text) => text)
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

const kb = knex({
  client: 'mysql2',
  connection: { host: 'x', user: 'x', password: 'x', database: 'x' }
});

function makeSub() {
  const sub = { calls: [], subs: [] };
  const record = (kind, args) => sub.calls.push({ kind, args });
  const invoke = (fn) => {
    const child = makeSub();
    sub.subs.push(child);
    fn(child);
    return child;
  };
  sub.where = (...args) => {
    record('where', args);
    if (typeof args[args.length - 1] === 'function') invoke(args[args.length - 1]);
    return sub;
  };
  sub.orWhere = (...args) => {
    record('orWhere', args);
    if (typeof args[args.length - 1] === 'function') invoke(args[args.length - 1]);
    return sub;
  };
  sub.whereIn = (col, val) => {
    record('whereIn', [col, val]);
    if (typeof val === 'function') invoke(val);
    return sub;
  };
  sub.whereNull = (col) => {
    record('whereNull', [col]);
    return sub;
  };
  sub.orderBy = (col, dir) => {
    record('orderBy', [col, dir]);
    return sub;
  };
  sub.select = (...cols) => {
    record('select', cols);
    return sub;
  };
  sub.from = (t) => {
    record('from', [t]);
    return sub;
  };
  return sub;
}

function makeChain({ offsetRows, countResult, cursorRows }) {
  const sub = makeSub();
  Object.assign(sub, {
    withGraphFetched: vi.fn().mockReturnThis(),
    modifiers: vi.fn().mockReturnThis(),
    limit:
      cursorRows !== undefined ? vi.fn().mockResolvedValue(cursorRows) : vi.fn().mockReturnThis(),
    offset: offsetRows !== undefined ? vi.fn().mockResolvedValue(offsetRows) : vi.fn(),
    count: countResult !== undefined ? vi.fn().mockReturnThis() : vi.fn(),
    first: countResult !== undefined ? vi.fn().mockResolvedValue(countResult) : vi.fn()
  });
  return sub;
}

const findCalls = (chain, kind, firstArg) =>
  chain.calls.filter((c) => c.kind === kind && c.args[0] === firstArg).map((c) => c.args);

describe('ProductionFeedService — Search & Cursor Pagination', () => {
  const service = new ProductionFeedService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('_encodeCursor / _decodeCursor', () => {
    it('round-trips a Date sort value as a local DATETIME string', () => {
      const cursor = service._encodeCursor(
        { post_id: 5, is_pinned: 1, created_at: new Date(2026, 0, 2, 3, 4, 5) },
        'created_at',
        'desc'
      );
      const decoded = service._decodeCursor(cursor);
      expect(decoded).toMatchObject({
        v: 1,
        sortBy: 'created_at',
        sortOrder: 'desc',
        is_pinned: 1,
        sort_value: '2026-01-02 03:04:05',
        post_id: 5
      });
    });

    it('returns null for malformed or missing fields', () => {
      expect(service._decodeCursor('not-a-cursor')).toBeNull();
      const encoded = service._encodeCursor({ post_id: 1, is_pinned: 0, judul: 'A' }, 'judul', 'asc');
      const tampered = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      delete tampered.post_id;
      expect(service._decodeCursor(Buffer.from(JSON.stringify(tampered)).toString('base64url'))).toBeNull();
    });
  });

  describe('_applyCursor (keyset predicate)', () => {
    it('builds correct SQL for desc ordering', () => {
      const q = kb('production_posts');
      service._applyCursor(
        q,
        { is_pinned: 1, sort_value: '2026-08-01 10:00:00', post_id: 42 },
        'created_at',
        'desc'
      );
      expect(q.toSQL().sql).toBe(
        'select * from `production_posts` where ((`is_pinned` < ? or (`is_pinned` = ? and (`created_at` < ? or (`created_at` = ? and `post_id` < ?)))))'
      );
    });

    it('builds correct SQL for asc ordering', () => {
      const q = kb('production_posts');
      service._applyCursor(
        q,
        { is_pinned: 0, sort_value: 'B', post_id: 7 },
        'judul',
        'asc'
      );
      expect(q.toSQL().sql).toBe(
        'select * from `production_posts` where ((`is_pinned` < ? or (`is_pinned` = ? and (`judul` > ? or (`judul` = ? and `post_id` > ?)))))'
      );
    });

    it('skips the duplicated column when sortBy is is_pinned', () => {
      const q = kb('production_posts');
      service._applyCursor(q, { is_pinned: 1, post_id: 7 }, 'is_pinned', 'desc');
      expect(q.toSQL().sql).toBe(
        'select * from `production_posts` where ((`is_pinned` < ? or (`is_pinned` = ? and `post_id` < ?)))'
      );
    });
  });

  describe('getAll — offset pagination (default)', () => {
    it('applies default filters and returns correct pagination', async () => {
      const rows = [{ post_id: 1 }, { post_id: 2 }];
      const mainChain = makeChain({ offsetRows: rows });
      const countChain = makeChain({ countResult: { total: '5' } });
      ProductionPost.query.mockReturnValueOnce(mainChain).mockReturnValueOnce(countChain);

      const result = await service.getAll({});

      expect(result.posts).toEqual(rows);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 5, totalPages: 1 });
      expect(findCalls(mainChain, 'whereNull', 'deleted_at')).toHaveLength(1);
      expect(findCalls(mainChain, 'where', 'visibility')).toContainEqual(['visibility', 'public']);
      expect(findCalls(mainChain, 'orderBy', 'is_pinned')).toContainEqual(['is_pinned', 'desc']);
      expect(findCalls(mainChain, 'orderBy', 'created_at')).toContainEqual(['created_at', 'desc']);
      expect(findCalls(mainChain, 'orderBy', 'post_id')).toContainEqual(['post_id', 'desc']);
    });

    it('filters by author name via users subquery', async () => {
      const mainChain = makeChain({ offsetRows: [] });
      const countChain = makeChain({ countResult: { total: '0' } });
      ProductionPost.query.mockReturnValueOnce(mainChain).mockReturnValueOnce(countChain);

      await service.getAll({ author: 'Doni' });

      const authorSub = mainChain.subs.find((s) =>
        s.calls.some((c) => c.kind === 'from' && c.args[0] === 'users')
      );
      expect(authorSub).toBeDefined();
      expect(authorSub.calls).toEqual(
        expect.arrayContaining([
          { kind: 'select', args: ['id'] },
          { kind: 'from', args: ['users'] },
          { kind: 'where', args: ['name', 'like', '%Doni%'] }
        ])
      );
    });

    it('applies date range on published_at for the published feed', async () => {
      const mainChain = makeChain({ offsetRows: [] });
      const countChain = makeChain({ countResult: { total: '0' } });
      ProductionPost.query.mockReturnValueOnce(mainChain).mockReturnValueOnce(countChain);

      await service.getAll({ date_from: '2026-01-01', date_to: '2026-01-31' });

      expect(findCalls(mainChain, 'where', 'published_at')).toEqual([
        ['published_at', '>=', '2026-01-01 00:00:00'],
        ['published_at', '<=', '2026-01-31 23:59:59']
      ]);
    });

    it('applies date range on created_at when status is not published', async () => {
      const mainChain = makeChain({ offsetRows: [] });
      const countChain = makeChain({ countResult: { total: '0' } });
      ProductionPost.query.mockReturnValueOnce(mainChain).mockReturnValueOnce(countChain);

      await service.getAll({ date_from: '2026-01-01', status: 'draft' });

      expect(findCalls(mainChain, 'where', 'created_at')).toEqual([
        ['created_at', '>=', '2026-01-01 00:00:00']
      ]);
    });

    it('applies explicit visibility filter on top of access control', async () => {
      const mainChain = makeChain({ offsetRows: [] });
      const countChain = makeChain({ countResult: { total: '0' } });
      ProductionPost.query.mockReturnValueOnce(mainChain).mockReturnValueOnce(countChain);

      await service.getAll({ visibility: 'private' });

      expect(findCalls(mainChain, 'where', 'visibility')).toContainEqual(['visibility', 'private']);
    });
  });

  describe('getAll — cursor pagination', () => {
    it('rejects an invalid cursor', async () => {
      await expect(service.getAll({ cursor: 'invalid-cursor' })).rejects.toThrow(ValidationError);
      expect(ProductionPost.query).not.toHaveBeenCalled();
    });

    it('rejects a cursor that does not match the requested sort', async () => {
      const cursor = service._encodeCursor(
        { post_id: 1, is_pinned: 0, created_at: new Date(2026, 0, 1) },
        'created_at',
        'desc'
      );
      await expect(service.getAll({ cursor, sortBy: 'judul', sortOrder: 'asc' })).rejects.toThrow(
        ValidationError
      );
      expect(ProductionPost.query).not.toHaveBeenCalled();
    });

    it('returns next_cursor and has_more for a partial page', async () => {
      const cursor = service._encodeCursor(
        { post_id: 1, is_pinned: 0, created_at: new Date(2026, 0, 1) },
        'created_at',
        'desc'
      );
      const rows = [
        { post_id: 2, is_pinned: 0, created_at: new Date(2026, 0, 2) },
        { post_id: 3, is_pinned: 0, created_at: new Date(2026, 0, 3) },
        { post_id: 4, is_pinned: 0, created_at: new Date(2026, 0, 4) }
      ];
      const chain = makeChain({ cursorRows: rows });
      ProductionPost.query.mockReturnValueOnce(chain);

      const result = await service.getAll({ cursor, limit: 2, sortBy: 'created_at', sortOrder: 'desc' });

      expect(result.posts).toEqual(rows.slice(0, 2));
      expect(result.pagination).toEqual({
        limit: 2,
        has_more: true,
        next_cursor: service._encodeCursor(rows[1], 'created_at', 'desc')
      });
      expect(chain.limit).toHaveBeenCalledWith(3);
    });

    it('returns has_more false and null next_cursor on the last page', async () => {
      const cursor = service._encodeCursor(
        { post_id: 1, is_pinned: 0, created_at: new Date(2026, 0, 1) },
        'created_at',
        'desc'
      );
      const rows = [{ post_id: 2, is_pinned: 0, created_at: new Date(2026, 0, 2) }];
      ProductionPost.query.mockReturnValueOnce(makeChain({ cursorRows: rows }));

      const result = await service.getAll({ cursor, limit: 2, sortBy: 'created_at', sortOrder: 'desc' });

      expect(result.posts).toEqual(rows);
      expect(result.pagination).toEqual({ limit: 2, has_more: false, next_cursor: null });
    });
  });

  describe('_syncTags (batch upsert, no N+1)', () => {
    it('reuses existing tags (case-insensitive) and links in a single junction insert', async () => {
      const existing = [
        { tag_id: 1, nama_tag: 'Casting' },
        { tag_id: 2, nama_tag: 'behind the scenes' }
      ];
      Tag.query.mockReturnValueOnce({ whereIn: vi.fn().mockResolvedValue(existing) });

      const junctionInsert = vi.fn().mockResolvedValue(1);
      ProductionPostTag.query.mockReturnValue({ insert: junctionInsert });

      await service._syncTags({}, 42, ['Casting', 'BEHIND THE SCENES', '  ']);

      expect(Tag.query).toHaveBeenCalledTimes(1);
      expect(junctionInsert).toHaveBeenCalledWith({ post_id: 42, tag_id: 1 });
      expect(junctionInsert).toHaveBeenCalledWith({ post_id: 42, tag_id: 2 });
    });

    it('bulk-inserts missing tags, then links all tags in junction inserts', async () => {
      const existing = [{ tag_id: 1, nama_tag: 'Aktor' }];
      const newlyCreated = [{ tag_id: 3, nama_tag: 'Wrap Party' }];
      const insertTag = vi.fn().mockResolvedValue(1);

      Tag.query
        .mockReturnValueOnce({ whereIn: vi.fn().mockResolvedValue(existing) })
        .mockReturnValueOnce({ insert: insertTag })
        .mockReturnValueOnce({ whereIn: vi.fn().mockResolvedValue(newlyCreated) });

      const junctionInsert = vi.fn().mockResolvedValue(1);
      ProductionPostTag.query.mockReturnValue({ insert: junctionInsert });

      await service._syncTags({}, 42, ['Aktor', 'Wrap Party']);

      expect(Tag.query).toHaveBeenCalledTimes(3);
      expect(insertTag).toHaveBeenCalledWith({ nama_tag: 'Wrap Party', slug: undefined });
      expect(junctionInsert).toHaveBeenCalledWith({ post_id: 42, tag_id: 1 });
      expect(junctionInsert).toHaveBeenCalledWith({ post_id: 42, tag_id: 3 });
    });

    it('returns early when all names are empty', async () => {
      await service._syncTags({}, 42, [null, '', '   ']);
      expect(Tag.query).not.toHaveBeenCalled();
      expect(ProductionPostTag.query).not.toHaveBeenCalled();
    });

    it('dedupes case-variant duplicate names to avoid a junction PK collision', async () => {
      const existing = [{ tag_id: 1, nama_tag: 'Casting' }];
      Tag.query.mockReturnValueOnce({ whereIn: vi.fn().mockResolvedValue(existing) });

      const junctionInsert = vi.fn().mockResolvedValue(1);
      ProductionPostTag.query.mockReturnValueOnce({ insert: junctionInsert });

      await service._syncTags({}, 42, ['Casting', 'CASTING', 'casting']);

      expect(Tag.query).toHaveBeenCalledTimes(1);
      expect(junctionInsert).toHaveBeenCalledWith({ post_id: 42, tag_id: 1 });
    });
  });
});
