/**
 * transcoder/src/__tests__/sprint8.e2e.test.js
 *
 * Sprint 8 — Development Transcoding Observability & E2E Control Suite.
 * Covers full E2E happy-path, Corrupt File Failure & Recovery, and Cancel -> Retry -> Complete Lifecycle.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';
import {
  getHlsOutputDir,
  getTempHlsOutputDir,
  cleanupTempHlsDir,
} from '../paths.js';
import { processTranscodeJob } from '../worker.js';
import { cancelFfmpegProcess, transcodeRendition } from '../ffmpeg.js';
import { validateHlsOutput } from '../validator.js';

describe('Sprint 8 E2E Transcoding Observability & Control', () => {
  const e2eVideo = path.join(UPLOAD_VIDEOS_DIR, 'sprint8_e2e.mp4');
  const corruptVideo = path.join(UPLOAD_VIDEOS_DIR, 'sprint8_corrupt.mp4');
  const filmId = 801;

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    // 1. Generate real 2-second test video
    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=2:size=640x360:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=2',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      e2eVideo,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegExe, args, { windowsHide: true });
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`))));
      proc.on('error', reject);
    });

    // 2. Create corrupt video file
    fs.writeFileSync(corruptVideo, Buffer.from('CORRUPT_HEADER_NOT_A_REAL_VIDEO'));
  }, 20000);

  afterAll(() => {
    try {
      [e2eVideo, corruptVideo].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      [801, 802, 803].forEach((id) => {
        const out = getHlsOutputDir(id);
        if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
      });
    } catch {}
  });

  describe('Scenario 1 — Full E2E Happy Path', () => {
    it('processes video payload from enqueue to completed HLS output', async () => {
      const jobPayload = {
        id: 'sprint8-happy-path',
        data: {
          filmId: 801,
          sourcePath: e2eVideo,
        },
      };

      const result = await processTranscodeJob(jobPayload);
      expect(result.status).toBe('completed');
      expect(result.hlsManifestUrl).toBe('/uploads/videos/hls/801/master.m3u8');

      // Verify filesystem promotion
      const finalDir = getHlsOutputDir(801);
      const masterPath = path.join(finalDir, 'master.m3u8');
      expect(fs.existsSync(masterPath)).toBe(true);

      const val = validateHlsOutput(finalDir, [{ name: '360p' }]);
      expect(val.valid).toBe(true);
    }, 20000);
  });

  describe('Scenario 2 — Corrupt File Failure & Source Preservation', () => {
    it('fails fast on corrupt MP4, cleans temp directory, and preserves source MP4 intact', async () => {
      const jobPayload = {
        id: 'sprint8-corrupt-path',
        data: {
          filmId: 802,
          sourcePath: corruptVideo,
        },
      };

      await expect(processTranscodeJob(jobPayload)).rejects.toThrow();

      // Source file must be preserved intact
      expect(fs.existsSync(corruptVideo)).toBe(true);

      // Temp directory must be cleaned up
      const tempDir = getTempHlsOutputDir(802, 'sprint8-corrupt-path');
      expect(fs.existsSync(tempDir)).toBe(false);
    });
  });

  describe('Scenario 3 — Cancel -> Retry -> Complete Lifecycle', () => {
    it('handles cancellation signal cleanly, releases resources, and allows successful retry', async () => {
      const tempDir = getTempHlsOutputDir(803, 'cancel-retry-job');

      // 1. Start encoding
      const p = transcodeRendition({
        filmId: 803,
        inputPath: e2eVideo,
        outputDir: path.join(tempDir, '360p'),
        rendition: { name: '360p', width: 640, height: 360, videoBitrate: '800k' },
        totalDuration: 2.0,
      });

      await new Promise((r) => setTimeout(r, 50));

      // 2. Trigger Cancel
      const cancelled = cancelFfmpegProcess(803);
      expect(cancelled).toBe(true);
      await expect(p).rejects.toThrow('cancelled');

      cleanupTempHlsDir(tempDir);

      // 3. Retry completes successfully
      const retryResult = await processTranscodeJob({
        id: 'sprint8-retry-job',
        data: { filmId: 803, sourcePath: e2eVideo },
      });

      expect(retryResult.status).toBe('completed');
    }, 25000);
  });
});
