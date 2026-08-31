<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  Database, Video, FileText, Image as ImageIcon, User as UserIcon, 
  HardDrive, AlertCircle, RefreshCcw, Loader2, Sparkles, FolderArchive,
  PieChart, Server, CheckCircle2, ShieldAlert
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()
const loading = ref(true)
const storageStats = ref(null)

const formatSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const categoryConfig = {
  videos: {
    name: 'Video & Media HLS',
    desc: 'File master video, trailer, teaser, dan segmen HLS transcode.',
    color: 'bg-purple-500',
    colorText: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-500/15 dark:bg-purple-950/40 border-purple-500/40',
    icon: Video
  },
  documents: {
    name: 'Dokumen & Naskah',
    desc: 'Modul materi PDF, naskah skenario, storyboard, dan dokumen produksi.',
    color: 'bg-blue-500',
    colorText: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-500/15 dark:bg-blue-950/40 border-blue-500/40',
    icon: FileText
  },
  images: {
    name: 'Gambar & Poster',
    desc: 'Poster karya film, thumbnail modul, banner festival, dan backdrop.',
    color: 'bg-emerald-500',
    colorText: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-500/40',
    icon: ImageIcon
  },
  avatars: {
    name: 'Avatar & Profil',
    desc: 'Foto profil kustom kreator, siswa, dan staf pengajar.',
    color: 'bg-amber-500',
    colorText: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-500/15 dark:bg-amber-950/40 border-amber-500/40',
    icon: UserIcon
  }
}

const getCategoryConfig = (key) => {
  return categoryConfig[key] || {
    name: key,
    desc: 'Aset berkas penyimpanan.',
    color: 'bg-stone-500',
    colorText: 'text-stone-600 dark:text-stone-400',
    bgLight: 'bg-stone-500/15 dark:bg-stone-800 border-stone-500/40',
    icon: HardDrive
  }
}

const fetchStorageStats = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/admin/storage')
    if (response?.success) {
      storageStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch storage stats:', error)
    showToast('Gagal memuat statistik penyimpanan', 'error')
  } finally {
    loading.value = false
  }
}

const largestCategory = computed(() => {
  if (!storageStats.value?.categories) return '-'
  let maxCat = null
  let maxSize = -1
  for (const [key, cat] of Object.entries(storageStats.value.categories)) {
    if (cat.size > maxSize) {
      maxSize = cat.size
      maxCat = getCategoryConfig(key).name
    }
  }
  return maxCat || '-'
})

onMounted(() => {
  fetchStorageStats()
})
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 text-stone-900 dark:text-stone-100 max-w-7xl w-full mx-auto">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">
        Manajemen File &amp; Storage
      </Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader 
      title="Manajemen Penyimpanan & File" 
      description="Pantau volume kuota disk, distribusi berkas media (video, dokumen, gambar, avatar), dan efisiensi ruang server."
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <button 
          type="button"
          @click="fetchStorageStats" 
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <RefreshCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>Kalkulasi Ulang</span>
        </button>
      </template>
    </PageHeader>

    <!-- Structured Skeleton Loading State (Maintains full width & zero shift) -->
    <div v-if="loading && !storageStats" class="space-y-6 w-full animate-pulse">
      <!-- 4 Skeleton Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-stone-100 dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
          <div class="w-11 h-11 bg-stone-200 dark:bg-stone-800 border-2 border-black dark:border-stone-700 shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-2.5 bg-stone-200 dark:bg-stone-800 w-24"></div>
            <div class="h-5 bg-stone-300 dark:bg-stone-700 w-16"></div>
            <div class="h-2 bg-stone-200 dark:bg-stone-800 w-20"></div>
          </div>
        </div>
      </div>

      <!-- 2-Column Skeleton Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Skeleton Card -->
        <div class="lg:col-span-5 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-5 space-y-4 shadow-brutal">
          <div class="h-4 bg-stone-200 dark:bg-stone-800 w-44"></div>
          <div class="h-4 bg-stone-300 dark:bg-stone-700 w-full"></div>
          <div class="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div class="h-3.5 bg-stone-200 dark:bg-stone-800 w-32"></div>
            <div class="h-3.5 bg-stone-300 dark:bg-stone-700 w-full"></div>
            <div class="h-8 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 w-full"></div>
            <div class="h-8 bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 w-full"></div>
          </div>
        </div>

        <!-- Right Skeleton (4 Category Grid) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 space-y-3 shadow-brutal-xs">
              <div class="flex items-center justify-between">
                <div class="w-7 h-7 bg-stone-200 dark:bg-stone-800 border border-black dark:border-stone-700"></div>
                <div class="w-12 h-3 bg-stone-200 dark:bg-stone-800"></div>
              </div>
              <div class="h-6 bg-stone-300 dark:bg-stone-700 w-24"></div>
              <div class="h-3 bg-stone-200 dark:bg-stone-800 w-3/4"></div>
            </div>
          </div>
          <div class="h-16 bg-stone-100 dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 p-4"></div>
        </div>
      </div>

      <!-- Loading Banner Indicator -->
      <div class="flex items-center justify-center gap-2 pt-2 text-stone-500 font-mono text-xs">
        <Loader2 class="w-4 h-4 animate-spin text-brand-teal" />
        <span class="font-bold uppercase tracking-wider">Menghitung Kapasitas &amp; Distribusi File Server...</span>
      </div>
    </div>

    <template v-else-if="storageStats">
      <!-- Section 1: Executive KPI Stat Cards (4 Columns) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Total Upload Storage -->
        <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
          <div class="w-11 h-11 bg-teal-500/15 dark:bg-teal-400/20 border-2 border-brand-teal dark:border-teal-400 flex items-center justify-center text-brand-teal dark:text-teal-300 shadow-brutal-xs shrink-0">
            <FolderArchive class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Total Berkas Unggahan
            </div>
            <div class="text-xl font-display font-black text-stone-900 dark:text-stone-100 leading-tight">
              {{ formatSize(storageStats.totalSize) }}
            </div>
            <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              {{ storageStats.totalCount }} File Tersimpan
            </div>
          </div>
        </div>

        <!-- KPI 2: Server Disk Usage -->
        <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
          <div class="w-11 h-11 bg-blue-500/15 dark:bg-blue-400/20 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center text-blue-600 dark:text-blue-300 shadow-brutal-xs shrink-0">
            <HardDrive class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Penggunaan Disk Server
            </div>
            <div class="text-xl font-display font-black text-stone-900 dark:text-stone-100 leading-tight">
              {{ storageStats.disk?.usedPercent || 0 }}% <span class="text-xs font-normal text-stone-500">Terpakai</span>
            </div>
            <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              Sisa: {{ formatSize(storageStats.disk?.free) }}
            </div>
          </div>
        </div>

        <!-- KPI 3: Largest Category -->
        <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
          <div class="w-11 h-11 bg-purple-500/15 dark:bg-purple-400/20 border-2 border-purple-500 dark:border-purple-400 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-brutal-xs shrink-0">
            <PieChart class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Kategori Terbesar
            </div>
            <div class="text-sm font-bold text-stone-900 dark:text-stone-100 truncate" :title="largestCategory">
              {{ largestCategory }}
            </div>
            <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              Konsumsi Ruang Dominan
            </div>
          </div>
        </div>

        <!-- KPI 4: Storage Health -->
        <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
          <div class="w-11 h-11 bg-emerald-500/15 dark:bg-emerald-400/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-brutal-xs shrink-0">
            <CheckCircle2 class="w-5 h-5 stroke-[2.2]" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Status Penyimpanan
            </div>
            <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Optimal &amp; Normal
            </div>
            <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              Auto Sharp &amp; WebP Aktif
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: 2-Column Split Layout (Left: Kapasitas Disk & Proporsi, Right: 4 Kategori + Rekomendasi) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Kapasitas Disk & Proporsi (No Empty Gap) -->
        <Card class="lg:col-span-5 border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
          <CardHeader class="py-3.5 px-4 md:px-5 bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
                  <Database class="w-3.5 h-3.5" />
                </div>
                <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Kapasitas Disk &amp; Proporsi
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent class="p-4 md:p-5 space-y-4">
            <!-- Partisi Disk Server -->
            <div v-if="storageStats.disk" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs font-bold font-mono">
                <span class="text-stone-700 dark:text-stone-300 uppercase">Partisi Disk Server</span>
                <span class="text-brand-teal dark:text-teal-300">{{ storageStats.disk.usedPercent }}% Terpakai</span>
              </div>
              <div class="w-full h-3.5 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-300 overflow-hidden shadow-brutal-xs">
                <div 
                  class="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-700"
                  :style="{ width: `${storageStats.disk.usedPercent}%` }"
                ></div>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
                <span>Terpakai: {{ formatSize(storageStats.disk.used) }}</span>
                <span>Total: {{ formatSize(storageStats.disk.total) }}</span>
              </div>
            </div>

            <!-- Multi-segment Distribusi Berkas Unggahan -->
            <div class="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <div class="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>Distribusi Berkas Unggahan</span>
                <span class="font-mono text-[11px] text-stone-500 font-normal">{{ formatSize(storageStats.totalSize) }}</span>
              </div>
              
              <div class="w-full h-3.5 bg-stone-200 dark:bg-stone-800 border-2 border-black dark:border-stone-300 flex overflow-hidden shadow-brutal-xs">
                <div 
                  v-for="(cat, key) in storageStats.categories" 
                  :key="key"
                  :class="getCategoryConfig(key).color"
                  :style="{ width: `${(cat.size / (storageStats.totalSize || 1)) * 100}%` }"
                  :title="`${getCategoryConfig(key).name}: ${formatSize(cat.size)}`"
                  class="h-full transition-all duration-700"
                ></div>
              </div>

              <!-- Detailed Category Breakdown Rows -->
              <div class="space-y-1.5 pt-1.5">
                <div 
                  v-for="(cat, key) in storageStats.categories" 
                  :key="key"
                  class="flex items-center justify-between text-xs py-1.5 px-2.5 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="getCategoryConfig(key).color"></span>
                    <span class="font-bold text-stone-800 dark:text-stone-200 truncate">{{ getCategoryConfig(key).name }}</span>
                  </div>
                  <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span class="text-stone-500 dark:text-stone-400">({{ cat.count }} file)</span>
                    <span class="font-bold text-stone-900 dark:text-stone-100">{{ formatSize(cat.size) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Right: 4 Category Cards Grid (2x2) + Rekomendasi Efisiensi -->
        <div class="lg:col-span-7 space-y-4">
          <!-- 2x2 Grid of Category Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="(cat, key) in storageStats.categories" 
              :key="key"
              class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col justify-between"
            >
              <div>
                <!-- Header -->
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-7 h-7 border-2 border-black dark:border-stone-200 flex items-center justify-center shadow-brutal-xs text-white shrink-0"
                      :class="getCategoryConfig(key).color"
                    >
                      <component :is="getCategoryConfig(key).icon" class="w-3.5 h-3.5" />
                    </div>
                    <span class="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 truncate">
                      {{ getCategoryConfig(key).name }}
                    </span>
                  </div>
                  <span class="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700">
                    /{{ cat.name }}
                  </span>
                </div>

                <!-- Size & Count -->
                <div class="my-2">
                  <div class="text-2xl font-display font-black text-stone-900 dark:text-stone-100 leading-none">
                    {{ formatSize(cat.size) }}
                  </div>
                  <div class="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-1">
                    {{ cat.count }} Berkas Terunggah
                  </div>
                </div>

                <!-- Short Clean Description -->
                <p class="text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
                  {{ getCategoryConfig(key).desc }}
                </p>
              </div>

              <!-- Path Footer -->
              <div class="mt-3 pt-2 border-t border-stone-200 dark:border-stone-800 text-[10px] font-mono text-stone-500 truncate">
                uploads/{{ cat.name }}/
              </div>
            </div>
          </div>

          <!-- Rekomendasi Efisiensi Penyimpanan Card -->
          <div class="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-500 dark:border-amber-400/60 p-4 shadow-brutal-xs flex items-start gap-3">
            <div class="w-8 h-8 bg-amber-500/20 border border-amber-600 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <Sparkles class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <h4 class="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-0.5">
                Rekomendasi Efisiensi Penyimpanan
              </h4>
              <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                PF Space otomatis mengompresi gambar menjadi format <strong>WebP</strong> (kualitas 80%) dan mengonversi video ke format multi-resolusi <strong>HLS (m3u8)</strong> untuk menghemat ruang disk dan mempercepat pemuatan bagi siswa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <div v-else class="p-8 text-center bg-red-50 dark:bg-red-950/60 border-2 border-red-500 shadow-brutal-sm">
      <AlertCircle class="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 class="text-sm font-bold uppercase tracking-wider text-red-800 dark:text-red-200 mb-1">Gagal Memuat Data Penyimpanan</h3>
      <p class="text-xs text-red-600 dark:text-red-400 mb-4">Terjadi kendala saat membaca status partisi berkas sistem server.</p>
      <button 
        type="button" 
        @click="fetchStorageStats" 
        class="px-4 py-1.5 bg-red-600 text-white font-bold text-xs border-2 border-black shadow-brutal-xs hover:bg-red-700 cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  </div>
</template>

