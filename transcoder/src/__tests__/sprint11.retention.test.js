/**
 * transcoder/src/__tests__/sprint11.retention.test.js
 *
 * Sprint 11 Safe HLS Retention Policy & Cleanup Test Suite.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { UPLOAD_VIDEOS_DIR, HLS_OUTPUT_DIR } from '../config.js';
import { evaluateRetentionPolicy } from '../recovery/retentionPolicy.js';

describe('Sprint 11 Retention Policy Suite', () => {
  const sampleMp4 = path.join(UPLOAD_VIDEOS_DIR, 'sprint11_retention_source.mp4');
  const hlsDir = path.resolve(HLS_OUTPUT_DIR);
  const activeHls = path.join(hlsDir, '1101');

  beforeAll(() => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });
    if (!fs.existsSync(activeHls)) fs.mkdirSync(activeHls, { recursive: true });

    fs.writeFileSync(sampleMp4, Buffer.from('SOURCE_MP4'));
    fs.writeFileSync(path.join(activeHls, 'master.m3u8'), '#EXTM3U');
  });

  afterAll(() => {
    try {
      if (fs.existsSync(sampleMp4)) fs.unlinkSync(sampleMp4);
      if (fs.existsSync(activeHls)) fs.rmSync(activeHls, { recursive: true, force: true });
    } catch {}
  });

  it('1. Source MP4 files are ALWAYS protected and never eligible for deletion', () => {
    const report = evaluateRetentionPolicy();
    expect(report.protectedSourceMp4s.length).toBeGreaterThan(0);
    expect(report.eligibleForCleanup.some((item) => item.fullPath.endsWith('.mp4'))).toBe(false);
  });

  it('2. Active HLS output directories are protected', () => {
    const report = evaluateRetentionPolicy();
    expect(report.protectedHls.some((item) => item.name === '1101')).toBe(true);
  });
});
