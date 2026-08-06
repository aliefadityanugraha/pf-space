/**
 * Unit tests for the Production Feed card component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FeedCard from '../FeedCard.vue'
import { _resetAuthState, _setAuthUser } from '@/composables/useAuth'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
}

const mountCard = (post) =>
  mount(FeedCard, {
    props: { post },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

const basePost = {
  postId: 1,
  filmId: null,
  judul: 'Day 40: Warna mulai masuk',
  slug: 'day-40-warna',
  isiKonten: 'Proses grading selesai untuk reel pertama.',
  tipe: 'progress',
  status: 'published',
  visibility: 'public',
  cover: null,
  isPinned: false,
  publishedAt: '2026-07-01T08:00:00.000Z',
  createdAt: '2026-06-20T08:00:00.000Z',
  creator: { id: 'u1', name: 'Rara', image: null },
  category: { categoryId: 5, namaKategori: 'Film Panjang' },
  tags: ['grading', 'warna'],
  commentCount: null
}

describe('FeedCard', () => {
  beforeEach(() => {
    _resetAuthState()
  })

  it('renders title, creator, category and tags', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.text()).toContain('Day 40: Warna mulai masuk')
    expect(wrapper.text()).toContain('Rara')
    expect(wrapper.text()).toContain('Film Panjang')
    expect(wrapper.text()).toContain('#grading')
    expect(wrapper.text()).toContain('#warna')
  })

  it('shows the pinned badge when the post is pinned', () => {
    const wrapper = mountCard({ ...basePost, isPinned: true })

    expect(wrapper.text()).toContain('Disematkan')
  })

  it('hides the pinned badge for regular posts', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.text()).not.toContain('Disematkan')
  })

  it('shows the film badge when the post is linked to a film', () => {
    const wrapper = mountCard({ ...basePost, filmId: 3 })

    expect(wrapper.text()).toContain('Terkait Film')
  })

  it('hides the film badge when there is no film relation', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.text()).not.toContain('Terkait Film')
  })

  it('shows the comment count when available', () => {
    const wrapper = mountCard({ ...basePost, commentCount: 7 })

    expect(wrapper.text()).toContain('7')
  })

  it('omits the comment count when it is null', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.find('[data-testid="comment-count"]').exists()).toBe(false)
  })

  it('strips HTML from the content preview', () => {
    const wrapper = mountCard({ ...basePost, isiKonten: '<p>Halo <strong>dunia</strong></p>' })

    expect(wrapper.text()).toContain('Halo dunia')
    expect(wrapper.text()).not.toContain('<p>')
  })

  it('does not show an edit CTA to other users', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.text()).not.toContain('Edit')
  })

  it('links the title to the post detail page', () => {
    const wrapper = mountCard(basePost)

    expect(wrapper.find('a[href="/feed/day-40-warna"]').exists()).toBe(true)
  })

  it('falls back to the post id in the title link when there is no slug', () => {
    const wrapper = mountCard({ ...basePost, slug: null })

    expect(wrapper.find('a[href="/feed/1"]').exists()).toBe(true)
  })

  it('shows an edit CTA linking to the edit page for the post owner', () => {
    _setAuthUser({ id: 'u1', name: 'Rara', image: null })

    const wrapper = mountCard(basePost)

    const editLink = wrapper.find('a[href="/feed/1/edit"]')
    expect(editLink.exists()).toBe(true)
    expect(editLink.text()).toContain('Edit')
  })
})
