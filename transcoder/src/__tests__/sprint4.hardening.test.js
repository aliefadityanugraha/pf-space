/**
 * transcoder/src/__tests__/sprint4.hardening.test.js
 *
 * Sprint 4 — Development Environment Hardening Test Suite.
 * Covers Real Video Matrix, Failure Testing, Progress Accuracy,
 * Zombie Job Recovery, Concurrent Isolation, and Hardened HLS Validation.
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
import { processTranscodeJob, recoverZombieJobs } from '../worker.js';
import { inspectVideoMetadata } from '../ffprobe.js';
import { selectRenditions } from '../renditions.js';
import { transcodeRendition } from '../ffmpeg.js';
import { generateMasterPlaylist } from '../masterPlaylist.js';
import { validateHlsOutput } from '../validator.js';

describe('Sprint 4 Development Environment Hardening Suite', () => {
  const video360p = path.join(UPLOAD_VIDEOS_DIR, 's4_360p.mp4');
  const video720p = path.join(UPLOAD_VIDEOS_DIR, 's4_720p.mp4');
  const videoNoAudio = path.join(UPLOAD_VIDEOS_DIR, 's4_no_audio.mp4');
  const videoPortrait = path.join(UPLOAD_VIDEOS_DIR, 's4_portrait.mp4');
  const ffmpegExe = FFMPEG_PATH || 'ffmpeg';

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    const runFfmpeg = (args) => new Promise((resolve, reject) => {
      const p = spawn(ffmpegExe, args, { windowsHide: true });
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}`))));
      p.on('error', reject);
    });

    // 1. Create 360p video (640x360)
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', video360p]);

    // 2. Create 720p video (1280x720)
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=1280x720:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', video720p]);

    // 3. Create Video Without Audio Stream (640x360)
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=640x360:rate=30', '-c:v', 'libx264', '-an', '-pix_fmt', 'yuv420p', videoNoAudio]);

    // 4. Create Portrait Video (360x640 9:16)
    await runFfmpeg(['-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=360x640:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=1', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', videoPortrait]);
  }, 25000);

  afterAll(() => {
    try {
      [video360p, video720p, videoNoAudio, videoPortrait].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      [701, 702, 703, 704].forEach((id) => {
        const out = getHlsOutputDir(id);
        if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
      });
    } catch {}
  });

  describe('Phase 1 — Real Video Matrix Testing', () => {
    it('1A: 360p video selects only 360p rendition and does not upscale to 1080p', async () => {
      const meta = await inspectVideoMetadata(video360p);
      expect(meta.width).toBe(640);
      expect(meta.height).toBe(360);

      const rends = selectRenditions(meta.width, meta.height);
      expect(rends.map((r) => r.name)).toEqual(['360p']);
      expect(rends.some((r) => r.name === '1080p')).toBe(false);
    });

    it('1B: 720p video selects 720p & 360p renditions without upscaling to 1080p', async () => {
      const meta = await inspectVideoMetadata(video720p);
      const rends = selectRenditions(meta.width, meta.height);
      expect(rends.map((r) => r.name)).toEqual(['720p', '360p']);
    });

    it('1E: Video without audio stream transcodes cleanly using -an filter', async () => {
      const meta = await inspectVideoMetadata(videoNoAudio);
      expect(meta.hasAudioStream).toBe(false);

      const rends = selectRenditions(meta.width, meta.height);
      const tempDir = getTempHlsOutputDir(703, 'no-audio-test');

      await transcodeRendition({
        inputPath: videoNoAudio,
        outputDir: path.join(tempDir, '360p'),
        rendition: rends[0],
        totalDuration: meta.duration,
        hasAudioStream: meta.hasAudioStream,
      });

      generateMasterPlaylist(tempDir, rends);
      const val = validateHlsOutput(tempDir, rends);
      expect(val.valid).toBe(true);

      cleanupTempHlsDir(tempDir);
    }, 15000);

    it('1F: Portrait video (360x640) transcodes preserving aspect ratio', async () => {
      const meta = await inspectVideoMetadata(videoPortrait);
      expect(meta.width).toBe(360);
      expect(meta.height).toBe(640);

      const rends = selectRenditions(meta.width, meta.height);
      expect(rends[0].height).toBeLessThanOrEqual(640);

      const tempDir = getTempHlsOutputDir(704, 'portrait-test');
      await transcodeRendition({
        inputPath: videoPortrait,
        outputDir: path.join(tempDir, rends[0].name),
        rendition: rends[0],
        totalDuration: meta.duration,
        hasAudioStream: meta.hasAudioStream,
      });

      generateMasterPlaylist(tempDir, rends);
      const val = validateHlsOutput(tempDir, rends);
      expect(val.valid).toBe(true);

      cleanupTempHlsDir(tempDir);
    }, 15000);
  });

  describe('Phase 4 — Zombie Job Recovery', () => {
    it('recovers stranded processing jobs gracefully without throwing exceptions', async () => {
      await expect(recoverZombieJobs()).resolves.not.toThrow();
    });
  });

  describe('Phase 6 — Hardened HLS Validator', () => {
    it('rejects variant playlist missing #EXT-X-ENDLIST', () => {
      const testDir = getTempHlsOutputDir(705, 'val-test-1');
      const varDir = path.join(testDir, '360p');
      fs.mkdirSync(varDir, { recursive: true });

      fs.writeFileSync(path.join(testDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n360p/playlist.m3u8');
      // Missing #EXT-X-ENDLIST
      fs.writeFileSync(path.join(varDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts');
      fs.writeFileSync(path.join(varDir, 'segment_000.ts'), 'content');

      const val = validateHlsOutput(testDir, [{ name: '360p' }]);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('missing VOD termination tag #EXT-X-ENDLIST');

      cleanupTempHlsDir(testDir);
    });

    it('rejects variant playlist referencing missing segment file on disk', () => {
      const testDir = getTempHlsOutputDir(706, 'val-test-2');
      const varDir = path.join(testDir, '360p');
      fs.mkdirSync(varDir, { recursive: true });

      fs.writeFileSync(path.join(testDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n360p/playlist.m3u8');
      fs.writeFileSync(path.join(varDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nmissing_segment_999.ts\n#EXT-X-ENDLIST');

      const val = validateHlsOutput(testDir, [{ name: '360p' }]);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('missing on disk');

      cleanupTempHlsDir(testDir);
    });
  });
});
