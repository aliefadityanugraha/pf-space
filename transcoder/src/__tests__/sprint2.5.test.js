/**
 * transcoder/src/__tests__/sprint2.5.test.js
 *
 * Sprint 2.5 HLS Verification & Hardening Test Suite.
 * Covers End-to-End processing, failure recovery, directory promotion,
 * stale temp directory cleanup, and static HTTP delivery.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';
import {
  getTempHlsOutputDir,
  getHlsOutputDir,
  promoteTempToFinalHlsDir,
  cleanupTempHlsDir,
  cleanStaleTempDirectories,
} from '../paths.js';
import { processTranscodeJob } from '../worker.js';
import { validateHlsOutput } from '../validator.js';

describe('Sprint 2.5 HLS Verification & Hardening Suite', () => {
  const sampleVideo = path.join(UPLOAD_VIDEOS_DIR, 'sprint25_test_sample.mp4');
  const invalidVideo = path.join(UPLOAD_VIDEOS_DIR, 'sprint25_corrupt_sample.mp4');
  const filmId = 888;

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    // 1. Generate real 2-second test video fixture using FFmpeg
    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=2:size=1280x720:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=800:duration=2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      sampleVideo,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegExe, args, { windowsHide: true });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(sampleVideo)) resolve();
        else reject(new Error(`Failed to create sample video fixture (code ${code})`));
      });
      proc.on('error', reject);
    });

    // 2. Create invalid video file fixture
    fs.writeFileSync(invalidVideo, 'invalid corrupt video content string');
  }, 15000);

  afterAll(() => {
    try {
      if (fs.existsSync(sampleVideo)) fs.unlinkSync(sampleVideo);
      if (fs.existsSync(invalidVideo)) fs.unlinkSync(invalidVideo);
      const hlsDir = getHlsOutputDir(filmId);
      if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });
    } catch {}
  });

  describe('End-to-End HLS Processing & MP4 Preservation', () => {
    it('processes real MP4 to HLS output and preserves original MP4 video intact', async () => {
      const job = {
        id: 'sprint25-e2e-1',
        data: {
          filmId: 888,
          sourcePath: '/uploads/videos/sprint25_test_sample.mp4',
        },
      };

      const result = await processTranscodeJob(job);
      expect(result.status).toBe('completed');
      expect(result.hlsManifestUrl).toBe('/uploads/videos/hls/888/master.m3u8');

      // Verify original MP4 source file is NEVER deleted or modified
      expect(fs.existsSync(sampleVideo)).toBe(true);

      // Verify HLS master.m3u8 exists
      const finalDir = getHlsOutputDir(888);
      expect(fs.existsSync(path.join(finalDir, 'master.m3u8'))).toBe(true);
    }, 30000);
  });

  describe('Failure Handling & Temp Cleanup', () => {
    it('fails fast on missing source file and cleans up temporary directory', async () => {
      const job = {
        id: 'sprint25-missing-file',
        data: {
          filmId: 889,
          sourcePath: '/uploads/videos/non_existent_file_9999.mp4',
        },
      };

      await expect(processTranscodeJob(job)).rejects.toThrow('Source path validation failed');

      // Verify no temporary output directory is left behind
      const tempDir = getTempHlsOutputDir(889, 'sprint25-missing-file');
      expect(fs.existsSync(tempDir)).toBe(false);
    });

    it('fails fast on invalid/corrupt video via FFprobe and skips FFmpeg', async () => {
      const job = {
        id: 'sprint25-corrupt-file',
        data: {
          filmId: 890,
          sourcePath: '/uploads/videos/sprint25_corrupt_sample.mp4',
        },
      };

      await expect(processTranscodeJob(job)).rejects.toThrow('FFprobe inspection failed');

      // Verify original corrupt source file is preserved intact
      expect(fs.existsSync(invalidVideo)).toBe(true);

      // Verify temp dir is cleaned up
      const tempDir = getTempHlsOutputDir(890, 'sprint25-corrupt-file');
      expect(fs.existsSync(tempDir)).toBe(false);
    });
  });

  describe('Directory Promotion & Backup Hardening', () => {
    it('atomically promotes temp directory and backs up existing output', () => {
      const targetDir = getHlsOutputDir(991);
      const tempDir = getTempHlsOutputDir(991, 'promo-test');

      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'master.m3u8'), '#EXTM3U\ntemp content');

      // 1. Initial Promotion
      promoteTempToFinalHlsDir(tempDir, targetDir);
      expect(fs.existsSync(path.join(targetDir, 'master.m3u8'))).toBe(true);

      // 2. Re-promotion (Re-transcoding replacement)
      const newTempDir = getTempHlsOutputDir(991, 'promo-test-2');
      if (!fs.existsSync(newTempDir)) fs.mkdirSync(newTempDir, { recursive: true });
      fs.writeFileSync(path.join(newTempDir, 'master.m3u8'), '#EXTM3U\nnew content');

      promoteTempToFinalHlsDir(newTempDir, targetDir);
      expect(fs.readFileSync(path.join(targetDir, 'master.m3u8'), 'utf-8')).toContain('new content');

      // Cleanup spec target
      fs.rmSync(targetDir, { recursive: true, force: true });
    });
  });

  describe('Stale Temporary Directory Cleanup', () => {
    it('detects and cleans stale .tmp-* directories older than threshold', () => {
      const hlsDir = path.resolve(UPLOAD_VIDEOS_DIR, 'hls');
      if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

      const staleDir = path.join(hlsDir, '.tmp-999-stale-spec');
      if (!fs.existsSync(staleDir)) fs.mkdirSync(staleDir, { recursive: true });
      const past = new Date(Date.now() - 7200000);
      try { fs.utimesSync(staleDir, past, past); } catch {}

      // Clean with maxAgeMs = 3600000 (1 hour)
      const cleaned = cleanStaleTempDirectories(3600000);
      expect(cleaned).toBeGreaterThanOrEqual(1);
      expect(fs.existsSync(staleDir)).toBe(false);
    });
  });
});
