/**
 * frontend/src/components/__tests__/PlaybackRecovery.sprint13.test.js
 *
 * Sprint 13 Playback Recovery & Seamless MP4 Fallback Unit Tests.
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

describe('PlaybackRecovery Sprint 13 Suite', () => {
  it('1. Switches to MP4 fallback mode when usingHlsFallback is triggered', async () => {
    const wrapper = mount(VideoPlayer, {
      props: {
        src: '/uploads/videos/original.mp4',
        mp4Src: '/uploads/videos/original.mp4',
        hlsSrc: '/uploads/videos/hls/42/master.m3u8',
        transcodeStatus: 'completed',
      },
    })
    await wrapper.vm.$nextTick()

    wrapper.vm.usingHlsFallback = true
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.usingHlsFallback).toBe(true)
    expect(wrapper.text()).toContain('MP4 Fallback Mode')
  })
})
