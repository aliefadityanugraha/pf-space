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

    it('should prepend API_BASE and /uploads/ for relative paths', () => {
      const relativePath = 'poster.jpg';
      const result = assetUrl(relativePath);
      
      // Since API_BASE is likely http://localhost:3000 in test env
      expect(result).toContain('http://localhost:3000');
      expect(result).toContain('/uploads/poster.jpg');
    });

    it('should handle paths already starting with /uploads/', () => {
      const pathWithUploads = '/uploads/banner.png';
      const result = assetUrl(pathWithUploads);
      
      expect(result).toBe('http://localhost:3000/uploads/banner.png');
    });

    it('should handle paths starting with /api/', () => {
      const apiPath = '/api/files/test.pdf';
      const result = assetUrl(apiPath);
      
      expect(result).toBe('http://localhost:3000/api/files/test.pdf');
    });
  });
});
