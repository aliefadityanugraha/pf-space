<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { 
  MessageCircle, Trash2, Search, Filter, Loader2, 
  Eye, ChevronRight, Film, User, Calendar, X
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const sidebarCollapsed = ref(false)
const loading = ref(true)
const deleting = ref(null)

// Data
const comments = ref([])
const films = ref([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

// Filters
const searchQuery = ref('')
const selectedFilmId = ref('')
const currentPage = ref(1)

// Toast
const { toast, showToast } = useToast()

// Fetch films for filter
const fetchFilms = async () => {
  try {
    const res = await api.get('/api/films', { params: { limit: 1000, status: 'published' } })
    films.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch films:', err)
  }
}

// Fetch comments
const fetchComments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pagination.value.limit
    }
    
    if (selectedFilmId.value) {
      params.film_id = selectedFilmId.value
    }
    
    const res = await api.get('/api/discussions/all', { params })
    if (res.success) {
      comments.value = res.data || []
      pagination.value = res.pagination || pagination.value
    }
  } catch (err) {
    console.error('Failed to fetch comments:', err)
    showToast('Gagal memuat komentar', 'error')
  } finally {
    loading.value = false
  }
}

// Delete comment
const deleteComment = async (commentId) => {
  if (!confirm('Hapus komentar ini? Semua balasan juga akan terhapus.')) return
  
  deleting.value = commentId
  try {
    await api.delete(`/api/discussions/${commentId}`)
    showToast('Komentar berhasil dihapus')
    await fetchComments()
  } catch (err) {
    console.error('Failed to delete comment:', err)
    showToast('Gagal menghapus komentar', 'error')
  } finally {
    deleting.value = null
  }
}

// Filtered comments
const filteredComments = computed(() => {
  if (!searchQuery.value.trim()) return comments.value
  
  const query = searchQuery.value.toLowerCase()
  return comments.value.filter(comment => 
    comment.isi_pesan?.toLowerCase().includes(query) ||
    comment.user?.name?.toLowerCase().includes(query) ||
    comment.film?.judul?.toLowerCase().includes(query)
  )
})

// Watch filters
watch([selectedFilmId, currentPage], () => {
  fetchComments()
}, { immediate: false })

// Get film name
const getFilmName = (filmId) => {
  const film = films.value.find(f => f.film_id === filmId)
  return film?.judul || 'Arsip tidak dikenal'
}

onMounted(async () => {
  await Promise.all([fetchFilms(), fetchComments()])
})
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    <Toast v-bind="toast" @close="toast.show = false" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Beranda</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administrasi</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Komentar</Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Kelola Komentar" 
        description="Moderasi dan kelola semua komentar pengguna di platform."
        :icon="MessageCircle"
        icon-color="bg-teal-500"
      />

      <!-- Filters -->
      <Card class="mb-6">
        <CardContent class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                v-model="searchQuery"
                placeholder="Cari komentar..."
                class="pl-10"
              />
            </div>

            <!-- Film Filter -->
            <div class="relative">
              <Film class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <select 
                v-model="selectedFilmId"
                class="w-full pl-10 pr-4 py-2 border-2 border-stone-800 bg-white focus:outline-none focus:ring-0 font-body"
              >
                <option value="">Semua Karya</option>
                <option v-for="film in films" :key="film.film_id" :value="film.film_id">
                  {{ film.judul }}
                </option>
              </select>
            </div>

            <!-- Clear Filters -->
            <Button 
              v-if="selectedFilmId || searchQuery"
              variant="outline" 
              @click="selectedFilmId = ''; searchQuery = ''"
              class="gap-2"
            >
              <X class="w-4 h-4" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 class="w-12 h-12 animate-spin text-brand-teal mb-4" />
        <p class="text-stone-500 font-mono uppercase tracking-widest animate-pulse">Memuat komentar...</p>
      </div>

      <!-- Comments List -->
      <template v-else>
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Total Komentar</p>
                  <p class="text-2xl font-bold text-stone-900">{{ pagination.total }}</p>
                </div>
                <MessageCircle class="w-8 h-8 text-brand-teal" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Ditampilkan</p>
                  <p class="text-2xl font-bold text-stone-900">{{ filteredComments.length }}</p>
                </div>
                <Filter class="w-8 h-8 text-brand-orange" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Halaman</p>
                  <p class="text-2xl font-bold text-stone-900">{{ currentPage }} / {{ pagination.totalPages }}</p>
                </div>
                <Calendar class="w-8 h-8 text-brand-red" />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Comments Table -->
        <Card>
          <CardHeader class="bg-brand-teal/10 border-b-2 border-stone-800">
            <CardTitle class="flex items-center gap-2">
              <MessageCircle class="w-5 h-5" />
              Semua Komentar
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <!-- Empty State -->
            <div v-if="filteredComments.length === 0" class="text-center py-12">
              <MessageCircle class="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 class="text-lg font-bold text-stone-700 mb-1">Belum ada komentar yang ditampilkan</h3>
              <p class="text-stone-500 font-body mb-1">
                Tidak ada komentar yang cocok dengan filter saat ini.
              </p>
              <p class="text-sm text-stone-400">
                Coba reset filter, ubah kata kunci pencarian, atau periksa periode waktu yang berbeda.
              </p>
            </div>

            <!-- Comments List -->
            <div v-else class="divide-y divide-stone-200">
              <div 
                v-for="comment in filteredComments" 
                :key="comment.diskusi_id"
                class="p-6 hover:bg-stone-50 transition-colors"
              >
                <div class="flex gap-4">
                  <!-- Avatar -->
                  <div class="w-10 h-10 bg-brand-orange border-2 border-stone-800 shadow-brutal-sm flex items-center justify-center text-sm font-bold shrink-0">
                    {{ comment.user?.name?.charAt(0) || 'U' }}
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <!-- Header -->
                    <div class="flex items-start justify-between gap-4 mb-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-1">
                          <span class="font-bold text-stone-900">{{ comment.user?.name || 'Pengguna tidak dikenal' }}</span>
                          <Badge variant="outline" class="text-xs">
                            <User class="w-3 h-3 mr-1" />
                            {{ comment.user?.email || 'Tidak ada email' }}
                          </Badge>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-stone-500">
                          <span class="flex items-center gap-1">
                            <Calendar class="w-3 h-3" />
                            {{ formatDate(comment.created_at, true) }}
                          </span>
                          <span v-if="comment.film" class="flex items-center gap-1">
                            <Film class="w-3 h-3" />
                            <router-link 
                              :to="`/archive/${comment.film?.slug}`"
                              class="hover:text-brand-teal hover:underline"
                            >
                              {{ comment.film?.judul || getFilmName(comment.film_id) }}
                            </router-link>
                          </span>
                        </div>
                      </div>

                      <!-- Actions -->
                      <div class="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          @click="router.push(`/archive/${comment.film?.slug}`)"
                          class="gap-1"
                        >
                          <Eye class="w-3 h-3" />
                          Lihat
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          @click="deleteComment(comment.diskusi_id)"
                          :disabled="deleting === comment.diskusi_id"
                          class="gap-1"
                        >
                          <Loader2 v-if="deleting === comment.diskusi_id" class="w-3 h-3 animate-spin" />
                          <Trash2 v-else class="w-3 h-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    <!-- Comment Body -->
                    <div class="mt-3 p-4 bg-stone-100 border-l-4 border-brand-teal">
                      <p class="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                        {{ comment.isi_pesan }}
                      </p>
                    </div>

                    <!-- Metadata -->
                    <div v-if="comment.parent_id" class="mt-2 text-xs text-stone-500 flex items-center gap-1">
                      <ChevronRight class="w-3 h-3" />
                      <span>Ini adalah balasan dari komentar lain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex items-center justify-between mt-6">
          <div class="text-sm text-stone-600">
            Menampilkan {{ (currentPage - 1) * pagination.limit + 1 }} sampai 
            {{ Math.min(currentPage * pagination.limit, pagination.total) }} dari 
            {{ pagination.total }} komentar
          </div>
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              @click="currentPage--"
              :disabled="currentPage === 1"
            >
              Sebelumnya
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              @click="currentPage++"
              :disabled="currentPage >= pagination.totalPages"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>


