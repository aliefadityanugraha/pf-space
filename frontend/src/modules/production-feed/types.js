/**
 * frontend/src/modules/production-feed/types.js
 *
 * Types (JSDoc typedefs) + pure mapping helpers for the Production Feed.
 * Keeps the raw backend shape decoupled from the UI model so components
 * stay simple and the mapping is unit-testable.
 */

/**
 * Creator relation (users.selectBasic: id, name, image)
 * @typedef {Object} ProductionFeedCreator
 * @property {string} id
 * @property {string} name
 * @property {string|null} image
 */

/**
 * Category relation
 * @typedef {Object} ProductionFeedCategory
 * @property {number} category_id
 * @property {string} nama_kategori
 */

/**
 * Tag relation
 * @typedef {Object} ProductionFeedTag
 * @property {number} tag_id
 * @property {string} name
 */

/**
 * Raw post shape as returned by GET /api/production-feed
 * @typedef {Object} ProductionFeedRawPost
 * @property {number} post_id
 * @property {string} user_id
 * @property {number|null} film_id
 * @property {number|null} category_id
 * @property {string} judul
 * @property {string|null} slug
 * @property {string} isi_konten
 * @property {string} tipe
 * @property {string} status
 * @property {string} visibility
 * @property {string|null} gambar_cover
 * @property {boolean|number} is_pinned
 * @property {string|null} published_at
 * @property {string} created_at
 * @property {ProductionFeedCreator|null} creator
 * @property {ProductionFeedCategory|null} category
 * @property {ProductionFeedTag[]} tags
 */

/**
 * Normalized post model consumed by the feed UI
 * @typedef {Object} ProductionFeedPost
 * @property {number} postId
 * @property {number|null} filmId
 * @property {string} judul
 * @property {string|null} slug
 * @property {string} isiKonten
 * @property {string} tipe
 * @property {string} status
 * @property {string} visibility
 * @property {string|null} cover
 * @property {boolean} isPinned
 * @property {string|null} publishedAt
 * @property {string|null} createdAt
 * @property {ProductionFeedCreator|null} creator
 * @property {{ categoryId: number, namaKategori: string }|null} category
 * @property {string[]} tags
 * @property {number|null} commentCount
 */

/**
 * Pagination object from GET /api/production-feed
 * (offset mode → page/total/totalPages; cursor mode → next_cursor/has_more)
 * @typedef {Object} ProductionFeedPagination
 * @property {number} limit
 * @property {number} [page]
 * @property {number} [total]
 * @property {number} [totalPages]
 * @property {string|null} [next_cursor]
 * @property {boolean} [has_more]
 */

/**
 * Map a raw API post to the normalized UI model.
 * @param {ProductionFeedRawPost|null|undefined} post
 * @returns {ProductionFeedPost|null}
 */
export function mapPost(post) {
  if (!post) return null

  return {
    postId: post.post_id,
    filmId: post.film_id ?? null,
    judul: post.judul || 'Tanpa judul',
    slug: post.slug || null,
    isiKonten: post.isi_konten || '',
    tipe: post.tipe || '',
    status: post.status || 'draft',
    visibility: post.visibility || 'public',
    cover: post.gambar_cover || null,
    isPinned: !!post.is_pinned,
    publishedAt: post.published_at || null,
    createdAt: post.created_at || null,
    creator: post.creator || null,
    category: post.category
      ? {
          categoryId: post.category.category_id,
          namaKategori: post.category.nama_kategori
        }
      : null,
    tags: Array.isArray(post.tags)
      ? post.tags
          .map((tag) => tag?.name || tag?.nama_tag)
          .filter(Boolean)
      : [],
    commentCount: null
  }
}

/**
 * Map an array of raw API posts.
 * @param {ProductionFeedRawPost[]} posts
 * @returns {ProductionFeedPost[]}
 */
export function mapPosts(posts) {
  return (Array.isArray(posts) ? posts : [])
    .map(mapPost)
    .filter(Boolean)
}

/**
 * Media item (raw shape from POST/GET production-feed media relation)
 * @typedef {Object} ProductionFeedMediaItem
 * @property {number} media_id
 * @property {string} media_type - 'photo' | 'video' | 'pdf'
 * @property {string} file_path
 * @property {string|null} mime_type
 * @property {number|null} file_size
 * @property {string|null} thumbnail
 * @property {number|null} duration
 * @property {number} sort_order
 */

/**
 * Normalized media item consumed by the post detail UI.
 * @typedef {Object} ProductionFeedMedia
 * @property {number|null} mediaId
 * @property {string} mediaType - 'photo' | 'video' | 'pdf'
 * @property {string} filePath
 * @property {string|null} mimeType
 * @property {number|null} fileSize
 * @property {string|null} thumbnail
 * @property {number|null} duration
 * @property {number} sortOrder
 */

/**
 * Detail post model (extends list model with resolved media).
 * @typedef {ProductionFeedPost & { media: ProductionFeedMedia[] }} ProductionFeedPostDetail
 */

/**
 * Map a single raw media item to the UI model.
 * @param {ProductionFeedMediaItem|null|undefined} item
 * @returns {ProductionFeedMedia|null}
 */
export function mapMediaItem(item) {
  if (!item) return null

  return {
    mediaId: item.media_id ?? null,
    mediaType: item.media_type || 'photo',
    filePath: item.file_path || '',
    mimeType: item.mime_type || null,
    fileSize: item.file_size != null ? item.file_size : null,
    thumbnail: item.thumbnail || null,
    duration: item.duration != null ? item.duration : null,
    sortOrder: item.sort_order != null ? item.sort_order : 0
  }
}

/**
 * Map a raw post detail (GET /production-feed/:id|:slug) to the UI model,
 * including its media list ordered by sort_order.
 * @param {ProductionFeedRawPost|null|undefined} post
 * @returns {ProductionFeedPostDetail|null}
 */
export function mapPostDetail(post) {
  const base = mapPost(post)
  if (!base) return null

  const media = (Array.isArray(post.media) ? post.media : [])
    .map(mapMediaItem)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { ...base, media }
}
