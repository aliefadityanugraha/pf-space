/**
 * frontend/src/modules/production-feed/useProductionFeedEditor.js
 *
 * Composable for the Production Feed creator experience (create + edit).
 * Owns the form model, lookups (categories/tags/films), TUS uploads,
 * validation, dirty tracking (unsaved-changes guard), and the
 * draft / publish submit flows.
 *
 * No autosave: drafts are saved explicitly by the creator; leaving the
 * page with unsaved changes triggers the in-page confirm dialog.
 */

import { ref, computed, unref } from 'vue'
import { api } from '@/lib/api'
import { uploadFileTus } from '@/lib/uploadFileTus'
import {
  createFeedPost,
  updateFeedPost,
  publishFeedPost,
  deleteFeedPost,
  fetchPostDetail,
  fetchFeedTags,
  fetchMyFilms
} from './api'
import {
  createInitialForm,
  postToForm,
  formToPayload,
  fileToMediaType,
  makeMediaItem,
  moveMediaItem,
  removeMediaItem,
  validateForm,
  isFormDirty
} from './editor'

const LIMITS = {
  photo: 10 * 1024 * 1024, // 10MB
  pdf: 10 * 1024 * 1024, // 10MB
  video: 4 * 1024 * 1024 * 1024 // 4GB
}

export function useProductionFeedEditor({ mode = 'create' } = {}) {
  const isEdit = mode === 'edit'

  // Form state
  const form = ref(createInitialForm())
  const baseline = ref(null)
  const postId = ref(null)
  const currentStatus = ref('draft')

  // Lookups
  const categories = ref([])
  const tags = ref([])
  const films = ref([])
  const lookupsLoading = ref(false)

  // Initial load (edit mode)
  const isLoading = ref(false)
  const loadError = ref(null)

  // Submit / upload state
  const submitting = ref(false)
  const formError = ref(null)
  const errors = ref({})
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const activeUpload = ref(null) // { file, mediaType }

  const isDirty = computed(() => isFormDirty(baseline.value, form.value))
  const canSubmit = computed(() => !submitting.value && !uploading.value)

  /**
   * Reset the dirty baseline to the current form (after load/save).
   */
  const resetBaseline = () => {
    baseline.value = JSON.parse(JSON.stringify(form.value))
  }

  /**
   * Load lookup data (categories, tags, films) for the editor panels.
   */
  const loadLookups = async () => {
    lookupsLoading.value = true
    try {
      const [categoriesRes, tagsRes, filmsRes] = await Promise.all([
        api.get('/api/categories'),
        fetchFeedTags(),
        fetchMyFilms()
      ])
      categories.value = Array.isArray(categoriesRes?.data) ? categoriesRes.data : []
      tags.value = Array.isArray(tagsRes) ? tagsRes : []
      films.value = Array.isArray(filmsRes) ? filmsRes : []
    } catch (err) {
      console.error('Failed to load editor lookups:', err)
    } finally {
      lookupsLoading.value = false
    }
  }

  /**
   * Load an existing post into the editor (edit mode).
   * @param {number|string} id - Numeric post ID
   */
  const initEdit = async (id) => {
    isLoading.value = true
    loadError.value = null
    try {
      const post = await fetchPostDetail(id)
      if (!post) {
        loadError.value = 'Post tidak ditemukan atau tidak dapat diakses.'
        return
      }
      postId.value = post.post_id
      currentStatus.value = post.status || 'draft'
      form.value = postToForm(post)
      resetBaseline()
      await loadLookups()

      // Ensure the linked film is visible even when it's not in my-films
      const filmId = form.value.film_id
      if (filmId && !films.value.some((film) => Number(film.film_id) === Number(filmId))) {
        try {
          const res = await api.get(`/api/films/${filmId}`)
          if (res?.data?.film_id) films.value = [res.data, ...films.value]
        } catch {
          // Non-fatal — film label may be missing, post still editable
        }
      }
    } catch (err) {
      loadError.value = err?.message || 'Gagal memuat post.'
    } finally {
      isLoading.value = false
    }
  }

  // --- Tag helpers ---

  /**
   * Add one or more tags (comma/Enter separated, deduped, max 10).
   * @param {string} raw
   */
  const addTags = (raw) => {
    const incoming = String(raw || '')
      .split(/[,;]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    const current = form.value.tags
    const seen = new Set(current.map((t) => t.toLowerCase()))
    for (const tag of incoming) {
      if (current.length >= 10) break
      const key = tag.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        current.push(tag)
      }
    }
    form.value.tags = [...current]
  }

  /**
   * Remove a tag by value.
   * @param {string} tag
   */
  const removeTag = (tag) => {
    form.value.tags = form.value.tags.filter((t) => t !== tag)
  }

  // --- Media helpers ---

  const addToFormMedia = (item) => {
    form.value.media = [...form.value.media, item]
  }

  /**
   * Move a gallery item up/down (reorder).
   * @param {string} localId
   * @param {number} direction - -1 or 1
   */
  const moveMedia = (localId, direction) => {
    const index = form.value.media.findIndex((item) => item.localId === localId)
    if (index === -1) return
    form.value.media = moveMediaItem(form.value.media, index, index + direction)
  }

  /**
   * Remove a gallery item.
   * @param {string} localId
   */
  const removeMedia = (localId) => {
    form.value.media = removeMediaItem(form.value.media, localId)
  }

  /**
   * Set a cover image path (replaces the previous cover).
   * @param {string} filePath - /uploads/images/<id>
   */
  const setCover = (filePath) => {
    form.value.gambar_cover = filePath
  }

  // --- Upload flow ---

  const validateFile = (file, mediaType) => {
    const limit = LIMITS[mediaType] || LIMITS.photo
    if (file.size > limit) {
      const mb = (limit / (1024 * 1024)).toFixed(0)
      throw new Error(
        mediaType === 'video'
          ? `Ukuran video terlalu besar (maksimal ${mb}GB)`
          : `Ukuran file terlalu besar (maksimal ${mb}MB)`
      )
    }
  }

  const hintForMediaType = (mediaType) =>
    mediaType === 'video' ? 'video' : mediaType === 'pdf' ? 'pdf' : 'images'

  /**
   * Start an upload for a selected file.
   * Video files open the progress modal; photos/PDFs upload inline.
   * @param {File} file
   * @param {('cover'|'gallery')} target
   */
  const selectFile = (file, target) => {
    if (!file) return
    const mediaType = fileToMediaType(file)

    if (target === 'cover') {
      if (mediaType !== 'photo') {
        formError.value = 'Cover harus berupa gambar (JPG, PNG, WebP).'
        return
      }
    }

    try {
      validateFile(file, mediaType)
    } catch (err) {
      formError.value = err.message
      return
    }

    if (mediaType === 'video') {
      activeUpload.value = { file, mediaType, target }
      return
    }

    void performUpload(file, mediaType, target)
  }

  /**
   * Confirm the pending video upload from the progress modal.
   */
  const startActiveUpload = async () => {
    const current = activeUpload.value
    if (!current) return
    await performUpload(current.file, current.mediaType, current.target)
  }

  const cancelActiveUpload = () => {
    activeUpload.value = null
    uploadProgress.value = 0
  }

  const performUpload = async (file, mediaType, target) => {
    uploading.value = true
    formError.value = null
    uploadProgress.value = 0
    try {
      const filePath = await uploadFileTus(file, (percent) => {
        uploadProgress.value = percent
      }, hintForMediaType(mediaType))

      if (target === 'cover') {
        setCover(filePath)
      } else {
        addToFormMedia(
          makeMediaItem({
            media_type: mediaType,
            file_path: filePath,
            mime_type: file.type || null,
            file_size: file.size || null
          })
        )
      }
      cancelActiveUpload()
      return filePath
    } catch (err) {
      console.error('Upload failed:', err)
      formError.value = `Gagal mengunggah file: ${err?.message || 'Server error'}`
      cancelActiveUpload()
      return null
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  // --- Submit flows ---

  const runValidation = (forPublish) => {
    const result = validateForm(form.value, { forPublish })
    errors.value = result.errors
    return result.valid
  }

  /**
   * Save as draft (create or update). Keeps current status.
   * @returns {Promise<object|null>} Saved post or null on failure
   */
  const saveDraft = async () => {
    if (!canSubmit.value) return null
    if (!runValidation(false)) return null

    submitting.value = true
    submitAction.value = 'draft'
    formError.value = null
    try {
      let post
      if (isEdit && postId.value) {
        post = await updateFeedPost(postId.value, formToPayload(form.value))
      } else {
        post = await createFeedPost(formToPayload(form.value))
        postId.value = post.post_id
        currentStatus.value = post.status || 'draft'
      }
      currentStatus.value = post.status || currentStatus.value
      resetBaseline()
      return post
    } catch (err) {
      formError.value = err?.message || 'Gagal menyimpan draft.'
      return null
    } finally {
      submitting.value = false
      submitAction.value = null
    }
  }

  /**
   * Publish the post (create/update first, then set status published).
   * @returns {Promise<object|null>} Published post or null on failure
   */
  const publish = async () => {
    if (!canSubmit.value) return null
    if (!runValidation(true)) return null

    submitting.value = true
    submitAction.value = 'publish'
    formError.value = null
    try {
      let post
      if (isEdit && postId.value) {
        post = await updateFeedPost(postId.value, formToPayload(form.value))
        if (currentStatus.value !== 'published') {
          post = await publishFeedPost(postId.value)
        }
      } else {
        post = await createFeedPost(formToPayload(form.value))
        postId.value = post.post_id
        post = await publishFeedPost(post.post_id)
      }
      currentStatus.value = 'published'
      resetBaseline()
      return post
    } catch (err) {
      formError.value = err?.message || 'Gagal mempublikasikan post.'
      return null
    } finally {
      submitting.value = false
      submitAction.value = null
    }
  }

  /**
   * Delete the current post (edit mode).
   * @returns {Promise<boolean>} True on success
   */
  const deletePost = async () => {
    if (!isEdit || !postId.value) return false
    submitting.value = true
    submitAction.value = 'delete'
    formError.value = null
    try {
      await deleteFeedPost(postId.value)
      return true
    } catch (err) {
      formError.value = err?.message || 'Gagal menghapus postingan.'
      return false
    } finally {
      submitting.value = false
      submitAction.value = null
    }
  }

  const submitAction = ref(null) // 'draft' | 'publish' | 'delete' | null

  return {
    // State
    form,
    baseline,
    postId,
    currentStatus,
    isEdit,
    // Lookups
    categories,
    tags,
    films,
    lookupsLoading,
    // Loading / errors
    isLoading,
    loadError,
    formError,
    errors,
    submitting,
    uploading,
    uploadProgress,
    activeUpload,
    submitAction,
    // Computed
    isDirty,
    canSubmit,
    // Actions
    initEdit,
    loadLookups,
    addTags,
    removeTag,
    moveMedia,
    removeMedia,
    setCover,
    selectFile,
    startActiveUpload,
    cancelActiveUpload,
    saveDraft,
    publish,
    deletePost,
    resetBaseline
  }
}
