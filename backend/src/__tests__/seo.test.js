import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seoMiddleware } from '../middlewares/seo.middleware.js';
import { generateSitemap } from '../lib/sitemap.js';
import { filmService } from '../services/index.js';

// Mock Dependencies
vi.mock('../services/index.js', () => ({
  filmService: {
    getBySlug: vi.fn(),
    getById: vi.fn()
  }
}));

vi.mock('../models/Film.js', () => {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([
      { slug: 'sore-istri-dari-masa-depan', updated_at: '2026-08-14T00:00:00Z' },
      { slug: 'film-pendek-smk', updated_at: '2026-08-14T00:00:00Z' }
    ]))
  };
  return {
    Film: {
      query: vi.fn(() => mockQueryBuilder)
    }
  };
});

describe('SEO Middleware (Backend)', () => {
  let mockRequest;
  let mockReply;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      headers: {},
      url: '/archive/sore-istri-dari-masa-depan',
      params: {}
    };

    mockReply = {
      type: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
  });

  it('should ignore regular browser requests (non-bot user agents)', async () => {
    mockRequest.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';
    
    await seoMiddleware(mockRequest, mockReply);

    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should intercept WhatsApp bot request and return static SSR HTML with Open Graph & JSON-LD', async () => {
    mockRequest.headers['user-agent'] = 'WhatsApp/2.21.12.21';
    
    const mockFilm = {
      film_id: 1,
      judul: 'Sore: Istri dari Masa Depan',
      sinopsis: 'Mengisahkan fotografer Indonesia di Kroasia dengan gaya hidup tidak sehat.',
      gambar_poster: '/uploads/images/sore-poster.jpg',
      slug: 'sore-istri-dari-masa-depan',
      creator: { name: 'Dion Wiyoko' },
      category: { name: 'Romance' }
    };

    filmService.getBySlug.mockResolvedValue(mockFilm);

    await seoMiddleware(mockRequest, mockReply);

    expect(mockReply.type).toHaveBeenCalledWith('text/html');
    expect(mockReply.send).toHaveBeenCalled();

    const htmlOutput = mockReply.send.mock.calls[0][0];
    
    // Check title, OG tags, Twitter cards, and JSON-LD
    expect(htmlOutput).toContain('<title>Sore: Istri dari Masa Depan | PF Space</title>');
    expect(htmlOutput).toContain('property="og:title"');
    expect(htmlOutput).toContain('property="og:site_name" content="PF Space"');
    expect(htmlOutput).toContain('property="og:image"');
    expect(htmlOutput).toContain('name="twitter:card" content="summary_large_image"');
    expect(htmlOutput).toContain('type="application/ld+json"');
    expect(htmlOutput).toContain('"@type":"Movie"');
    expect(htmlOutput).toContain('"name":"Sore: Istri dari Masa Depan"');
  });

  it('should handle bot request for non-existent film gracefully', async () => {
    mockRequest.headers['user-agent'] = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
    filmService.getBySlug.mockResolvedValue(null);
    filmService.getById.mockResolvedValue(null);

    await seoMiddleware(mockRequest, mockReply);

    expect(mockReply.send).not.toHaveBeenCalled();
  });
});

describe('XML Sitemap Generator (Backend)', () => {
  it('should generate a valid XML sitemap with static and dynamic routes', async () => {
    const xml = await generateSitemap();

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('/films</loc>');
    expect(xml).toContain('/materi</loc>');
    expect(xml).toContain('/archive/sore-istri-dari-masa-depan</loc>');
    expect(xml).toContain('</urlset>');
  });
});
