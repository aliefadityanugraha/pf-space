/**
 * frontend/src/components/__tests__/VideoPlayer.sprint13.test.js
 *
 * Sprint 13 Adaptive Quality Intelligence & State Management Unit Tests.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoPlayer from '../VideoPlayer.vue'

vi.mock('plyr', () => ({
  default: vi.fn().mockImplementation(() => ({
    config: { quality: {}, i18n: {} },
    currentTime: 0,
    duration: 100,
    paused: false,
    destroy: vi.fn(),
  })),
}))

vi.mock('hls.js', () => {
  class MockHls {
    static isSupported() { return true; }
    static Events = { MANIFEST_PARSED: 'hlsManifestParsed', LEVEL_SWITCHED: 'hlsLevelSwitched', ERROR: 'hlsError' };
    constructor() { this.levels = [{ height: 720 }, { height: 360 }]; this.currentLevel = -1; this.listeners = {}; }
    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();
    on(event, cb) { this.listeners[event] = cb; }
  }
  return { default: MockHls };
})

describe('VideoPlayer Sprint 13 Quality & State Suite', () => {
  it('1. Initializes playback state as loading/playing', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/sample.mp4',
        title: 'Test Movie',
      },
    })
    await wrapper.vm.$nextTick()

    expect(['loading', 'playing', 'idle']).toContain(wrapper.vm.playbackState)
  })

  it('2. Exposes development playback metrics object', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/sample.mp4',
      },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.playbackMetrics).toBeDefined()
    expect(wrapper.vm.playbackMetrics.selectedQuality).toBe('Auto')
  })
})
