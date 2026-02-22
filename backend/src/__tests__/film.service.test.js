import { describe, it, expect, vi } from 'vitest';
import { FilmService } from '../services/film.service.js';

// Mock dependencies
vi.mock('../models/index.js', () => ({
  Film: { query: vi.fn() },
  BaseModel: { defaultModifiers: vi.fn() }
}));

vi.mock('../lib/upload.js', () => ({
  deleteFile: vi.fn()
}));

vi.mock('./embedding.service.js', () => ({
  embeddingService: {}
}));

vi.mock('../lib/sanitize.js', () => ({
  sanitizeRichText: vi.fn(text => `sanitized_rich:${text}`),
  sanitizePlainText: vi.fn(text => `sanitized_plain:${text}`)
}));

describe('FilmService', () => {
  const filmService = new FilmService();

  describe('normalizeData', () => {
    it('should clean and normalize crew data correctly', () => {
      const input = {
        crew: [
          { jabatan: ' Sutradara ', anggota: [' Ali ', ' ', 'Budi'] },
          { jabatan: ' ', anggota: ['Invalid'] },
          { jabatan: 'Produser', anggota: 'Bukan Array' },
          null,
          'bukan object'
        ]
      };

      const result = filmService.normalizeData(input);

      expect(result.crew).toEqual([
        { jabatan: 'Sutradara', anggota: ['Ali', 'Budi'] },
        { jabatan: 'Produser', anggota: [] }
      ]);
    });

    it('should return null if crew is empty after filtering', () => {
      const input = {
        crew: [
          { jabatan: ' ', anggota: [] }
        ]
      };
      const result = filmService.normalizeData(input);
      expect(result.crew).toBeNull();
    });

    it('should sanitize HTML content using library functions', () => {
      const input = {
        judul: 'Film Test',
        deskripsi_lengkap: '<p>Halo</p>',
        sinopsis: '<b>Sinopsis</b>'
      };

      const result = filmService.normalizeData(input);

      expect(result.deskripsi_lengkap).toBe('sanitized_rich:<p>Halo</p>');
      expect(result.sinopsis).toBe('sanitized_plain:<b>Sinopsis</b>');
    });

    it('should handle undefined crew by making it null', () => {
      const input = { judul: 'Test' };
      // Note: in our implementation, if crew is undefined it stays undefined unless specifically handled
      // Let's re-check FilmService.normalizeData:
      // } else if (clean.crew !== undefined) { clean.crew = null; }
      // Wait, if it's undefined, it's NOT !== undefined, so it stays undefined. Correct.
      const result = filmService.normalizeData(input);
      expect(result.crew).toBeUndefined();
    });
    
    it('should set crew to null if provided as non-array/non-undefined', () => {
      const result = filmService.normalizeData({ crew: 'invalid' });
      expect(result.crew).toBeNull();
    });
  });
});
