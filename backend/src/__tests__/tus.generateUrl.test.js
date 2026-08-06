import { describe, it, expect } from 'vitest';
import { tusServer } from '../lib/tus.js';

describe('tusServer generateUrl', () => {
  const generateUrl = tusServer.options.generateUrl;

  it('generates http URL for localhost requests', () => {
    const req = {
      headers: { host: 'localhost:3000' },
      socket: { encrypted: false },
    };
    const url = generateUrl(req, { host: 'localhost:3000', path: '/api/files', id: 'uuid-123' });
    expect(url).toBe('http://localhost:3000/api/files/uuid-123');
  });

  it('generates http URL for LAN IP requests', () => {
    const req = {
      headers: { host: '192.168.1.50:3000' },
      socket: { encrypted: false },
    };
    const url = generateUrl(req, { host: '192.168.1.50:3000', path: '/api/files', id: 'uuid-123' });
    expect(url).toBe('http://192.168.1.50:3000/api/files/uuid-123');
  });

  it('generates https URL when x-forwarded-proto is https', () => {
    const req = {
      headers: {
        host: 'pfspace.my.id',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'pfspace.my.id',
      },
      socket: { encrypted: false },
    };
    const url = generateUrl(req, { host: 'pfspace.my.id', path: '/api/files', id: 'uuid-123' });
    expect(url).toBe('https://pfspace.my.id/api/files/uuid-123');
  });

  it('defaults to https for non-local production hosts', () => {
    const req = {
      headers: { host: 'pfspace.my.id' },
      socket: { encrypted: false },
    };
    const url = generateUrl(req, { host: 'pfspace.my.id', path: '/api/files', id: 'uuid-123' });
    expect(url).toBe('https://pfspace.my.id/api/files/uuid-123');
  });
});
