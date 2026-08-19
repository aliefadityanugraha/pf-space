/**
 * transcoder/src/__tests__/worker.test.js
 *
 * Unit tests for Transcoder Worker paths, payload validation, and job processing logic.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { resolveAndValidateSourcePath, getHlsOutputDir } from '../paths.js';
import { processTranscodeJob } from '../worker.js';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';

describe('Transcoder Worker & Path Security', () => {
  const dummyVideo = path.join(UPLOAD_VIDEOS_DIR, 'worker_test_sample.mp4');

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    // Generate real 1-second sample video fixture for worker test
    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=1:size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      dummyVideo,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegExe, args, { windowsHide: true });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(dummyVideo)) resolve();
        else reject(new Error(`Failed to generate test video fixture: code ${code}`));
      });
      proc.on('error', reject);
    });
  }, 15000);

  afterAll(() => {
    try {
      if (fs.existsSync(dummyVideo)) fs.unlinkSync(dummyVideo);
      const hlsDir = path.join(UPLOAD_VIDEOS_DIR, 'hls', '42');
      if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });
    } catch {}
  });

  describe('resolveAndValidateSourcePath', () => {
    it('validates existing video file in UPLOAD_VIDEOS_DIR', () => {
      const res = resolveAndValidateSourcePath('/uploads/videos/worker_test_sample.mp4');
      expect(res.valid).toBe(true);
      expect(res.absolutePath).toBe(path.resolve(dummyVideo));
    });

    it('rejects path traversal attempts', () => {
      const res = resolveAndValidateSourcePath('../../package.json');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('not found or invalid');
    });

    it('rejects non-existent files', () => {
      const res = resolveAndValidateSourcePath('/uploads/videos/non_existent_file_123.mp4');
      expect(res.valid).toBe(false);
    });
  });

  describe('getHlsOutputDir', () => {
    it('generates safe HLS output path based on filmId', () => {
      const out = getHlsOutputDir(42);
      expect(out).toBe(path.resolve(UPLOAD_VIDEOS_DIR, 'hls', '42'));
    });
  });

  describe('processTranscodeJob Pipeline', () => {
    it('processes valid job payload and generates real HLS output successfully', async () => {
      const mockJob = {
        id: 'job-spec-1',
        data: {
          filmId: 42,
          sourcePath: '/uploads/videos/worker_test_sample.mp4',
        },
      };

      const result = await processTranscodeJob(mockJob);
      expect(result.status).toBe('completed');
      expect(result.filmId).toBe(42);
      expect(result.hlsManifestUrl).toBe('/uploads/videos/hls/42/master.m3u8');
    });

    it('rejects job with invalid filmId', async () => {
      const mockJob = {
        id: 'job-spec-invalid',
        data: {
          filmId: null,
          sourcePath: '/uploads/videos/worker_test_sample.mp4',
        },
      };

      await expect(processTranscodeJob(mockJob)).rejects.toThrow('filmId must be a positive number');
    });
  });
});
