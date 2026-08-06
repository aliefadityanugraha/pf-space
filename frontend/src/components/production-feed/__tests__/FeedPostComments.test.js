/**
 * Unit tests for the production feed post comments component.
 * It reuses CommentItem + the existing discussion endpoints.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FeedPostComments from '../FeedPostComments.vue'
import {
  fetchPostComments,
  submitPostComment,
  deletePostComment
} from '@/modules/production-feed/api'

vi.mock('@/modules/production-feed/api', () => ({
  fetchPostComments: vi.fn(),
  submitPostComment: vi.fn(),
  deletePostComment: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const ReportModalStub = {
  props: ['show', 'targetType', 'targetId', 'targetName'],
  template:
    '<div class="report-modal-stub" v-if="show">{{ targetType }}:{{ targetId }}:{{ targetName }}</div>'
}

const comment = (overrides = {}) => ({
  diskusi_id: 1,
  user_id: 'commenter-1',
  isi_pesan: 'Keren banget!',
  created_at: '2026-07-01T08:00:00.000Z',
  parent_id: null,
  user: { id: 'commenter-1', name: 'Budi', image: null, role_id: 1 },
  replies: [],
  ...overrides
})

const mountComments = (props = {}) =>
  mount(FeedPostComments, {
    props: {
      postId: 5,
      postOwnerId: 'owner-1',
      isLoggedIn: false,
      user: null,
      canModerate: false,
      ...props
    },
    global: {
      stubs: { ReportModal: ReportModalStub },
      mocks: {}
    }
  })

beforeEach(() => {
  vi.clearAllMocks()
  window.confirm = vi.fn(() => true)
  fetchPostComments.mockResolvedValue([])
})

describe('FeedPostComments', () => {
  it('fetches and renders comments for the post', async () => {
    fetchPostComments.mockResolvedValue([comment()])

    const wrapper = mountComments({ isLoggedIn: true, user: { id: 'me', name: 'Me' } })
    await flushPromises()

    expect(fetchPostComments).toHaveBeenCalledWith(5)
    expect(wrapper.text()).toContain('Keren banget!')
    expect(wrapper.text()).toContain('Ruang Diskusi (1 Komentar)')
  })

  it('shows the login CTA when logged out', async () => {
    const wrapper = mountComments()
    await flushPromises()

    expect(wrapper.text()).toContain('Login Untuk Berkomentar')
  })

  it('shows an empty state when there are no comments', async () => {
    const wrapper = mountComments({ isLoggedIn: true, user: { id: 'me', name: 'Me' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Belum ada diskusi')
  })

  it('submits a new comment via submitPostComment and refetches', async () => {
    fetchPostComments.mockResolvedValue([])
    submitPostComment.mockResolvedValue({})

    const wrapper = mountComments({ isLoggedIn: true, user: { id: 'me', name: 'Me' } })
    await flushPromises()

    await wrapper.find('textarea').setValue('Pesan baru')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(submitPostComment).toHaveBeenCalledWith(5, {
      isi_pesan: 'Pesan baru',
      parent_id: null
    })
    expect(fetchPostComments).toHaveBeenCalledTimes(2)
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('deletes a comment via deletePostComment', async () => {
    fetchPostComments.mockResolvedValue([comment()])
    deletePostComment.mockResolvedValue({})

    const wrapper = mountComments({
      isLoggedIn: true,
      user: { id: 'commenter-1', name: 'Budi' },
      canModerate: true
    })
    await flushPromises()

    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Hapus'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(deletePostComment).toHaveBeenCalledWith(1)
  })

  it('opens the report modal for a comment', async () => {
    fetchPostComments.mockResolvedValue([comment()])

    const wrapper = mountComments({
      isLoggedIn: true,
      user: { id: 'someone-else', name: 'Orang' }
    })
    await flushPromises()

    const reportBtn = wrapper.findAll('button').find((b) => b.text().includes('Laporkan'))
    expect(reportBtn).toBeTruthy()
    await reportBtn.trigger('click')

    const modal = wrapper.find('.report-modal-stub')
    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('comment:1')
  })
})
