<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'

import PageLayout from '@/components/PageLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import ArchiveCard from '@/components/ArchiveCard.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Film, Plus, Pencil, Trash2, Eye, Clock, CheckCircle, XCircle,
  X, Search, ArrowRight
} from 'lucide-vue-next'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import ArchiveSkeleton from '@/components/ArchiveSkeleton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Pagination from '@/components/Pagination.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { useToast } from '@/composables/useToast'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Manajemen Karya Saya - PF Space'
})

const router = useRouter()
const films = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const statusFilter = ref('all')
const statusSummary = ref({
  all: 0,
  pending: 0,
  published: 0,
  rejected: 0
})
const summaryLoading = ref(false)

// Modal & Toast
const showConfirm = ref(false)
const filmToDelete = ref(null)
const deleting = ref(false)
const showRejectionModal = ref(false)
const selectedRejectionFilm = ref(null)
const { showToast } = useToast()

const openRejectionModal = (film) => {
  selectedRejectionFilm.value = film
  showRejectionModal.value = true
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  published: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
}

const statusLabels = {
  pending: 'Menunggu Review',
  published: 'Dipublikasi',
  rejected: 'Ditolak'
}

const fetchFilms = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('limit', pagination.value.limit)
    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }
    
    const res = await api.get(`/api/films/my-films?${params}`)
    films.value = res.data
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination }
    }
  } catch (err) {
    console.error('Failed to fetch films:', err)
    showToast('Gagal memuat data film', 'error')
  } finally {
    loading.value = false
  }
}

const fetchStatusSummary = async () => {
  summaryLoading.value = true
  try {
    const statuses = ['all', 'pending', 'published', 'rejected']
    const requests = statuses.map(status =>
      api
        .get('/api/films/my-films', {
          params: {
            page: 1,
            limit: 1,
            status: status === 'all' ? undefined : status
          }
        })
        .then(res => ({
          status,
          total: res.pagination?.total || (Array.isArray(res.data) ? res.data.length : 0)
        }))
    )
    const results = await Promise.all(requests)
    const nextSummary = {
      all: 0,
      pending: 0,
      published: 0,
      rejected: 0
    }
    for (const item of results) {
      nextSummary[item.status] = item.total
    }
    statusSummary.value = nextSummary
  } catch (err) {
    console.error('Failed to fetch film status summary:', err)
    showToast('Gagal memuat ringkasan status film', 'error')
  } finally {
    summaryLoading.value = false
  }
}

const confirmDelete = (film) => {
  filmToDelete.value = film
  showConfirm.value = true
}

const executeDelete = async () => {
  if (!filmToDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/api/films/${filmToDelete.value.film_id}`)
    showToast('Film berhasil dihapus')
    showConfirm.value = false
    await fetchFilms()
  } catch (err) {
    showToast(err.message || 'Gagal menghapus film', 'error')
  } finally {
    deleting.value = false
    filmToDelete.value = null
  }
}

const changeFilter = (status) => {
  statusFilter.value = status
  pagination.value.page = 1
  fetchFilms()
}

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage
    fetchFilms()
  }
}

onMounted(async () => {
  await Promise.all([fetchFilms(), fetchStatusSummary()])
})
</script>

<template>
  <PageLayout>

    <main class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <!-- Header -->
      <PageHeader 
        title="Karya Saya" 
        description="Kelola semua karya yang sudah kamu upload."
      >
        <template #actions>
          <Button @click="router.push('/upload')" class="gap-2">
            <Plus class="w-4 h-4" />
            Upload Karya Baru
          </Button>
        </template>
      </PageHeader>

      <ErrorBoundary name="Ringkasan Status">
        <Card class="mb-6">
          <CardContent class="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">Status Pengajuan Karya</p>
              <p class="text-sm text-stone-500">
                Ringkasan semua karya yang kamu upload berdasarkan status review.
              </p>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" class="bg-stone-900 text-white border-stone-900">
                <span class="font-bold mr-1">{{ summaryLoading ? '…' : statusSummary.all }}</span>
                Total
              </Badge>
              <Badge :class="statusColors.pending">
                <span class="font-bold mr-1">{{ summaryLoading ? '…' : statusSummary.pending }}</span>
                Menunggu
              </Badge>
              <Badge :class="statusColors.published">
                <span class="font-bold mr-1">{{ summaryLoading ? '…' : statusSummary.published }}</span>
                Dipublikasi
              </Badge>
              <Badge :class="statusColors.rejected">
                <span class="font-bold mr-1">{{ summaryLoading ? '…' : statusSummary.rejected }}</span>
                Ditolak
              </Badge>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <!-- Status Filter -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <Button 
          v-for="status in ['all', 'pending', 'published', 'rejected']" 
          :key="status"
          :variant="statusFilter === status ? 'default' : 'outline'"
          size="sm"
          @click="changeFilter(status)"
          class="gap-2"
        >
          <Clock v-if="status === 'pending'" class="w-4 h-4" />
          <CheckCircle v-else-if="status === 'published'" class="w-4 h-4" />
          <XCircle v-else-if="status === 'rejected'" class="w-4 h-4" />
          <Film v-else class="w-4 h-4" />
          {{ status === 'all' ? 'Semua' : statusLabels[status] }}
        </Button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArchiveSkeleton v-for="i in 6" :key="i" variant="landscape" />
      </div>

      <!-- Empty State -->
      <EmptyState 
        v-else-if="films.length === 0"
        :icon="Film"
        :title="statusFilter === 'all' ? 'Belum ada karya' : `Belum ada karya dengan status ${statusLabels[statusFilter]}`"
        :description="statusFilter === 'all' ? 'Mulai upload karya pertamamu sekarang!' : 'Coba pilih status lain atau upload karya baru.'"
        actionLabel="Upload Karya"
        @action="router.push('/upload')"
      >
        <template #action-icon>
          <Plus class="w-4 h-4" />
        </template>
      </EmptyState>

      <!-- Films Grid -->
      <ErrorBoundary name="Daftar Karya">
        <div v-if="films.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArchiveCard 
            v-for="item in films" 
            :key="item.film_id" 
            :archive="item"
            variant="landscape"
            :show-play-overlay="false"
          >
            <template #overlay>
              <!-- Status Badge -->
              <Badge :class="['absolute top-2 right-2', statusColors[item.status]]">
                {{ statusLabels[item.status] }}
              </Badge>
            </template>

            <template #extra-content>
              <p class="text-xs text-stone-400 mb-4">{{ item.tahun_karya || '-' }}</p>

              <div v-if="item.status === 'rejected'" class="p-2 bg-red-50 border border-red-200 text-red-600 text-xs mb-4 rounded">
                <p class="font-semibold mb-1">Karya ditolak admin.</p>
                <div v-if="item.rejection_reason">
                  <p class="line-clamp-2">
                    Alasan: {{ item.rejection_reason }}
                  </p>
                  <button 
                    v-if="item.rejection_reason.length > 60"
                    @click.stop="openRejectionModal(item)"
                    class="text-red-800 font-bold underline mt-1 hover:text-red-950"
                  >
                    Lihat Alasan Lengkap
                  </button>
                </div>
                <p v-else>
                  Silakan periksa kembali kualitas konten, format file, dan kelengkapan data lalu submit ulang.
                </p>
              </div>
            </template>

            <template #actions>
              <Button 
                variant="outline" 
                size="sm" 
                class="flex-1 gap-1"
                @click="router.push(`/archive/${item.slug}`)"
              >
                <Eye class="w-4 h-4" /> Lihat
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                class="flex-1 gap-1"
                @click="router.push(`/edit-archive/${item.slug}`)"
              >
                <Pencil class="w-4 h-4" /> Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                class="text-red-600 hover:bg-red-50"
                @click="confirmDelete(item)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </template>
          </ArchiveCard>
        </div>
      </ErrorBoundary>

      <!-- Pagination -->
      <Pagination 
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        @change="changePage"
      />
    </main>

  

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-model:show="showConfirm"
      title="Hapus Karya"
      :message="`Hapus karya '${filmToDelete?.judul}'? Aksi ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      variant="danger"
      :loading="deleting"
      @confirm="executeDelete"
    >
      <template #confirm-icon>
        <Trash2 class="w-4 h-4" />
      </template>
    </ConfirmDialog>

    <!-- Rejection Reason Modal -->
    <div v-if="showRejectionModal && selectedRejectionFilm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showRejectionModal = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-red-50">
          <div class="flex items-center gap-3">
            <XCircle class="w-5 h-5 text-red-600" />
            <h2 class="font-bold text-lg text-red-800">Alasan Penolakan</h2>
          </div>
          <button @click="showRejectionModal = false" class="p-1 hover:bg-red-100 rounded">
            <X class="w-5 h-5 text-red-800" />
          </button>
        </div>
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <h3 class="font-bold text-lg mb-2">{{ selectedRejectionFilm.judul }}</h3>
          <div class="p-4 bg-stone-50 border border-stone-200 rounded text-stone-700 whitespace-pre-wrap text-sm">
            {{ selectedRejectionFilm.rejection_reason }}
          </div>
          <div class="mt-6 flex justify-end">
            <Button @click="showRejectionModal = false">Tutup</Button>
          </div>
        </div>
      </div>
    </div>

  </PageLayout>
</template>
