/**
 * transcoder/src/recovery/hlsScanner.js
 *
 * Scans backend/uploads/videos/hls/ directory to audit HLS outputs,
 * detect orphan directories, missing playlists, 0-byte segments, and stale temporary directories.
 */

import fs from 'fs';
import path from 'path';
import { HLS_OUTPUT_DIR } from '../config.js';
import { validateHlsOutput } from '../validator.js';

/**
 * Scans the HLS output directory and generates a comprehensive filesystem audit report
 * @param {Array<number|string>} [existingFilmIds=[]] - List of valid film IDs in DB for orphan detection
 * @returns {object} Audit report
 */
export function scanHlsFilesystem(existingFilmIds = []) {
  const hlsDir = path.resolve(HLS_OUTPUT_DIR);
  const report = {
    totalEntries: 0,
    filmDirectories: [],
    tempDirectories: [],
    orphanDirectories: [],
    healthyCount: 0,
    invalidCount: 0,
    staleTempCount: 0,
  };

  if (!fs.existsSync(hlsDir)) {
    return report;
  }

  const validIdSet = new Set(existingFilmIds.map((id) => String(id)));
  const entries = fs.readdirSync(hlsDir, { withFileTypes: true });
  const now = Date.now();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    report.totalEntries++;
    const fullPath = path.join(hlsDir, entry.name);

    if (entry.name.startsWith('.tmp-')) {
      let ageMs = 0;
      try {
        const stat = fs.statSync(fullPath);
        ageMs = now - stat.mtimeMs;
      } catch {}

      const isStale = ageMs >= 3600000; // > 1 hour
      if (isStale) report.staleTempCount++;

      report.tempDirectories.push({
        name: entry.name,
        fullPath,
        ageMs,
        isStale,
      });
      continue;
    }

    // Check if directory name is numeric (filmId)
    const isNumeric = /^\d+$/.test(entry.name);
    const isOrphan = isNumeric && validIdSet.size > 0 && !validIdSet.has(entry.name);

    const valResult = validateHlsOutput(fullPath, [
      { name: '1080p' },
      { name: '720p' },
      { name: '360p' },
    ]);

    const dirAudit = {
      filmId: isNumeric ? parseInt(entry.name, 10) : entry.name,
      fullPath,
      isOrphan,
      isValid: valResult.valid,
      error: valResult.error || null,
    };

    if (dirAudit.isValid) {
      report.healthyCount++;
    } else {
      report.invalidCount++;
    }

    if (isOrphan) {
      report.orphanDirectories.push(dirAudit);
    } else {
      report.filmDirectories.push(dirAudit);
    }
  }

  return report;
}
