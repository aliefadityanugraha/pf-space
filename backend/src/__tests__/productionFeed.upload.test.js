import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductionFeedService } from '../services/productionFeed.service.js';
import { ProductionPostMedia } from '../models/index.js';
import { deleteFile, fileExists, getSubfolderForMediaType } from '../lib/upload.js';
import { uploadOrUrl } from '../lib/validation.js';
import { ValidationError } from '../lib/errors.js';

vi.mock('../models/index.js', () => ({
  ProductionPost: { query: vi.fn(), transaction: vi.fn() },
  ProductionPostMedia: { query: vi.fn() },
  ProductionPostTag: { query: vi.fn() },
  Tag: { query: vi.fn() },
  Film: { query: vi.fn(), generateSlug: vi.fn() },
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
  buildPagination: vi.fn((total, page, limit) => ({ page, limit, total }))
}));

describe('ProductionFeedService — upload integrity (_assertUploadedMedia / _attachMedia)', () => {
  const service = new ProductionFeedService();

  beforeEach(() => {
    vi.clearAllMocks();
    getSubfolderForMediaType.mockImplementation((type) =>
      ({ photo: 'images', video: 'videos', pdf: 'documents' })[type] || null
    );
    fileExists.mockReturnValue(true);
  });

  describe('_assertUploadedMedia', () => {
    it('rejects an unsupported media type', () => {
      expect(() => service._assertUploadedMedia('/uploads/images/x.jpg', 'audio')).toThrow(ValidationError);
      expect(() => service._assertUploadedMedia('/uploads/images/x.jpg', 'audio')).toThrow(/Tipe media/);
    });

    it('rejects an empty file path', () => {
      expect(() => service._assertUploadedMedia('', 'photo')).toThrow(/File media wajib/);
    });

    it('rejects a file in the wrong subfolder', () => {
      getSubfolderForMediaType.mockReturnValue('images');
      expect(() => service._assertUploadedMedia('/uploads/videos/x.mp4', 'photo')).toThrow(/folder \/uploads\/images/);
    });

    it('rejects a file that does not physically exist', () => {
      getSubfolderForMediaType.mockReturnValue('images');
      fileExists.mockReturnValue(false);
      expect(() => service._assertUploadedMedia('/uploads/images/ghost.jpg', 'photo')).toThrow(/tidak ditemukan/);
    });

    it('accepts a valid photo in the matching folder', () => {
      getSubfolderForMediaType.mockReturnValue('images');
      expect(() => service._assertUploadedMedia('/uploads/images/ok.jpg', 'photo')).not.toThrow();
      expect(fileExists).toHaveBeenCalledWith('/uploads/images/ok.jpg');
    });
  });

  describe('_attachMedia', () => {
    const insert = vi.fn();

    beforeEach(() => {
      insert.mockReset();
      ProductionPostMedia.query.mockReturnValue({ insert });
    });

    it('inserts rows with sort_order falling back to the index', async () => {
      await service._attachMedia({}, 5, [
        { media_type: 'photo', file_path: '/uploads/images/a.jpg' },
        { media_type: 'video', file_path: '/uploads/videos/b.mp4', duration: 120 }
      ]);
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ post_id: 5, file_path: '/uploads/images/a.jpg', sort_order: 0 })
      );
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ post_id: 5, file_path: '/uploads/videos/b.mp4', sort_order: 1, duration: 120 })
      );
    });

    it('preserves explicit sort_order', async () => {
      await service._attachMedia({}, 5, [
        { media_type: 'photo', file_path: '/uploads/images/a.jpg', sort_order: 9 }
      ]);
      expect(insert).toHaveBeenCalledWith(expect.objectContaining({ sort_order: 9 }));
    });

    it('rejects when the thumbnail file is missing', async () => {
      fileExists.mockImplementation((p) => p !== '/uploads/images/thumb.jpg');
      await expect(
        service._attachMedia({}, 5, [{ media_type: 'video', file_path: '/uploads/videos/a.mp4', thumbnail: '/uploads/images/thumb.jpg' }])
      ).rejects.toThrow(/Thumbnail/);
      expect(insert).not.toHaveBeenCalled();
    });

    it('validates every item before inserting any row', async () => {
      getSubfolderForMediaType.mockReturnValue('images');
      await expect(
        service._attachMedia({}, 5, [
          { media_type: 'photo', file_path: '/uploads/images/ok.jpg' },
          { media_type: 'photo', file_path: '/uploads/videos/wrong.mp4' }
        ])
      ).rejects.toThrow(ValidationError);
      expect(insert).not.toHaveBeenCalled();
    });
  });
});

describe('lib/validation — uploadOrUrl schema', () => {
  const ok = (v) => expect(uploadOrUrl.safeParse(v).success).toBe(true);
  const fail = (v) => expect(uploadOrUrl.safeParse(v).success).toBe(false);

  it('accepts empty string, valid URLs, and safe upload paths', () => {
    ok('');
    ok('https://example.com/poster.jpg');
    ok('/uploads/images/poster.jpg');
    ok('/uploads/videos/behind-the-scenes.mp4');
    ok('/uploads/documents/naskah.pdf');
    ok('/uploads/avatars/user1.png');
  });

  it('rejects traversal and absolute paths outside /uploads', () => {
    fail('../etc/passwd');
    fail('/etc/passwd');
    fail('uploads/images/x.jpg');
    fail('/uploads/../images/x.jpg');
  });

  it('rejects unknown subfolders and nested paths', () => {
    fail('/uploads/music/song.mp3');
    fail('/uploads/images/folder/nested.jpg');
    fail('/uploads/images/a/b.jpg');
  });

  it('rejects strings that are neither URLs nor upload paths', () => {
    fail('not a url');
    fail('just-some-text');
    fail('http://');
  });
});
