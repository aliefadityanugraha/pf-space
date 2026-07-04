import { describe, it, expect, vi } from 'vitest';
import { getSubfolderForType, generateUniqueName, UPLOAD_SUBDIRS } from '../lib/upload.js';

describe('Upload Utility', () => {
  describe('getSubfolderForType', () => {
    it('should return videos for video mime types', () => {
      expect(getSubfolderForType('video/mp4')).toBe(UPLOAD_SUBDIRS.videos);
      expect(getSubfolderForType('video/quicktime')).toBe(UPLOAD_SUBDIRS.videos);
    });

    it('should return images for image mime types', () => {
      expect(getSubfolderForType('image/jpeg')).toBe(UPLOAD_SUBDIRS.images);
      expect(getSubfolderForType('image/png')).toBe(UPLOAD_SUBDIRS.images);
      expect(getSubfolderForType('image/webp')).toBe(UPLOAD_SUBDIRS.images);
    });

    it('should return documents for PDF', () => {
      expect(getSubfolderForType('application/pdf')).toBe(UPLOAD_SUBDIRS.documents);
    });

    it('should return documents for unknown or empty types', () => {
      expect(getSubfolderForType(null)).toBe(UPLOAD_SUBDIRS.documents);
      expect(getSubfolderForType('')).toBe(UPLOAD_SUBDIRS.documents);
      expect(getSubfolderForType('application/zip')).toBe(UPLOAD_SUBDIRS.documents);
    });
  });

  describe('generateUniqueName', () => {
    it('should generate a name with the correct extension', () => {
      const originalName = 'my-movie.mp4';
      const uniqueName = generateUniqueName(originalName);
      
      expect(uniqueName).toMatch(/^[0-9a-f-]{36}\.mp4$/);
    });

    it('should generate different names for the same input', () => {
      const name1 = generateUniqueName('test.jpg');
      const name2 = generateUniqueName('test.jpg');
      
      expect(name1).not.toBe(name2);
    });
  });
});
