/**
 * frontend/src/components/__tests__/VideoPlayer.sprint35.test.js
 *
 * Sprint 3.5 Frontend Browser Playback & Fallback Verification Test Suite.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VideoPlayer from '../VideoPlayer.vue';

// Mocks for Plyr and Hls.js
let mockHlsInstance = null;
let mockPlyrInstance = null;

vi.mock('plyr', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      mockPlyrInstance = {
        config: { quality: {}, i18n: {} },
        currentTime: 0,
        duration: 100,
        paused: false,
        destroy: vi.fn(),
      };
      return mockPlyrInstance;
    }),
  };
});

vi.mock('hls.js', () => {
  class MockHls {
    static isSupported() {
      return true;
    }
    static Events = {
      MANIFEST_PARSED: 'hlsManifestParsed',
      ERROR: 'hlsError',
    };

    constructor() {
      this.levels = [{ height: 720 }, { height: 360 }];
      this.currentLevel = -1;
      this.listeners = {};
      mockHlsInstance = this;
    }

    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();

    on(event, cb) {
      this.listeners[event] = cb;
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event](event, data);
      }
    }
  }

  return { default: MockHls };
});

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: null } }),
}));

describe('VideoPlayer Sprint 3.5 Playback & Fallback Suite', () => {
  beforeEach(() => {
    mockHlsInstance = null;
    mockPlyrInstance = null;
    vi.clearAllMocks();
  });

  it('uses MP4 fallback when transcodeStatus is pending, processing, or failed', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/main.mp4',
        mp4Src: '/uploads/videos/main.mp4',
        hlsSrc: '/uploads/videos/hls/1/master.m3u8',
        transcodeStatus: 'processing',
      },
    });

    await wrapper.vm.$nextTick();
    const video = wrapper.find('video');
    expect(video.exists()).toBe(true);
    expect(mockHlsInstance).toBeNull();
  });

  it('initializes HLS.js when transcodeStatus is completed and hlsSrc is provided', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/main.mp4',
        mp4Src: '/uploads/videos/main.mp4',
        hlsSrc: '/uploads/videos/hls/1/master.m3u8',
        transcodeStatus: 'completed',
      },
    });

    // Wait for dynamic imports
    await new Promise((r) => setTimeout(r, 50));

    expect(mockHlsInstance).not.toBeNull();
    expect(mockHlsInstance.loadSource).toHaveBeenCalledWith('/uploads/videos/hls/1/master.m3u8');
  });

  it('dynamically configures Plyr quality levels from manifest (720p, 360p — excluding 1080p)', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/main.mp4',
        mp4Src: '/uploads/videos/main.mp4',
        hlsSrc: '/uploads/videos/hls/1/master.m3u8',
        transcodeStatus: 'completed',
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockHlsInstance).not.toBeNull();

    // Trigger manifest parsed event
    mockHlsInstance.emit('hlsManifestParsed');

    expect(mockPlyrInstance.config.quality.options).toEqual([0, 720, 360]);
    // 1080p must NOT be present in options array
    expect(mockPlyrInstance.config.quality.options).not.toContain(1080);
  });

  it('switches to MP4 fallback on HLS fatal error', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/main.mp4',
        mp4Src: '/uploads/videos/main.mp4',
        hlsSrc: '/uploads/videos/hls/1/master.m3u8',
        transcodeStatus: 'completed',
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockHlsInstance).not.toBeNull();

    // Emit fatal HLS error
    mockHlsInstance.emit('hlsError', { fatal: true, type: 'networkError', details: 'manifestLoadError' });

    await wrapper.vm.$nextTick();
    expect(mockHlsInstance.destroy).toHaveBeenCalled();
  });

  it('handles YouTube URLs cleanly without HLS.js', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockHlsInstance).toBeNull();
    expect(mockPlyrInstance).not.toBeNull();
  });

  it('destroys HLS and Plyr instances cleanly on component unmount', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/main.mp4',
        hlsSrc: '/uploads/videos/hls/1/master.m3u8',
        transcodeStatus: 'completed',
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    const destroyHlsSpy = mockHlsInstance.destroy;
    const destroyPlyrSpy = mockPlyrInstance.destroy;

    wrapper.unmount();

    expect(destroyHlsSpy).toHaveBeenCalled();
    expect(destroyPlyrSpy).toHaveBeenCalled();
  });
});
