/**
 * transcoder/src/validator.js
 *
 * Hardened HLS Output Validator.
 * Validates master playlist integrity, variant playlist syntax, segment reference accuracy,
 * and segment file size sufficiency before allowing completed status promotion.
 */

import fs from 'fs';
import path from 'path';

/**
 * Validates HLS output directory before marking job as completed
 *
 * @param {string} hlsDir - Target HLS output directory
 * @param {Array<object>} renditions - Expected renditions
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateHlsOutput(hlsDir, renditions) {
  if (!hlsDir || !fs.existsSync(hlsDir)) {
    return { valid: false, error: `HLS output directory does not exist: ${hlsDir}` };
  }

  const masterPath = path.join(hlsDir, 'master.m3u8');
  if (!fs.existsSync(masterPath)) {
    return { valid: false, error: `master.m3u8 does not exist at: ${masterPath}` };
  }

  try {
    const masterContent = fs.readFileSync(masterPath, 'utf-8');
    if (!masterContent.includes('#EXTM3U') || !masterContent.includes('#EXT-X-STREAM-INF')) {
      return { valid: false, error: `master.m3u8 content is invalid or missing headers` };
    }
  } catch (err) {
    return { valid: false, error: `Failed to read master.m3u8: ${err.message}` };
  }

  if (!Array.isArray(renditions) || renditions.length === 0) {
    return { valid: false, error: `No renditions specified for validation` };
  }

  for (const r of renditions) {
    const variantDir = path.join(hlsDir, r.name);
    const playlistPath = path.join(variantDir, 'playlist.m3u8');

    if (!fs.existsSync(variantDir) || !fs.statSync(variantDir).isDirectory()) {
      return { valid: false, error: `Variant directory missing for rendition '${r.name}' at: ${variantDir}` };
    }

    if (!fs.existsSync(playlistPath)) {
      return { valid: false, error: `Variant playlist missing for rendition '${r.name}' at: ${playlistPath}` };
    }

    let playlistContent = '';
    try {
      playlistContent = fs.readFileSync(playlistPath, 'utf-8');
      if (!playlistContent.includes('#EXTM3U') || !playlistContent.includes('#EXTINF')) {
        return { valid: false, error: `Variant playlist '${r.name}' content is invalid or missing segments` };
      }
      if (!playlistContent.includes('#EXT-X-ENDLIST')) {
        return { valid: false, error: `Variant playlist '${r.name}' is missing VOD termination tag #EXT-X-ENDLIST` };
      }
    } catch (err) {
      return { valid: false, error: `Failed to read variant playlist '${r.name}': ${err.message}` };
    }

    // Extract segment filenames from variant playlist
    const lines = playlistContent.split(/\r?\n/);
    const segmentFilenames = lines
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.endsWith('.ts'));

    if (segmentFilenames.length === 0) {
      return { valid: false, error: `Variant playlist '${r.name}' references no .ts segment files` };
    }

    // Verify each referenced .ts segment exists on disk and has size > 0
    for (const segFile of segmentFilenames) {
      const segPath = path.join(variantDir, segFile);
      if (!fs.existsSync(segPath)) {
        return { valid: false, error: `Referenced HLS segment file missing on disk: '${segPath}'` };
      }
      const stat = fs.statSync(segPath);
      if (stat.size <= 0) {
        return { valid: false, error: `Referenced HLS segment file is empty (0 bytes): '${segPath}'` };
      }
    }
  }

  return { valid: true };
}
