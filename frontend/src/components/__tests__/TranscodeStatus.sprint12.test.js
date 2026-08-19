/**
 * frontend/src/components/__tests__/TranscodeStatus.sprint12.test.js
 *
 * Sprint 12 Frontend Permission-Aware UI Test Suite.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TranscodeStatus from '../TranscodeStatus.vue'
import { _setAuthUser } from '@/composables/useAuth'

describe('TranscodeStatus Sprint 12 Permission-Aware UI Suite', () => {
  it('renders Action Buttons when canManage is true', () => {
    const wrapper = mount(TranscodeStatus, {
      props: {
        filmId: 1201,
        transcodeStatus: 'failed',
        canManage: true,
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Coba Transcode Lagi')
  })

  it('hides Action Buttons when canManage is false for unauthorized users', () => {
    const wrapper = mount(TranscodeStatus, {
      props: {
        filmId: 1201,
        transcodeStatus: 'failed',
        canManage: false,
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows Batalkan button ONLY for Admin role during processing', () => {
    _setAuthUser({ id: 2, name: 'Creator', role: { name: 'creator' } })
    const nonAdminWrapper = mount(TranscodeStatus, {
      props: {
        filmId: 1202,
        transcodeStatus: 'processing',
        transcodeProgress: 20,
        canManage: true,
      },
    })
    expect(nonAdminWrapper.text()).not.toContain('Batalkan')

    _setAuthUser({ id: 1, name: 'Admin', role: { name: 'admin' } })
    const adminWrapper = mount(TranscodeStatus, {
      props: {
        filmId: 1202,
        transcodeStatus: 'processing',
        transcodeProgress: 20,
        canManage: true,
      },
    })
    expect(adminWrapper.text()).toContain('Batalkan')
  })
})
