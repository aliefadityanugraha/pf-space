import { describe, it, expect, vi } from 'vitest';
import { assetUrl } from '../lib/format.js';

describe('Format Utility', () => {
  describe('assetUrl', () => {
    it('should return null or undefined if input is falsy', () => {
      expect(assetUrl(null)).toBe(null);
      expect(assetUrl('')).toBe('');
    });

    it('should return original url if it starts with http or https', () => {
      const externalUrl = 'https://example.com/image.jpg';
      expect(assetUrl(externalUrl)).toBe(externalUrl);
    });

    it('should prepend the current origin and /uploads/ for relative paths', () => {
      const relativePath = 'poster.jpg';
      const result = assetUrl(relativePath);
      const expectedPrefix = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

      expect(result).toContain(expectedPrefix);
      expect(result).toContain('/uploads/poster.jpg');
    });

    it('should handle paths already starting with /uploads/', () => {
      const pathWithUploads = '/uploads/banner.png';
      const result = assetUrl(pathWithUploads);
      const expectedPrefix = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

      expect(result).toBe(`${expectedPrefix}/uploads/banner.png`);
    });

    it('should handle paths starting with /api/', () => {
      const apiPath = '/api/files/test.pdf';
      const result = assetUrl(apiPath);
      const expectedPrefix = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

      expect(result).toBe(`${expectedPrefix}/api/files/test.pdf`);
    });
  });
});
