/**
 * transcoder/src/runtime/checkRuntime.js
 *
 * Isolated cross-platform runtime health checker.
 * Verifies Node.js environment, system resources, Redis connectivity,
 * FFmpeg & FFprobe executables, filesystem access, and concurrency.
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import Redis from 'ioredis';
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  FFMPEG_PATH,
  FFPROBE_PATH,
  UPLOAD_DIR,
  HLS_OUTPUT_DIR,
  CONCURRENCY,
} from '../config.js';

/**
 * Execute a command with finite timeout using execFile with argument array
 * @param {string} file 
 * @param {string[]} args 
 * @param {number} timeoutMs 
 * @returns {Promise<{ success: boolean, stdout: string, error?: string }>}
 */
function runExecutable(file, args = [], timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      execFile(file, args, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
        if (err) {
          resolve({
            success: false,
            stdout: stdout ? stdout.toString() : '',
            error: err.message || stderr ? stderr.toString() : 'Executable returned failure',
          });
        } else {
          resolve({
            success: true,
            stdout: stdout ? stdout.toString() : (stderr ? stderr.toString() : ''),
          });
        }
      });
    } catch (e) {
      resolve({
        success: false,
        stdout: '',
        error: e.message,
      });
    }
  });
}

/**
 * Check Redis connectivity with finite timeout
 * @returns {Promise<{ ready: boolean, host: string, port: number, error?: string }>}
 */
async function checkRedis() {
  const result = {
    ready: false,
    host: REDIS_HOST,
    port: REDIS_PORT,
  };

  return new Promise((resolve) => {
    let client = null;
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (client) {
          try { client.disconnect(); } catch {}
        }
        resolve({ ...result, error: 'Redis connection timed out after 800ms' });
      }
    }, 800);

    try {
      client = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        connectTimeout: 600,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });

      client.on('connect', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try { client.disconnect(); } catch {}
          resolve({ ...result, ready: true });
        }
      });

      client.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try { client.disconnect(); } catch {}
          resolve({ ...result, error: err.message });
        }
      });
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ ...result, error: err.message });
      }
    }
  });
}

/**
 * Check FFmpeg executable and version string
 * @param {string|null} customPath 
 * @returns {Promise<{ ready: boolean, executable: string, version: string|null, error?: string }>}
 */
async function checkFFmpeg(customPath = FFMPEG_PATH) {
  const executable = customPath || 'ffmpeg';
  const res = await runExecutable(executable, ['-version']);

  if (!res.success) {
    return {
      ready: false,
      executable,
      version: null,
      error: res.error,
    };
  }

  // Extract first line of version info
  const firstLine = res.stdout.split('\n')[0] || 'ffmpeg version detected';
  return {
    ready: true,
    executable,
    version: firstLine.trim(),
  };
}

/**
 * Check FFprobe executable and version string
 * @param {string|null} customPath 
 * @returns {Promise<{ ready: boolean, executable: string, version: string|null, error?: string }>}
 */
async function checkFFprobe(customPath = FFPROBE_PATH) {
  const executable = customPath || 'ffprobe';
  const res = await runExecutable(executable, ['-version']);

  if (!res.success) {
    return {
      ready: false,
      executable,
      version: null,
      error: res.error,
    };
  }

  const firstLine = res.stdout.split('\n')[0] || 'ffprobe version detected';
  return {
    ready: true,
    executable,
    version: firstLine.trim(),
  };
}

/**
 * Check upload directory readability and HLS output directory writability
 * @returns {Promise<{ uploadDir: string, uploadDirReadable: boolean, hlsOutputDir: string, hlsOutputDirWritable: boolean, error?: string }>}
 */
async function checkFilesystem() {
  const uploadDir = path.resolve(UPLOAD_DIR);
  const hlsOutputDir = path.resolve(HLS_OUTPUT_DIR);

  let uploadDirReadable = false;
  let hlsOutputDirWritable = false;
  let errorMsg = null;

  // 1. Check Upload Directory Readability
  try {
    if (fs.existsSync(uploadDir)) {
      await fs.promises.access(uploadDir, fs.constants.R_OK);
      uploadDirReadable = true;
    }
  } catch (err) {
    errorMsg = `Upload dir not readable: ${err.message}`;
  }

  // 2. Check HLS Output Directory Writability
  try {
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }
    await fs.promises.access(hlsOutputDir, fs.constants.W_OK);
    hlsOutputDirWritable = true;
  } catch (err) {
    errorMsg = (errorMsg ? errorMsg + '; ' : '') + `HLS output dir not writable: ${err.message}`;
  }

  return {
    uploadDir,
    uploadDirReadable,
    hlsOutputDir,
    hlsOutputDirWritable,
    error: errorMsg || undefined,
  };
}

/**
 * Perform comprehensive cross-platform runtime health check
 * @returns {Promise<object>} Detailed runtime status report
 */
export async function checkRuntime() {
  const [redis, ffmpeg, ffprobe, filesystem] = await Promise.all([
    checkRedis(),
    checkFFmpeg(),
    checkFFprobe(),
    checkFilesystem(),
  ]);

  const blockers = [];
  if (!redis.ready) blockers.push(`Redis server unavailable: ${redis.error || 'Connection failed'}`);
  if (!ffmpeg.ready) blockers.push(`FFmpeg executable unavailable: ${ffmpeg.error || 'Executable not found'}`);
  if (!ffprobe.ready) blockers.push(`FFprobe executable unavailable: ${ffprobe.error || 'Executable not found'}`);
  if (!filesystem.uploadDirReadable) blockers.push(`Upload directory not readable: ${filesystem.uploadDir}`);
  if (!filesystem.hlsOutputDirWritable) blockers.push(`HLS output directory not writable: ${filesystem.hlsOutputDir}`);

  const isReady = blockers.length === 0;

  return {
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCount: os.cpus() ? os.cpus().length : 1,
      totalMemBytes: os.totalmem(),
      freeMemBytes: os.freemem(),
    },
    redis,
    ffmpeg,
    ffprobe,
    filesystem,
    concurrency: CONCURRENCY,
    blockers,
  };
}
