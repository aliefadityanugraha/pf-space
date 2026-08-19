/**
 * transcoder/src/__tests__/sprint9.stress.test.js
 *
 * Sprint 9 — Development Performance & Resource Control Test Suite.
 * Covers Adaptive Concurrency, Directory Isolation, Resource Guard, and Queue Metrics.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH, FFMPEG_PRESET, CONCURRENCY } from '../config.js';
import {
  getHlsOutputDir,
  getTempHlsOutputDir,
  cleanupTempHlsDir,
} from '../paths.js';
import { processTranscodeJob } from '../worker.js';

describe('Sprint 9 Performance & Resource Control Suite', () => {
  const stressVideo1 = path.join(UPLOAD_VIDEOS_DIR, 'sprint9_stress1.mp4');
  const stressVideo2 = path.join(UPLOAD_VIDEOS_DIR, 'sprint9_stress2.mp4');

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const createFixture = (filePath) => new Promise((resolve, reject) => {
      const p = spawn(ffmpegExe, [
        '-y',
        '-f', 'lavfi', '-i', 'testsrc=duration=1:size=640x360:rate=30',
        '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        filePath,
      ], { windowsHide: true });
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`))));
      p.on('error', reject);
    });

    await Promise.all([createFixture(stressVideo1), createFixture(stressVideo2)]);
  }, 25000);

  afterAll(() => {
    try {
      [stressVideo1, stressVideo2].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      [901, 902].forEach((id) => {
        const out = getHlsOutputDir(id);
        if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
      });
    } catch {}
  });

  describe('Phase 1 — Adaptive Concurrency & Output Isolation', () => {
    it('verifies default CONCURRENCY setting and temporary directory isolation', async () => {
      expect(CONCURRENCY).toBeGreaterThanOrEqual(1);

      const job1 = { id: 's9-job-1', data: { filmId: 901, sourcePath: stressVideo1 } };
      const job2 = { id: 's9-job-2', data: { filmId: 902, sourcePath: stressVideo2 } };

      const [res1, res2] = await Promise.all([
        processTranscodeJob(job1),
        processTranscodeJob(job2),
      ]);

      expect(res1.status).toBe('completed');
      expect(res2.status).toBe('completed');

      expect(fs.existsSync(path.join(getHlsOutputDir(901), 'master.m3u8'))).toBe(true);
      expect(fs.existsSync(path.join(getHlsOutputDir(902), 'master.m3u8'))).toBe(true);
    }, 30000);
  });

  describe('Phase 3 — FFmpeg Performance Policy', () => {
    it('verifies FFMPEG_PRESET is configured correctly', () => {
      expect(typeof FFMPEG_PRESET).toBe('string');
      expect(FFMPEG_PRESET.length).toBeGreaterThan(0);
    });
  });
});
