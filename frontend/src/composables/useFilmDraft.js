/**
 * Composable untuk mengelola draft form film
 * Auto-save ke localStorage untuk mencegah kehilangan data saat upload terputus
 */

import { ref, watch } from 'vue'

const DRAFT_KEY = 'film_draft'
const DRAFT_TIMESTAMP_KEY = 'film_draft_timestamp'
const DRAFT_EXPIRY_DAYS = 7 // Draft akan expired setelah 7 hari

export function useFilmDraft() {
  const hasDraft = ref(false)
  const draftTimestamp = ref(null)

  /**
   * Simpan draft ke localStorage
   */
  const saveDraft = (formData) => {
    try {
      const timestamp = new Date().toISOString()
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, timestamp)
      draftTimestamp.value = timestamp
      hasDraft.value = true
      console.log('[Draft] Saved:', timestamp)
    } catch (error) {
      console.error('[Draft] Failed to save:', error)
    }
  }

  /**
   * Load draft dari localStorage
   */
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY)

      if (!draft || !timestamp) {
        return null
      }

      // Check if draft is expired
      const draftDate = new Date(timestamp)
      const now = new Date()
      const daysDiff = (now - draftDate) / (1000 * 60 * 60 * 24)

      if (daysDiff > DRAFT_EXPIRY_DAYS) {
        console.log('[Draft] Expired, clearing...')
        clearDraft()
        return null
      }

      hasDraft.value = true
      draftTimestamp.value = timestamp
      return JSON.parse(draft)
    } catch (error) {
      console.error('[Draft] Failed to load:', error)
      return null
    }
  }

  /**
   * Hapus draft dari localStorage
   */
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY)
      hasDraft.value = false
      draftTimestamp.value = null
      console.log('[Draft] Cleared')
    } catch (error) {
      console.error('[Draft] Failed to clear:', error)
    }
  }

  /**
   * Check apakah ada draft yang tersimpan
   */
  const checkDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY)
    const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY)
    
    if (draft && timestamp) {
      const draftDate = new Date(timestamp)
      const now = new Date()
      const daysDiff = (now - draftDate) / (1000 * 60 * 60 * 24)

      if (daysDiff <= DRAFT_EXPIRY_DAYS) {
        hasDraft.value = true
        draftTimestamp.value = timestamp
        return true
      }
    }
    
    return false
  }

  /**
   * Format timestamp untuk display
   */
  const formatDraftTime = () => {
    if (!draftTimestamp.value) return ''
    
    const date = new Date(draftTimestamp.value)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    return `${diffDays} hari yang lalu`
  }

  /**
   * Auto-save dengan debounce
   */
  const createAutoSave = (formRef, delay = 2000) => {
    let timeoutId = null

    const stopAutoSave = watch(
      formRef,
      (newValue) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
          // Hanya save jika ada data yang diisi
          const hasData = 
            newValue.judul || 
            newValue.sinopsis || 
            newValue.link_video_utama ||
            newValue.link_trailer ||
            newValue.gambar_poster

          if (hasData) {
            saveDraft(newValue)
          }
        }, delay)
      },
      { deep: true }
    )

    return stopAutoSave
  }

  return {
    hasDraft,
    draftTimestamp,
    saveDraft,
    loadDraft,
    clearDraft,
    checkDraft,
    formatDraftTime,
    createAutoSave
  }
}
