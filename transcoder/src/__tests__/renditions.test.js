/**
 * transcoder/src/__tests__/renditions.test.js
 *
 * Unit tests for adaptive rendition selection strategy.
 */

import { describe, it, expect } from 'vitest';
import { selectRenditions, RENDITIONS } from '../renditions.js';

describe('Adaptive Rendition Selection Strategy', () => {
  it('selects 1080p, 720p, and 360p for 1080p source video (1920x1080)', () => {
    const list = selectRenditions(1920, 1080);
    expect(list.length).toBe(3);
    expect(list[0].name).toBe('1080p');
    expect(list[1].name).toBe('720p');
    expect(list[2].name).toBe('360p');
  });

  it('selects 720p and 360p for 720p source video (1280x720)', () => {
    const list = selectRenditions(1280, 720);
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('720p');
    expect(list[1].name).toBe('360p');
  });

  it('selects only 360p for 360p source video (640x360)', () => {
    const list = selectRenditions(640, 360);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('360p');
  });

  it('does not upscale low resolution source video (< 360p)', () => {
    const list = selectRenditions(480, 270);
    expect(list.length).toBe(1);
    expect(list[0].height).toBeLessThanOrEqual(270);
    expect(list[0].width).toBeLessThanOrEqual(480);
  });
});
