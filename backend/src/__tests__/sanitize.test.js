import { describe, it, expect } from 'vitest';
import { sanitizeRichText, sanitizePlainText } from '../lib/sanitize.js';

describe('Sanitization Utility', () => {
  describe('sanitizeRichText', () => {
    it('should allow safe HTML tags', () => {
      const html = '<h1>Judul</h1><p>Paragraf <strong>tebal</strong></p>';
      expect(sanitizeRichText(html)).toBe(html);
    });

    it('should strip dangerous tags like <script>', () => {
      const html = '<p>Halo</p><script>alert("XSS")</script>';
      expect(sanitizeRichText(html)).toBe('<p>Halo</p>');
    });

    it('should strip inline event handlers', () => {
      const html = '<img src="x" onerror="alert(1)">';
      expect(sanitizeRichText(html)).toBe('<img src="x" />');
    });

    it('should strip javascript: URLs from links', () => {
      const html = '<a href="javascript:alert(1)">Klik</a>';
      // It should strip the href or remove the tag depending on config.
      // Looking at sanitize-html defaults, it usually discards the attribute if the scheme is not allowed.
      expect(sanitizeRichText(html)).not.toContain('javascript:');
    });

    it('should automatically add target="_blank" and rel for links', () => {
      const html = '<a href="https://google.com">Google</a>';
      const result = sanitizeRichText(html);
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });
  });

  describe('sanitizePlainText', () => {
    it('should strip all HTML tags', () => {
      const html = '<h1>Judul</h1><p>Halo <b>Budi</b></p>';
      const result = sanitizePlainText(html);
      // Depending on sanitize-html, it might leave whitespace.
      expect(result).toBe('JudulHalo Budi');
    });

    it('should leave plain text untouched', () => {
      const text = 'Hanya teks biasa 123';
      expect(sanitizePlainText(text)).toBe(text);
    });
  });
});
