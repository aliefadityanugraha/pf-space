import { describe, it, expect } from 'vitest';
import { normalizeTusUploadUrl } from '@/lib/uploadFileTus';

describe('Tus upload URL normalization', () => {
  it('rebuilds a backend-localhost URL onto the page origin over https', () => {
    const url = 'http://localhost:3000/api/files/abc123';
    const normalized = normalizeTusUploadUrl(url, 'https://pfspace.my.id');
    expect(normalized).toBe('https://pfspace.my.id/api/files/abc123');
  });

  it('rebuilds a backend URL onto the page origin over http', () => {
    const url = 'http://localhost:3000/api/files/abc123';
    const normalized = normalizeTusUploadUrl(url, 'http://localhost:5173');
    expect(normalized).toBe('http://localhost:5173/api/files/abc123');
  });

  it('keeps a URL that is already on the page origin unchanged', () => {
    const url = 'http://localhost:5173/api/files/abc123';
    expect(normalizeTusUploadUrl(url, 'http://localhost:5173')).toBe(url);
  });

  it('leaves already secure upload URLs unchanged when origin matches', () => {
    const url = 'https://pfspace.my.id/api/files/abc123';
    expect(normalizeTusUploadUrl(url, 'https://pfspace.my.id')).toBe(url);
  });

  it('returns the input unchanged when no upload id is present', () => {
    expect(normalizeTusUploadUrl('http://localhost:3000/nope', 'https://pfspace.my.id')).toBe(
      'http://localhost:3000/nope'
    );
  });

  it('handles a trailing slash on the origin', () => {
    const normalized = normalizeTusUploadUrl(
      'http://localhost:3000/api/files/abc123',
      'https://pfspace.my.id/'
    );
    expect(normalized).toBe('https://pfspace.my.id/api/files/abc123');
  });
  
  it('rebuilds an https localhost backend URL onto an http page origin', () => {
    const url = 'https://localhost:3000/api/files/abc123';
    const normalized = normalizeTusUploadUrl(url, 'http://localhost:5173');
    expect(normalized).toBe('http://localhost:5173/api/files/abc123');
  });
});
