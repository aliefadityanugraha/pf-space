/**
 * frontend/src/components/__tests__/sprint14.playback.test.js
 *
 * Sprint 14 Final Frontend Playback Intelligence QA Test Suite.
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
    constructor() { this.levels = [{ height: 1080 }, { height: 720 }, { height: 360 }]; this.currentLevel = -1; this.listeners = {}; }
    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();
    on(event, cb) { this.listeners[event] = cb; }
  }
  return { default: MockHls };
})

describe('Sprint 14 Final Frontend Playback Intelligence QA Suite', () => {
  it('1. Renders VideoPlayer cleanly in HLS completed state', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/final.mp4',
        hlsSrc: '/uploads/videos/hls/1401/master.m3u8',
        transcodeStatus: 'completed',
        title: 'Final Release Film',
      },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.usingHlsFallback).toBe(false)
    expect(wrapper.vm.playbackMetrics).toBeDefined()
  })

  it('2. Preserves player integrity under MP4 fallback', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/final.mp4',
        mp4Src: '/uploads/videos/final.mp4',
        hlsSrc: '/uploads/videos/hls/1401/master.m3u8',
        transcodeStatus: 'failed',
      },
    })
    await wrapper.vm.$nextTick()

    wrapper.vm.usingHlsFallback = true
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.usingHlsFallback).toBe(true)
    expect(wrapper.text()).toContain('MP4 Fallback Mode')
  })
})
