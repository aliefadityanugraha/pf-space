/**
 * transcoder/src/config.js
 *
 * Configuration loader for Transcoder Worker Service.
 * Supports cross-platform environment variables for Windows development and Linux production.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../../');
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(ROOT_DIR, 'backend/uploads');
export const UPLOAD_VIDEOS_DIR = path.resolve(UPLOAD_DIR, 'videos');
export const HLS_OUTPUT_DIR = path.resolve(UPLOAD_VIDEOS_DIR, 'hls');

export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let defaultFfmpegPath = null;
let defaultFfprobePath = null;

try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  defaultFfmpegPath = ffmpegInstaller?.path || ffmpegInstaller?.default?.path || null;
} catch {}

try {
  const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
  defaultFfprobePath = ffprobeInstaller?.path || ffprobeInstaller?.default?.path || null;
} catch {}

export const FFMPEG_PATH = process.env.FFMPEG_PATH || defaultFfmpegPath || 'ffmpeg';
export const FFPROBE_PATH = process.env.FFPROBE_PATH || defaultFfprobePath || 'ffprobe';

export const QUEUE_NAME = 'video-transcoding';
export const JOB_NAME = 'transcode-hls-job';
export const CONCURRENCY = parseInt(process.env.TRANSCODER_CONCURRENCY || '1', 10);

// FFmpeg Resource & Performance Config
export const FFMPEG_PRESET = process.env.FFMPEG_PRESET || 'fast';
export const FFMPEG_THREADS = process.env.FFMPEG_THREADS || '0';
export const FFMPEG_TIMEOUT_MS = parseInt(process.env.FFMPEG_TIMEOUT_MS || '600000', 10);
export const MIN_FREE_RAM_MB = parseInt(process.env.MIN_FREE_RAM_MB || '256', 10);
