/**
 * Unit tests for production-feed/types.js mapping helpers
 */

import { describe, it, expect } from 'vitest'
import { mapPost, mapPosts, mapMediaItem, mapPostDetail } from '../types'

const rawPost = {
  post_id: 12,
  user_id: 'user-1',
  film_id: 3,
  category_id: 5,
  judul: 'Day 40: Warna mulai masuk',
  slug: 'day-40-warna',
  isi_konten: 'Proses grading selesai untuk reel pertama.',
  tipe: 'progress',
  status: 'published',
  visibility: 'public',
  gambar_cover: 'covers/day40.jpg',
  is_pinned: 1,
  published_at: '2026-07-01T08:00:00.000Z',
  created_at: '2026-06-20T08:00:00.000Z',
  creator: { id: 'user-1', name: 'Rara', image: 'avatars/rara.jpg' },
  category: { category_id: 5, nama_kategori: 'Film Panjang' },
  tags: [{ tag_id: 1, name: 'grading' }, { tag_id: 2, name: 'behind-scenes' }]
}

describe('mapPost', () => {
  it('maps all fields to the normalized model', () => {
    const post = mapPost(rawPost)

    expect(post.postId).toBe(12)
    expect(post.filmId).toBe(3)
    expect(post.judul).toBe('Day 40: Warna mulai masuk')
    expect(post.slug).toBe('day-40-warna')
    expect(post.isiKonten).toBe('Proses grading selesai untuk reel pertama.')
    expect(post.tipe).toBe('progress')
    expect(post.status).toBe('published')
    expect(post.cover).toBe('covers/day40.jpg')
    expect(post.isPinned).toBe(true)
    expect(post.publishedAt).toBe(rawPost.published_at)
    expect(post.createdAt).toBe(rawPost.created_at)
    expect(post.creator).toEqual({ id: 'user-1', name: 'Rara', image: 'avatars/rara.jpg' })
    expect(post.category).toEqual({ categoryId: 5, namaKategori: 'Film Panjang' })
    expect(post.tags).toEqual(['grading', 'behind-scenes'])
    expect(post.commentCount).toBeNull()
  })

  it('treats falsy is_pinned as false', () => {
    const post = mapPost({ ...rawPost, is_pinned: 0 })
    expect(post.isPinned).toBe(false)
  })

  it('handles missing relations gracefully', () => {
    const post = mapPost({
      post_id: 1,
      user_id: 'u1',
      judul: 'Judul',
      isi_konten: 'Isi',
      created_at: '2026-01-01T00:00:00.000Z'
    })

    expect(post.filmId).toBeNull()
    expect(post.cover).toBeNull()
    expect(post.creator).toBeNull()
    expect(post.category).toBeNull()
    expect(post.tags).toEqual([])
  })

  it('falls back to a default judul when empty', () => {
    const post = mapPost({ ...rawPost, judul: '' })
    expect(post.judul).toBe('Tanpa judul')
  })

  it('returns null for null/undefined input', () => {
    expect(mapPost(null)).toBeNull()
    expect(mapPost(undefined)).toBeNull()
  })
})

describe('mapPosts', () => {
  it('maps arrays and skips null entries', () => {
    const posts = mapPosts([rawPost, null, { ...rawPost, post_id: 13, is_pinned: 0 }])

    expect(posts).toHaveLength(2)
    expect(posts[0].postId).toBe(12)
    expect(posts[1].postId).toBe(13)
    expect(posts[1].isPinned).toBe(false)
  })

  it('returns empty array for non-array input', () => {
    expect(mapPosts(null)).toEqual([])
    expect(mapPosts(undefined)).toEqual([])
    expect(mapPosts('nope')).toEqual([])
  })
})

describe('mapMediaItem', () => {
  it('maps a raw media item to the normalized model', () => {
    const item = mapMediaItem({
      media_id: 4,
      media_type: 'video',
      file_path: 'videos/clip.mp4',
      mime_type: 'video/mp4',
      file_size: 1024,
      thumbnail: 'thumbs/clip.jpg',
      duration: 65,
      sort_order: 2
    })

    expect(item).toEqual({
      mediaId: 4,
      mediaType: 'video',
      filePath: 'videos/clip.mp4',
      mimeType: 'video/mp4',
      fileSize: 1024,
      thumbnail: 'thumbs/clip.jpg',
      duration: 65,
      sortOrder: 2
    })
  })

  it('applies defaults for missing optional fields', () => {
    const item = mapMediaItem({ media_type: 'photo', file_path: 'photos/a.jpg' })

    expect(item.mediaId).toBeNull()
    expect(item.mediaType).toBe('photo')
    expect(item.mimeType).toBeNull()
    expect(item.fileSize).toBeNull()
    expect(item.thumbnail).toBeNull()
    expect(item.duration).toBeNull()
    expect(item.sortOrder).toBe(0)
  })

  it('returns null for null/undefined input', () => {
    expect(mapMediaItem(null)).toBeNull()
    expect(mapMediaItem(undefined)).toBeNull()
  })
})

describe('mapPostDetail', () => {
  const detailPost = {
    ...rawPost,
    media: [
      { media_id: 1, media_type: 'pdf', file_path: 'docs/naskah.pdf', sort_order: 2 },
      { media_id: 2, media_type: 'photo', file_path: 'photos/bts.jpg', sort_order: 1 }
    ]
  }

  it('extends the list model with a normalized media list', () => {
    const post = mapPostDetail(detailPost)

    expect(post.postId).toBe(12)
    expect(post.media).toHaveLength(2)
    expect(post.media[0]).toMatchObject({ mediaType: 'photo', filePath: 'photos/bts.jpg', sortOrder: 1 })
    expect(post.media[1]).toMatchObject({ mediaType: 'pdf', filePath: 'docs/naskah.pdf', sortOrder: 2 })
  })

  it('sorts media by sort_order ascending', () => {
    const post = mapPostDetail(detailPost)
    expect(post.media.map((m) => m.mediaType)).toEqual(['photo', 'pdf'])
  })

  it('defaults to an empty media list', () => {
    const post = mapPostDetail(rawPost)
    expect(post.media).toEqual([])
  })

  it('returns null for null/undefined input', () => {
    expect(mapPostDetail(null)).toBeNull()
    expect(mapPostDetail(undefined)).toBeNull()
  })
})
