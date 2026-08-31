<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Film, Search, Loader2, Eye, Check, X, Trash2, AlertTriangle, 
  CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, 
  Sparkles, RefreshCw, Plus, Layers, User, Users,
  ExternalLink, Video, LayoutGrid, LayoutList,
  Play, CheckSquare, FileText, BookOpen, Clapperboard,
  Download, UserCheck, Shield, Lock, FileCode
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/PageHeader.vue'
import AdminPosterImage from '@/components/AdminPosterImage.vue'

const route = useRoute()
const { toast, showToast } = useToast()

// View Mode: 'table' or 'grid'
const viewMode = ref('table')

// Data states
const Karyas = ref([])
const categories = ref([])
const loading = ref(true)
const isRefreshing = ref(false)
const actionLoading = ref(false)
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 })

// KPI Counts
const stats = ref({
  total: 0,
  pending: 0,
  published: 0,
  rejected: 0
})

// Filters & Sorting
const statusFilter = ref('all')
const categoryFilter = ref('all')
const limitFilter = ref('12')
const sortBy = ref('films.created_at')
const sortOrder = ref('desc')
const searchQuery = ref('')

// Batch Selection
const selectedIds = ref([])

// Modal states
const showDetailModal = ref(false)
const detailLoading = ref(false)
const activeDetailTab = ref('visual') // 'visual', 'crew', 'content', 'media', 'docs'
const activeDocType = ref('naskah') // 'naskah', 'storyboard', 'rab'
const showPdfDropdown = ref(false)
const showVideoModal = ref(false)
const showConfirm = ref(false)
const selectedKarya = ref(null)
const confirmAction = ref({ type: '', karya: null, isBatch: false })
const rejectionReason = ref('')

const togglePdfDropdown = () => {
  showPdfDropdown.value = !showPdfDropdown.value
}

const selectPdfDoc = (type) => {
  activeDetailTab.value = 'docs'
  activeDocType.value = type
  showPdfDropdown.value = false
}

// Prevent background scrolling when any modal is open
watch([showDetailModal, showVideoModal, showConfirm], ([d, v, c]) => {
  if (d || v || c) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

// Status labels map
const statusLabels = {
  pending: 'Menunggu',
  published: 'Dipublikasi',
  rejected: 'Ditolak'
}

// Creator name resolver
const getCreatorName = (karya) => {
  if (!karya) return 'Anonim'
  if (karya.creator?.name) return karya.creator.name
  if (karya.sutradara) return karya.sutradara
  if (Array.isArray(karya.crew)) {
    const director = karya.crew.find(c => c.jabatan?.toLowerCase().includes('sutradara'))
    if (director && Array.isArray(director.anggota) && director.anggota.length > 0) {
      const first = director.anggota[0]
      return typeof first === 'object' && first !== null ? (first.name || first.nama) : String(first)
    }
  }
  return 'Anonim'
}

// Video URL parser for embedded player
const getEmbedUrl = (url) => {
  if (!url) return ''
  if (url.includes('youtube.com/watch')) {
    try {
      const v = new URL(url).searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}?autoplay=1` : url
    } catch {
      return url
    }
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url
  }
  return assetUrl(url)
}

const isDirectVideo = (url) => {
  if (!url) return false
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('/uploads/videos/')
}

// Fetch categories for filtering
const fetchCategories = async () => {
  try {
    const res = await api.get('/api/categories')
    categories.value = res.data || []
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

// Fetch Stats summary
const fetchStats = async () => {
  try {
    const [allRes, pendingRes, pubRes, rejRes] = await Promise.all([
      api.get('/api/films?limit=1&status=all').catch(() => ({ pagination: { total: 0 } })),
      api.get('/api/films?limit=1&status=pending').catch(() => ({ pagination: { total: 0 } })),
      api.get('/api/films?limit=1&status=published').catch(() => ({ pagination: { total: 0 } })),
      api.get('/api/films?limit=1&status=rejected').catch(() => ({ pagination: { total: 0 } }))
    ])

    stats.value = {
      total: allRes.pagination?.total || 0,
      pending: pendingRes.pagination?.total || 0,
      published: pubRes.pagination?.total || 0,
      rejected: rejRes.pagination?.total || 0
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err)
  }
}

// Fetch Karyas list
const fetchKaryas = async (showFullLoader = true) => {
  if (showFullLoader) {
    loading.value = true
  }
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    
    if (limitFilter.value === 'all') {
      params.append('limit', '1000')
    } else {
      params.append('limit', limitFilter.value)
    }
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }

    if (categoryFilter.value !== 'all') {
      params.append('category_id', categoryFilter.value)
    }

    params.append('sortBy', sortBy.value)
    params.append('sortOrder', sortOrder.value)
    
    const res = await api.get(`/api/films?${params.toString()}`)
    Karyas.value = res.data || []
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination }
    }
  } catch (err) {
    console.error('Failed to fetch archives:', err)
    showToast('Gagal memuat data arsip film', 'error')
  } finally {
    loading.value = false
  }
}

// Manual refresh handler without intrusive popups
const handleManualRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await Promise.all([fetchKaryas(false), fetchStats()])
  } catch (err) {
    console.error('Refresh error:', err)
  } finally {
    isRefreshing.value = false
  }
}

// Search with debounce
let searchTimeout = null
const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchKaryas(true)
  }, 300)
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  categoryFilter.value = 'all'
  limitFilter.value = '12'
  sortBy.value = 'films.created_at'
  sortOrder.value = 'desc'
  pagination.value.page = 1
  selectedIds.value = []
  fetchKaryas(true)
  fetchStats()
}

// Change page
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage
    fetchKaryas(true)
  }
}

// Change filter
const changeFilter = (status) => {
  statusFilter.value = status
  pagination.value.page = 1
  selectedIds.value = []
  fetchKaryas(true)
}

// Selection helpers
const isAllSelected = computed(() => {
  return Karyas.value.length > 0 && selectedIds.value.length === Karyas.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = Karyas.value.map(k => k.film_id)
  }
}

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// Quick Video Preview modal
const openVideoPreview = (karya) => {
  selectedKarya.value = karya
  showVideoModal.value = true
}

// View Karya comprehensive detail
const viewKarya = async (karya) => {
  selectedKarya.value = { ...karya }
  activeDetailTab.value = 'visual'
  activeDocType.value = 'naskah'
  showDetailModal.value = true
  detailLoading.value = true
  
  try {
    const res = await api.get(`/api/films/${karya.film_id}`)
    if (res.data) {
      selectedKarya.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch full film detail:', err)
  } finally {
    detailLoading.value = false
  }
}

// Inline toggle banner carousel (Only published films allowed)
const toggleInlineBanner = async (karya) => {
  if (karya.status !== 'published') {
    showToast('Banner carousel hanya dapat diaktifkan untuk film yang telah dipublikasikan', 'error')
    return
  }

  const targetState = !karya.is_banner_active
  try {
    await api.put(`/api/films/${karya.film_id}`, {
      is_banner_active: targetState
    })
    karya.is_banner_active = targetState ? 1 : 0
    if (selectedKarya.value && selectedKarya.value.film_id === karya.film_id) {
      selectedKarya.value.is_banner_active = targetState ? 1 : 0
    }
    showToast(targetState ? 'Film diaktifkan pada Banner Carousel' : 'Film dinonaktifkan dari Banner Carousel', 'success')
  } catch (err) {
    console.error('Failed to toggle banner:', err)
    showToast('Gagal mengubah status banner', 'error')
  }
}

// Confirm single action dialog
const confirmActionDialog = (type, karya) => {
  confirmAction.value = { type, karya, isBatch: false }
  if (type === 'reject') {
    rejectionReason.value = ''
  }
  showConfirm.value = true
}

// Confirm batch action dialog
const confirmBatchActionDialog = (type) => {
  if (selectedIds.value.length === 0) return
  confirmAction.value = { type, karya: null, isBatch: true }
  if (type === 'reject') {
    rejectionReason.value = ''
  }
  showConfirm.value = true
}

// Execute action (single or batch)
const executeAction = async () => {
  const { type, karya, isBatch } = confirmAction.value
  actionLoading.value = true
  
  try {
    if (isBatch) {
      if (type === 'approve') {
        await Promise.all(selectedIds.value.map(id => api.patch(`/api/films/${id}/approve`, {})))
        showToast(`${selectedIds.value.length} karya berhasil disetujui & dipublikasi`, 'success')
      } else if (type === 'delete') {
        await Promise.all(selectedIds.value.map(id => api.delete(`/api/films/${id}`)))
        showToast(`${selectedIds.value.length} karya berhasil dihapus`, 'success')
      }
      selectedIds.value = []
    } else {
      if (type === 'approve') {
        await api.patch(`/api/films/${karya.film_id}/approve`, {})
        showToast(`Karya "${karya.judul}" berhasil dipublikasi`, 'success')
      } else if (type === 'reject') {
        if (!rejectionReason.value.trim()) {
          showToast('Alasan penolakan wajib diisi', 'error')
          actionLoading.value = false
          return
        }
        await api.patch(`/api/films/${karya.film_id}/reject`, {
          rejection_reason: rejectionReason.value.trim()
        })
        showToast(`Karya "${karya.judul}" telah ditolak`, 'success')
      } else if (type === 'delete') {
        await api.delete(`/api/films/${karya.film_id}`)
        showToast(`Karya "${karya.judul}" berhasil dihapus`, 'success')
      }
    }

    showConfirm.value = false
    showDetailModal.value = false
    showVideoModal.value = false
    await Promise.all([fetchKaryas(false), fetchStats()])
  } catch (err) {
    showToast(err.message || 'Gagal melakukan aksi', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Watch filters
watch([categoryFilter, limitFilter, sortBy, sortOrder], () => {
  pagination.value.page = 1
  selectedIds.value = []
  fetchKaryas(true)
})

onMounted(() => {
  if (route.query.status) {
    statusFilter.value = route.query.status
  }
  if (route.query.category_id || route.query.category) {
    categoryFilter.value = route.query.category_id || route.query.category
  }
  fetchCategories()
  fetchStats()
  fetchKaryas(true)
})
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 text-stone-900 dark:text-stone-100">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">
        Manajemen Arsip
      </Badge>
    </nav>

    <!-- Page Header & Action Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <PageHeader 
        title="Manajemen Arsip Film" 
        description="Kelola, verifikasi, dan moderasi seluruh katalog karya film yang diunggah kreator."
        icon-color="bg-brand-teal"
      />
      <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
          @click="handleManualRefresh"
          :disabled="isRefreshing"
          title="Segarkan Data Arsip"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
          <span>{{ isRefreshing ? 'Menyegarkan...' : 'Refresh' }}</span>
        </button>
        <router-link
          to="/upload"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Unggah Karya</span>
        </router-link>
      </div>
    </div>

    <!-- 4 KPI Stat Cards (Click card to filter status directly) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
      <!-- Total Semua Arsip -->
      <button 
        type="button"
        @click="changeFilter('all')"
        class="p-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center gap-3 text-left transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800"
        :class="{ 'ring-2 ring-brand-teal': statusFilter === 'all' }"
      >
        <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shrink-0">
          <Layers class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="block text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">Total Arsip</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm md:text-base font-black font-mono leading-none">{{ stats.total }}</span>
            <span class="text-[10px] text-stone-500 font-mono">film</span>
          </div>
        </div>
      </button>

      <!-- Menunggu Moderasi -->
      <button 
        type="button"
        @click="changeFilter('pending')"
        class="p-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center gap-3 text-left transition-all cursor-pointer hover:bg-yellow-50/50 dark:hover:bg-stone-800"
        :class="{ 'ring-2 ring-yellow-400': statusFilter === 'pending', 'bg-yellow-50/60 dark:bg-yellow-950/20': stats.pending > 0 }"
      >
        <div class="w-9 h-9 bg-yellow-400 text-stone-950 border-2 border-black dark:border-stone-100 flex items-center justify-center shrink-0">
          <Clock class="w-4 h-4 stroke-[2.5]" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="block text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">Menunggu Review</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm md:text-base font-black font-mono leading-none" :class="{ 'text-yellow-600 dark:text-yellow-400': stats.pending > 0 }">
              {{ stats.pending }}
            </span>
            <span class="text-[10px] text-stone-500 font-mono">perlu tinjau</span>
          </div>
        </div>
      </button>

      <!-- Dipublikasi -->
      <button 
        type="button"
        @click="changeFilter('published')"
        class="p-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center gap-3 text-left transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800"
        :class="{ 'ring-2 ring-brand-teal': statusFilter === 'published' }"
      >
        <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shrink-0">
          <CheckCircle class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="block text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">Dipublikasi</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm md:text-base font-black font-mono leading-none">{{ stats.published }}</span>
            <span class="text-[10px] text-stone-500 font-mono">aktif</span>
          </div>
        </div>
      </button>

      <!-- Ditolak -->
      <button 
        type="button"
        @click="changeFilter('rejected')"
        class="p-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center gap-3 text-left transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800"
        :class="{ 'ring-2 ring-brand-red': statusFilter === 'rejected' }"
      >
        <div class="w-9 h-9 bg-brand-red text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shrink-0">
          <XCircle class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="block text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">Ditolak</span>
          <div class="flex items-baseline gap-1">
            <span class="text-sm md:text-base font-black font-mono leading-none" :class="{ 'text-brand-red': stats.rejected > 0 }">
              {{ stats.rejected }}
            </span>
            <span class="text-[10px] text-stone-500 font-mono">ditolak</span>
          </div>
        </div>
      </button>
    </div>

    <!-- Filter & Search Toolbar (Single Responsive Container) -->
    <Card class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900">
      <CardContent class="p-3.5 space-y-3">
        <!-- Top Toolbar: Search Input, Category, Limit & View Toggle -->
        <div class="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          <!-- Search Input -->
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input 
              v-model="searchQuery"
              @input="onSearch"
              placeholder="Cari judul film, sutradara, kreator..."
              class="pl-9 text-xs h-9 bg-stone-50 dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''; onSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Secondary Filters Row -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Category Filter -->
            <select
              v-model="categoryFilter"
              @change="fetchKaryas(true)"
              class="text-xs h-9 px-2.5 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option v-for="cat in categories" :key="cat.category_id || cat.id" :value="cat.category_id || cat.id">
                {{ cat.nama_kategori }}
              </option>
            </select>

            <!-- Limit Filter -->
            <select
              v-model="limitFilter"
              @change="pagination.limit = Number(limitFilter); fetchKaryas(true)"
              class="text-xs h-9 px-2 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              <option value="12">12 / hal</option>
              <option value="24">24 / hal</option>
              <option value="48">48 / hal</option>
            </select>

            <!-- Reset Filters -->
            <button
              type="button"
              class="h-9 px-2.5 text-xs font-mono font-bold border-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 shadow-brutal-xs cursor-pointer"
              @click="resetFilters"
              title="Reset Semua Filter"
            >
              Reset
            </button>

            <!-- View Switcher (Table / Grid) -->
            <div class="inline-flex border-2 border-black dark:border-stone-100 shadow-brutal-xs overflow-hidden">
              <button
                type="button"
                @click="viewMode = 'table'"
                class="p-2 transition-colors cursor-pointer"
                :class="viewMode === 'table' ? 'bg-brand-teal text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'"
                title="Tampilan Tabel"
              >
                <LayoutList class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="viewMode = 'grid'"
                class="p-2 transition-colors cursor-pointer border-l-2 border-black dark:border-stone-100"
                :class="viewMode === 'grid' ? 'bg-brand-teal text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'"
                title="Tampilan Grid Galeri"
              >
                <LayoutGrid class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Segmented Status Tabs (Active Button Shows Yellow for Pending, Green for Published, Red for Rejected) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <span class="text-stone-500 dark:text-stone-400 font-bold uppercase text-[10px] mr-1 hidden sm:inline">Status:</span>
          
          <!-- All -->
          <button 
            type="button"
            @click="changeFilter('all')"
            class="px-3 py-1.5 border-2 transition-all cursor-pointer font-bold flex items-center gap-1.5 whitespace-nowrap"
            :class="statusFilter === 'all' 
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black'"
          >
            <Filter class="w-3.5 h-3.5" :class="statusFilter === 'all' ? 'text-white dark:text-stone-900' : 'text-brand-teal'" />
            <span>Semua</span>
            <span class="px-1.5 py-0.2 text-[10px] font-mono border" :class="statusFilter === 'all' ? 'bg-white/20 dark:bg-black/20 text-inherit border-current' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600'">
              {{ stats.total }}
            </span>
          </button>

          <!-- Pending (Yellow highlight) -->
          <button 
            type="button"
            @click="changeFilter('pending')"
            class="px-3 py-1.5 border-2 transition-all cursor-pointer font-bold flex items-center gap-1.5 whitespace-nowrap"
            :class="statusFilter === 'pending' 
              ? 'bg-yellow-400 text-stone-950 border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black'"
          >
            <Clock class="w-3.5 h-3.5 stroke-[2.5]" :class="statusFilter === 'pending' ? 'text-stone-950 stroke-[3]' : 'text-yellow-500'" />
            <span>Menunggu Review</span>
            <span class="px-1.5 py-0.2 text-[10px] font-mono border font-bold" :class="statusFilter === 'pending' ? 'bg-stone-950 text-yellow-300 border-black' : (stats.pending > 0 ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300')">
              {{ stats.pending }}
            </span>
          </button>

          <!-- Published (Teal/Green highlight) -->
          <button 
            type="button"
            @click="changeFilter('published')"
            class="px-3 py-1.5 border-2 transition-all cursor-pointer font-bold flex items-center gap-1.5 whitespace-nowrap"
            :class="statusFilter === 'published' 
              ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black'"
          >
            <CheckCircle class="w-3.5 h-3.5 stroke-[2.5]" :class="statusFilter === 'published' ? 'text-white' : 'text-emerald-500'" />
            <span>Dipublikasi</span>
            <span class="px-1.5 py-0.2 text-[10px] font-mono border" :class="statusFilter === 'published' ? 'bg-white/20 text-white border-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600'">
              {{ stats.published }}
            </span>
          </button>

          <!-- Rejected (Red highlight) -->
          <button 
            type="button"
            @click="changeFilter('rejected')"
            class="px-3 py-1.5 border-2 transition-all cursor-pointer font-bold flex items-center gap-1.5 whitespace-nowrap"
            :class="statusFilter === 'rejected' 
              ? 'bg-brand-red text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black'"
          >
            <XCircle class="w-3.5 h-3.5 stroke-[2.5]" :class="statusFilter === 'rejected' ? 'text-white' : 'text-red-500'" />
            <span>Ditolak</span>
            <span class="px-1.5 py-0.2 text-[10px] font-mono border" :class="statusFilter === 'rejected' ? 'bg-white/20 text-white border-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600'">
              {{ stats.rejected }}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>

    <!-- Batch Selection Action Bar (Appears when items are selected) -->
    <div 
      v-if="selectedIds.length > 0"
      class="p-3 bg-teal-50 dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal flex items-center justify-between gap-3 flex-wrap animate-in fade-in slide-in-from-top-2"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold bg-brand-teal text-white px-2 py-0.5 border border-black shadow-brutal-xs">
          {{ selectedIds.length }} karya dipilih
        </span>
        <button 
          type="button"
          @click="selectedIds = []"
          class="text-xs font-mono text-stone-500 hover:text-stone-900 dark:hover:text-white underline cursor-pointer"
        >
          Batal Pilih
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-teal text-white border-2 border-black shadow-brutal-xs hover:bg-teal-700 transition-all cursor-pointer"
          @click="confirmBatchActionDialog('approve')"
        >
          <Check class="w-3.5 h-3.5 stroke-[3]" />
          <span>Setujui Semua ({{ selectedIds.length }})</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-red text-white border-2 border-black shadow-brutal-xs hover:bg-red-700 transition-all cursor-pointer"
          @click="confirmBatchActionDialog('reject')"
        >
          <X class="w-3.5 h-3.5 stroke-[3]" />
          <span>Tolak Semua ({{ selectedIds.length }})</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-stone-900 text-white border-2 border-black shadow-brutal-xs hover:bg-black transition-all cursor-pointer"
          @click="confirmBatchActionDialog('delete')"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Hapus Semua ({{ selectedIds.length }})</span>
        </button>
      </div>
    </div>

    <!-- Main Content Area: Loading / Empty / Table / Grid -->
    <div v-if="loading" class="py-20 text-center space-y-3">
      <Loader2 class="w-10 h-10 animate-spin mx-auto text-brand-teal" />
      <p class="font-mono text-xs uppercase text-stone-500 dark:text-stone-400 font-bold">
        Memuat Data Arsip Film...
      </p>
    </div>

    <!-- Empty State -->
    <Card v-else-if="Karyas.length === 0" class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900">
      <CardContent class="py-16 text-center space-y-3">
        <Film class="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
        <h3 class="font-black text-lg text-stone-900 dark:text-stone-100 uppercase tracking-wide">
          Tidak Ada Arsip Film Ditemukan
        </h3>
        <p class="text-xs text-stone-500 dark:text-stone-400 font-mono max-w-md mx-auto">
          Tidak ada karya yang sesuai dengan filter atau kata kunci pencarian yang dipilih. Coba atur ulang filter pencarian Anda.
        </p>
        <button
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-teal text-white border-2 border-black shadow-brutal-xs hover:bg-teal-700 transition-all cursor-pointer"
          @click="resetFilters"
        >
          <span>Reset Semua Filter</span>
        </button>
      </CardContent>
    </Card>

    <!-- VIEW 1: DATA TABLE (Comfortable, Spacious Spacing) -->
    <Card v-else-if="viewMode === 'table'" class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[860px] table-auto border-collapse">
            <colgroup>
              <col class="w-10" />
              <col class="w-[36%]" />
              <col class="w-[14%]" />
              <col class="w-[18%]" />
              <col class="w-[32%]" />
            </colgroup>
            <thead>
              <tr class="bg-stone-100 dark:bg-stone-800 border-b-2 border-black dark:border-stone-100 font-mono uppercase text-stone-700 dark:text-stone-300">
                <th class="py-3 px-3 text-center">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll"
                    class="w-4 h-4 rounded-none border-2 border-black cursor-pointer"
                  />
                </th>
                <th class="py-3 px-4 font-bold">Karya & Kreator</th>
                <th class="py-3 px-3 font-bold text-center">Banner</th>
                <th class="py-3 px-3 font-bold text-center">Status</th>
                <th class="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-stone-200 dark:divide-stone-800">
              <tr 
                v-for="karya in Karyas" 
                :key="karya.film_id"
                class="hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                :class="{ 'bg-teal-50/60 dark:bg-teal-950/20': selectedIds.includes(karya.film_id) }"
              >
                <!-- Checkbox -->
                <td class="py-4 px-3 text-center align-middle">
                  <input 
                    type="checkbox" 
                    :checked="selectedIds.includes(karya.film_id)" 
                    @change="toggleSelect(karya.film_id)"
                    class="w-4 h-4 rounded-none border-2 border-black cursor-pointer"
                  />
                </td>

                <!-- Col 1: Film Poster, Title, Badges & Creator -->
                <td class="py-4 px-4 align-middle">
                  <div class="flex items-center gap-3.5">
                    <!-- Poster with video preview overlay -->
                    <div class="relative group shrink-0">
                      <AdminPosterImage 
                        :src="karya.gambar_poster" 
                        :alt="karya.judul"
                        className="w-12 h-16"
                      />
                      <button 
                        v-if="karya.link_video_utama || karya.link_trailer"
                        @click="openVideoPreview(karya)"
                        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
                        title="Tonton Preview Video"
                      >
                        <Play class="w-5 h-5 fill-white" />
                      </button>
                    </div>

                    <!-- Details Area -->
                    <div class="min-w-0 flex-1 space-y-1">
                      <!-- Title as Link -->
                      <button 
                        type="button"
                        @click="viewKarya(karya)"
                        class="font-bold text-sm md:text-base text-stone-900 dark:text-stone-100 hover:text-brand-teal hover:underline line-clamp-1 text-left cursor-pointer"
                      >
                        {{ karya.judul }}
                      </button>

                      <!-- Metadata row: Category, Year, Creator Link -->
                      <div class="flex items-center gap-2 flex-wrap text-xs">
                        <span class="inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
                          {{ karya.category?.nama_kategori || 'Umum' }}
                        </span>
                        <span class="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                          {{ karya.tahun_karya || '-' }}
                        </span>
                        <span class="text-stone-300 dark:text-stone-600">•</span>
                        <!-- Clickable Creator Link opening profile in new tab -->
                        <router-link
                          :to="`/p/${karya.user_id || karya.creator?.id}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 text-[11px] font-mono text-stone-600 dark:text-stone-400 hover:text-brand-teal hover:underline truncate max-w-[200px]"
                          title="Buka Profil Kreator di Tab Baru"
                        >
                          <User class="w-3 h-3 text-stone-400 shrink-0" />
                          <span class="truncate">{{ getCreatorName(karya) }}</span>
                        </router-link>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Col 2: Banner Carousel Toggle Button (Enabled only for published) -->
                <td class="py-4 px-3 align-middle text-center">
                  <button 
                    v-if="karya.status === 'published'"
                    type="button"
                    @click="toggleInlineBanner(karya)"
                    class="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs transition-all cursor-pointer whitespace-nowrap"
                    :class="karya.is_banner_active 
                      ? 'bg-yellow-400 text-stone-950 font-black' 
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'"
                    :title="karya.is_banner_active ? 'Aktif di Banner Utama' : 'Nonaktif dari Banner'"
                  >
                    <Sparkles class="w-3 h-3" :class="{ 'fill-stone-950': karya.is_banner_active }" />
                    <span>{{ karya.is_banner_active ? 'Aktif' : 'Off' }}</span>
                  </button>
                  <span 
                    v-else
                    class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500 px-2 py-0.5 border border-dashed border-stone-300 dark:border-stone-700 select-none"
                    title="Hanya karya terpublikasi yang dapat diaktifkan di banner carousel"
                  >
                    <Lock class="w-2.5 h-2.5" />
                    <span>Terkunci</span>
                  </span>
                </td>

                <!-- Col 3: Moderation Status Pill -->
                <td class="py-4 px-3 align-middle text-center">
                  <div class="inline-flex flex-col gap-1 items-center">
                    <span 
                      class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase border-2 border-black dark:border-stone-100 shadow-brutal-xs whitespace-nowrap"
                      :class="{
                        'bg-brand-teal text-white': karya.status === 'published',
                        'bg-yellow-400 text-stone-950 font-black': karya.status === 'pending',
                        'bg-brand-red text-white': karya.status === 'rejected'
                      }"
                    >
                      <CheckCircle v-if="karya.status === 'published'" class="w-3 h-3 stroke-[2.5]" />
                      <Clock v-else-if="karya.status === 'pending'" class="w-3 h-3 stroke-[2.5]" />
                      <XCircle v-else class="w-3 h-3 stroke-[2.5]" />
                      {{ statusLabels[karya.status] || karya.status }}
                    </span>

                    <span 
                      v-if="karya.status === 'pending' && karya.original_status === 'published'" 
                      class="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 whitespace-nowrap"
                    >
                      Edit Publik
                    </span>
                    <span 
                      v-else-if="karya.status === 'pending' && karya.original_status === 'rejected'" 
                      class="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 whitespace-nowrap"
                    >
                      Revisi Ditolak
                    </span>
                    <span 
                      v-else-if="karya.status === 'pending' && !karya.original_status" 
                      class="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 whitespace-nowrap"
                    >
                      Karya Baru
                    </span>
                  </div>
                </td>

                <!-- Col 4: Action Buttons (Roomy & Never Cut-off) -->
                <td class="py-4 px-4 align-middle text-right">
                  <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <!-- Detail Button with neutral/white Eye icon -->
                    <button 
                      type="button" 
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                      @click="viewKarya(karya)"
                      title="Lihat Detail & Moderasi"
                    >
                      <Eye class="w-4 h-4 text-stone-900 dark:text-white stroke-[2.5] shrink-0" />
                      <span>Detail</span>
                    </button>

                    <!-- Moderation Actions for Pending -->
                    <template v-if="karya.status === 'pending'">
                      <button 
                        type="button" 
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-teal hover:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                        @click="confirmActionDialog('approve', karya)"
                        title="Setujui Karya"
                      >
                        <Check class="w-3.5 h-3.5 stroke-[3]" />
                        <span>Setujui</span>
                      </button>
                      <button 
                        type="button" 
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-red hover:bg-red-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group/tolak"
                        @click="confirmActionDialog('reject', karya)"
                        title="Tolak Karya"
                      >
                        <X class="w-3.5 h-3.5 stroke-[3] text-white group-hover/tolak:text-white" />
                        <span class="text-white group-hover/tolak:text-white">Tolak</span>
                      </button>
                    </template>

                    <!-- Delete Button -->
                    <button 
                      type="button" 
                      class="inline-flex items-center justify-center w-8 h-8 bg-stone-100 dark:bg-stone-800 hover:bg-brand-red hover:text-white text-brand-red dark:text-red-400 border-2 border-black dark:border-stone-100 shadow-brutal-xs active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
                      @click="confirmActionDialog('delete', karya)"
                      title="Hapus Karya"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- VIEW 2: CINEMATIC CARD GALLERY GRID -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div 
        v-for="karya in Karyas" 
        :key="karya.film_id"
        class="group bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-sm transition-all flex flex-col overflow-hidden relative"
        :class="{ 'ring-2 ring-brand-teal': selectedIds.includes(karya.film_id) }"
      >
        <!-- Aspect 3:4 Poster -->
        <div class="relative aspect-[3/4] bg-stone-900 overflow-hidden border-b-2 border-black dark:border-stone-100">
          <AdminPosterImage 
            :src="karya.gambar_poster" 
            :alt="karya.judul"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <!-- Checkbox Top-Left -->
          <div class="absolute top-2.5 left-2.5 z-10">
            <input 
              type="checkbox" 
              :checked="selectedIds.includes(karya.film_id)" 
              @change="toggleSelect(karya.film_id)"
              class="w-4 h-4 rounded-none border-2 border-black cursor-pointer bg-white/90"
            />
          </div>

          <!-- Status Badge Top-Right -->
          <div class="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1">
            <span 
              class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border-2 border-black shadow-brutal-xs"
              :class="{
                'bg-brand-teal text-white': karya.status === 'published',
                'bg-yellow-400 text-stone-950': karya.status === 'pending',
                'bg-brand-red text-white': karya.status === 'rejected'
              }"
            >
              {{ statusLabels[karya.status] }}
            </span>
            <span 
              v-if="karya.is_banner_active" 
              class="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-yellow-400 text-stone-950 border border-black"
            >
              ★ Banner
            </span>
          </div>
        </div>

        <!-- Grid Content Body -->
        <div class="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-stone-500 dark:text-stone-400">
              <span class="font-bold text-yellow-600 dark:text-yellow-400 uppercase">{{ karya.category?.nama_kategori || 'Umum' }}</span>
              <span>•</span>
              <span>{{ karya.tahun_karya || '-' }}</span>
            </div>

            <button 
              type="button"
              @click="viewKarya(karya)"
              class="font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-brand-teal hover:underline line-clamp-1 block leading-tight text-left cursor-pointer"
            >
              {{ karya.judul }}
            </button>

            <!-- Creator Link opening profile in new tab -->
            <router-link 
              :to="`/p/${karya.user_id || karya.creator?.id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] text-stone-600 dark:text-stone-400 hover:text-brand-teal hover:underline mt-1 flex items-center gap-1.5 font-mono truncate"
            >
              <User class="w-3 h-3 text-stone-400 shrink-0" />
              <span class="truncate">{{ getCreatorName(karya) }}</span>
            </router-link>
          </div>

          <!-- Card Actions Footer -->
          <div class="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-1.5">
            <button 
              type="button" 
              class="flex-1 py-1.5 text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
              @click="viewKarya(karya)"
            >
              <Eye class="w-3.5 h-3.5 text-stone-900 dark:text-white stroke-[2.5]" />
              <span>Detail</span>
            </button>

            <!-- Pending Actions -->
            <template v-if="karya.status === 'pending'">
              <button 
                type="button" 
                class="px-2.5 py-1.5 bg-brand-teal hover:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer"
                @click="confirmActionDialog('approve', karya)"
                title="Setujui"
              >
                <Check class="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button 
                type="button" 
                class="px-2.5 py-1.5 bg-brand-red hover:bg-red-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer group/tolak"
                @click="confirmActionDialog('reject', karya)"
                title="Tolak"
              >
                <X class="w-3.5 h-3.5 stroke-[3] text-white group-hover/tolak:text-white" />
              </button>
            </template>

            <!-- Published Banner Toggle -->
            <button 
              v-else-if="karya.status === 'published'"
              type="button" 
              class="px-2.5 py-1.5 border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer"
              :class="karya.is_banner_active ? 'bg-yellow-400 text-stone-950 font-bold' : 'bg-white dark:bg-stone-800 text-stone-600'"
              @click="toggleInlineBanner(karya)"
              title="Toggle Banner Carousel"
            >
              <Sparkles class="w-3.5 h-3.5" />
            </button>

            <button 
              type="button" 
              class="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-brand-red hover:text-white text-brand-red dark:text-red-400 border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer"
              @click="confirmActionDialog('delete', karya)"
              title="Hapus"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="pagination.totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal">
      <span class="text-xs font-mono text-stone-600 dark:text-stone-400">
        Menampilkan {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} dari {{ pagination.total }} karya
      </span>

      <div class="flex items-center gap-1.5">
        <button 
          type="button"
          class="px-2.5 py-1 text-xs font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>

        <div class="flex gap-1">
          <template v-for="p in pagination.totalPages">
            <button
              v-if="p === 1 || p === pagination.totalPages || (p >= pagination.page - 1 && p <= pagination.page + 1)"
              :key="`page-${p}`"
              type="button"
              class="w-7 h-7 text-xs font-mono font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer"
              :class="pagination.page === p 
                ? 'bg-brand-teal text-white font-black' 
                : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700'"
              @click="changePage(p)"
            >
              {{ p }}
            </button>
            <span 
              v-else-if="p === pagination.page - 2 || p === pagination.page + 2" 
              :key="`dots-${p}`"
              class="flex items-center justify-center w-6 h-7 text-xs text-stone-400 font-mono"
            >
              ..
            </span>
          </template>
        </div>

        <button 
          type="button"
          class="px-2.5 py-1 text-xs font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
          title="Halaman Berikutnya"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- MODAL 1: COMPREHENSIVE FILM DETAIL & MODERATION INSPECTION -->
    <div v-if="showDetailModal && selectedKarya" class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <!-- Backdrop (Locks Background Scroll) -->
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm" @click="showDetailModal = false"></div>
      
      <!-- Modal Main Card (Scrolls Internally) -->
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-4xl max-h-[90vh] flex flex-col text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in duration-200 overflow-hidden z-10">
        
        <!-- Modal Header Bar -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <Film class="w-5 h-5 text-brand-teal shrink-0" />
            <h3 class="font-black text-sm md:text-base uppercase tracking-wider text-stone-900 dark:text-white truncate">
              DETAIL & KURASI: {{ selectedKarya.judul }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <!-- Open Public Page in New Tab -->
            <router-link
              :to="`/archive/${selectedKarya.slug}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              title="Buka Halaman Publik di Tab Baru"
            >
              <span>Halaman Publik</span>
              <ExternalLink class="w-3.5 h-3.5 text-stone-500 dark:text-stone-300" />
            </router-link>

            <!-- Close Button Top-Right -->
            <button 
              type="button"
              @click="showDetailModal = false" 
              class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Navigation Tabs inside Detail Modal (Unified, Sleek Segmented Buttons with Hover Dropdown) -->
        <div class="flex items-center gap-2 p-2.5 border-b-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-950 overflow-visible shrink-0 text-xs font-mono uppercase">
          <!-- Tab 1: Visual & Banner -->
          <button 
            type="button"
            @click="activeDetailTab = 'visual'"
            class="inline-flex items-center gap-2 px-3.5 py-2 border-2 transition-all cursor-pointer whitespace-nowrap"
            :class="activeDetailTab === 'visual' 
              ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold'"
          >
            <Sparkles class="w-3.5 h-3.5" :class="activeDetailTab === 'visual' ? 'text-yellow-300 fill-yellow-300' : 'text-stone-400'" />
            <span>Visual & Banner</span>
          </button>

          <!-- Tab 2: Kreator & Kru -->
          <button 
            type="button"
            @click="activeDetailTab = 'crew'"
            class="inline-flex items-center gap-2 px-3.5 py-2 border-2 transition-all cursor-pointer whitespace-nowrap"
            :class="activeDetailTab === 'crew' 
              ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold'"
          >
            <Users class="w-3.5 h-3.5" :class="activeDetailTab === 'crew' ? 'text-white' : 'text-stone-400'" />
            <span>Kreator & Kru</span>
          </button>

          <!-- Tab 3: Sinopsis & Eksplorasi -->
          <button 
            type="button"
            @click="activeDetailTab = 'content'"
            class="inline-flex items-center gap-2 px-3.5 py-2 border-2 transition-all cursor-pointer whitespace-nowrap"
            :class="activeDetailTab === 'content' 
              ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold'"
          >
            <FileText class="w-3.5 h-3.5" :class="activeDetailTab === 'content' ? 'text-white' : 'text-stone-400'" />
            <span>Sinopsis & Eksplorasi</span>
          </button>

          <!-- Tab 4: Video & Media -->
          <button 
            type="button"
            @click="activeDetailTab = 'media'"
            class="inline-flex items-center gap-2 px-3.5 py-2 border-2 transition-all cursor-pointer whitespace-nowrap"
            :class="activeDetailTab === 'media' 
              ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold'"
          >
            <Film class="w-3.5 h-3.5" :class="activeDetailTab === 'media' ? 'text-white' : 'text-stone-400'" />
            <span>Video & Media</span>
          </button>

          <!-- Tab 5: Dokumen PDF with Click/Hover Dropdown (No flickering, no dots) -->
          <div class="relative" @mouseleave="showPdfDropdown = false">
            <button 
              type="button"
              @click="activeDetailTab = 'docs'; togglePdfDropdown()"
              @mouseenter="showPdfDropdown = true"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 border-2 transition-all cursor-pointer whitespace-nowrap"
              :class="activeDetailTab === 'docs' 
                ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-brutal-xs font-black' 
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold'"
            >
              <FileCode class="w-3.5 h-3.5" :class="activeDetailTab === 'docs' ? 'text-white' : 'text-stone-400'" />
              <span>{{ activeDetailTab === 'docs' ? (activeDocType === 'naskah' ? 'PDF: Naskah' : activeDocType === 'storyboard' ? 'PDF: Storyboard' : 'PDF: RAB') : 'Dokumen PDF' }}</span>
              <ChevronDown class="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 shrink-0" :class="showPdfDropdown ? 'rotate-180 text-white' : (activeDetailTab === 'docs' ? 'text-white' : 'text-stone-500 dark:text-stone-400')" />
            </button>

            <!-- Dropdown Menu with Seamless Hover Bridge & Extra Width -->
            <div 
              v-show="showPdfDropdown"
              class="absolute left-0 top-full pt-1.5 w-72 sm:w-80 z-50 animate-in fade-in duration-100"
            >
              <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal py-1">
                <!-- Naskah Option -->
                <button 
                  type="button"
                  @click="selectPdfDoc('naskah')"
                  class="w-full px-4 py-2.5 text-left text-xs font-mono font-bold flex items-center justify-between gap-3 hover:bg-teal-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  :class="activeDetailTab === 'docs' && activeDocType === 'naskah' ? 'text-brand-teal dark:text-teal-300 font-black bg-teal-50/80 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-300'"
                >
                  <span class="flex items-center gap-2 truncate">
                    <FileText class="w-3.5 h-3.5 text-brand-teal shrink-0" />
                    <span class="truncate">Naskah Skenario</span>
                  </span>
                  <span class="shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 border" :class="selectedKarya.file_naskah ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 font-bold' : 'text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-normal'">
                    {{ selectedKarya.file_naskah ? 'Tersedia' : 'Belum Ada' }}
                  </span>
                </button>

                <!-- Storyboard Option -->
                <button 
                  type="button"
                  @click="selectPdfDoc('storyboard')"
                  class="w-full px-4 py-2.5 text-left text-xs font-mono font-bold flex items-center justify-between gap-3 hover:bg-teal-50 dark:hover:bg-stone-800 transition-colors cursor-pointer border-t border-stone-100 dark:border-stone-800"
                  :class="activeDetailTab === 'docs' && activeDocType === 'storyboard' ? 'text-brand-teal dark:text-teal-300 font-black bg-teal-50/80 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-300'"
                >
                  <span class="flex items-center gap-2 truncate">
                    <BookOpen class="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span class="truncate">Storyboard Visual</span>
                  </span>
                  <span class="shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 border" :class="selectedKarya.file_storyboard ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 font-bold' : 'text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-normal'">
                    {{ selectedKarya.file_storyboard ? 'Tersedia' : 'Belum Ada' }}
                  </span>
                </button>

                <!-- RAB Option -->
                <button 
                  type="button"
                  @click="selectPdfDoc('rab')"
                  class="w-full px-4 py-2.5 text-left text-xs font-mono font-bold flex items-center justify-between gap-3 hover:bg-teal-50 dark:hover:bg-stone-800 transition-colors cursor-pointer border-t border-stone-100 dark:border-stone-800"
                  :class="activeDetailTab === 'docs' && activeDocType === 'rab' ? 'text-brand-teal dark:text-teal-300 font-black bg-teal-50/80 dark:bg-stone-800' : 'text-stone-700 dark:text-stone-300'"
                >
                  <span class="flex items-center gap-2 truncate">
                    <FileCode class="w-3.5 h-3.5 text-brand-red shrink-0" />
                    <span class="truncate">RAB & Produksi</span>
                  </span>
                  <span class="shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 border" :class="selectedKarya.file_rab ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 font-bold' : 'text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 font-normal'">
                    {{ selectedKarya.file_rab ? 'Tersedia' : 'Belum Ada' }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Internal Scrollable Content (Overscroll Contained) -->
        <div class="p-5 md:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          <div v-if="detailLoading" class="py-12 text-center">
            <Loader2 class="w-8 h-8 animate-spin mx-auto text-brand-teal" />
            <p class="text-xs font-mono uppercase text-stone-500 mt-2">Memuat seluruh detail data film...</p>
          </div>

          <template v-else>
            <!-- TAB 1: VISUAL & BANNER CAROUSEL INSPECTION -->
            <div v-if="activeDetailTab === 'visual'" class="space-y-5">
              <!-- REJECTION NOTE BANNER (Appears ONLY in Tab 1 Visual & Banner) -->
              <div 
                v-if="selectedKarya.status === 'rejected' || selectedKarya.rejection_reason" 
                class="p-4 bg-red-50 dark:bg-red-950/70 border-2 border-red-500 dark:border-red-600 shadow-brutal-xs space-y-1.5 animate-in fade-in"
              >
                <div class="flex items-center gap-2 text-red-800 dark:text-red-300 font-black text-xs uppercase tracking-wider">
                  <AlertTriangle class="w-4 h-4 text-red-600 dark:text-red-400 stroke-[2.5]" />
                  <span>Catatan / Alasan Penolakan Kurator:</span>
                </div>
                <p class="text-xs md:text-sm text-red-900 dark:text-red-200 font-mono leading-relaxed pl-6 whitespace-pre-line font-bold">
                  "{{ selectedKarya.rejection_reason || 'Karya belum memenuhi kriteria kelayakan kurasi film.' }}"
                </p>
              </div>

              <!-- Poster & Identity Summary -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <!-- Poster Box -->
                <div class="md:col-span-4 flex flex-col items-center">
                  <span class="block text-xs font-mono font-bold uppercase text-stone-500 dark:text-stone-400 mb-1.5 self-start">
                    Desain Poster Resmi:
                  </span>
                  <div class="w-44 aspect-[3/4] bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs overflow-hidden">
                    <AdminPosterImage 
                      :src="selectedKarya.gambar_poster" 
                      :alt="selectedKarya.judul"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <!-- Identity Information -->
                <div class="md:col-span-8 space-y-3">
                  <h2 class="text-xl md:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                    {{ selectedKarya.judul }}
                  </h2>

                  <!-- Status & Badges -->
                  <div class="flex flex-wrap gap-1.5 items-center">
                    <span 
                      class="px-2.5 py-1 text-xs font-mono font-bold uppercase border-2 border-black dark:border-stone-100 shadow-brutal-xs"
                      :class="{
                        'bg-brand-teal text-white': selectedKarya.status === 'published',
                        'bg-yellow-400 text-stone-950 font-black': selectedKarya.status === 'pending',
                        'bg-brand-red text-white': selectedKarya.status === 'rejected'
                      }"
                    >
                      Status: {{ statusLabels[selectedKarya.status] }}
                    </span>

                    <span class="px-2 py-1 text-xs font-mono font-bold bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
                      Kategori: {{ selectedKarya.category?.nama_kategori || 'Umum' }}
                    </span>

                    <span class="px-2 py-1 text-xs font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                      Tahun: {{ selectedKarya.tahun_karya || '-' }}
                    </span>
                  </div>

                  <!-- Metadata Details -->
                  <div class="p-3 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-1.5 text-xs font-mono text-stone-700 dark:text-stone-300">
                    <p><span class="font-bold text-stone-900 dark:text-white">Slug:</span> {{ selectedKarya.slug }}</p>
                    <p>
                      <span class="font-bold text-stone-900 dark:text-white">Total Dilihat:</span> 
                      <span v-if="selectedKarya.status === 'published'">{{ selectedKarya.views || 0 }} views</span>
                      <span v-else class="text-stone-500 dark:text-stone-400 font-normal">0 views (Terkunci saat proses kurasi)</span>
                    </p>
                    <p v-if="selectedKarya.created_at"><span class="font-bold text-stone-900 dark:text-white">Tanggal Unggah:</span> {{ new Date(selectedKarya.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
                  </div>
                </div>
              </div>

              <!-- Banner Carousel Simulation Section -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles class="w-4 h-4 text-yellow-500" />
                      <span>Simulasi Tampilan Banner Carousel Halaman Utama (16:9)</span>
                    </h4>
                    <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Pratinjau bagaimana banner film tampil di slider utama website.
                    </p>
                  </div>

                  <!-- Toggle Button (Enabled ONLY for published films) -->
                  <div class="flex items-center gap-2">
                    <button 
                      v-if="selectedKarya.status === 'published'"
                      type="button"
                      @click="toggleInlineBanner(selectedKarya)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer transition-all"
                      :class="selectedKarya.is_banner_active ? 'bg-yellow-400 text-stone-950 font-black' : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-white'"
                    >
                      <Sparkles class="w-3.5 h-3.5" />
                      <span>{{ selectedKarya.is_banner_active ? 'Banner Aktif (On)' : 'Aktifkan Banner (Off)' }}</span>
                    </button>

                    <div 
                      v-else
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border border-black/30 dark:border-stone-600"
                    >
                      <Lock class="w-3.5 h-3.5" />
                      <span>Banner Terkunci (Belum Dipublikasi)</span>
                    </div>
                  </div>
                </div>

                <!-- Simulated Hero Banner Frame -->
                <div class="relative aspect-video w-full max-w-2xl mx-auto bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden group">
                  <img 
                    :src="assetUrl(selectedKarya.banner_url || selectedKarya.gambar_poster)" 
                    class="w-full h-full object-cover"
                  />
                  <!-- Simulated dark gradient and title overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 md:p-6 text-white">
                    <span class="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-brand-teal text-white w-fit border border-black shadow-brutal-xs mb-1">
                      {{ selectedKarya.category?.nama_kategori || 'FEATURED' }}
                    </span>
                    <h3 class="text-lg md:text-2xl font-black uppercase tracking-tight text-white drop-shadow">
                      {{ selectedKarya.judul }}
                    </h3>
                    <p class="text-xs text-stone-300 font-mono mt-0.5">
                      Disutradarai oleh {{ getCreatorName(selectedKarya) }} • {{ selectedKarya.tahun_karya }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: KREATOR & DAFTAR KRU TERSTRUKTUR DENGAN LINK PROFIL -->
            <div v-else-if="activeDetailTab === 'crew'" class="space-y-4">
              <!-- Creator / Owner Box -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <span class="block text-xs font-mono font-bold uppercase text-stone-500 dark:text-stone-400">
                  Pemilik / Pengunggah Karya:
                </span>
                <div class="flex items-center justify-between flex-wrap gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 border-2 border-black dark:border-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                      <img 
                        v-if="selectedKarya.creator?.image" 
                        :src="assetUrl(selectedKarya.creator.image)" 
                        class="w-full h-full object-cover" 
                      />
                      <User v-else class="w-6 h-6 text-stone-400" />
                    </div>
                    <div>
                      <h4 class="font-black text-base text-stone-900 dark:text-white leading-tight">
                        {{ selectedKarya.creator?.name || getCreatorName(selectedKarya) }}
                      </h4>
                      <p class="text-xs text-stone-600 dark:text-stone-300 font-mono mt-0.5">
                        {{ selectedKarya.creator?.email || 'Email terdaftar pada sistem' }}
                      </p>
                    </div>
                  </div>

                  <!-- Link to Public Profile in New Tab with White Text -->
                  <router-link
                    :to="`/p/${selectedKarya.user_id || selectedKarya.creator?.id}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-teal-700 transition-all cursor-pointer"
                  >
                    <span>Lihat Profil Kreator</span>
                    <ExternalLink class="w-3.5 h-3.5 text-white" />
                  </router-link>
                </div>
              </div>

              <!-- Crew Breakdown -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-3">
                <h4 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white">
                  Daftar Kru & Anggota Tim Produksi
                </h4>

                <div v-if="selectedKarya.crew && selectedKarya.crew.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    v-for="(group, gIdx) in selectedKarya.crew" 
                    :key="gIdx"
                    class="p-3 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1.5"
                  >
                    <span class="inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-black/20">
                      {{ group.jabatan }}
                    </span>
                    <div class="flex flex-wrap gap-1.5 pt-0.5">
                      <template v-for="(member, mIdx) in group.anggota" :key="mIdx">
                        <!-- Tagged User Link (Opens Profile in New Tab) -->
                        <router-link
                          v-if="typeof member === 'object' && member !== null && (member.user_id || member.id)"
                          :to="`/p/${member.user_id || member.id}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-200 border border-brand-teal/40 hover:underline"
                          title="Klik untuk membuka profil di tab baru"
                        >
                          <UserCheck class="w-3 h-3 text-brand-teal dark:text-teal-300" />
                          <span>{{ member.name || member.nama }}</span>
                          <ExternalLink class="w-2.5 h-2.5 opacity-70" />
                        </router-link>

                        <!-- Untagged Member Text -->
                        <span 
                          v-else 
                          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600"
                        >
                          <User class="w-3 h-3 text-stone-400" />
                          <span>{{ typeof member === 'object' && member !== null ? (member.name || member.nama) : member }}</span>
                        </span>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-else class="text-xs text-stone-500 dark:text-stone-400 italic p-3 text-center bg-white dark:bg-stone-800 border border-dashed border-stone-300 dark:border-stone-700">
                  Tidak ada data kru produksi tambahan yang dicantumkan.
                </div>
              </div>
            </div>

            <!-- TAB 3: SINOPSIS & EKSPLORASI KARYA / CATATAN SUTRADARA -->
            <div v-else-if="activeDetailTab === 'content'" class="space-y-4">
              <!-- Sinopsis -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <h4 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <FileText class="w-4 h-4 text-brand-teal" />
                  <span>Sinopsis Resmi Film</span>
                </h4>
                <p class="text-xs md:text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                  {{ selectedKarya.sinopsis || 'Tidak ada sinopsis yang dilampirkan.' }}
                </p>
              </div>

              <!-- Deskripsi Lengkap / Eksplorasi Karya -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <h4 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen class="w-4 h-4 text-yellow-500" />
                  <span>Eksplorasi Karya & Catatan Sutradara / Tim</span>
                </h4>
                <div 
                  v-if="selectedKarya.deskripsi_lengkap" 
                  class="text-xs md:text-sm text-stone-700 dark:text-stone-200 leading-relaxed prose dark:prose-invert max-w-none"
                  v-html="selectedKarya.deskripsi_lengkap"
                ></div>
                <p v-else class="text-xs text-stone-500 dark:text-stone-400 italic">
                  Tidak ada catatan eksplorasi karya tambahan yang dilampirkan oleh kreator.
                </p>
              </div>
            </div>

            <!-- TAB 4: VIDEO UTAMA, TRAILER, & BTS (Stacked Vertically) -->
            <div v-else-if="activeDetailTab === 'media'" class="space-y-4">
              <!-- Video Utama Player -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <h4 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Video class="w-4 h-4 text-brand-teal" />
                  <span>Video Utama Film</span>
                </h4>
                <div v-if="selectedKarya.link_video_utama" class="space-y-2">
                  <div class="relative aspect-video bg-black border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden">
                    <iframe 
                      v-if="!isDirectVideo(selectedKarya.link_video_utama)"
                      :src="getEmbedUrl(selectedKarya.link_video_utama)"
                      class="w-full h-full"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                    <video 
                      v-else
                      :src="getEmbedUrl(selectedKarya.link_video_utama)"
                      controls
                      class="w-full h-full object-contain"
                    ></video>
                  </div>
                  <p class="text-xs font-mono text-stone-500 dark:text-stone-400 truncate">
                    Sumber: <a :href="selectedKarya.link_video_utama" target="_blank" class="text-brand-teal hover:underline">{{ selectedKarya.link_video_utama }}</a>
                  </p>
                </div>
                <div v-else class="text-xs text-stone-500 dark:text-stone-400 italic p-4 text-center bg-white dark:bg-stone-800 border border-dashed">
                  Tautan video utama belum diisi.
                </div>
              </div>

              <!-- Trailer Film (Stacked Vertically) -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <h5 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Clapperboard class="w-4 h-4 text-yellow-500" />
                  <span>Trailer Film</span>
                </h5>
                <div v-if="selectedKarya.link_trailer" class="space-y-2">
                  <div class="relative aspect-video bg-black border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden">
                    <iframe 
                      v-if="!isDirectVideo(selectedKarya.link_trailer)"
                      :src="getEmbedUrl(selectedKarya.link_trailer)"
                      class="w-full h-full"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                    <video 
                      v-else
                      :src="getEmbedUrl(selectedKarya.link_trailer)"
                      controls
                      class="w-full h-full object-contain"
                    ></video>
                  </div>
                  <p class="text-xs font-mono text-stone-500 dark:text-stone-400 truncate">
                    Sumber: <a :href="selectedKarya.link_trailer" target="_blank" class="text-yellow-600 dark:text-yellow-400 hover:underline">{{ selectedKarya.link_trailer }}</a>
                  </p>
                </div>
                <div v-else class="text-xs text-stone-500 dark:text-stone-400 italic p-4 text-center bg-white dark:bg-stone-800 border border-dashed">
                  Trailer tidak dilampirkan oleh kreator.
                </div>
              </div>

              <!-- Behind The Scenes (BTS) (Stacked Vertically) -->
              <div class="p-4 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2">
                <h5 class="font-bold text-xs md:text-sm uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Film class="w-4 h-4 text-brand-red" />
                  <span>Behind The Scenes (BTS)</span>
                </h5>
                <div v-if="selectedKarya.link_bts" class="space-y-2">
                  <div class="relative aspect-video bg-black border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden">
                    <iframe 
                      v-if="!isDirectVideo(selectedKarya.link_bts)"
                      :src="getEmbedUrl(selectedKarya.link_bts)"
                      class="w-full h-full"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                    <video 
                      v-else
                      :src="getEmbedUrl(selectedKarya.link_bts)"
                      controls
                      class="w-full h-full object-contain"
                    ></video>
                  </div>
                  <p class="text-xs font-mono text-stone-500 dark:text-stone-400 truncate">
                    Sumber: <a :href="selectedKarya.link_bts" target="_blank" class="text-brand-red hover:underline">{{ selectedKarya.link_bts }}</a>
                  </p>
                </div>
                <div v-else class="text-xs text-stone-500 dark:text-stone-400 italic p-4 text-center bg-white dark:bg-stone-800 border border-dashed">
                  Video Behind The Scenes (BTS) tidak dilampirkan oleh kreator.
                </div>
              </div>
            </div>

            <!-- TAB 5: DOKUMEN PDF (NASKAH, STORYBOARD, RAB) DILIHAT LANGSUNG DI MODAL -->
            <div v-else-if="activeDetailTab === 'docs'" class="space-y-4">
              <!-- PDF Viewer Frame Container (Clean, Direct Viewer) -->
              <div class="p-3.5 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 space-y-2.5">
                <!-- Naskah Viewer -->
                <template v-if="activeDocType === 'naskah'">
                  <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <span class="font-bold text-xs font-mono uppercase text-stone-900 dark:text-white flex items-center gap-1.5">
                      <FileText class="w-3.5 h-3.5 text-brand-teal" />
                      <span>Dokumen Naskah / Skenario Film</span>
                    </span>
                    <a 
                      v-if="selectedKarya.file_naskah" 
                      :href="assetUrl(selectedKarya.file_naskah)" 
                      target="_blank" 
                      download
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-black uppercase bg-yellow-400 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-yellow-300 dark:hover:bg-yellow-500 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Download class="w-3.5 h-3.5 text-stone-950" />
                      <span>Unduh Naskah PDF</span>
                    </a>
                  </div>
                  <div v-if="selectedKarya.file_naskah" class="w-full h-[520px] bg-stone-900 border-2 border-black dark:border-stone-700 overflow-hidden shadow-inner">
                    <iframe 
                      :src="assetUrl(selectedKarya.file_naskah)" 
                      class="w-full h-full"
                    ></iframe>
                  </div>
                  <div v-else class="py-16 text-center text-xs text-stone-500 dark:text-stone-400 italic bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 space-y-1">
                    <FileText class="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
                    <p class="font-bold uppercase">Naskah Film Belum Diunggah</p>
                    <p class="text-[11px]">Kreator belum melampirkan berkas naskah/skenario untuk karya ini.</p>
                  </div>
                </template>

                <!-- Storyboard Viewer -->
                <template v-else-if="activeDocType === 'storyboard'">
                  <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <span class="font-bold text-xs font-mono uppercase text-stone-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen class="w-3.5 h-3.5 text-yellow-500" />
                      <span>Dokumen Storyboard Visual</span>
                    </span>
                    <a 
                      v-if="selectedKarya.file_storyboard" 
                      :href="assetUrl(selectedKarya.file_storyboard)" 
                      target="_blank" 
                      download
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-black uppercase bg-yellow-400 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-yellow-300 dark:hover:bg-yellow-500 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Download class="w-3.5 h-3.5 text-stone-950" />
                      <span>Unduh Storyboard PDF</span>
                    </a>
                  </div>
                  <div v-if="selectedKarya.file_storyboard" class="w-full h-[520px] bg-stone-900 border-2 border-black dark:border-stone-700 overflow-hidden shadow-inner">
                    <iframe 
                      :src="assetUrl(selectedKarya.file_storyboard)" 
                      class="w-full h-full"
                    ></iframe>
                  </div>
                  <div v-else class="py-16 text-center text-xs text-stone-500 dark:text-stone-400 italic bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 space-y-1">
                    <BookOpen class="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
                    <p class="font-bold uppercase">Storyboard Belum Diunggah</p>
                    <p class="text-[11px]">Kreator belum melampirkan berkas storyboard untuk karya ini.</p>
                  </div>
                </template>

                <!-- RAB Viewer -->
                <template v-else-if="activeDocType === 'rab'">
                  <div class="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-200 dark:border-stone-700">
                    <span class="font-bold text-xs font-mono uppercase text-stone-900 dark:text-white flex items-center gap-1.5">
                      <FileCode class="w-3.5 h-3.5 text-brand-red" />
                      <span>Rencana Anggaran Biaya (RAB) / Dokumen Produksi</span>
                    </span>
                    <a 
                      v-if="selectedKarya.file_rab" 
                      :href="assetUrl(selectedKarya.file_rab)" 
                      target="_blank" 
                      download
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-black uppercase bg-yellow-400 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-yellow-300 dark:hover:bg-yellow-500 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Download class="w-3.5 h-3.5 text-stone-950" />
                      <span>Unduh Dokumen RAB</span>
                    </a>
                  </div>
                  <div v-if="selectedKarya.file_rab" class="w-full h-[520px] bg-stone-900 border-2 border-black dark:border-stone-700 overflow-hidden shadow-inner">
                    <iframe 
                      :src="assetUrl(selectedKarya.file_rab)" 
                      class="w-full h-full"
                    ></iframe>
                  </div>
                  <div v-else class="py-16 text-center text-xs text-stone-500 dark:text-stone-400 italic bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 space-y-1">
                    <FileCode class="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
                    <p class="font-bold uppercase">Dokumen RAB Belum Diunggah</p>
                    <p class="text-[11px]">Kreator belum melampirkan dokumen RAB / anggaran produksi untuk karya ini.</p>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Modal Bottom Actions Bar (Tutup button removed, ONLY Moderation Actions) -->
        <div class="px-5 py-3 border-t-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800 shrink-0 flex items-center justify-end gap-2.5">
          <template v-if="selectedKarya.status === 'pending'">
            <button 
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-red text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-red-700 cursor-pointer"
              @click="confirmActionDialog('reject', selectedKarya)"
            >
              <X class="w-4 h-4 stroke-[3]" />
              <span>Tolak Karya</span>
            </button>
            <button 
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-teal-700 cursor-pointer"
              @click="confirmActionDialog('approve', selectedKarya)"
            >
              <Check class="w-4 h-4 stroke-[3]" />
              <span>Setujui & Publikasikan</span>
            </button>
          </template>

          <button 
            v-else
            type="button" 
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-stone-200 dark:bg-stone-700 hover:bg-brand-red hover:text-white text-brand-red dark:text-red-300 border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer transition-colors"
            @click="confirmActionDialog('delete', selectedKarya)"
          >
            <Trash2 class="w-4 h-4" />
            <span>Hapus Arsip</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Built-in Cinematic Video Player & Instant Review -->
    <div v-if="showVideoModal && selectedKarya" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="showVideoModal = false"></div>
      <div class="relative bg-stone-950 border-2 border-stone-100 shadow-brutal w-full max-w-3xl text-stone-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between px-5 py-3 border-b-2 border-stone-800 bg-stone-900">
          <div class="flex items-center gap-2 min-w-0">
            <Play class="w-4 h-4 text-brand-yellow shrink-0 fill-brand-yellow" />
            <h3 class="font-bold text-sm truncate uppercase tracking-wider text-white">
              Pratinjau Video: {{ selectedKarya.judul }}
            </h3>
          </div>
          <button 
            type="button"
            @click="showVideoModal = false" 
            class="p-1 border-2 border-transparent hover:border-white hover:bg-stone-800 text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 text-white stroke-[2.5]" />
          </button>
        </div>

        <div class="relative aspect-video bg-black flex items-center justify-center">
          <iframe 
            v-if="!isDirectVideo(selectedKarya.link_video_utama || selectedKarya.link_trailer)"
            :src="getEmbedUrl(selectedKarya.link_video_utama || selectedKarya.link_trailer)"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
          <video 
            v-else
            :src="assetUrl(selectedKarya.link_video_utama || selectedKarya.link_trailer)"
            controls
            autoplay
            class="w-full h-full object-contain"
          ></video>
        </div>

        <div class="p-4 bg-stone-900 border-t-2 border-stone-800 flex items-center justify-between gap-3 flex-wrap">
          <div class="text-xs font-mono text-stone-400">
            <span>Kreator: <strong class="text-white">{{ getCreatorName(selectedKarya) }}</strong></span>
            <span class="mx-2">•</span>
            <span>Status: <strong class="uppercase text-yellow-400">{{ selectedKarya.status }}</strong></span>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="selectedKarya.status === 'pending'">
              <button 
                type="button" 
                class="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-brand-red text-white border border-black shadow-brutal-xs cursor-pointer hover:bg-red-700"
                @click="confirmActionDialog('reject', selectedKarya)"
              >
                <X class="w-3.5 h-3.5" />
                <span>Tolak</span>
              </button>
              <button 
                type="button" 
                class="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-brand-teal text-white border border-black shadow-brutal-xs cursor-pointer hover:bg-teal-700"
                @click="confirmActionDialog('approve', selectedKarya)"
              >
                <Check class="w-3.5 h-3.5" />
                <span>Setujui</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Confirmation Dialog (Approve / Reject / Delete) -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="!actionLoading ? showConfirm = false : null"></div>
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-md animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
        <div 
          class="flex items-center justify-between px-5 py-3 border-b-2 border-black dark:border-stone-100"
          :class="confirmAction.type === 'approve' 
            ? 'bg-brand-teal text-white' 
            : confirmAction.type === 'reject' 
              ? 'bg-yellow-400 text-stone-950 font-black' 
              : 'bg-brand-red text-white'"
        >
          <div class="flex items-center gap-2">
            <CheckCircle v-if="confirmAction.type === 'approve'" class="w-4 h-4 text-white" />
            <AlertTriangle v-else-if="confirmAction.type === 'reject'" class="w-4 h-4 text-stone-950" />
            <Trash2 v-else class="w-4 h-4 text-white" />
            <h3 class="font-bold text-sm md:text-base uppercase tracking-wider">
              {{ confirmAction.type === 'approve' ? 'Setujui Publikasi' : confirmAction.type === 'reject' ? 'Tolak Karya' : 'Hapus Karya' }}
            </h3>
          </div>
          <button 
            type="button"
            @click="showConfirm = false" 
            class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors cursor-pointer flex items-center justify-center"
            :disabled="actionLoading"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div class="p-5 space-y-3.5">
          <p class="text-xs md:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            <span v-if="confirmAction.isBatch">
              <span v-if="confirmAction.type === 'approve'">
                Setujui dan publikasikan secara serentak <strong>{{ selectedIds.length }} karya</strong> yang telah dipilih?
              </span>
              <span v-else>
                Hapus secara permanen <strong>{{ selectedIds.length }} karya</strong> terpilih? Tindakan ini tidak dapat dibatalkan.
              </span>
            </span>
            <span v-else>
              <span v-if="confirmAction.type === 'approve'">
                Apakah Anda yakin ingin menyetujui dan mempublikasikan karya <strong>"{{ confirmAction.karya?.judul }}"</strong> ke katalog publik?
              </span>
              <span v-else-if="confirmAction.type === 'reject'">
                Karya <strong>"{{ confirmAction.karya?.judul }}"</strong> akan ditolak dan kreator akan mendapatkan notifikasi.
              </span>
              <span v-else>
                Apakah Anda yakin ingin menghapus arsip karya <strong>"{{ confirmAction.karya?.judul }}"</strong>? Tindakan ini permanen dan tidak dapat dibatalkan.
              </span>
            </span>
          </p>

          <!-- Rejection reason input -->
          <div v-if="confirmAction.type === 'reject'" class="space-y-1.5">
            <label class="block text-xs font-mono font-bold uppercase text-stone-700 dark:text-stone-300">
              Alasan Penolakan (Wajib diisi):
            </label>
            <textarea
              v-model="rejectionReason"
              rows="3"
              class="w-full text-xs p-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs focus:ring-brand-red resize-none"
              placeholder="Contoh: Kualitas audio kurang jernih / poster tidak memenuhi syarat resolusi minimum."
            ></textarea>
          </div>

          <div class="flex gap-2.5 justify-end pt-1">
            <button 
              type="button" 
              class="px-3.5 py-1.5 border-2 border-black dark:border-stone-100 font-bold text-xs bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
              @click="showConfirm = false" 
              :disabled="actionLoading"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs text-xs cursor-pointer disabled:opacity-50" 
              :class="confirmAction.type === 'approve' 
                ? 'bg-brand-teal hover:bg-teal-700 text-white' 
                : 'bg-brand-red hover:bg-red-700 text-white'"
              @click="executeAction" 
              :disabled="actionLoading"
            >
              <Loader2 v-if="actionLoading" class="w-3.5 h-3.5 animate-spin" />
              <Check v-else-if="confirmAction.type === 'approve'" class="w-3.5 h-3.5" />
              <X v-else-if="confirmAction.type === 'reject'" class="w-3.5 h-3.5" />
              <Trash2 v-else class="w-3.5 h-3.5" />
              <span>{{ confirmAction.type === 'approve' ? 'Ya, Setujui' : confirmAction.type === 'reject' ? 'Tolak Karya' : 'Ya, Hapus' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  </div>
</template>
