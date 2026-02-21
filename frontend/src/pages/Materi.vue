<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import PageLayout from '@/components/PageLayout.vue'
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
  return assetUrl(path)
}

onMounted(fetchData)
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader 
        title="Materi Pembelajaran" 
        subtitle="Akses berbagai materi pendukung pembelajaran produksi film dan sistem informasi."
        :light-text="false"
      />

      <!-- Filters -->
      <div class="mb-6 md:mb-10 flex flex-col md:flex-row gap-3 md:gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari materi..."
            class="w-full pl-9 pr-4 py-2 bg-white border-2 border-black shadow-brutal-xs md:shadow-brutal-sm focus:outline-none focus:ring-0 text-sm h-10 md:h-11"
          />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button 
            variant="outline"
            :class="[selectedType === 'all' ? 'bg-brand-teal text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs text-[10px] md:text-sm h-10 px-3 whitespace-nowrap']"
            @click="selectedType = 'all'"
          >
            Semua
          </Button>
          <Button 
            variant="outline"
            :class="[selectedType === 'pdf' ? 'bg-brand-red text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs text-[10px] md:text-sm h-10 px-3 whitespace-nowrap']"
            @click="selectedType = 'pdf'"
          >
            <FileText class="w-3.5 h-3.5 mr-1.5" />
            PDF
          </Button>
          <Button 
            variant="outline"
            :class="[selectedType === 'video' ? 'bg-[#FF0000] text-white shadow-none translate-x-[1px] translate-y-[1px]' : 'bg-white text-black', 'border-2 border-black shadow-brutal-xs text-[10px] md:text-sm h-10 px-3 whitespace-nowrap']"
            @click="selectedType = 'video'"
          >
            <Youtube class="w-3.5 h-3.5 mr-1.5" />
            Video
          </Button>
        </div>
      </div>

      <!-- MATERIALS LIST -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 5" :key="i" class="h-24 animate-pulse bg-white border-2 border-black shadow-brutal-sm" />
      </div>

      <div v-else-if="filteredMaterials.length === 0">
        <EmptyState 
          title="Materi Tidak Ditemukan" 
          description="Coba gunakan kata kunci lain atau filter yang berbeda."
        />
      </div>

      <div v-else class="space-y-4 md:space-y-6">
        <div 
          v-for="material in filteredMaterials" 
          :key="material.materi_id"
          class="bg-white border-2 border-black shadow-brutal-sm overflow-hidden flex flex-col md:flex-row hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
        >
          <!-- Small Thumbnail / Type Icon -->
          <div class="w-full md:w-56 lg:w-72 aspect-video md:aspect-auto bg-stone-100 border-b-2 md:border-b-0 md:border-r-2 border-black flex-shrink-0 relative overflow-hidden">
            <template v-if="material.tipe === 'video'">
              <div v-if="material.video_url" class="w-full h-full relative group/vid">
                <img :src="`https://img.youtube.com/vi/${getYoutubeEmbedUrl(material.video_url).split('/').pop()}/mqdefault.jpg`" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 group-hover/vid:bg-black/20 transition-all">
                  <div class="w-10 h-10 bg-white border-2 border-black shadow-brutal-xs flex items-center justify-center">
                    <Play class="w-5 h-5 text-[#FF0000] fill-[#FF0000]" />
                  </div>
                </div>
              </div>
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-[#FF0000]">
                <Youtube class="w-10 h-10" />
              </div>
              <div class="absolute top-2 left-2">
                <Badge class="bg-[#FF0000] text-white border-black border text-[9px]">VIDEO</Badge>
              </div>
            </template>
            <template v-else>
              <div class="w-full h-full flex flex-col items-center justify-center text-brand-red p-4">
                <FileText class="w-10 h-10 mb-1" />
                <span class="font-black uppercase text-[10px] tracking-widest opacity-50 text-center">LEARNING DOCUMENT</span>
              </div>
              <div class="absolute top-2 left-2">
                <Badge class="bg-brand-red text-white border-black border text-[9px]">PDF</Badge>
              </div>
            </template>
          </div>

          <!-- Content Info -->
          <div class="flex-1 p-4 md:p-6 flex flex-col justify-center">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-base md:text-xl font-display font-black text-stone-900 group-hover:text-brand-teal transition-colors">
                  {{ material.judul }}
                </h3>
                <p class="mt-2 text-[11px] md:text-sm text-stone-500 font-medium line-clamp-2 leading-relaxed">
                  {{ material.deskripsi || 'Tidak ada deskripsi tersedia untuk materi ini.' }}
                </p>
                
                <!-- Meta Info -->
                <div class="mt-4 flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full border border-black bg-stone-200 overflow-hidden flex-shrink-0 shadow-[1px_1px_0px_#000]">
                      <img v-if="material.creator?.image" :src="material.creator.image" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center text-stone-600 text-[8px] font-black">
                        {{ material.creator?.name?.[0]?.toUpperCase() || 'A' }}
                      </div>
                    </div>
                    <span class="text-[10px] font-black text-stone-600 uppercase tracking-wider">{{ material.creator?.name || 'Admin' }}</span>
                  </div>
                  <div class="h-1 w-1 rounded-full bg-stone-300 hidden md:block"></div>
                  <span class="text-[10px] font-bold text-stone-400 uppercase">
                    {{ material.created_at ? new Date(material.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru' }}
                  </span>
                </div>
              </div>

              <!-- Action Button -->
              <div class="flex-shrink-0 flex items-center">
                <Button 
                  v-if="material.tipe === 'pdf'"
                  variant="outline"
                  class="w-full md:w-auto border-2 border-black bg-white shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] h-10 md:h-12 px-6 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 group/btn"
                  as="a"
                  :href="getFullUrl(material.file_path)"
                  target="_blank"
                >
                  <Download class="w-4 h-4 text-brand-red group-hover/btn:scale-110 transition-transform" />
                  Unduh Materi
                </Button>
                <Button 
                  v-else
                  variant="outline"
                  class="w-full md:w-auto border-2 border-black bg-white shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] h-10 md:h-12 px-6 text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 group/btn"
                  as="a"
                  :href="material.video_url"
                  target="_blank"
                >
                  <ExternalLink class="w-4 h-4 text-[#FF0000] group-hover/btn:scale-110 transition-transform" />
                  Buka Video
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.shadow-brutal-xs {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
}
</style>
