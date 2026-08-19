/**
 * transcoder/src/__tests__/sprint14.e2e.test.js
 *
 * Sprint 14 Final E2E Transcoder QA & Lifecycle Validation Test Suite.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';
import { getHlsOutputDir, cleanupTempHlsDir } from '../paths.js';
import { processTranscodeJob } from '../worker.js';

describe('Sprint 14 Final E2E Transcoder QA & Release Validation', () => {
  const videoPath = path.join(UPLOAD_VIDEOS_DIR, 'sprint14_final_sample.mp4');

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });

    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const p = spawn(ffmpegExe, [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=1:size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1',
      '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p',
      videoPath,
    ], { windowsHide: true });

    await new Promise((resolve, reject) => {
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`))));
      p.on('error', reject);
    });
  }, 25000);

  afterAll(() => {
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      const out = getHlsOutputDir(1401);
      if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
    } catch {}
  });

  it('1. Executes full end-to-end transcoding lifecycle from payload validation to completed HLS output', async () => {
    const job = { id: 'sprint14-e2e-job', data: { filmId: 1401, sourcePath: videoPath } };
    const res = await processTranscodeJob(job);

    expect(res.status).toBe('completed');
    expect(res.hlsManifestUrl).toBe('/uploads/videos/hls/1401/master.m3u8');
    expect(fs.existsSync(path.join(getHlsOutputDir(1401), 'master.m3u8'))).toBe(true);
  }, 30000);
});
