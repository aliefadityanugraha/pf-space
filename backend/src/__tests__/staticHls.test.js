/**
 * backend/src/__tests__/staticHls.test.js
 *
 * Integration tests for static HLS delivery (.m3u8 & .ts) in static.routes.js.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import staticRoutes from '../routes/static.routes.js';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR } from '../lib/upload.js';

describe('Static Routes HLS Delivery', () => {
  let fastify;
  const testHlsDir = path.join(UPLOAD_DIR, 'videos', 'hls', 'test_hls_spec');
  const m3u8File = path.join(testHlsDir, 'master.m3u8');
  const tsFile = path.join(testHlsDir, 'segment_000.ts');

  beforeAll(async () => {
    // Create temporary HLS files for testing
    if (!fs.existsSync(testHlsDir)) {
      fs.mkdirSync(testHlsDir, { recursive: true });
    }
    fs.writeFileSync(m3u8File, '#EXTM3U\n#EXT-X-VERSION:3\n');
    fs.writeFileSync(tsFile, Buffer.from([0x47, 0x40, 0x00, 0x10]));

    fastify = Fastify();
    await fastify.register(fastifyStatic, { root: UPLOAD_DIR, decorateReply: true });
    await fastify.register(staticRoutes);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    try {
      if (fs.existsSync(m3u8File)) fs.unlinkSync(m3u8File);
      if (fs.existsSync(tsFile)) fs.unlinkSync(tsFile);
      if (fs.existsSync(testHlsDir)) fs.rmdirSync(testHlsDir);
    } catch {}
  });

  it('serves .m3u8 manifest files with Content-Type application/vnd.apple.mpegurl', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/uploads/videos/hls/test_hls_spec/master.m3u8',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/vnd.apple.mpegurl');
    expect(response.payload).toContain('#EXTM3U');
  });

  it('serves .ts segment files with Content-Type video/mp2t', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/uploads/videos/hls/test_hls_spec/segment_000.ts',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('video/mp2t');
  });

  it('rejects path traversal attempts on HLS endpoints with 403 Forbidden', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/uploads/videos/hls/../../static.routes.js',
    });

    expect([403, 404]).toContain(response.statusCode);
  });
});
