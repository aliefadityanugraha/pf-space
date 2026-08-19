/**
 * transcoder/src/recovery/retentionPolicy.js
 *
 * Safe HLS Retention Policy Module.
 * Audits HLS output filesystem and identifies files eligible for cleanup safely.
 * Source MP4 files are ALWAYS PROTECTED and NEVER ELIGIBLE FOR DELETION.
 */

import fs from 'fs';
import path from 'path';
import { HLS_OUTPUT_DIR, UPLOAD_VIDEOS_DIR } from '../config.js';

/**
 * Audits filesystem entries against retention policies
 * @returns {object} Retention policy report
 */
export function evaluateRetentionPolicy() {
  const hlsDir = path.resolve(HLS_OUTPUT_DIR);
  const report = {
    eligibleForCleanup: [],
    protectedHls: [],
    protectedSourceMp4s: [],
  };

  // 1. Audit Source MP4s (ALWAYS PROTECTED)
  const videosDir = path.resolve(UPLOAD_VIDEOS_DIR);
  if (fs.existsSync(videosDir)) {
    const videoEntries = fs.readdirSync(videosDir);
    for (const v of videoEntries) {
      if (v.endsWith('.mp4') || v.endsWith('.mov') || v.endsWith('.mkv')) {
        report.protectedSourceMp4s.push(path.join(videosDir, v));
      }
    }
  }

  // 2. Audit HLS Output Directories
  if (!fs.existsSync(hlsDir)) {
    return report;
  }

  const entries = fs.readdirSync(hlsDir, { withFileTypes: true });
  const now = Date.now();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(hlsDir, entry.name);

    if (entry.name.startsWith('.tmp-')) {
      let ageMs = 0;
      try {
        const stat = fs.statSync(fullPath);
        ageMs = now - stat.mtimeMs;
      } catch {}

      if (ageMs >= 3600000) { // Older than 1 hour
        report.eligibleForCleanup.push({
          type: 'stale_temp_dir',
          name: entry.name,
          fullPath,
          ageMs,
          reason: 'Stale temporary output directory older than 1 hour',
        });
      } else {
        report.protectedHls.push({
          type: 'active_temp_dir',
          name: entry.name,
          fullPath,
          reason: 'Active temporary directory under 1 hour old',
        });
      }
    } else {
      report.protectedHls.push({
        type: 'current_hls_output',
        name: entry.name,
        fullPath,
        reason: 'Current active film HLS output directory',
      });
    }
  }

  return report;
}
