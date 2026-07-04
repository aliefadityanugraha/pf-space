import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import tusRoutes from '../routes/tus.routes.js';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock the tus server to avoid real filesystem/network operations
vi.mock('../lib/tus.js', () => {
  return {
    tusServer: {
      handle: vi.fn((req, res) => {
        // Simulate a successful no-content response from tus server
        res.statusCode = 204;
        res.setHeader('X-Mock', 'ok');
        res.end();
      }),
    },
  };
});

describe('Tus Routes Integration', () => {
  let fastify;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'http://localhost:5173';
    fastify = Fastify({ logger: false });

    // Mimic app's special content type parser for tus PATCH stream
    fastify.addContentTypeParser('application/offset+octet-stream', (request, payload, done) => {
      done(null);
    });

    // Register strict rate limit to ensure bypass is effective on the route
    await fastify.register(rateLimit, {
      max: 1,
      timeWindow: '1 minute',
    });

    // Register tus routes with the same prefix used in the app
    await fastify.register(tusRoutes, { prefix: '/api/files' });
    await fastify.ready();
  });

  afterAll(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  it('should bypass rate limit on PATCH upload requests', async () => {
    const headers = {
      origin: 'http://localhost:5173',
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': '0',
      'Content-Length': '0',
      'Content-Type': 'application/offset+octet-stream',
    };

    // First request should pass
    const r1 = await fastify.inject({
      method: 'PATCH',
      url: '/api/files/some-id',
      headers,
      payload: '',
    });
    expect(r1.statusCode).toBe(204);
    expect(r1.headers['x-mock']).toBe('ok');

    // Subsequent requests should also pass even with strict rate limit
    const r2 = await fastify.inject({
      method: 'PATCH',
      url: '/api/files/some-id',
      headers,
      payload: '',
    });
    expect(r2.statusCode).toBe(204);

    const r3 = await fastify.inject({
      method: 'PATCH',
      url: '/api/files/some-id',
      headers,
      payload: '',
    });
    expect(r3.statusCode).toBe(204);
  });

  it('should handle CORS preflight (OPTIONS) with 204', async () => {
    const res = await fastify.inject({
      method: 'OPTIONS',
      url: '/api/files/some-id',
      headers: {
        origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PATCH',
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-methods']).toMatch(/GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD/);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
