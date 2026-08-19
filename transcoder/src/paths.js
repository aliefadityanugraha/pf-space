/**
 * transcoder/src/paths.js
 *
 * Path validation, resolution, atomic directory management, and stale cleanup
 * for Transcoder Worker. Safe across Windows and Linux environments.
 */

import path from 'path';
import fs from 'fs';
import { UPLOAD_VIDEOS_DIR, HLS_OUTPUT_DIR } from './config.js';

/**
 * Resolves and validates a video source path safely inside UPLOAD_VIDEOS_DIR.
 *
 * @param {string} rawSourcePath - Relative or absolute path sent in job payload
 * @returns {{ valid: boolean, absolutePath?: string, error?: string }}
 */
export function resolveAndValidateSourcePath(rawSourcePath) {
  if (!rawSourcePath || typeof rawSourcePath !== 'string') {
    return { valid: false, error: 'Source path must be a non-empty string' };
  }

  // Normalize path string
  const cleanedPath = rawSourcePath.trim().replace(/^[\/\\]+/, '');
  const basename = path.basename(cleanedPath);

  // Probe candidates:
  // 1. Direct path relative to backend root or uploads
  // 2. Direct path relative to UPLOAD_VIDEOS_DIR
  const candidates = [
    path.resolve(UPLOAD_VIDEOS_DIR, basename),
    path.resolve(UPLOAD_VIDEOS_DIR, cleanedPath.replace(/^uploads\/videos\//i, '').replace(/^videos\//i, '')),
  ];

  let resolvedPath = null;
  for (const cand of candidates) {
    // Security check: Must reside within UPLOAD_VIDEOS_DIR
    const resolvedVideosDir = path.resolve(UPLOAD_VIDEOS_DIR);
    if (cand.startsWith(resolvedVideosDir)) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        resolvedPath = cand;
        break;
      }
    }
  }

  if (!resolvedPath) {
    return { valid: false, error: `Source file not found or invalid: ${rawSourcePath}` };
  }

  return { valid: true, absolutePath: resolvedPath };
}

/**
 * Generates the target final HLS directory path for a film ID
 *
 * @param {number} filmId
 * @returns {string} Absolute path to target HLS output directory
 */
export function getHlsOutputDir(filmId) {
  const safeId = String(filmId).replace(/[^0-9]/g, '');
  return path.resolve(UPLOAD_VIDEOS_DIR, 'hls', safeId);
}

/**
 * Generates a temporary HLS output directory path for an in-progress transcoding job
 *
 * @param {number} filmId
 * @param {string|number} jobId
 * @returns {string} Absolute path to temporary output directory
 */
export function getTempHlsOutputDir(filmId, jobId) {
  const safeFilmId = String(filmId).replace(/[^0-9]/g, '');
  const safeJobId = String(jobId || 'job').replace(/[^a-zA-Z0-9_-]/g, '');
  return path.resolve(UPLOAD_VIDEOS_DIR, 'hls', `.tmp-${safeFilmId}-${safeJobId}`);
}

/**
 * Safely removes a temporary directory if it exists
 *
 * @param {string} tempDir - Absolute path to temporary directory
 */
export function cleanupTempHlsDir(tempDir) {
  if (!tempDir || !tempDir.includes('.tmp-')) return;
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[Paths] Warning: Failed to cleanup temp dir '${tempDir}':`, err.message);
  }
}

/**
 * Scans HLS output directory and cleans up stale .tmp-* directories older than maxAgeMs.
 *
 * @param {number} [maxAgeMs=3600000] - Age threshold in ms (Default: 1 hour)
 * @returns {number} Number of cleaned directories
 */
export function cleanStaleTempDirectories(maxAgeMs = 3600000) {
  const hlsDir = path.resolve(HLS_OUTPUT_DIR);
  if (!fs.existsSync(hlsDir)) return 0;

  let count = 0;
  const now = Date.now();

  try {
    const entries = fs.readdirSync(hlsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('.tmp-')) {
        const fullPath = path.join(hlsDir, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          const ageMs = now - stat.mtimeMs;
          if (ageMs >= maxAgeMs) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            count++;
            console.log(`[Paths] Cleaned stale temporary directory: ${entry.name} (Age: ${(ageMs / 60000).toFixed(1)} mins)`);
          }
        } catch (e) {
          console.warn(`[Paths] Could not inspect/remove stale temp dir '${entry.name}':`, e.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[Paths] Error scanning stale temp directories:`, err.message);
  }

  return count;
}

/**
 * Atomically promotes a temporary output directory to the final HLS output directory.
 * Includes backup & fallback protection for Windows file locking and cross-device moves.
 *
 * @param {string} tempDir - Absolute path to temporary directory
 * @param {string} finalDir - Absolute path to final output directory
 */
export function promoteTempToFinalHlsDir(tempDir, finalDir) {
  if (!tempDir || !finalDir) throw new Error('Invalid arguments for directory promotion');

  const parentDir = path.dirname(finalDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const backupDir = `${finalDir}.bak-${Date.now()}`;
  let backupCreated = false;

  try {
    // 1. If final directory exists, backup first to preserve old output if swap fails
    if (fs.existsSync(finalDir)) {
      try {
        fs.renameSync(finalDir, backupDir);
        backupCreated = true;
      } catch (backupErr) {
        // Fallback: Copy if rename fails (e.g. cross-device)
        fs.cpSync(finalDir, backupDir, { recursive: true });
        fs.rmSync(finalDir, { recursive: true, force: true });
        backupCreated = true;
      }
    }

    // 2. Move tempDir to finalDir
    try {
      fs.renameSync(tempDir, finalDir);
    } catch (renameErr) {
      // Fallback for Windows file lock / cross-device link
      fs.cpSync(tempDir, finalDir, { recursive: true });
      cleanupTempHlsDir(tempDir);
    }

    // 3. Promotion succeeded — remove backup
    if (backupCreated && fs.existsSync(backupDir)) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore backup cleanup warning
      }
    }
  } catch (err) {
    // Rollback: Restore backup if promotion failed
    if (backupCreated && fs.existsSync(backupDir) && !fs.existsSync(finalDir)) {
      try {
        fs.renameSync(backupDir, finalDir);
      } catch (e) {}
    }
    throw new Error(`Directory promotion failed for '${tempDir}' -> '${finalDir}': ${err.message}`);
  }
}
