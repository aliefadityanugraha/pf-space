<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Film, Bookmark, BookmarkX, Eye, ArrowRight, Search 
} from 'lucide-vue-next'
import PageLayout from '@/components/PageLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import CollectionCardSkeleton from '@/components/CollectionCardSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Koleksi Simpanan Saya - PF Space'
})

const router = useRouter()
const collections = ref([])
const loading = ref(true)
const { showToast } = useToast()



const fetchCollections = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/collections')
    const arr = Array.isArray(res.data) ? res.data : []
    collections.value = arr.map(it => {
      const film = it.film || {}
      if (film.gambar_poster) {
        film.gambar_poster = assetUrl(film.gambar_poster)
      }
      it.film = film
      return it
    })
  } catch (err) {
    console.error('Failed to fetch collections:', err)
    showToast('Gagal memuat koleksi', 'error')
  } finally {
    loading.value = false
  }
}

const removingIds = ref(new Set())

const removeFromCollection = async (filmId) => {
  if (removingIds.value.has(filmId)) return
  
  removingIds.value.add(filmId)
  try {
    await api.post(`/api/collections/${filmId}/toggle`, {})
    collections.value = collections.value.filter(item => item.film_id !== filmId)
    showToast('Karya dihapus dari koleksi')
  } catch (err) {
    showToast('Gagal menghapus karya', 'error')
  } finally {
    removingIds.value.delete(filmId)
  }
}

onMounted(fetchCollections)
</script>

<template >
  <PageLayout>
  <div class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
    <div class="mb-8 md:mb-10 py-6 md:py-0">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl md:text-5xl font-display font-bold text-stone-900">Simpanan Saya</h1>
        </div>
        <p class="text-xs md:text-sm text-stone-500 font-body max-w-2xl px-1">
          Kumpulan karya favorit yang telah Anda simpan untuk ditonton kembali atau dipelajari aset pembelajarannya.
        </p>
      </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      <CollectionCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <!-- Content -->
    <div v-else-if="collections.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      <Card 
        v-for="item in collections" 
        :key="item.collection_id" 
        class="group bg-white border-2 border-black shadow-brutal hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-brutal-sm transition-all"
      >
        <CardContent class="p-0">
          <!-- Thumbnail -->
          <div class="aspect-video bg-stone-200 border-b-2 border-black relative overflow-hidden">
            <img 
              v-if="item.film?.gambar_poster" 
              :src="item.film.gambar_poster" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Film class="w-10 h-10 md:w-12 md:h-12 text-stone-400" />
            </div>
            <!-- Category Badge -->
            <div class="absolute top-2 left-2 md:top-3 md:left-3">
              <Badge class="bg-brand-red text-white border-2 border-black shadow-brutal-xs text-[9px] md:text-xs">
                {{ item.film?.category?.nama_kategori }}
              </Badge>
            </div>
          </div>

          <!-- Body -->
          <div class="p-4 md:p-5">
            <div class="flex justify-between items-start gap-2 mb-2">
              <h3 class="text-lg md:text-xl font-display font-bold text-stone-900 line-clamp-1 group-hover:text-brand-red transition-colors">
                {{ item.film?.judul }}
              </h3>
              <span class="text-[10px] md:text-xs font-mono font-bold text-stone-400">{{ item.film?.tahun_karya }}</span>
            </div>
            
            <p class="text-[11px] md:text-sm text-stone-500 font-body line-clamp-2 mb-4 md:mb-6">
              {{ item.film?.sinopsis || 'Tidak ada deskripsi.' }}
            </p>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <Button 
                class="flex-1 gap-2 shadow-brutal-xs h-9 md:h-10 text-xs md:text-sm font-bold" 
                @click="router.push(`/archive/${item.film?.slug}`)"
              >
                <Eye class="w-3.5 h-3.5 md:w-4 md:h-4" /> Tonton
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                class="w-9 h-9 md:w-10 md:h-10 border-2 border-stone-200 hover:border-brand-red hover:text-brand-red transition-all"
                @click="removeFromCollection(item.film_id)"
                :disabled="removingIds.has(item.film_id)"
              >
                <Loader2 v-if="removingIds.has(item.film_id)" class="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <BookmarkX v-else class="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <EmptyState 
      v-else 
      :icon="Bookmark"
      title="Belum Ada Simpanan"
      description="Jelajahi arsip dan klik tombol 'Simpan ke Koleksi' pada karya yang Anda sukai untuk menyimpannya di sini."
      action-label="Jelajahi Arsip"
      variant="dashed"
      @action="router.push('/')"
    >
      <template #action-icon>
        <Search class="w-5 h-5" />
      </template>
    </EmptyState>
  </div>
  </PageLayout>
</template>
