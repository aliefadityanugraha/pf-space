<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, FileText, ImageIcon, Film, 
  Maximize2, Minimize2, ChevronDown, ExternalLink,
  FileSpreadsheet, MonitorPlay
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

const route = useRoute()
const router = useRouter()
const filmSlug = route.params.slug

const film = ref(null)
const loading = ref(true)
const activeTab = ref('naskah') // 'naskah' | 'storyboard' | 'rab'

// Fetch film data
const fetchFilm = async () => {
  loading.value = true
  try {
    const res = await api.get(`/api/films/${filmSlug}`)
    film.value = res.data
    
    // Auto-select tab based on availability
    if (film.value.file_naskah) activeTab.value = 'naskah'
    else if (film.value.file_storyboard) activeTab.value = 'storyboard'
    else if (film.value.file_rab) activeTab.value = 'rab'
    
  } catch (err) {
    console.error("Failed to fetch film:", err)
    router.push('/')
  } finally {
    loading.value = false
  }
}

// Video helpers
const isYoutubeUrl = (url) => url?.includes('youtube.com') || url?.includes('youtu.be')
const getYoutubeEmbedUrl = (url) => {
  if (!url) return ''
  let videoId = ''
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0]
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}

// Helper to get full document URL
const getDocumentUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  
  // Get API URL from env or default
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  // Ensure path starts with / if needed
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_URL}${cleanPath}`
}

// Active document URL
const activeDocUrl = computed(() => {
  if (!film.value) return null
  let path = null
  switch (activeTab.value) {
    case 'naskah': path = film.value.file_naskah; break;
    case 'storyboard': path = film.value.file_storyboard; break;
    case 'rab': path = film.value.file_rab; break;
  }
  return getDocumentUrl(path)
})

onMounted(() => {
  fetchFilm()
})

useHead({
  title: computed(() => film.value ? `Study: ${film.value.judul} - PF Space` : 'Loading...')
})
</script>

<template>
  <div class="h-screen flex flex-row bg-stone-950 text-white overflow-hidden">
    
    <!-- 1. SIDEBAR NAVIGATION -->
    <aside class="w-64 bg-stone-900 border-r border-white/10 flex flex-col shrink-0 z-20">
      <!-- Header Sidebar: Back & Title -->
      <div class="p-6 border-b border-white/10">
        <button 
          @click="router.back()"
          class="flex items-center text-sm text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft class="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Kembali
        </button>
        
        <div v-if="loading" class="animate-pulse space-y-2">
          <div class="h-6 bg-white/10 rounded w-3/4"></div>
          <div class="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
        <div v-else-if="film">
          <h1 class="font-display font-medium text-lg text-white leading-tight mb-2">{{ film.judul }}</h1>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-stone-400 border border-white/5 uppercase tracking-wide">
            Mode Studi
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <div class="text-xs font-semibold text-stone-500 uppercase tracking-widest px-2 mb-2">Dokumen Produksi</div>
        
        <button 
          v-if="film?.file_naskah" 
          @click="activeTab = 'naskah'"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'naskah' ? 'bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'"
        >
          <FileText class="w-4 h-4" />
          <span>Naskah</span>
        </button>
        
        <button 
          v-if="film?.file_storyboard" 
          @click="activeTab = 'storyboard'"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'storyboard' ? 'bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'"
        >
          <ImageIcon class="w-4 h-4" />
          <span>Storyboard</span>
        </button>

        <button 
          v-if="film?.file_rab" 
          @click="activeTab = 'rab'"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200"
          :class="activeTab === 'rab' ? 'bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>RAB</span>
        </button>

        <div v-if="!loading && !film?.file_naskah && !film?.file_storyboard && !film?.file_rab" class="text-xs text-stone-600 px-3 py-2 italic">
          Tidak ada dokumen tersedia.
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-white/10 text-[10px] text-stone-600">
        &copy; PF Space Archive
      </div>
    </aside>

    <!-- 2. MAIN CONTENT (Stack View) -->
    <main v-if="!loading && film" class="flex-1 flex flex-col min-w-0 relative h-full">
      
      <!-- TOP: Video Player -->
      <div class="w-full h-[45%] bg-black flex flex-col border-b border-white/10 relative group shrink-0">
        <div class="w-full h-full relative">
            <iframe
              v-if="film.link_video_utama && isYoutubeUrl(film.link_video_utama)"
              :src="getYoutubeEmbedUrl(film.link_video_utama)"
              class="w-full h-full absolute inset-0"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowfullscreen
            ></iframe>
            <video
              v-else-if="film.link_video_utama"
              :src="film.link_video_utama"
              controls
              class="w-full h-full bg-black"
            ></video>
            <div v-else class="w-full h-full flex flex-col items-center justify-center bg-stone-930 text-stone-600 gap-4">
              <MonitorPlay class="w-16 h-16 opacity-20" />
              <span class="text-sm">Video tidak tersedia</span>
            </div>
        </div>
      </div>

      <!-- BOTTOM: Document Viewer -->
      <div class="flex-1 w-full bg-stone-100 relative flex flex-col min-h-0">
        <!-- Document Content -->
        <div class="flex-1 w-full h-full bg-stone-200 relative flex flex-col">
          <iframe 
            v-if="activeDocUrl"
            :src="activeDocUrl + '#toolbar=0&view=FitH'"
            class="flex-1 w-full"
            frameborder="0"
          ></iframe>
          
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-8 text-center bg-stone-50">
            <div class="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4">
              <FileText class="w-8 h-8 text-stone-400" />
            </div>
            <h3 class="font-bold text-stone-600 mb-1">Pilih Dokumen</h3>
            <p class="text-sm max-w-xs mx-auto">Pilih dokumen dari sidebar kiri untuk mulai mempelajari aset produksi film ini.</p>
          </div>
        </div>
      </div>

    </main>

    <!-- Loading State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-white/20 border-t-brand-red rounded-full animate-spin"></div>
    </div>
  </div>
</template>
