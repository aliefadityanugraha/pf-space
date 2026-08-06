/**
 * frontend/src/modules/production-feed/editor.js
 *
 * Pure helpers for the Production Feed editor form: form model,
 * post <-> form mapping, media helpers, validation, and dirty tracking.
 * No Vue imports — fully unit-testable.
 */

/**
 * Post type (tipe) options shown in the editor.
 * @type {Array<{value: string, label: string}>}
 */
export const TIPE_OPTIONS = [
  { value: 'progress', label: 'Progress' },
  { value: 'behind_the_scenes', label: 'Behind The Scenes' },
  { value: 'casting', label: 'Casting' },
  { value: 'announcement', label: 'Pengumuman' },
  { value: 'wrap', label: 'Wrap' }
]

/**
 * Visibility options.
 * @type {Array<{value: string, label: string}>}
 */
export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Publik' },
  { value: 'private', label: 'Privat' }
]

let idCounter = 0

/**
 * Generate a stable unique id for media rows in the form (v-for keys).
 * @returns {string}
 */
export function nextMediaId() {
  idCounter += 1
  return `media-${idCounter}`
}

/**
 * Strip HTML to a plain-text preview.
 * @param {string} [html]
 * @returns {string}
 */
export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Create an empty editor form.
 * @returns {object}
 */
export function createInitialForm() {
  return {
    judul: '',
    isi_konten: '',
    tipe: '',
    category_id: null,
    film_id: null,
    visibility: 'public',
    gambar_cover: '',
    media: [],
    tags: []
  }
}

/**
 * Map a raw API post (getById shape) into the editor form model.
 * @param {object|null} post - Raw post from GET /production-feed/:id
 * @returns {object} Editor form
 */
export function postToForm(post) {
  if (!post) return createInitialForm()

  const media = (Array.isArray(post.media) ? post.media : []).map((item) => ({
    localId: nextMediaId(),
    media_type: item.media_type || 'photo',
    file_path: item.file_path || '',
    mime_type: item.mime_type || null,
    file_size: item.file_size != null ? item.file_size : null,
    thumbnail: item.thumbnail || null,
    duration: item.duration != null ? item.duration : null,
    sort_order: item.sort_order != null ? item.sort_order : 0
  }))

  const tags = (Array.isArray(post.tags) ? post.tags : [])
    .map((tag) => tag?.nama_tag || tag?.name || '')
    .map((name) => String(name).trim())
    .filter(Boolean)

  return {
    judul: post.judul || '',
    isi_konten: post.isi_konten || '',
    tipe: post.tipe || '',
    category_id: post.category_id != null ? Number(post.category_id) : null,
    film_id: post.film_id != null ? Number(post.film_id) : null,
    visibility: post.visibility === 'private' ? 'private' : 'public',
    gambar_cover: post.gambar_cover || '',
    media,
    tags
  }
}

/**
 * Serialize a form into the API payload (productionPostCreateSchema /
 * productionPostUpdateSchema shape).
 * @param {object} form - Editor form
 * @returns {object} API payload
 */
export function formToPayload(form) {
  const media = (Array.isArray(form.media) ? form.media : [])
    .filter((item) => item && item.file_path)
    .map((item, index) => {
      const row = {
        media_type: item.media_type || 'photo',
        file_path: item.file_path,
        sort_order: item.sort_order != null ? item.sort_order : index
      }
      if (item.mime_type) row.mime_type = item.mime_type
      if (item.file_size != null) row.file_size = Number(item.file_size)
      if (item.thumbnail) row.thumbnail = item.thumbnail
      if (item.duration != null) row.duration = Number(item.duration)
      return row
    })

  const payload = {
    judul: String(form.judul || '').trim(),
    isi_konten: form.isi_konten || '',
    visibility: form.visibility === 'private' ? 'private' : 'public',
    gambar_cover: form.gambar_cover || '',
    media,
    tags: Array.isArray(form.tags)
      ? form.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : []
  }

  if (form.tipe) payload.tipe = form.tipe
  if (form.category_id != null && form.category_id !== '') {
    payload.category_id = Number(form.category_id)
  }
  if (form.film_id != null && form.film_id !== '') {
    payload.film_id = Number(form.film_id)
  }

  return payload
}

/**
 * Determine the media type for a File object.
 * @param {File} file
 * @returns {'photo'|'video'|'pdf'}
 */
export function fileToMediaType(file) {
  const type = String(file?.type || '').toLowerCase()
  if (type.startsWith('video/')) return 'video'
  if (type === 'application/pdf' || type.includes('pdf')) return 'pdf'
  return 'photo'
}

/**
 * Build a media form row from an uploaded file path.
 * @param {object} opts
 * @param {'photo'|'video'|'pdf'} opts.media_type
 * @param {string} opts.file_path - /uploads/<subfolder>/<id>
 * @param {string|null} [opts.mime_type]
 * @param {number|null} [opts.file_size]
 * @param {string|null} [opts.thumbnail]
 * @param {number|null} [opts.duration]
 * @returns {object} Media form row
 */
export function makeMediaItem({ media_type, file_path, mime_type = null, file_size = null, thumbnail = null, duration = null }) {
  return {
    localId: nextMediaId(),
    media_type,
    file_path,
    mime_type,
    file_size,
    thumbnail,
    duration,
    sort_order: 0
  }
}

/**
 * Move a media row from one index to another (pure).
 * @param {object[]} media
 * @param {number} from
 * @param {number} to
 * @returns {object[]} New media array
 */
export function moveMediaItem(media, from, to) {
  if (!Array.isArray(media) || media.length === 0) return media
  if (from === to) return media
  const clampedTo = Math.max(0, Math.min(to, media.length - 1))
  const next = [...media]
  const [item] = next.splice(from, 1)
  next.splice(clampedTo, 0, item)
  return next
}

/**
 * Remove a media row by localId (pure).
 * @param {object[]} media
 * @param {string} localId
 * @returns {object[]} New media array
 */
export function removeMediaItem(media, localId) {
  return (Array.isArray(media) ? media : []).filter((item) => item.localId !== localId)
}

/**
 * Validate the editor form.
 * @param {object} form
 * @param {object} [opts]
 * @param {boolean} [opts.forPublish=false] - Require content when publishing
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateForm(form, { forPublish = false } = {}) {
  const errors = {}

  const judul = String(form?.judul || '').trim()
  if (!judul) {
    errors.judul = 'Judul wajib diisi'
  } else if (judul.length > 255) {
    errors.judul = 'Judul maksimal 255 karakter'
  }

  if (forPublish) {
    const hasContent = stripHtml(form?.isi_konten).length > 0
    const hasMedia = Array.isArray(form?.media) && form.media.length > 0
    const hasCover = Boolean(form?.gambar_cover)
    if (!hasContent && !hasMedia && !hasCover) {
      errors.content = 'Tambahkan isi konten, media, atau cover sebelum mempublikasikan'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Deep-compare two forms for the unsaved-changes guard.
 * @param {object} a - Baseline (snapshot after load/save)
 * @param {object} b - Current form
 * @returns {boolean} True when there are unsaved changes
 */
export function isFormDirty(a, b) {
  const normalize = (form) => ({
    judul: String(form?.judul || ''),
    isi_konten: String(form?.isi_konten || ''),
    tipe: form?.tipe || '',
    category_id: form?.category_id ?? null,
    film_id: form?.film_id ?? null,
    visibility: form?.visibility || 'public',
    gambar_cover: form?.gambar_cover || '',
    media: (Array.isArray(form?.media) ? form.media : []).map((item) => ({
      media_type: item?.media_type || 'photo',
      file_path: item?.file_path || '',
      thumbnail: item?.thumbnail || null,
      duration: item?.duration != null ? item.duration : null,
      sort_order: item?.sort_order ?? 0
    })),
    tags: (Array.isArray(form?.tags) ? form.tags : [])
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .sort()
  })

  return JSON.stringify(normalize(a)) !== JSON.stringify(normalize(b))
}
