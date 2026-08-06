/**
 * Unit tests for production-feed/api.js comment + related helpers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  fetchRelatedPosts,
  fetchPostComments,
  submitPostComment,
  deletePostComment
} from '../api'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

const rawPost = (overrides = {}) => ({
  post_id: 10,
  user_id: 'u1',
  judul: 'Post',
  slug: 'post-10',
  isi_konten: 'Isi',
  tipe: 'progress',
  status: 'published',
  visibility: 'public',
  gambar_cover: null,
  is_pinned: false,
  created_at: '2026-01-01T00:00:00.000Z',
  creator: { id: 'u1', name: 'Rara', image: null },
  category: null,
  tags: [],
  ...overrides
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('post comment helpers', () => {
  it('fetchPostComments returns the data array', async () => {
    api.get.mockResolvedValue({ data: [{ diskusi_id: 1 }] })
    const result = await fetchPostComments(5)
    expect(api.get).toHaveBeenCalledWith('/api/discussions/post/5')
    expect(result).toEqual([{ diskusi_id: 1 }])
  })

  it('submitPostComment posts to the post endpoint', async () => {
    api.post.mockResolvedValue({ data: { diskusi_id: 2 } })
    const result = await submitPostComment(5, { isi_pesan: 'Halo', parent_id: null })
    expect(api.post).toHaveBeenCalledWith('/api/discussions/post/5', {
      isi_pesan: 'Halo',
      parent_id: null
    })
    expect(result).toEqual({ diskusi_id: 2 })
  })

  it('deletePostComment deletes via the shared discussion endpoint', async () => {
    api.delete.mockResolvedValue({})
    await deletePostComment(7)
    expect(api.delete).toHaveBeenCalledWith('/api/discussions/7')
  })
})

describe('fetchRelatedPosts', () => {
  it('returns normalized posts, excluding the current post', async () => {
    api.get.mockResolvedValue({
      data: [rawPost(), rawPost({ post_id: 11, slug: 'post-11' })],
      pagination: {}
    })

    const result = await fetchRelatedPosts({ postId: 10, filmId: 3, tipe: 'progress' }, 4)

    expect(result).toHaveLength(1)
    expect(result[0].postId).toBe(11)
  })

  it('requests the same film first, then same tipe', async () => {
    api.get.mockResolvedValue({ data: [], pagination: {} })

    await fetchRelatedPosts({ postId: 10, filmId: 3, tipe: 'progress' }, 4)

    const urls = api.get.mock.calls.map(([url, opts]) => `${url}?${new URLSearchParams(opts.params)}`)
    expect(urls[0]).toContain('film_id=3')
    expect(urls[1]).toContain('tipe=progress')
  })

  it('caps the result at the limit', async () => {
    api.get.mockResolvedValue({
      data: [
        rawPost({ post_id: 11 }),
        rawPost({ post_id: 12 }),
        rawPost({ post_id: 13 }),
        rawPost({ post_id: 14 }),
        rawPost({ post_id: 15 })
      ],
      pagination: {}
    })

    const result = await fetchRelatedPosts({ postId: 10, tipe: 'progress' }, 2)
    expect(result).toHaveLength(2)
  })

  it('fills from the latest feed when sources are exhausted', async () => {
    api.get
      .mockResolvedValueOnce({ data: [rawPost({ post_id: 11 })], pagination: {} })
      .mockResolvedValueOnce({ data: [], pagination: {} })
      .mockResolvedValueOnce({ data: [rawPost({ post_id: 12 })], pagination: {} })

    const result = await fetchRelatedPosts({ postId: 10, filmId: 3, tipe: 'progress' }, 2)

    expect(result.map((p) => p.postId)).toEqual([11, 12])
  })

  it('returns an empty array for missing post input', async () => {
    expect(await fetchRelatedPosts(null, 4)).toEqual([])
    expect(await fetchRelatedPosts({ postId: null }, 4)).toEqual([])
    expect(api.get).not.toHaveBeenCalled()
  })
})
