<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Youtube, ExternalLink, Download, Play, Search, Filter } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Materi Pembelajaran - PF Space',
  meta: [
    { name: 'description', content: 'Kumpulan materi pembelajaran perfilman dalam bentuk PDF dan Video.' }
  ]
})

const materials = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedType = ref('all')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/learning-materials')
    if (res.success) {
      materials.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch materials:', err)
  } finally {
    loading.value = false
  }
}

const filteredMaterials = computed(() => {
  return materials.value.filter(m => {
    const matchesSearch = m.judul.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         (m.deskripsi && m.deskripsi.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesType = selectedType.value === 'all' || m.tipe === selectedType.value
    return matchesSearch && matchesType
  })
})

const getYoutubeEmbedUrl = (url) => {
  if (!url) return ''
  // Handle various youtube formats
  let videoId = ''
  if (url.includes('v=')) {
    videoId = url.split('v=')[1].split('&')[0]
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0]
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

const getFullUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />
    
    <main class="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-28">
      <SectionHeader 
        title="Materi Pembelajaran" 
        subtitle="Akses berbagai materi pendukung pembelajaran produksi film dan sistem informasi."
        :light-text="false"
      />

      <!-- Filters -->
      <div class="mb-10 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari materi..."
            class="w-full pl-10 pr-4 py-2 bg-white border-2 border-black shadow-brutal-sm focus:outline-none focus:ring-0"
          />
        </div>
        <div class="flex gap-2">
          <Button 
            variant="outline"
            :class="[selectedType === 'all' ? 'bg-brand-teal text-white' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]']"
            @click="selectedType = 'all'"
          >
            Semua
          </Button>
          <Button 
            variant="outline"
            :class="[selectedType === 'pdf' ? 'bg-brand-red text-white' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]']"
            @click="selectedType = 'pdf'"
          >
            <FileText class="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline"
            :class="[selectedType === 'video' ? 'bg-[#FF0000] text-white' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]']"
            @click="selectedType = 'video'"
          >
            <Youtube class="w-4 h-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card v-for="i in 6" :key="i" class="h-64 animate-pulse bg-white border-2 border-black shadow-brutal" />
      </div>

      <div v-else-if="filteredMaterials.length === 0">
        <EmptyState 
          title="Materi Tidak Ditemukan" 
          description="Coba gunakan kata kunci lain atau filter yang berbeda."
        />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card 
          v-for="material in filteredMaterials" 
          :key="material.materi_id"
          class="bg-white border-2 border-black shadow-brutal overflow-hidden flex flex-col h-full hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all"
        >
          <!-- Thumbnail / Icon Header -->
          <div class="aspect-video bg-stone-100 border-b-2 border-black relative group overflow-hidden">
            <template v-if="material.tipe === 'video'">
              <iframe 
                v-if="material.video_url"
                :src="getYoutubeEmbedUrl(material.video_url)" 
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-[#FF0000]">
                <Youtube class="w-16 h-16" />
                <span class="mt-2 font-bold">VIDEO</span>
              </div>
              <div class="absolute top-2 right-2">
                <Badge class="bg-[#FF0000] text-white border-black border">VIDEO</Badge>
              </div>
            </template>
            <template v-else>
              <div class="w-full h-full flex flex-col items-center justify-center text-brand-red p-4">
                <FileText class="w-16 h-16 mb-2" />
                <span class="font-bold text-center uppercase text-[10px] tracking-widest opacity-50">
                  {{ material.file_path?.includes('.') ? material.file_path.split('.').pop() : 'PDF' }}
                </span>
              </div>
              <div class="absolute top-2 right-2">
                <Badge class="bg-brand-red text-white border-black border">PDF</Badge>
              </div>
              <a 
                :href="getFullUrl(material.file_path)" 
                target="_blank"
                class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <div class="bg-white p-3 border-2 border-black shadow-brutal-xs">
                  <Play class="w-6 h-6 text-black fill-black" />
                </div>
              </a>
            </template>
          </div>

          <CardHeader class="flex-1">
            <CardTitle class="text-xl font-bold leading-tight">{{ material.judul }}</CardTitle>
            <CardDescription class="mt-2 line-clamp-3 text-stone-600">
              {{ material.deskripsi || 'Tidak ada deskripsi.' }}
            </CardDescription>
          </CardHeader>

          <CardFooter class="border-t-2 border-black p-4 bg-stone-50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full border border-black bg-brand-teal overflow-hidden flex-shrink-0">
                <img v-if="material.creator?.image" :src="material.creator.image" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                  {{ material.creator?.name?.[0]?.toUpperCase() || 'A' }}
                </div>
              </div>
              <span class="text-xs font-medium text-stone-700">{{ material.creator?.name || 'Admin' }}</span>
            </div>

            <Button 
              v-if="material.tipe === 'pdf'"
              size="sm"
              variant="outline"
              class="border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] h-8 px-3"
              as="a"
              :href="getFullUrl(material.file_path)"
              target="_blank"
            >
              <Download class="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              v-else
              size="sm"
              variant="outline"
              class="border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] h-8 px-3"
              as="a"
              :href="material.video_url"
              target="_blank"
            >
              <ExternalLink class="w-4 h-4 mr-2" />
              Buka YT
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.shadow-brutal-xs {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
}
</style>
