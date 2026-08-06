/**
 * Unit tests for the production feed related posts component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import RelatedFeed from '../RelatedFeed.vue'
import { fetchRelatedPosts } from '@/modules/production-feed/api'

vi.mock('@/modules/production-feed/api', () => ({
  fetchRelatedPosts: vi.fn()
}))

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
}

const post = (overrides = {}) => ({
  postId: 1,
  slug: 'post-1',
  judul: 'Post 1',
  cover: 'covers/1.jpg',
  tipe: 'progress',
  publishedAt: '2026-07-01T08:00:00.000Z',
  createdAt: '2026-06-01T08:00:00.000Z',
  creator: { id: 'u1', name: 'Rara', image: null },
  ...overrides
})

const currentPost = post({ postId: 100, slug: 'current' })

const mountRelated = (props = {}) =>
  mount(RelatedFeed, {
    props: { post: currentPost, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RelatedFeed', () => {
  it('renders up to the limit of related posts', async () => {
    fetchRelatedPosts.mockResolvedValue([post(), post({ postId: 2 }), post({ postId: 3 })])

    const wrapper = mountRelated()
    await flushPromises()

    expect(fetchRelatedPosts).toHaveBeenCalledWith(currentPost, 4)
    expect(wrapper.findAll('a[href^="/feed/"]').length).toBe(3)
    expect(wrapper.text()).toContain('Bacaan Terkait')
  })

  it('links each related post to its detail slug', async () => {
    fetchRelatedPosts.mockResolvedValue([post({ postId: 2, slug: 'post-2' })])

    const wrapper = mountRelated()
    await flushPromises()

    expect(wrapper.find('a[href="/feed/post-2"]').exists()).toBe(true)
  })

  it('renders a loading skeleton while fetching', async () => {
    fetchRelatedPosts.mockReturnValue(new Promise(() => {}))

    const wrapper = mountRelated()
    await nextTick()

    expect(wrapper.text()).toContain('Bacaan Terkait')
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('hides the section when there are no related posts', async () => {
    fetchRelatedPosts.mockResolvedValue([])

    const wrapper = mountRelated()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Bacaan Terkait')
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
