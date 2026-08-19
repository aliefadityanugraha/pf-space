/**
 * frontend/src/components/__tests__/TranscodeStatus.sprint7.test.js
 *
 * Sprint 7 — Transcoding Management UI & Real-Time Status Unit Test Suite.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TranscodeStatus from '../TranscodeStatus.vue'
import { api } from '@/lib/api'
import { _setAuthUser } from '@/composables/useAuth'

vi.mock('@/lib/api', () => ({
  BASE_URL: 'http://localhost:3001',
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('TranscodeStatus.vue (Sprint 7 UI & Real-Time Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    _setAuthUser({ id: 1, name: 'Admin', role: { name: 'admin' } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders MP4 default badge when transcodeStatus is "none"', () => {
    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'none', transcodeProgress: 0 },
    })

    expect(wrapper.text()).toContain('Format MP4 Standar')
  })

  it('renders pending badge and starts polling when status is "pending"', () => {
    api.get.mockResolvedValue({ data: { transcode_status: 'pending', transcode_progress: 0 } })

    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'pending', transcodeProgress: 0, pollIntervalMs: 1000 },
    })

    expect(wrapper.text()).toContain('Menunggu Antrean Transcoding...')
    expect(api.get).toHaveBeenCalledWith('/api/films/42')
  })

  it('renders processing progress bar and guarantees monotonic progress updates', async () => {
    api.get.mockResolvedValue({ data: { transcode_status: 'processing', transcode_progress: 45 } })

    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'processing', transcodeProgress: 40, pollIntervalMs: 1000 },
    })

    expect(wrapper.text()).toContain('Transcoding Video... (40%)')

    // Advance timer to trigger poll
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('45%')
  })

  it('stops polling automatically when status becomes "completed"', async () => {
    api.get.mockResolvedValueOnce({
      data: { transcode_status: 'completed', transcode_progress: 100, hls_manifest_url: '/uploads/videos/hls/42/master.m3u8' },
    })

    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'processing', transcodeProgress: 90, pollIntervalMs: 1000 },
    })

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('✓ Video HLS Siap Diputar')

    // Reset mock to check it is not called again
    api.get.mockClear()
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.get).not.toHaveBeenCalled()
  })

  it('triggers cancellation API when Cancel button is clicked', async () => {
    api.post.mockResolvedValue({ data: { message: 'Cancelled' } })

    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'processing', transcodeProgress: 50, canManage: true },
    })

    const cancelBtn = wrapper.find('button')
    expect(cancelBtn.exists()).toBe(true)
    expect(cancelBtn.text()).toContain('Batalkan')

    await cancelBtn.trigger('click')

    expect(api.post).toHaveBeenCalledWith('/api/films/42/transcode/cancel')
    expect(wrapper.emitted('cancelled')).toBeTruthy()
  })

  it('triggers re-transcode API when Retry button is clicked on failed status', async () => {
    api.post.mockResolvedValue({ data: { message: 'Retranscode started' } })

    const wrapper = mount(TranscodeStatus, {
      props: { filmId: 42, transcodeStatus: 'failed', transcodeProgress: 0, canManage: true },
    })

    const retryBtn = wrapper.find('button')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('Coba Transcode Lagi')

    await retryBtn.trigger('click')

    expect(api.post).toHaveBeenCalledWith('/api/films/42/retranscode')
    expect(wrapper.emitted('retried')).toBeTruthy()
  })
})
