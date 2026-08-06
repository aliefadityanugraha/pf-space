/**
 * frontend/src/modules/production-feed/api.js
 *
 * API service for the Production Feed feature.
 * Thin wrappers around the existing backend endpoints — no backend changes.
 */

import { api } from '@/lib/api'
import { mapPosts } from './types'

export const PRODUCTION_FEED_ENDPOINT = '/api/production-feed'
export const DEFAULT_FEED_LIMIT = 10

/**
 * Fetch a paginated feed of posts (offset mode on first page, cursor mode after).
 * @param {object} [params] - Query params: page | cursor, limit, status, sortBy, sortOrder, etc.
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export async function fetchFeedPosts(params = {}) {
  const res = await api.get(PRODUCTION_FEED_ENDPOINT, {
    params: { limit: DEFAULT_FEED_LIMIT, ...params }
  })

  return {
    posts: Array.isArray(res.data) ? res.data : [],
    pagination: res.pagination || {}
  }
}

/**
 * Fetch the comment count for a single production feed post.
 * @param {number} postId
 * @returns {Promise<number|null>}
 */
export async function fetchPostCommentCount(postId) {
  const res = await api.get(`/api/discussions/post/${postId}/count`)
  const count = res?.data?.comment_count
  return typeof count === 'number' ? count : null
}

/**
 * Fetch the comment list for a production feed post (flat list).
 * @param {number} postId
 * @returns {Promise<object[]>}
 */
export async function fetchPostComments(postId) {
  const res = await api.get(`/api/discussions/post/${postId}`)
  return Array.isArray(res?.data) ? res.data : []
}

/**
 * Submit a comment (or reply payload) to a production feed post.
 * @param {number} postId
 * @param {{ isi_pesan: string, parent_id?: number|null }} payload
 * @returns {Promise<object|null>}
 */
export async function submitPostComment(postId, payload) {
  const res = await api.post(`/api/discussions/post/${postId}`, payload)
  return res?.data ?? null
}

/**
 * Delete a comment by its discussion id (owner/moderator/admin).
 * @param {number} commentId
 * @returns {Promise<void>}
 */
export async function deletePostComment(commentId) {
  await api.delete(`/api/discussions/${commentId}`)
}

/**
 * Fetch related posts for a post detail page (max `limit` items).
 * Prioritizes posts linked to the same film, then same type, then the
 * latest feed — using the existing GET /api/production-feed endpoint only.
 * @param {{ postId: number, filmId?: number|null, tipe?: string }|null} post
 * @param {number} [limit=4]
 * @returns {Promise<object[]>} Normalized related posts
 */
export async function fetchRelatedPosts(post, limit = 4) {
  if (!post || !post.postId) return []

  const max = Math.max(1, limit)
  const seen = new Set([post.postId])
  const related = []

  const sources = []
  if (post.filmId) sources.push({ film_id: post.filmId })
  if (post.tipe) sources.push({ tipe: post.tipe })
  if (sources.length === 0) sources.push({})

  const sourceResults = await Promise.all(
    sources.map(async (filter) => {
      try {
        const res = await fetchFeedPosts({
          ...filter,
          sortBy: 'created_at',
          sortOrder: 'desc',
          limit: max + 1
        })
        return res.posts
      } catch {
        return []
      }
    })
  )

  for (const list of sourceResults) {
    for (const p of list) {
      if (seen.has(p.post_id)) continue
      seen.add(p.post_id)
      related.push(p)
      if (related.length >= max) return mapPosts(related)
    }
  }

  if (related.length < max) {
    try {
      const res = await fetchFeedPosts({
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: max + 1
      })
      for (const p of res.posts) {
        if (seen.has(p.post_id)) continue
        seen.add(p.post_id)
        related.push(p)
        if (related.length >= max) break
      }
    } catch {
      // Ignore — related feed is decorative.
    }
  }

  return mapPosts(related)
}

/**
 * Fetch a single post by numeric ID or slug (raw backend shape).
 * @param {number|string} idOrSlug
 * @returns {Promise<object|null>}
 */
export async function fetchPostDetail(idOrSlug) {
  const res = await api.get(`${PRODUCTION_FEED_ENDPOINT}/${encodeURIComponent(idOrSlug)}`)
  return res?.data ?? null
}

/**
 * Create a new post. Backend always starts it as a draft.
 * @param {object} data - Post body (see productionPostCreateSchema)
 * @returns {Promise<object>} Created post
 */
export async function createFeedPost(data) {
  const res = await api.post(PRODUCTION_FEED_ENDPOINT, data)
  return res?.data ?? null
}

/**
 * Update an existing post (owner/moderator).
 * @param {number} id - Post ID
 * @param {object} data - Partial post body (see productionPostUpdateSchema)
 * @returns {Promise<object>} Updated post
 */
export async function updateFeedPost(id, data) {
  const res = await api.put(`${PRODUCTION_FEED_ENDPOINT}/${id}`, data)
  return res?.data ?? null
}

/**
 * Publish a draft post (owner/moderator).
 * @param {number} id - Post ID
 * @returns {Promise<object>} Published post
 */
export async function publishFeedPost(id) {
  const res = await api.patch(`${PRODUCTION_FEED_ENDPOINT}/${id}/publish`, {})
  return res?.data ?? null
}

/**
 * Delete a post (owner/moderator/admin).
 * @param {number} id - Post ID
 * @returns {Promise<void>}
 */
export async function deleteFeedPost(id) {
  await api.delete(`${PRODUCTION_FEED_ENDPOINT}/${id}`)
}

/**
 * Fetch all existing tags for the tag picker.
 * @returns {Promise<Array<{tag_id: number, nama_tag: string, slug: string}>>}
 */
export async function fetchFeedTags() {
  const res = await api.get(`${PRODUCTION_FEED_ENDPOINT}/tags`)
  return Array.isArray(res?.data) ? res.data : []
}

/**
 * Fetch the current creator's own films (all statuses) for the film picker.
 * @returns {Promise<Array<{film_id: number, judul: string, slug: string, status: string}>>}
 */
export async function fetchMyFilms() {
  const res = await api.get('/api/films/my-films', {
    params: { limit: 100 }
  })
  return Array.isArray(res?.data?.films) ? res.data.films : []
}
