/**
 * transcoder/src/ffprobe.js
 *
 * Video metadata inspection module using FFprobe via child_process.execFile.
 * Safe against command injection (uses argument array, no shell execution).
 */

import { execFile } from 'child_process';
import { FFPROBE_PATH } from './config.js';

/**
 * Inspects a video file and returns structured video/audio metadata
 *
 * @param {string} inputPath - Absolute filesystem path to source video file
 * @returns {Promise<{
 *   width: number,
 *   height: number,
 *   duration: number,
 *   videoCodec: string,
 *   audioCodec: string|null,
 *   bitrate: number|null,
 *   hasVideoStream: boolean,
 *   hasAudioStream: boolean
 * }>}
 */
export function inspectVideoMetadata(inputPath) {
  const executable = FFPROBE_PATH || 'ffprobe';
  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration,bit_rate',
    '-show_streams',
    '-of', 'json',
    inputPath,
  ];

  return new Promise((resolve, reject) => {
    execFile(executable, args, { windowsHide: true, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`FFprobe inspection failed for '${inputPath}': ${err.message || stderr}`));
      }

      try {
        const data = JSON.parse(stdout || '{}');
        const streams = data.streams || [];
        const format = data.format || {};

        const videoStream = streams.find((s) => s.codec_type === 'video');
        const audioStream = streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error(`Invalid media file '${inputPath}': No video stream found`));
        }

        const width = parseInt(videoStream.width || '0', 10);
        const height = parseInt(videoStream.height || '0', 10);
        const duration = parseFloat(format.duration || videoStream.duration || '0');
        const bitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : (videoStream.bit_rate ? parseInt(videoStream.bit_rate, 10) : null);

        if (!width || !height || width <= 0 || height <= 0) {
          return reject(new Error(`Invalid video dimensions (${width}x${height}) for '${inputPath}'`));
        }

        resolve({
          width,
          height,
          duration,
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream ? (audioStream.codec_name || 'unknown') : null,
          bitrate,
          hasVideoStream: true,
          hasAudioStream: Boolean(audioStream),
        });
      } catch (parseErr) {
        reject(new Error(`Failed to parse FFprobe JSON output for '${inputPath}': ${parseErr.message}`));
      }
    });
  });
}
