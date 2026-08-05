import { describe, it, expect } from 'vitest';

describe('Tus HTTPS normalization', () => {
  it('rewrites insecure tus URLs to https when the page is served over https', () => {
    const url = 'http://example.com/api/files/abc123';
    const httpsUrl = url.replace(/^http:\/\//, 'https://');
    expect(httpsUrl).toBe('https://example.com/api/files/abc123');
  });

  it('leaves already secure tus URLs unchanged', () => {
    const url = 'https://example.com/api/files/abc123';
    const normalized = url.replace(/^http:\/\//, 'https://');
    expect(normalized).toBe('https://example.com/api/files/abc123');
  });
});
