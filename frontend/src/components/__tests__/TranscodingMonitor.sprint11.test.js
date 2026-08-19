/**
 * frontend/src/components/__tests__/TranscodingMonitor.sprint11.test.js
 *
 * Sprint 11 Frontend Transcoding Monitor & Operation Audit Trail Unit Tests.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TranscodingMonitor from '../TranscodingMonitor.vue'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('TranscodingMonitor Sprint 11 Governance & Audit Trail Suite', () => {
  it('renders dashboard shell and audit trail title', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/films') return Promise.resolve({ data: { data: [{ film_id: 1101, judul: 'Test Film', transcode_status: 'processing' }] } })
      if (url === '/api/films/transcode/queue') return Promise.resolve({ data: { data: { active: 1, waiting: 0, completed: 5, failed: 0 } } })
      if (url.includes('/history')) return Promise.resolve({ data: { data: { operations: [{ id: 1, operationType: 'enqueue', previousStatus: 'none', newStatus: 'pending', createdAt: new Date().toISOString() }] } } })
      return Promise.resolve({ data: {} })
    })

    const wrapper = mount(TranscodingMonitor)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Transcoding Governance')
    expect(wrapper.text()).toContain('Operation Audit Trail')
  })
})
