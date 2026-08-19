/**
 * transcoder/src/__tests__/sprint12.security.test.js
 *
 * Sprint 12 Transcoder Security & Isolation Test Suite.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { UPLOAD_VIDEOS_DIR } from '../config.js';
import { resolveAndValidateSourcePath } from '../paths.js';

describe('Sprint 12 Transcoder Security Suite', () => {
  const dummyFile = path.join(UPLOAD_VIDEOS_DIR, 'sprint12_valid_sample.mp4');

  beforeAll(() => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    fs.writeFileSync(dummyFile, Buffer.from('VALID_VIDEO'));
  });

  afterAll(() => {
    try {
      if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
    } catch {}
  });

  it('1. Rejects path traversal source path attempting to leave upload boundary', () => {
    const res = resolveAndValidateSourcePath('../../windows/system32/cmd.exe');
    expect(res.valid).toBe(false);
  });

  it('2. Accepts valid video path within uploads boundary', () => {
    const res = resolveAndValidateSourcePath(dummyFile);
    expect(res.valid).toBe(true);
  });
});
