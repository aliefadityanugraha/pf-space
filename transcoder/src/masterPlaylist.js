/**
 * transcoder/src/masterPlaylist.js
 *
 * Generates and writes HLS master playlist (master.m3u8) referencing generated variant playlists.
 */

import fs from 'fs';
import path from 'path';

/**
 * Generates and writes master.m3u8 to target directory based on completed renditions
 *
 * @param {string} targetDir - Directory where master.m3u8 will be created
 * @param {Array<object>} renditions - List of renditions generated
 * @returns {string} Absolute path to master.m3u8
 */
export function generateMasterPlaylist(targetDir, renditions) {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

  for (const r of renditions) {
    const resString = `${r.width}x${r.height}`;
    const bw = r.bandwidth || 1000000;
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${resString}\n`;
    content += `${r.name}/playlist.m3u8\n\n`;
  }

  const masterPath = path.join(targetDir, 'master.m3u8');
  fs.writeFileSync(masterPath, content.trim() + '\n', 'utf-8');
  return masterPath;
}
