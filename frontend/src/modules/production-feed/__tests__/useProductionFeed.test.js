/**
 * Unit tests for production-feed/useProductionFeed composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProductionFeed } from '../useProductionFeed'
import { fetchFeedPosts, fetchPostCommentCount } from '../api'

vi.mock('../api', () => ({
  fetchFeedPosts: vi.fn(),
  fetchPostCommentCount: vi.fn()
}))

const rawPost = (postId, overrides = {}) => ({
  post_id: postId,
  user_id: 'u1',
  judul: `Post ${postId}`,
  isi_konten: 'Isi konten',
  tipe: 'progress',
  status: 'published',
  visibility: 'public',
  is_pinned: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides
})

const firstPage = () => ({
  posts: [rawPost(1), rawPost(2)],
  pagination: { page: 1, limit: 10, total: 4, totalPages: 2, next_cursor: 'cursor-2', has_more: true }
})

const secondPage = () => ({
  posts: [rawPost(3), rawPost(4)],
  pagination: { limit: 10, next_cursor: null, has_more: false }
})

describe('useProductionFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchPostCommentCount.mockResolvedValue(0)
  })

  it('loads the first page with default params', async () => {
    fetchFeedPosts.mockResolvedValue(firstPage())

    const { posts, isLoading, isError, hasMore, fetchFeed } = useProductionFeed()
    expect(isLoading.value).toBe(false)

    await fetchFeed()

    expect(fetchFeedPosts).toHaveBeenCalledWith({ limit: 10 })
    expect(posts.value).toHaveLength(2)
    expect(posts.value[0].postId).toBe(1)
    expect(isError.value).toBe(false)
    expect(hasMore.value).toBe(true)
  })

  it('appends the next page via cursor during loadMore', async () => {
    fetchFeedPosts.mockResolvedValueOnce(firstPage()).mockResolvedValueOnce(secondPage())

    const { posts, hasMore, isLoadingMore, fetchFeed, loadMore } = useProductionFeed()
    await fetchFeed()
    expect(hasMore.value).toBe(true)

    await loadMore()

    expect(fetchFeedPosts).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'cursor-2', limit: 10 })
    )
    expect(posts.value).toHaveLength(4)
    expect(posts.value[3].postId).toBe(4)
    expect(hasMore.value).toBe(false)
    expect(isLoadingMore.value).toBe(false)
  })

  it('does not call loadMore when there is no more page', async () => {
    fetchFeedPosts.mockResolvedValue({ posts: [rawPost(1)], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } })

    const { fetchFeed, loadMore } = useProductionFeed()
    await fetchFeed()

    await loadMore()
    expect(fetchFeedPosts).toHaveBeenCalledTimes(1)
  })

  it('does not call loadMore without a cursor', async () => {
    fetchFeedPosts.mockResolvedValue({
      posts: [rawPost(1)],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 2, next_cursor: null, has_more: true }
    })

    const { fetchFeed, loadMore } = useProductionFeed()
    await fetchFeed()

    await loadMore()
    expect(fetchFeedPosts).toHaveBeenCalledTimes(1)
  })

  it('sets isError on initial fetch failure', async () => {
    fetchFeedPosts.mockRejectedValue(new Error('Network down'))

    const { posts, isError, error, isLoading, fetchFeed } = useProductionFeed()
    await fetchFeed()

    expect(isError.value).toBe(true)
    expect(error.value).toBeInstanceOf(Error)
    expect(posts.value).toEqual([])
    expect(isLoading.value).toBe(false)
  })

  it('recovers via retry after an error', async () => {
    fetchFeedPosts.mockRejectedValueOnce(new Error('Network down')).mockResolvedValueOnce(firstPage())

    const { posts, isError, fetchFeed, retry } = useProductionFeed()
    await fetchFeed()
    expect(isError.value).toBe(true)

    await retry()
    expect(isError.value).toBe(false)
    expect(posts.value).toHaveLength(2)
  })

  it('enriches posts with comment counts', async () => {
    fetchFeedPosts.mockResolvedValue(firstPage())
    fetchPostCommentCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(12)

    const { posts, fetchFeed } = useProductionFeed()
    await fetchFeed()

    await vi.waitFor(() => {
      expect(posts.value[0].commentCount).toBe(5)
      expect(posts.value[1].commentCount).toBe(12)
    })
  })

  it('keeps comment counts null when the count endpoint fails', async () => {
    fetchFeedPosts.mockResolvedValue(firstPage())
    fetchPostCommentCount.mockRejectedValue(new Error('down'))

    const { posts, fetchFeed } = useProductionFeed()
    await fetchFeed()

    await vi.waitFor(() => {
      expect(posts.value.every((p) => p.commentCount === null)).toBe(true)
    })
  })

  it('merges enriched counts when appending pages', async () => {
    fetchFeedPosts.mockResolvedValueOnce(firstPage()).mockResolvedValueOnce(secondPage())
    fetchPostCommentCount.mockResolvedValue(3)

    const { posts, fetchFeed, loadMore } = useProductionFeed()
    await fetchFeed()
    await loadMore()

    await vi.waitFor(() => {
      expect(posts.value.every((p) => p.commentCount === 3)).toBe(true)
    })
  })

  it('respects limit option', async () => {
    fetchFeedPosts.mockResolvedValue(firstPage())
    const { fetchFeed } = useProductionFeed({ limit: 25 })

    await fetchFeed()
    expect(fetchFeedPosts).toHaveBeenCalledWith(expect.objectContaining({ limit: 25 }))
  })

  it('merges initialParams into every request', async () => {
    fetchFeedPosts.mockResolvedValueOnce(firstPage()).mockResolvedValueOnce(secondPage())

    const { fetchFeed, loadMore } = useProductionFeed({ initialParams: { category_id: 7 } })
    await fetchFeed()
    await loadMore()

    expect(fetchFeedPosts).toHaveBeenNthCalledWith(1, expect.objectContaining({ category_id: 7 }))
    expect(fetchFeedPosts).toHaveBeenNthCalledWith(2, expect.objectContaining({ category_id: 7, cursor: 'cursor-2' }))
  })
})
