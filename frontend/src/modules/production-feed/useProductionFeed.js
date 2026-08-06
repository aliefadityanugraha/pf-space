/**
 * frontend/src/modules/production-feed/useProductionFeed.js
 *
 * Composable for the Production Feed: initial load, cursor-based infinite scroll,
 * and non-blocking comment-count enrichment for the visible page.
 */

import { ref } from 'vue'
import { fetchFeedPosts, fetchPostCommentCount } from './api'
import { mapPost } from './types'

const stateCache = new Map()

function cacheKey(options) {
  return JSON.stringify({
    limit: options.limit || 10,
    initialParams: options.initialParams || {}
  })
}

export function useProductionFeed(options = {}) {
  const { limit = 10, initialParams = {} } = options
  const key = cacheKey(options)

  const posts = ref([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const isError = ref(false)
  const error = ref(null)
  const pagination = ref({})
  const hasMore = ref(false)

  const saveCache = () => {
    stateCache.set(key, {
      posts: posts.value.map((p) => ({ ...p })),
      pagination: { ...pagination.value },
      hasMore: hasMore.value
    })
  }

  const applyPage = (rawPosts, rawPagination, replace) => {
    const mapped = (Array.isArray(rawPosts) ? rawPosts : []).map(mapPost)

    if (replace) {
      posts.value = mapped
    } else {
      posts.value = [...posts.value, ...mapped]
    }

    pagination.value = rawPagination || {}
    hasMore.value =
      rawPagination?.has_more ??
      (rawPagination?.page || 1) < (rawPagination?.totalPages || 1)

    enrichCommentCounts(mapped)
  }

  const enrichCommentCounts = async (targets) => {
    try {
      const results = await Promise.all(
        targets.map(async (post) => {
          try {
            return {
              postId: post.postId,
              count: await fetchPostCommentCount(post.postId)
            }
          } catch {
            return { postId: post.postId, count: null }
          }
        })
      )

      const counts = new Map(
        results.filter((r) => r.count !== null).map((r) => [r.postId, r.count])
      )

      posts.value.forEach((post) => {
        if (counts.has(post.postId)) post.commentCount = counts.get(post.postId)
      })
    } catch {
      // Non-fatal — comment counts are decorative; keep the feed usable.
    }
  }

  const fetchFeed = async (params = {}) => {
    isLoading.value = true
    isError.value = false
    error.value = null

    try {
      const res = await fetchFeedPosts({ ...initialParams, ...params, limit })
      applyPage(res.posts, res.pagination, true)
      saveCache()
    } catch (err) {
      isError.value = true
      error.value = err
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async () => {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return

    const cursor = pagination.value?.next_cursor || null
    if (!cursor) return

    isLoadingMore.value = true
    try {
      const res = await fetchFeedPosts({ ...initialParams, cursor, limit })
      applyPage(res.posts, res.pagination, false)
      saveCache()
    } catch (err) {
      console.error('Failed to load more feed posts:', err)
    } finally {
      isLoadingMore.value = false
    }
  }

  const retry = () => fetchFeed()

  const restoreCache = () => {
    const cached = stateCache.get(key)
    if (!cached) return false
    posts.value = (cached.posts || []).map((p) => ({ ...p }))
    pagination.value = { ...(cached.pagination || {}) }
    hasMore.value = !!cached.hasMore
    return true
  }

  return {
    posts,
    isLoading,
    isLoadingMore,
    isError,
    error,
    pagination,
    hasMore,
    fetchFeed,
    loadMore,
    retry,
    restoreCache
  }
}
