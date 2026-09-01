<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import { 
  TrendingUp, Trophy, Flame, Film as FilmIcon, Heart, Download, 
  RefreshCw, Filter, Search, RotateCcw, AlertTriangle, Trash2, 
  ExternalLink, X, Loader2, BarChart2, Layers, Calendar, 
  Award
} from 'lucide-vue-next'
import AdminPosterImage from '@/components/AdminPosterImage.vue'

const { showToast } = useToast()

// Data states
const trendingKaryas = ref([])
const categories = ref([])
const loadingTrending = ref(true)
const loadingCategories = ref(false)
const actionLoading = ref(false)

// Filter states
const selectedPeriod = ref('all') // 'week' | 'month' | 'all'
const selectedYear = ref('all')
const selectedCategory = ref('all')
const selectedLimit = ref('all')
const searchQuery = ref('')

// Modal states
const showResetAllModal = ref(false)
const resetConfirmInput = ref('')
const showResetFilmModal = ref(false)
const filmToReset = ref(null)

// Dynamic year options (current year down to 2020)
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y)
  }
  return years
})

// Period options
const periodOptions = [
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'all', label: 'Semua Waktu' }
]

// Limit options
const limitOptions = [
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: '50', label: 'Top 50' },
  { value: '100', label: 'Top 100' },
  { value: '250', label: 'Top 250' },
  { value: '500', label: 'Top 500' },
  { value: 'all', label: 'Semua Data' }
]

// Helper: Extract creator or director name accurately
const getCreatorName = (karya) => {
  if (!karya) return 'Kreator SMK'
  if (karya.creator?.name) return karya.creator.name
  if (karya.sutradara) return karya.sutradara
  if (karya.crew) {
    if (typeof karya.crew === 'object' && karya.crew.sutradara) return karya.crew.sutradara
    if (Array.isArray(karya.crew)) {
      const dir = karya.crew.find(c => /sutradara|director/i.test(c.role || ''))
      if (dir?.name) return dir.name
    }
  }
  return 'Kreator SMK'
}

// Fetch categories for filtering
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const res = await api.get('/api/categories')
    if (Array.isArray(res)) {
      categories.value = res
    } else if (res?.data && Array.isArray(res.data)) {
      categories.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  } finally {
    loadingCategories.value = false
  }
}

// Fetch trending leaderboard with active filters
const fetchTrending = async () => {
  loadingTrending.value = true
  try {
    const params = {
      period: selectedPeriod.value,
      limit: selectedLimit.value === 'all' ? 10000 : (parseInt(selectedLimit.value) || 10000)
    }

    if (selectedYear.value !== 'all') {
      params.year = selectedYear.value
    }

    if (selectedCategory.value !== 'all') {
      params.category_id = selectedCategory.value
    }

    const res = await api.get('/api/votes/trending', { params })

    if (Array.isArray(res)) {
      trendingKaryas.value = res
    } else if (res?.data && Array.isArray(res.data)) {
      trendingKaryas.value = res.data
    } else if (res?.success && Array.isArray(res.data)) {
      trendingKaryas.value = res.data
    } else {
      trendingKaryas.value = []
    }
  } catch (err) {
    console.error('Failed to fetch trending:', err)
    showToast('Gagal memuat data trending', 'error')
  } finally {
    loadingTrending.value = false
  }
}

// Reset active filters to default
const resetFilters = () => {
  selectedPeriod.value = 'all'
  selectedYear.value = 'all'
  selectedCategory.value = 'all'
  selectedLimit.value = 'all'
  searchQuery.value = ''
  fetchTrending()
}

// Client-side search filtering on current trending list
const filteredTrendingList = computed(() => {
  if (!searchQuery.value.trim()) {
    return trendingKaryas.value
  }
  const q = searchQuery.value.toLowerCase().trim()
  return trendingKaryas.value.filter(karya => {
    const titleMatch = karya.judul?.toLowerCase().includes(q)
    const creatorName = getCreatorName(karya).toLowerCase()
    const creatorMatch = creatorName.includes(q)
    const categoryMatch = karya.category?.nama_kategori?.toLowerCase().includes(q)
    return titleMatch || creatorMatch || categoryMatch
  })
})

// Quick Stat Metrics
const totalVotesInList = computed(() => {
  return trendingKaryas.value.reduce((acc, curr) => acc + (parseInt(curr.vote_count) || 0), 0)
})

const topFilm = computed(() => {
  return trendingKaryas.value.length > 0 ? trendingKaryas.value[0] : null
})

const totalCompetitors = computed(() => {
  return trendingKaryas.value.length
})

const avgVotesPerFilm = computed(() => {
  if (trendingKaryas.value.length === 0) return 0
  return (totalVotesInList.value / trendingKaryas.value.length).toFixed(1)
})

const highestVoteCount = computed(() => {
  return topFilm.value ? Math.max(topFilm.value.vote_count, 1) : 1
})

// Calculate percentage for vote distribution bar
const getVotePercentage = (voteCount) => {
  if (!highestVoteCount.value || highestVoteCount.value <= 0) return 0
  return Math.min(Math.round((voteCount / highestVoteCount.value) * 100), 100)
}

// Export current filtered leaderboard data to CSV
const exportToCSV = () => {
  if (filteredTrendingList.value.length === 0) {
    showToast('Tidak ada data untuk diekspor', 'warning')
    return
  }

  try {
    const headers = ['Peringkat', 'ID Film', 'Judul Film', 'Kategori', 'Tahun', 'Sutradara/Kreator', 'Jumlah Suara']
    const rows = filteredTrendingList.value.map((karya, idx) => [
      idx + 1,
      karya.film_id,
      `"${(karya.judul || '').replace(/"/g, '""')}"`,
      `"${(karya.category?.nama_kategori || '-').replace(/"/g, '""')}"`,
      karya.tahun_karya || '-',
      `"${getCreatorName(karya).replace(/"/g, '""')}"`,
      karya.vote_count || 0
    ])

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const periodLabel = selectedPeriod.value
    const yearLabel = selectedYear.value === 'all' ? 'semua-tahun' : selectedYear.value
    const dateStr = new Date().toISOString().slice(0, 10)

    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-trending-pfspace-${periodLabel}-${yearLabel}-${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('Laporan CSV berhasil diunduh!', 'success')
  } catch (err) {
    console.error('Failed to export CSV:', err)
    showToast('Gagal mengekspor CSV', 'error')
  }
}

// Granular Reset: Open modal for a specific film
const openResetFilmConfirm = (karya) => {
  filmToReset.value = karya
  showResetFilmModal.value = true
}

// Granular Reset: Execute vote deletion for single film
const executeResetFilmVotes = async () => {
  if (!filmToReset.value) return

  actionLoading.value = true
  try {
    const res = await api.delete(`/api/votes/film/${filmToReset.value.film_id}/reset`)
    if (res?.success !== false) {
      showToast(`Suara untuk "${filmToReset.value.judul}" berhasil direset.`, 'success')
      showResetFilmModal.value = false
      filmToReset.value = null
      await fetchTrending()
    } else {
      throw new Error(res?.message || 'Gagal mereset suara film')
    }
  } catch (error) {
    console.error('Reset film votes error:', error)
    showToast(error.message || 'Terjadi kesalahan saat mereset suara film.', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Global Reset: Open modal
const openResetAllConfirm = () => {
  resetConfirmInput.value = ''
  showResetAllModal.value = true
}

// Global Reset: Execute complete database vote wipe
const executeResetAllVotes = async () => {
  if (resetConfirmInput.value.trim() !== 'RESET-TRENDING') {
    showToast('Harap ketik "RESET-TRENDING" untuk mengonfirmasi.', 'warning')
    return
  }

  actionLoading.value = true
  try {
    const res = await api.delete('/api/votes/reset')
    if (res?.success !== false) {
      showToast('Seluruh data voting trending berhasil direset ke 0.', 'success')
      showResetAllModal.value = false
      resetConfirmInput.value = ''
      await fetchTrending()
    } else {
      throw new Error(res?.message || 'Gagal mereset semua voting')
    }
  } catch (error) {
    console.error('Reset all votes error:', error)
    showToast(error.message || 'Terjadi kesalahan saat mereset voting global.', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Watch filters to automatically refetch
watch([selectedPeriod, selectedYear, selectedCategory, selectedLimit], () => {
  fetchTrending()
})

onMounted(() => {
  fetchCategories()
  fetchTrending()
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
        Manajer Trending
      </Badge>
    </nav>

    <!-- Page Header with Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <PageHeader 
        title="Manajemen Trending" 
        description="Papan peringkat apresiasi karya, filter kurasi laporan, dan kontrol reset data suara."
        :icon="TrendingUp"
        icon-color="bg-brand-teal text-white"
      />

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Ekspor CSV Button: Hijau Brand Teal -->
        <button 
          type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-teal hover:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          @click="exportToCSV"
          :disabled="loadingTrending || filteredTrendingList.length === 0"
        >
          <Download class="w-3.5 h-3.5 stroke-[2]" />
          Ekspor CSV
        </button>

        <!-- Segarkan Button: Netral -->
        <button 
          type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          @click="fetchTrending"
          :disabled="loadingTrending"
        >
          <RefreshCw 
            class="w-3.5 h-3.5 stroke-[2]" 
            :class="{ 'animate-spin': loadingTrending }"
          />
          Segarkan
        </button>
      </div>
    </div>

    <!-- Quick Stat KPI Cards: Ultra-Compact & Proportional (Sleek Horizontal Style) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
      <!-- Card 1: Total Votes (Aksen Merah) -->
      <Card class="border-2 border-black dark:border-stone-100 shadow-brutal-xs bg-white dark:bg-stone-900">
        <CardContent class="p-2.5 md:p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
              Total Apresiasi
            </span>
            <div class="w-6 h-6 bg-red-100 dark:bg-red-950/60 border border-black dark:border-stone-100 flex items-center justify-center text-brand-red flex-shrink-0">
              <Heart class="w-3 h-3 fill-current" />
            </div>
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-lg md:text-xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
              {{ totalVotesInList.toLocaleString('id-ID') }}
            </span>
            <span class="text-[11px] text-stone-500 dark:text-stone-400 font-medium">suara</span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Top Film (Aksen Kuning) -->
      <Card class="border-2 border-black dark:border-stone-100 shadow-brutal-xs bg-white dark:bg-stone-900">
        <CardContent class="p-2.5 md:p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
              Peringkat #1
            </span>
            <div class="w-6 h-6 bg-yellow-100 dark:bg-yellow-950/60 border border-black dark:border-stone-100 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
              <Trophy class="w-3 h-3" />
            </div>
          </div>
          <div class="mt-1 flex items-baseline gap-1.5 min-w-0">
            <span class="text-xs md:text-sm font-bold truncate text-stone-900 dark:text-stone-100" :title="topFilm?.judul || 'Belum ada data'">
              {{ topFilm ? topFilm.judul : '-' }}
            </span>
            <span v-if="topFilm" class="text-[10px] text-yellow-600 dark:text-yellow-400 font-mono font-bold whitespace-nowrap flex-shrink-0">
              ({{ topFilm.vote_count }} suara)
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 3: Total Competitors (Aksen Hijau/Teal) -->
      <Card class="border-2 border-black dark:border-stone-100 shadow-brutal-xs bg-white dark:bg-stone-900">
        <CardContent class="p-2.5 md:p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
              Karya Terdaftar
            </span>
            <div class="w-6 h-6 bg-teal-100 dark:bg-teal-950/60 border border-black dark:border-stone-100 flex items-center justify-center text-brand-teal dark:text-teal-400 flex-shrink-0">
              <FilmIcon class="w-3 h-3" />
            </div>
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-lg md:text-xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
              {{ totalCompetitors }}
            </span>
            <span class="text-[11px] text-stone-500 dark:text-stone-400 font-medium">film</span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 4: Avg Votes (Netral) -->
      <Card class="border-2 border-black dark:border-stone-100 shadow-brutal-xs bg-white dark:bg-stone-900">
        <CardContent class="p-2.5 md:p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
              Rata-rata Suara
            </span>
            <div class="w-6 h-6 bg-stone-100 dark:bg-stone-800 border border-black dark:border-stone-100 flex items-center justify-center text-stone-700 dark:text-stone-300 flex-shrink-0">
              <BarChart2 class="w-3 h-3" />
            </div>
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-lg md:text-xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
              {{ avgVotesPerFilm }}
            </span>
            <span class="text-[11px] text-stone-500 dark:text-stone-400 font-medium">/ karya</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Multi-Dimensional Filter Bar -->
    <Card class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900">
      <CardHeader class="py-2.5 px-4 md:px-5 border-b-2 border-black dark:border-stone-100 bg-stone-50 dark:bg-stone-800">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-brand-teal" />
            <CardTitle class="text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100">Filter & Parameter Peringkat</CardTitle>
          </div>
          <!-- Reset Filter Button: Kuning -->
          <button 
            type="button"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold bg-yellow-400 hover:bg-yellow-500 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs transition-all cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="w-3 h-3" />
            Reset Filter
          </button>
        </div>
      </CardHeader>
      <CardContent class="p-3.5 md:p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Filter 1: Periode Waktu -->
          <div class="space-y-1">
            <label class="text-[11px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Calendar class="w-3 h-3 text-brand-teal" />
              Periode Waktu
            </label>
            <select 
              v-model="selectedPeriod"
              class="w-full h-8.5 px-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium text-xs shadow-brutal-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option v-for="p in periodOptions" :key="p.value" :value="p.value">
                {{ p.label }}
              </option>
            </select>
          </div>

          <!-- Filter 2: Tahun Karya -->
          <div class="space-y-1">
            <label class="text-[11px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Calendar class="w-3 h-3 text-brand-teal" />
              Tahun Karya
            </label>
            <select 
              v-model="selectedYear"
              class="w-full h-8.5 px-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium text-xs shadow-brutal-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="all">Semua Tahun</option>
              <option v-for="y in yearOptions" :key="y" :value="y">
                Tahun {{ y }}
              </option>
            </select>
          </div>

          <!-- Filter 3: Kategori -->
          <div class="space-y-1">
            <label class="text-[11px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Layers class="w-3 h-3 text-brand-teal" />
              Kategori Film
            </label>
            <select 
              v-model="selectedCategory"
              class="w-full h-8.5 px-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium text-xs shadow-brutal-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="all">Semua Kategori</option>
              <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id">
                {{ cat.nama_kategori }}
              </option>
            </select>
          </div>

          <!-- Filter 4: Batas Tampilan (Limit) -->
          <div class="space-y-1">
            <label class="text-[11px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Award class="w-3 h-3 text-brand-teal" />
              Limit Data
            </label>
            <select 
              v-model="selectedLimit"
              class="w-full h-8.5 px-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium text-xs shadow-brutal-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option v-for="lim in limitOptions" :key="lim.value" :value="lim.value">
                {{ lim.label }}
              </option>
            </select>
          </div>

          <!-- Filter 5: Pencarian Cepat -->
          <div class="space-y-1">
            <label class="text-[11px] font-mono font-bold uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <Search class="w-3 h-3 text-brand-teal" />
              Cari Judul / Kreator
            </label>
            <div class="relative">
              <Input 
                v-model="searchQuery" 
                placeholder="Cari..."
                class="h-8.5 text-xs pr-7 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-brutal-xs"
              />
              <button 
                v-if="searchQuery" 
                @click="searchQuery = ''" 
                class="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Leaderboard Table Section -->
    <Card class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900">
      <CardHeader class="py-3 px-4 md:px-6 bg-stone-50 dark:bg-stone-800 border-b-2 border-black dark:border-stone-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Trophy class="w-4 h-4 text-yellow-500" />
            <div>
              <CardTitle class="text-sm md:text-base font-bold text-stone-900 dark:text-stone-100">
                Papan Peringkat Apresiasi
              </CardTitle>
            </div>
          </div>

          <!-- Current active filter pills -->
          <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span class="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 font-bold border border-black dark:border-stone-400 text-stone-800 dark:text-stone-200">
              Periode: {{ periodOptions.find(p => p.value === selectedPeriod)?.label }}
            </span>
            <span v-if="selectedYear !== 'all'" class="px-2 py-0.5 bg-teal-100 dark:bg-teal-950/80 text-brand-teal dark:text-teal-300 font-bold border border-brand-teal">
              Tahun: {{ selectedYear }}
            </span>
            <span class="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 font-bold border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300">
              {{ filteredTrendingList.length }} Karya
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="loadingTrending" class="p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-brand-teal" />
          <p class="font-mono text-xs text-stone-500 dark:text-stone-400">Menghitung peringkat suara...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredTrendingList.length === 0" class="p-10 text-center">
          <div class="w-12 h-12 mx-auto mb-3 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center justify-center">
            <FilmIcon class="w-6 h-6 text-stone-400" />
          </div>
          <h3 class="text-sm font-bold text-stone-900 dark:text-stone-100">Tidak ada karya ditemukan</h3>
          <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
            Tidak ada data suara yang cocok dengan kriteria filter saat ini.
          </p>
          <button 
            type="button"
            class="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        <!-- Responsive Table with Generous Breathing Room -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <th class="py-3.5 px-5 w-16 text-center">Rank</th>
                <th class="py-3.5 px-5">Karya & Kategori</th>
                <th class="py-3.5 px-5 w-64">Sutradara / Kreator</th>
                <th class="py-3.5 px-5 w-48 text-right">Jumlah Suara</th>
                <th class="py-3.5 px-5 w-52 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
              <tr 
                v-for="(karya, index) in filteredTrendingList" 
                :key="karya.film_id"
                class="hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
              >
                <!-- Rank Column with Podium Badging -->
                <td class="py-4 px-5 text-center align-middle">
                  <div 
                    class="w-9 h-9 mx-auto flex items-center justify-center font-bold font-mono text-xs border-2 border-black dark:border-stone-100 shadow-brutal-xs"
                    :class="{
                      'bg-yellow-400 text-stone-950 font-black ring-2 ring-yellow-400': index === 0,
                      'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100': index > 0
                    }"
                  >
                    #{{ index + 1 }}
                  </div>
                </td>

                <!-- Film Poster & Title + Category & Year Labels (Spacious layout) -->
                <td class="py-4 px-5 align-middle">
                  <div class="flex items-center gap-3.5">
                    <!-- Thumbnail Poster (Auto-fallback to NO POSTER on error) -->
                    <AdminPosterImage 
                      :src="karya.gambar_poster" 
                      :alt="karya.judul"
                      className="w-12 h-16"
                    />

                    <!-- Title + Category & Year Badges -->
                    <div class="min-w-0 flex-1">
                      <router-link 
                        :to="`/archive/${karya.slug}`" 
                        target="_blank"
                        class="font-bold text-sm md:text-base text-stone-900 dark:text-stone-100 hover:text-brand-teal hover:underline line-clamp-1 inline-flex items-center gap-1.5 group"
                      >
                        <span>{{ karya.judul }}</span>
                        <ExternalLink class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-brand-teal" />
                      </router-link>

                      <!-- Labels: Category and Year directly under title with proper breathing space -->
                      <div class="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge 
                          variant="secondary" 
                          class="font-bold text-[10px] md:text-[11px] py-0.5 px-2 border border-black dark:border-stone-600 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 shadow-brutal-xs"
                        >
                          {{ karya.category?.nama_kategori || 'Umum' }}
                        </Badge>
                        <span class="text-[10px] md:text-[11px] font-mono font-bold px-2 py-0.5 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300">
                          Tahun {{ karya.tahun_karya || '-' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Creator / Director Info -->
                <td class="py-4 px-5 align-middle">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 border border-black dark:border-stone-300 flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold font-mono text-stone-900 dark:text-stone-100">
                      <img 
                        v-if="karya.creator?.image" 
                        :src="assetUrl(karya.creator.image)" 
                        class="w-full h-full object-cover" 
                      />
                      <span v-else>{{ (getCreatorName(karya) || 'K')[0].toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {{ getCreatorName(karya) }}
                      </div>
                      <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate mt-0.5">
                        Sutradara / Pengunggah
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Vote Count & Visual Distribution Bar -->
                <td class="py-4 px-5 align-middle text-right">
                  <div class="flex flex-col items-end gap-1.5">
                    <div class="flex items-center gap-1.5">
                      <Heart class="w-3.5 h-3.5 fill-brand-red text-brand-red" />
                      <span class="font-mono font-black text-sm md:text-base text-stone-900 dark:text-stone-100">
                        {{ (karya.vote_count || 0).toLocaleString('id-ID') }}
                      </span>
                      <span class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">suara</span>
                    </div>

                    <!-- Progress Bar Relative to Top 1 -->
                    <div class="w-32 h-2 bg-stone-200 dark:bg-stone-700 border border-black dark:border-stone-500 overflow-hidden">
                      <div 
                        class="h-full bg-brand-teal transition-all duration-500"
                        :style="{ width: `${getVotePercentage(karya.vote_count)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Actions: Buka (Hijau/Teal) & Reset (Merah) with comfortable spacing -->
                <td class="py-4 px-5 align-middle text-center">
                  <div class="inline-flex items-center justify-center gap-2">
                    <!-- Buka Button -->
                    <router-link 
                      :to="`/archive/${karya.slug}`" 
                      target="_blank"
                      class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-teal hover:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all whitespace-nowrap cursor-pointer"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </router-link>

                    <!-- Reset Suara Button -->
                    <button 
                      type="button"
                      class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-red hover:bg-red-600 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all whitespace-nowrap cursor-pointer"
                      @click="openResetFilmConfirm(karya)"
                    >
                      <RotateCcw class="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Danger Zone Card (Global Reset): Merah -->
    <Card class="border-2 border-red-500 dark:border-red-600 shadow-brutal bg-white dark:bg-stone-900">
      <CardHeader class="py-3 px-4 md:px-6 bg-red-50 dark:bg-red-950/60 border-b-2 border-red-500 dark:border-red-600">
        <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle class="w-4 h-4" />
          <CardTitle class="text-sm md:text-base text-red-700 dark:text-red-300 font-bold">Zona Bahaya: Reset Seluruh Suara (Global Reset)</CardTitle>
        </div>
        <CardDescription class="text-red-600 dark:text-red-400 text-xs">
          Tindakan ini untuk pergantian festival tahunan atau semester baru. Seluruh catatan suara semua karya akan dikembalikan ke 0.
        </CardDescription>
      </CardHeader>
      <CardContent class="p-4 md:p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="max-w-xl">
            <h4 class="font-bold text-xs md:text-sm text-stone-900 dark:text-stone-100">Hapus Semua Catatan Apresiasi</h4>
            <p class="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
              Mereset seluruh data suara di database kembali ke 0. Aksi ini dilindungi konfirmasi kata sandi dan tidak dapat dibatalkan.
            </p>
          </div>
          <button 
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-red hover:bg-red-600 text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
            @click="openResetAllConfirm"
            :disabled="actionLoading"
          >
            <Trash2 class="w-3.5 h-3.5" />
            Reset Seluruh Trending
          </button>
        </div>
      </CardContent>
    </Card>

    <!-- Modal 1: Granular Reset Per-Film Confirmation -->
    <div v-if="showResetFilmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="!actionLoading ? showResetFilmModal = false : null"></div>
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-md animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
        <div class="flex items-center justify-between px-5 py-3 border-b-2 border-black dark:border-stone-100 bg-yellow-100 dark:bg-yellow-950/60">
          <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
            <AlertTriangle class="w-4 h-4" />
            <h3 class="font-bold text-sm md:text-base">Reset Suara Film</h3>
          </div>
          <button 
            type="button"
            @click="showResetFilmModal = false" 
            class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors cursor-pointer"
            :disabled="actionLoading"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
        
        <div class="p-5 space-y-3.5">
          <p class="text-xs md:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            Apakah Anda yakin ingin mereset seluruh suara untuk karya berikut?
          </p>

          <!-- Film summary box -->
          <div class="p-3 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 flex items-center gap-3">
            <AdminPosterImage 
              :src="filmToReset?.gambar_poster" 
              :alt="filmToReset?.judul"
              className="w-10 h-14"
            />
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-xs md:text-sm truncate text-stone-900 dark:text-stone-100">{{ filmToReset?.judul }}</h4>
              <p class="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                Kreator: {{ getCreatorName(filmToReset) }}
              </p>
              <Badge variant="secondary" class="mt-1 font-mono text-[10px] bg-red-100 text-red-700 border border-red-300">
                {{ filmToReset?.vote_count }} Suara akan dihapus
              </Badge>
            </div>
          </div>

          <div class="p-2.5 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 text-[11px] text-yellow-800 dark:text-yellow-300 font-medium">
            Tindakan ini hanya menghapus catatan suara untuk karya ini saja tanpa memengaruhi karya lainnya.
          </div>
          
          <div class="flex gap-2.5 justify-end pt-1">
            <button 
              type="button" 
              class="px-3 py-1.5 border-2 border-black dark:border-stone-100 font-bold text-xs bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
              @click="showResetFilmModal = false" 
              :disabled="actionLoading"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-red hover:bg-red-600 text-white font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs text-xs cursor-pointer disabled:opacity-50" 
              @click="executeResetFilmVotes" 
              :disabled="actionLoading"
            >
              <Loader2 v-if="actionLoading" class="w-3.5 h-3.5 animate-spin" />
              <RotateCcw v-else class="w-3.5 h-3.5" />
              Ya, Reset Suara Film Ini
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 2: Global Reset Confirmation with Keyword Lock -->
    <div v-if="showResetAllModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="!actionLoading ? showResetAllModal = false : null"></div>
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-md animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
        <div class="flex items-center justify-between px-5 py-3 border-b-2 border-black dark:border-stone-100 bg-brand-red text-white">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-white animate-bounce" />
            <h3 class="font-bold text-base">Konfirmasi Reset Global</h3>
          </div>
          <button 
            type="button"
            @click="showResetAllModal = false" 
            class="p-1 border-2 border-transparent hover:border-white hover:bg-red-700 transition-colors cursor-pointer"
            :disabled="actionLoading"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
        
        <div class="p-5 space-y-3.5">
          <div class="p-3 bg-red-50 dark:bg-red-950/60 border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold leading-relaxed">
            PERINGATAN: Anda akan menghapus SELURUH catatan voting trending pada semua karya di sistem database PF Space.
          </div>

          <p class="text-xs text-stone-600 dark:text-stone-300">
            Untuk mengonfirmasi, silakan ketik kata kunci <strong class="font-mono font-black text-stone-950 dark:text-white tracking-wider">RESET-TRENDING</strong> pada kotak di bawah ini:
          </p>

          <div>
            <Input 
              v-model="resetConfirmInput" 
              placeholder="Ketik RESET-TRENDING"
              class="font-mono text-center tracking-widest font-bold text-xs h-9 border-2 border-brand-red focus:ring-brand-red bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              :disabled="actionLoading"
            />
          </div>
          
          <div class="flex gap-2.5 justify-end pt-1">
            <button 
              type="button" 
              class="px-3 py-1.5 border-2 border-black dark:border-stone-100 font-bold text-xs bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
              @click="showResetAllModal = false" 
              :disabled="actionLoading"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-red hover:bg-red-600 text-white font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs text-xs cursor-pointer disabled:opacity-50" 
              @click="executeResetAllVotes" 
              :disabled="actionLoading || resetConfirmInput.trim() !== 'RESET-TRENDING'"
            >
              <Loader2 v-if="actionLoading" class="w-3.5 h-3.5 animate-spin" />
              <Trash2 v-else class="w-3.5 h-3.5" />
              Hapus Seluruh Suara
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
