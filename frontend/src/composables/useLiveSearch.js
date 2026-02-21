import { ref, watch, unref } from 'vue'
import { api } from '@/lib/api'

export function useLiveSearch(options = {}) {
  const { 
    endpoint = '/api/films', 
    limit = 10, 
    debounceMs = 300,
    initialStatus = 'published',
    status: statusOption = null
  } = options

  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)
  const showResults = ref(false)
  const error = ref(null)
  const status = ref(statusOption !== null ? unref(statusOption) : initialStatus)
  let searchTimeout = null
  let currentSearchQuery = ''
  let abortController = null

  // Watch status option if it's reactive (computed/ref)
  if (statusOption !== null) {
    watch(() => unref(statusOption), (newStatus) => {
      status.value = newStatus
    }, { immediate: true })
  }

  const performSearch = async () => {
    const query = searchQuery.value.trim()
    
    // Cancel previous request if any
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    if (!query) {
      searchResults.value = []
      showResults.value = false
      error.value = null
      return
    }

    currentSearchQuery = query
    isSearching.value = true
    showResults.value = true
    error.value = null
    
    try {
      const searchParams = { 
        search: query, 
        limit,
        status: status.value
      }

      const res = await api.get(endpoint, {
        params: searchParams,
        signal: abortController.signal
      })
      
      if (currentSearchQuery === query) {
        searchResults.value = res.data || []
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      
      if (currentSearchQuery === query) {
        console.error('Search failed:', err)
        searchResults.value = []
        error.value = 'Gagal memuat hasil pencarian'
      }
    } finally {
      if (currentSearchQuery === query && !abortController.signal.aborted) {
        isSearching.value = false
      }
    }
  }

  watch(searchQuery, (newVal) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    const query = newVal.trim()
    
    if (!query) {
      if (abortController) abortController.abort()
      searchResults.value = []
      showResults.value = false
      currentSearchQuery = ''
      error.value = null
      return
    }
    
    searchTimeout = setTimeout(performSearch, debounceMs)
  })

  const clearSearch = () => {
    if (abortController) abortController.abort()
    searchQuery.value = ''
    searchResults.value = []
    showResults.value = false
    currentSearchQuery = ''
    error.value = null
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    showResults,
    error,
    performSearch,
    clearSearch
  }
}
