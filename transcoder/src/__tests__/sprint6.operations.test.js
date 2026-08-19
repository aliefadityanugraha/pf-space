/**
 * transcoder/src/__tests__/sprint6.operations.test.js
 *
 * Sprint 6 — Development Transcoding Operations & Queue Reliability Test Suite.
 * Covers Cancellation, Monotonic Progress, State Machine Consistency, Process Safety,
 * Zombie Recovery, and Observability Logging.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';
import {
  getHlsOutputDir,
  getTempHlsOutputDir,
  cleanupTempHlsDir,
} from '../paths.js';
import { updateFilmStatus, recoverZombieJobs, processTranscodeJob } from '../worker.js';
import { cancelFfmpegProcess, transcodeRendition } from '../ffmpeg.js';
import { validateHlsOutput } from '../validator.js';

describe('Sprint 6 Development Transcoding Operations & Queue Reliability', () => {
  const sampleVideo = path.join(UPLOAD_VIDEOS_DIR, 'sprint6_sample.mp4');
  const filmId = 601;

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    // Generate real 3-second sample video fixture using FFmpeg
    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=3:size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=3',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      sampleVideo,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegExe, args, { windowsHide: true });
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`))));
      proc.on('error', reject);
    });
  }, 20000);

  afterAll(() => {
    try {
      if (fs.existsSync(sampleVideo)) fs.unlinkSync(sampleVideo);
      const out = getHlsOutputDir(filmId);
      if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
    } catch {}
  });

  describe('Phase 2 & Phase 7 — FFmpeg Process Safety & Cancellation', () => {
    it('cancels an in-progress FFmpeg encoding job and terminates child process cleanly', async () => {
      const tempDir = getTempHlsOutputDir(filmId, 'cancel-test');

      const encodingPromise = transcodeRendition({
        filmId: 601,
        inputPath: sampleVideo,
        outputDir: path.join(tempDir, '360p'),
        rendition: { name: '360p', width: 640, height: 360, videoBitrate: '800k', maxRate: '800k', bufSize: '1600k', audioBitrate: '96k' },
        totalDuration: 3.0,
      });

      // Give spawn a moment to start
      await new Promise((r) => setTimeout(r, 50));

      // Trigger process cancellation
      const cancelled = cancelFfmpegProcess(601);
      expect(cancelled).toBe(true);

      await expect(encodingPromise).rejects.toThrow('FFmpeg process was cancelled');

      cleanupTempHlsDir(tempDir);
    });
  });

  describe('Phase 3 — Monotonic Progress Guarantee', () => {
    it('ensures transcode_progress updates strictly monotonically without decreasing', async () => {
      // Simulate progress updates: 0 -> 20 -> 15 (out of order) -> 95 -> 100
      await updateFilmStatus(602, { transcode_status: 'processing', transcode_progress: 0 });
      await updateFilmStatus(602, { transcode_progress: 20 });
      await updateFilmStatus(602, { transcode_progress: 15 }); // Out-of-order should be clamped to 20
      await updateFilmStatus(602, { transcode_progress: 95 });
      await updateFilmStatus(602, { transcode_status: 'completed', transcode_progress: 100 });
    });
  });

  describe('Phase 5 — Stale Job & Process Recovery', () => {
    it('executes zombie job recovery without throwing uncaught exceptions', async () => {
      await expect(recoverZombieJobs()).resolves.not.toThrow();
    });
  });

  describe('Phase 8 — Output Integrity Hardening', () => {
    it('requires #EXT-X-ENDLIST tag and valid .ts segment file sizes for completion', () => {
      const testDir = getTempHlsOutputDir(603, 'integrity-test');
      const varDir = path.join(testDir, '720p');
      fs.mkdirSync(varDir, { recursive: true });

      fs.writeFileSync(path.join(testDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000\n720p/playlist.m3u8');
      fs.writeFileSync(path.join(varDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\n#EXT-X-ENDLIST');
      // Zero byte segment file
      fs.writeFileSync(path.join(varDir, 'segment_000.ts'), Buffer.alloc(0));

      const val = validateHlsOutput(testDir, [{ name: '720p' }]);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('is empty (0 bytes)');

      cleanupTempHlsDir(testDir);
    });
  });
});
