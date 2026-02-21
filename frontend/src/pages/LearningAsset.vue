<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, Download, ArrowLeft, FileText, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

// Route params
const archiveSlug = computed(() => route.params.archiveSlug)
const assetSlug = computed(() => route.params.assetSlug)

const film = ref(null)
const loading = ref(true)
const error = ref(null)

// Asset mapping
const assetConfig = {
  'naskah-film': {
    field: 'file_naskah',
    title: 'Naskah',
    type: 'Script'
  },
  'storyboard': {
    field: 'file_storyboard',
    title: 'Storyboard',
    type: 'Visual'
  },
  'rab': {
    field: 'file_rab',
    title: 'RAB (Budget)',
    type: 'Document'
  }
}

const currentAssetConfig = computed(() => assetConfig[assetSlug.value] || null)

const assetUrl = computed(() => {
  if (!film.value || !currentAssetConfig.value) return null
  return film.value[currentAssetConfig.value.field]
})

const fetchFilm = async () => {
  if (!archiveSlug.value) return
  
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/api/films/${archiveSlug.value}`)
    film.value = res.data
    
    // Verify asset exists
    if (!currentAssetConfig.value || !film.value[currentAssetConfig.value.field]) {
      error.value = 'Aset pembelajaran tidak ditemukan untuk karya ini.'
    }
  } catch (err) {
    console.error('Failed to fetch archive:', err)
    error.value = 'Gagal memuat data karya.'
  } finally {
    loading.value = false
  }
}

// Viewer state
const zoomLevel = ref(100)

const zoomIn = () => {
  if (zoomLevel.value < 200) zoomLevel.value += 25
}

const zoomOut = () => {
  if (zoomLevel.value > 50) zoomLevel.value -= 25
}

const goBack = () => {
  router.push({ name: 'ArchiveDetail', params: { slug: film.value?.slug || archiveSlug.value } })
}

const downloadAsset = () => {
  if (assetUrl.value) {
    window.open(assetUrl.value, '_blank')
  }
}

const printAsset = () => {
  const iframe = document.querySelector('iframe')
  if (iframe) {
    iframe.contentWindow.print()
  }
}

// Breadcrumb items
const breadcrumbs = computed(() => {
  if (!film.value) return []
  return [
    { label: 'Beranda', path: '/' },
    { label: film.value.judul, path: `/archive/${film.value.slug}` },
    { label: currentAssetConfig.value?.title || 'Aset', active: true }
  ]
})

onMounted(() => {
  fetchFilm()
})

watch(() => route.params, () => {
  fetchFilm()
})
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />
    
    <main class="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-12">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 class="w-10 h-10 animate-spin text-stone-400 mb-4" />
        <p class="text-stone-500">Memuat aset pembelajaran...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <FileText class="w-16 h-16 text-stone-300 mb-4" />
        <h2 class="text-xl font-bold text-stone-800 mb-2">Aset Tidak Ditemukan</h2>
        <p class="text-stone-500 mb-6">{{ error }}</p>
        <Button @click="goBack">Kembali ke Detail Karya</Button>
      </div>

      <template v-else>
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <router-link 
              v-if="!crumb.active" 
              :to="crumb.path"
              class="font-bold uppercase tracking-wide text-stone-400 hover:text-stone-600 transition-colors"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else class="font-bold uppercase tracking-wide text-stone-800 border-b-2 border-orange-400 pb-0.5">
              {{ crumb.label }}
            </span>
            <span v-if="index < breadcrumbs.length - 1" class="text-stone-300">/</span>
          </template>
        </nav>

        <!-- Toolbar -->
        <div class="bg-stone-200 rounded-xl border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(43,38,38,1)] p-4 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <!-- Back Button & Title -->
            <div class="flex items-center gap-4">
              <Button 
                variant="ghost" 
                @click="goBack"
                class="flex items-center gap-2 hover:bg-stone-300"
              >
                <ArrowLeft class="w-5 h-5" />
                <span class="font-bold hidden sm:inline">Kembali</span>
              </Button>
              
              <div class="hidden sm:block w-px h-8 bg-stone-300" />
              
              <div class="flex items-center gap-3">
                <div class="w-11 h-10 bg-stone-100 rounded-lg border border-stone-300 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h1 class="text-lg md:text-xl font-serif text-stone-800 leading-tight">{{ currentAssetConfig?.title }}</h1>
                  <p class="text-xs font-mono uppercase text-stone-600">{{ currentAssetConfig?.type }} • PDF</p>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-3 ml-auto">
              <!-- Action Buttons -->
              <!-- <Button 
                variant="outline" 
                class="hidden md:flex items-center gap-2 border-2 border-stone-300"
                @click="printAsset"
              >
                <Printer class="w-4 h-4" />
                <span class="font-bold">Print</span>
              </Button> -->
              
              <!-- <Button 
                @click="downloadAsset"
                class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(43,38,38,1)]"
              >
                <Download class="w-4 h-4" />
                <span class="font-bold">Download</span>
              </Button> -->
            </div>
          </div>
        </div>

        <!-- Document Viewer (PDF Iframe) -->
        <div class="bg-stone-700 rounded-xl border-2 border-stone-800 shadow-inner overflow-hidden min-h-[600px] lg:min-h-[800px] relative">
          <iframe 
            v-if="assetUrl"
            :src="assetUrl + '#toolbar=0'"
            class="w-full h-full absolute inset-0 bg-white"
            frameborder="0"
          ></iframe>
          <div v-else class="absolute inset-0 flex items-center justify-center text-white">
            <p>File tidak dapat ditampilkan.</p>
          </div>
        </div>
      </template>
    </main>

    <Footer />
  </div>
</template>
