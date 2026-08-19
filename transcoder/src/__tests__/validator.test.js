/**
 * transcoder/src/__tests__/validator.test.js
 *
 * Unit tests for HLS output structure and master playlist validator.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { validateHlsOutput } from '../validator.js';
import { UPLOAD_VIDEOS_DIR } from '../config.js';

describe('HLS Output Validator', () => {
  const dummyHlsDir = path.join(UPLOAD_VIDEOS_DIR, 'hls', 'spec_test_validator');
  const variantDir = path.join(dummyHlsDir, '720p');
  const renditions = [{ name: '720p', width: 1280, height: 720 }];

  beforeAll(() => {
    if (!fs.existsSync(variantDir)) {
      fs.mkdirSync(variantDir, { recursive: true });
    }
  });

  afterAll(() => {
    try {
      if (fs.existsSync(dummyHlsDir)) {
        fs.rmSync(dummyHlsDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('rejects validation when master.m3u8 is missing', () => {
    const res = validateHlsOutput(dummyHlsDir, renditions);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('master.m3u8 does not exist');
  });

  it('validates correct HLS output structure with master.m3u8, variant playlist, and ts segment', () => {
    fs.writeFileSync(path.join(dummyHlsDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p/playlist.m3u8');
    fs.writeFileSync(path.join(variantDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\n#EXT-X-ENDLIST');
    fs.writeFileSync(path.join(variantDir, 'segment_000.ts'), Buffer.from([0x47, 0x40, 0x00, 0x10]));

    const res = validateHlsOutput(dummyHlsDir, renditions);
    expect(res.valid).toBe(true);
  });
});
