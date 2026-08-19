/**
 * transcoder/src/ffmpeg.js
 *
 * Real FFmpeg HLS Transcoding Engine with Process Registry & Cancellation.
 * Executes FFmpeg using child_process.spawn with argument array.
 * Tracks PID, handles process timeouts, cancellation signals, and exit code validation.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { FFMPEG_PATH, FFMPEG_PRESET, FFMPEG_THREADS, FFMPEG_TIMEOUT_MS } from './config.js';

// Map of active FFmpeg child processes keyed by filmId
const activeFfmpegProcesses = new Map();

/**
 * Cancels a running FFmpeg process for a specific filmId
 * @param {number|string} filmId 
 * @returns {boolean} True if process was found and killed
 */
export function cancelFfmpegProcess(filmId) {
  const key = String(filmId);
  const ffProc = activeFfmpegProcesses.get(key);
  if (ffProc) {
    console.log(`[FFmpeg] Cancelling running FFmpeg process for filmId=${filmId} (PID: ${ffProc.pid})...`);
    try {
      ffProc.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (activeFfmpegProcesses.has(key)) {
            ffProc.kill('SIGKILL');
          }
        } catch {}
      }, 2000);
    } catch (e) {
      console.warn(`[FFmpeg] Error killing process for filmId=${filmId}:`, e.message);
    }
    activeFfmpegProcesses.delete(key);
    return true;
  }
  return false;
}

/**
 * Cancels all active FFmpeg child processes (used on worker shutdown / recovery)
 */
export function cancelAllFfmpegProcesses() {
  console.log(`[FFmpeg] Terminating all active FFmpeg processes (${activeFfmpegProcesses.size} active)...`);
  for (const [filmId, ffProc] of activeFfmpegProcesses.entries()) {
    try {
      ffProc.kill('SIGKILL');
    } catch {}
  }
  activeFfmpegProcesses.clear();
}

/**
 * Converts HH:MM:SS.ss time string to total seconds
 * @param {string} timeStr 
 * @returns {number}
 */
export function parseFfmpegTimeSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 3) return 0;
  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Transcodes a single rendition to HLS format
 *
 * @param {object} params
 * @param {number|string} [params.filmId] - Optional film ID for process cancellation tracking
 * @param {string} params.inputPath - Absolute filesystem path to input video
 * @param {string} params.outputDir - Target directory for this rendition (e.g. tempDir/1080p)
 * @param {object} params.rendition - Rendition config ({ name, width, height, videoBitrate, maxRate, bufSize, audioBitrate })
 * @param {number} params.totalDuration - Video duration in seconds for progress calculation
 * @param {boolean} [params.hasAudioStream=true] - Whether input video contains an audio stream
 * @param {number} [params.timeoutMs=600000] - Process timeout in ms (default: 10 minutes)
 * @param {function(number):void} [params.onProgress] - Callback receiving progress percentage (0..99)
 * @returns {Promise<void>}
 */
export function transcodeRendition({
  filmId,
  inputPath,
  outputDir,
  rendition,
  totalDuration,
  hasAudioStream = true,
  timeoutMs = FFMPEG_TIMEOUT_MS,
  onProgress,
}) {
  const executable = FFMPEG_PATH || 'ffmpeg';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const playlistPath = path.join(outputDir, 'playlist.m3u8');
  const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

  // Build audio encoding args conditionally based on stream presence
  const audioArgs = hasAudioStream !== false
    ? ['-c:a', 'aac', '-b:a', rendition.audioBitrate || '128k', '-ac', '2']
    : ['-an'];

  // FFmpeg argument array (No shell concatenation)
  const args = [
    '-y',
    '-i', inputPath,
    '-threads', FFMPEG_THREADS,
    '-vf', `scale=${rendition.width}:${rendition.height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
    '-c:v', 'libx264',
    '-preset', FFMPEG_PRESET,
    '-crf', '23',
    '-b:v', rendition.videoBitrate,
    '-maxrate', rendition.maxRate || rendition.videoBitrate,
    '-bufsize', rendition.bufSize || '5000k',
    '-pix_fmt', 'yuv420p',
    ...audioArgs,
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', segmentPattern,
    playlistPath,
  ];

  return new Promise((resolve, reject) => {
    const ffProc = spawn(executable, args, { windowsHide: true });
    const processKey = filmId ? String(filmId) : null;

    if (processKey) {
      activeFfmpegProcesses.set(processKey, ffProc);
    }

    let stderrLog = '';
    let lastProgressTime = 0;
    let lastPercent = -1;
    let isCancelled = false;

    // Timeout safety handler
    const timer = setTimeout(() => {
      isCancelled = true;
      console.error(`[FFmpeg] Process timed out after ${timeoutMs}ms (filmId=${filmId}, PID=${ffProc.pid})`);
      try { ffProc.kill('SIGKILL'); } catch {}
      if (processKey) activeFfmpegProcesses.delete(processKey);
      reject(new Error(`FFmpeg process timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    ffProc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrLog += text;

      // Extract time=HH:MM:SS.ss from FFmpeg stderr
      const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
      if (timeMatch && totalDuration > 0 && typeof onProgress === 'function') {
        const currentSeconds = parseFfmpegTimeSeconds(timeMatch[1]);
        const percent = Math.min(99, Math.max(0, Math.floor((currentSeconds / totalDuration) * 100)));

        const now = Date.now();
        if (percent !== lastPercent && now - lastProgressTime > 500) {
          lastPercent = percent;
          lastProgressTime = now;
          onProgress(percent);
        }
      }
    });

    ffProc.on('error', (err) => {
      clearTimeout(timer);
      if (processKey) activeFfmpegProcesses.delete(processKey);
      reject(new Error(`FFmpeg process failed to spawn: ${err.message}`));
    });

    ffProc.on('close', (code, signal) => {
      clearTimeout(timer);
      if (processKey) activeFfmpegProcesses.delete(processKey);

      if (isCancelled || signal === 'SIGTERM' || signal === 'SIGKILL') {
        return reject(new Error(`FFmpeg process was cancelled (signal: ${signal || 'SIGKILL'})`));
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}: ${stderrLog.slice(-500)}`));
      }
    });
  });
}
