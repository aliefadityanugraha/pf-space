/**
 * transcoder/src/__tests__/integration.hls.test.js
 *
 * Real Media Integration Test for FFprobe metadata inspection, FFmpeg HLS transcoding,
 * master playlist generation, output validation, and atomic directory promotion.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { UPLOAD_VIDEOS_DIR, FFMPEG_PATH } from '../config.js';
import { inspectVideoMetadata } from '../ffprobe.js';
import { selectRenditions } from '../renditions.js';
import { transcodeRendition } from '../ffmpeg.js';
import { generateMasterPlaylist } from '../masterPlaylist.js';
import { validateHlsOutput } from '../validator.js';
import { getTempHlsOutputDir, getHlsOutputDir, promoteTempToFinalHlsDir, cleanupTempHlsDir } from '../paths.js';

describe('Real Media HLS Transcoding Pipeline Integration', () => {
  const sampleVideoPath = path.join(UPLOAD_VIDEOS_DIR, 'integration_sample_720p.mp4');
  const filmId = 999;
  const jobId = 'test-job-999';
  const tempDir = getTempHlsOutputDir(filmId, jobId);
  const finalDir = getHlsOutputDir(filmId);

  beforeAll(async () => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) {
      fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    }

    // Generate real 3-second 720p test video fixture using installed FFmpeg
    const ffmpegExe = FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=3:size=1280x720:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=3',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      sampleVideoPath,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegExe, args, { windowsHide: true });
      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(sampleVideoPath)) {
          resolve();
        } else {
          reject(new Error(`Failed to generate sample video fixture with FFmpeg (code ${code})`));
        }
      });
      proc.on('error', reject);
    });
  }, 15000);

  afterAll(() => {
    try {
      if (fs.existsSync(sampleVideoPath)) fs.unlinkSync(sampleVideoPath);
      cleanupTempHlsDir(tempDir);
      if (fs.existsSync(finalDir)) fs.rmSync(finalDir, { recursive: true, force: true });
    } catch {}
  });

  it('inspects real video metadata via FFprobe', async () => {
    const meta = await inspectVideoMetadata(sampleVideoPath);
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(720);
    expect(meta.duration).toBeGreaterThan(2);
    expect(meta.hasVideoStream).toBe(true);
    expect(meta.hasAudioStream).toBe(true);
  });

  it('selects 720p and 360p renditions without upscaling', async () => {
    const meta = await inspectVideoMetadata(sampleVideoPath);
    const renditions = selectRenditions(meta.width, meta.height);
    expect(renditions.map((r) => r.name)).toEqual(['720p', '360p']);
  });

  it('executes real FFmpeg HLS transcoding, validates output, and promotes directory', async () => {
    const meta = await inspectVideoMetadata(sampleVideoPath);
    const renditions = selectRenditions(meta.width, meta.height);

    let reportedProgress = 0;

    // Transcode renditions to temp dir
    for (const r of renditions) {
      const rDir = path.join(tempDir, r.name);
      await transcodeRendition({
        inputPath: sampleVideoPath,
        outputDir: rDir,
        rendition: r,
        totalDuration: meta.duration,
        onProgress: (p) => {
          reportedProgress = p;
        },
      });
    }

    // Generate Master Playlist
    generateMasterPlaylist(tempDir, renditions);

    // Validate HLS Output
    const val = validateHlsOutput(tempDir, renditions);
    expect(val.valid).toBe(true);

    // Atomic Directory Promotion
    promoteTempToFinalHlsDir(tempDir, finalDir);
    expect(fs.existsSync(path.join(finalDir, 'master.m3u8'))).toBe(true);
    expect(fs.existsSync(path.join(finalDir, '720p', 'playlist.m3u8'))).toBe(true);
    expect(fs.existsSync(path.join(finalDir, '360p', 'playlist.m3u8'))).toBe(true);

    // Verify .ts segments exist in 720p variant
    const tsFiles = fs.readdirSync(path.join(finalDir, '720p')).filter((f) => f.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  }, 30000);
});
