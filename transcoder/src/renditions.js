/**
 * transcoder/src/renditions.js
 *
 * Adaptive HLS Rendition Selection Strategy.
 * Determines target quality levels (1080p, 720p, 360p) based on source resolution
 * to prevent unnecessary upscaling while preserving aspect ratio.
 */

export const RENDITIONS = {
  '1080p': {
    name: '1080p',
    width: 1920,
    height: 1080,
    videoBitrate: '4500k',
    maxRate: '4950k',
    bufSize: '9000k',
    audioBitrate: '128k',
    bandwidth: 5000000,
  },
  '720p': {
    name: '720p',
    width: 1280,
    height: 720,
    videoBitrate: '2500k',
    maxRate: '2750k',
    bufSize: '5000k',
    audioBitrate: '128k',
    bandwidth: 2800000,
  },
  '360p': {
    name: '360p',
    width: 640,
    height: 360,
    videoBitrate: '800k',
    maxRate: '880k',
    bufSize: '1600k',
    audioBitrate: '96k',
    bandwidth: 900000,
  },
};

/**
 * Selects appropriate HLS renditions based on source dimensions
 *
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @returns {Array<object>} Selected renditions
 */
export function selectRenditions(sourceWidth, sourceHeight) {
  const width = Number(sourceWidth) || 0;
  const height = Number(sourceHeight) || 0;

  if (height >= 1080 || width >= 1920) {
    return [RENDITIONS['1080p'], RENDITIONS['720p'], RENDITIONS['360p']];
  }

  if (height >= 720 || width >= 1280) {
    return [RENDITIONS['720p'], RENDITIONS['360p']];
  }

  if (height >= 360 || width >= 640) {
    return [RENDITIONS['360p']];
  }

  // Low resolution source < 360p: Use exact source dimensions without upscaling
  const safeHeight = height > 0 ? (height % 2 === 0 ? height : height - 1) : 360;
  const safeWidth = width > 0 ? (width % 2 === 0 ? width : width - 1) : 640;

  return [
    {
      name: `${safeHeight}p`,
      width: safeWidth,
      height: safeHeight,
      videoBitrate: '500k',
      maxRate: '600k',
      bufSize: '1000k',
      audioBitrate: '64k',
      bandwidth: 600000,
    },
  ];
}
