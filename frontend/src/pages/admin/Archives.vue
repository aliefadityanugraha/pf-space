<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Film, Search, Loader2, Eye, Check, X, Trash2, AlertTriangle, 
  CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const sidebarCollapsed = ref(false)
const Karyas = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

// Filters
const statusFilter = ref('all')
const searchQuery = ref('')

// Modal states
const showDetailModal = ref(false)
const showConfirm = ref(false)
const selectedKarya = ref(null)
const confirmAction = ref({ type: '', karya: null })
const actionLoading = ref(false)
const rejectionReason = ref('')

// Banner Modal State
const showBannerModal = ref(false)
const bannerPreview = ref(null)
const isBannerActive = ref(false)
const bannerLoading = ref(false)

const openBannerModal = (karya) => {
  selectedKarya.value = karya
  isBannerActive.value = Boolean(karya.is_banner_active)
  bannerPreview.value = karya.banner_url || null
  showBannerModal.value = true
}

const saveBannerSettings = async () => {
  if (!selectedKarya.value) return

  bannerLoading.value = true
  try {
    await api.put(`/api/films/${selectedKarya.value.film_id}`, {
      is_banner_active: isBannerActive.value
    })

    showToast('success', 'Pengaturan banner berhasil disimpan')
    showBannerModal.value = false
    fetchKaryas()
  } catch (err) {
    console.error('Failed to update banner:', err)
    showToast('error', 'Gagal menyimpan pengaturan banner')
  } finally {
    bannerLoading.value = false
  }
}

// Toast
const { toast, showToast } = useToast()

// Status badge colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  published: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
}

const statusLabels = {
  pending: 'Menunggu',
  published: 'Dipublikasi',
  rejected: 'Ditolak'
}

// Fetch Karya
const fetchKaryas = async () => {
  loading.value = true
  try {
    let endpoint = '/api/films'
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('limit', pagination.value.limit)
    
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }

    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }
    
    const res = await api.get(`${endpoint}?${params}`)
    Karyas.value = res.data
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination }
    }
  } catch (err) {
    console.error('Failed to fetch archives:', err)
    showToast('error', 'Gagal memuat data arsip')
  } finally {
    loading.value = false
  }
}

// View Karya detail
const viewKarya = (karya) => {
  selectedKarya.value = karya
  showDetailModal.value = true
}

// Confirm action (approve/reject/delete)
const confirmActionDialog = (type, karya) => {
  confirmAction.value = { type, karya }
  if (type === 'reject') {
    rejectionReason.value = ''
  }
  showConfirm.value = true
}

// Execute action
const executeAction = async () => {
  const { type, karya } = confirmAction.value
  actionLoading.value = true
  
  try {
    if (type === 'approve') {
      await api.patch(`/api/films/${karya.film_id}/approve`, {})
      showToast('success', `Karya "${karya.judul}" berhasil dipublikasi`)
    } else if (type === 'reject') {
      if (!rejectionReason.value.trim()) {
        showToast('error', 'Alasan penolakan wajib diisi')
        actionLoading.value = false
        return
      }
      await api.patch(`/api/films/${karya.film_id}/reject`, {
        rejection_reason: rejectionReason.value.trim()
      })
      showToast('success', `Karya "${karya.judul}" ditolak`)
    } else if (type === 'delete') {
      await api.delete(`/api/films/${karya.film_id}`)
      showToast('success', `Karya "${karya.judul}" berhasil dihapus`)
    }
    showConfirm.value = false
    showDetailModal.value = false
    await fetchKaryas()
  } catch (err) {
    showToast('error', err.message || 'Gagal melakukan aksi')
  } finally {
    actionLoading.value = false
  }
}

// Search with debounce
let searchTimeout
const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchKaryas()
  }, 300)
}

// Change page
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage
    fetchKaryas()
  }
}

// Change filter
const changeFilter = (status) => {
  statusFilter.value = status
  pagination.value.page = 1
  fetchKaryas()
}

onMounted(fetchKaryas)
</script>

<template>
  <!-- <div class="min-h-screen bg-stone-100"> -->
    <!-- <AdminSidebar @update:collapsed="sidebarCollapsed = $event" /> -->
    
    <main class="p-4 md:p-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Beranda</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administrasi</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Arsip</Badge>
      </nav>

      <!-- Header -->
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-1 h-20 bg-teal-500 rounded-full"></div>
          <div>
            <h1 class="font-display text-4xl text-stone-900">Manajemen Arsip</h1>
            <p class="text-stone-600 mt-2 max-w-xl">Kelola dan moderasi karya yang diunggah creator.</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <!-- Status Filter -->
        <div class="flex gap-2">
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
            <Filter v-else class="w-4 h-4" />
            {{ status === 'all' ? 'Semua' : statusLabels[status] }}
          </Button>
        </div>

        <!-- Search -->
        <div class="relative flex-1 max-w-sm">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            v-model="searchQuery" 
            @input="onSearch"
            placeholder="Cari judul..." 
            class="pl-10"
          />
        </div>
      </div>

      <!-- Karyas Table -->
      <Card class="w-full">
        <CardHeader class="bg-teal-50 border-b-2 border-stone-800">
          <div class="flex items-center gap-3">
            <Film class="w-5 h-5" />
            <CardTitle class="text-lg font-bold uppercase">Daftar Arsip Karya</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
          </div>

          <!-- Empty -->
          <div v-else-if="Karyas.length === 0" class="text-center py-12 text-stone-400">
            <Film class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p class="mb-1">Tidak ada karya yang cocok dengan filter saat ini.</p>
            <p class="text-sm">
              Coba ubah status, kata kunci pencarian, atau reset filter yang aktif.
            </p>
          </div>

          <!-- Table -->
          <template v-else>
            <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-lime-50 border-b-2 border-stone-800 text-xs font-bold uppercase tracking-wider">
              <div class="col-span-4">Karya</div>
              <div class="col-span-2">Creator</div>
              <div class="col-span-2">Kategori</div>
              <div class="col-span-1">Tahun</div>
              <div class="col-span-1">Status</div>
              <div class="col-span-2 text-right">Aksi</div>
            </div>
            
            <div 
              v-for="Karya in Karyas" 
              :key="Karya.film_id" 
              class="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 hover:bg-stone-50 w-full"
            >
              <!-- Karya Info -->
              <div class="lg:col-span-4 flex items-center gap-3">
                <img 
                  v-if="Karya.gambar_poster" 
                  :src="Karya.gambar_poster" 
                  :alt="Karya.judul"
                  class="w-12 h-16 object-cover border border-stone-200 rounded"
                />
                <div v-else class="w-12 h-16 bg-stone-200 flex items-center justify-center rounded">
                  <Film class="w-6 h-6 text-stone-400" />
                </div>
                <div class="min-w-0">
                  <span class="block font-bold text-stone-900 truncate">{{ Karya.judul }}</span>
                  <p class="text-xs text-stone-500 truncate">{{ Karya.sinopsis || '-' }}</p>
                </div>
              </div>

              <!-- Creator -->
              <div class="lg:col-span-2 text-sm text-stone-600">
                {{ Karya.creator?.name || '-' }}
              </div>

              <!-- Category -->
              <div class="lg:col-span-2">
                <Badge variant="secondary">{{ Karya.category?.nama_kategori || '-' }}</Badge>
              </div>

              <!-- Year -->
              <div class="lg:col-span-1 text-sm text-stone-600">
                {{ Karya.tahun_karya || '-' }}
              </div>

              <!-- Status -->
              <div class="lg:col-span-1 flex flex-col gap-1">
                <Badge :class="statusColors[Karya.status]">
                  {{ statusLabels[Karya.status] }}
                </Badge>
                <Badge v-if="Karya.is_banner_active" class="bg-blue-100 text-blue-800 border-blue-300 w-fit">
                  <Sparkles class="w-3 h-3 mr-1" />
                  Banner
                </Badge>
              </div>

              <!-- Actions -->
              <div class="lg:col-span-2 flex gap-2 lg:justify-end">
                <Button variant="outline" size="sm" @click="viewKarya(Karya)" title="Lihat Detail">
                  <Eye class="w-4 h-4" />
                </Button>
                <Button 
                  v-if="Karya.status === 'published'"
                  variant="outline" 
                  size="sm" 
                  class="text-blue-600 hover:bg-blue-50"
                  @click="openBannerModal(Karya)"
                  title="Atur Banner"
                >
                  <ImageIcon class="w-4 h-4" />
                </Button>
                <Button 
                  v-if="Karya.status === 'pending'" 
                  variant="outline" 
                  size="sm" 
                  class="text-green-600 hover:bg-green-50"
                  @click="confirmActionDialog('approve', Karya)"
                  title="Setujui"
                >
                  <Check class="w-4 h-4" />
                </Button>
                <Button 
                  v-if="Karya.status === 'pending'" 
                  variant="outline" 
                  size="sm" 
                  class="text-red-600 hover:bg-red-50"
                  @click="confirmActionDialog('reject', Karya)"
                  title="Tolak"
                >
                  <X class="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="text-red-600 hover:bg-red-50"
                  @click="confirmActionDialog('delete', Karya)"
                  title="Hapus"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </template>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-stone-200">
            <span class="text-sm text-stone-600">
              Menampilkan {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} dari {{ pagination.total }} karya
            </span>
            <div class="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                :disabled="pagination.page <= 1"
                @click="changePage(pagination.page - 1)"
                title="Sebelumnya"
              >
                <ChevronLeft class="w-4 h-4" />
              </Button>

              <div class="flex gap-1">
                <template v-for="p in pagination.totalPages" :key="p">
                  <Button
                    v-if="p === 1 || p === pagination.totalPages || (p >= pagination.page - 1 && p <= pagination.page + 1)"
                    :variant="pagination.page === p ? 'default' : 'outline'"
                    size="sm"
                    class="w-8 h-8 p-0"
                    @click="changePage(p)"
                  >
                    {{ p }}
                  </Button>
                  <span 
                    v-else-if="p === pagination.page - 2 || p === pagination.page + 2" 
                    class="flex items-center justify-center w-8 h-8 text-stone-400"
                  >
                    ...
                  </span>
                </template>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                :disabled="pagination.page >= pagination.totalPages"
                @click="changePage(pagination.page + 1)"
                title="Selanjutnya"
              >
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedKarya" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showDetailModal = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100 sticky top-0">
          <h2 class="font-bold text-lg">Detail Arsip Karya</h2>
          <button @click="showDetailModal = false" class="p-1 hover:bg-stone-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <!-- Poster & Basic Info -->
          <div class="flex gap-4">
            <img 
              v-if="selectedKarya.gambar_poster" 
              :src="selectedKarya.gambar_poster" 
              :alt="selectedKarya.judul"
              class="w-32 h-44 object-cover border-2 border-black"
            />
            <div class="flex-1">
              <h3 class="font-bold text-xl">{{ selectedKarya.judul }}</h3>
              <p class="text-stone-600 mt-1">{{ selectedKarya.tahun_karya }}</p>
              <Badge :class="statusColors[selectedKarya.status]" class="mt-2">
                {{ statusLabels[selectedKarya.status] }}
              </Badge>
              <p class="text-sm text-stone-600 mt-2">
                <span class="font-medium">Creator:</span> {{ selectedKarya.creator?.name }}
              </p>
              <p class="text-sm text-stone-600">
                <span class="font-medium">Kategori:</span> {{ selectedKarya.category?.nama_kategori }}
              </p>
            </div>
          </div>

          <!-- Sinopsis -->
          <div>
            <h4 class="font-bold text-sm uppercase mb-2">Sinopsis</h4>
            <p class="text-stone-600 text-sm">{{ selectedKarya.sinopsis || '-' }}</p>
          </div>

          <!-- Links -->
          <div class="grid grid-cols-2 gap-4">
            <div v-if="selectedKarya.link_video_utama">
              <h4 class="font-bold text-sm uppercase mb-1">Video Utama</h4>
              <a :href="selectedKarya.link_video_utama" target="_blank" class="text-teal-600 hover:underline text-sm truncate block">
                {{ selectedKarya.link_video_utama }}
              </a>
            </div>
            <div v-if="selectedKarya.link_trailer">
              <h4 class="font-bold text-sm uppercase mb-1">Trailer</h4>
              <a :href="selectedKarya.link_trailer" target="_blank" class="text-teal-600 hover:underline text-sm truncate block">
                {{ selectedKarya.link_trailer }}
              </a>
            </div>
          </div>

          <!-- Crew -->
          <div v-if="selectedKarya.crew && selectedKarya.crew.length">
            <h4 class="font-bold text-sm uppercase mb-2">Crew</h4>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(item, idx) in selectedKarya.crew" :key="idx" class="text-sm">
                <span class="font-medium">{{ item.jabatan }}:</span>
                <span class="text-stone-600"> {{ item.anggota?.join(', ') }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="selectedKarya.status === 'pending'" class="flex gap-3 pt-4 border-t">
            <Button class="flex-1 gap-2 bg-green-600 hover:bg-green-700" @click="confirmActionDialog('approve', selectedKarya)">
              <Check class="w-4 h-4" /> Setujui
            </Button>
            <Button variant="outline" class="flex-1 gap-2 text-red-600" @click="confirmActionDialog('reject', selectedKarya)">
              <X class="w-4 h-4" /> Tolak
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showConfirm = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-sm mx-4">
        <div :class="[
          'flex items-center gap-3 px-6 py-4 border-b-2 border-black',
          confirmAction.type === 'approve' ? 'bg-green-50' : 'bg-red-50'
        ]">
          <CheckCircle v-if="confirmAction.type === 'approve'" class="w-5 h-5 text-green-600" />
          <AlertTriangle v-else class="w-5 h-5 text-red-600" />
          <h2 class="font-bold text-lg">
            {{ confirmAction.type === 'approve' ? 'Setujui Karya' : confirmAction.type === 'reject' ? 'Tolak Karya' : 'Hapus Karya' }}
          </h2>
        </div>
        <div class="p-6">
          <p class="text-stone-600 mb-6">
            {{ confirmAction.type === 'approve' 
              ? `Approve dan publikasikan karya "${confirmAction.karya?.judul}"?`
              : confirmAction.type === 'reject'
              ? `Tolak karya "${confirmAction.karya?.judul}"?`
              : `Hapus karya "${confirmAction.karya?.judul}"? Aksi ini tidak dapat dibatalkan.`
            }}
          </p>
          <div v-if="confirmAction.type === 'reject'" class="mb-6">
            <label class="block text-sm font-medium text-stone-700 mb-2">
              Alasan penolakan untuk kreator
            </label>
            <textarea
              v-model="rejectionReason"
              rows="3"
              class="w-full border-2 border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none"
              placeholder="Contoh: Kualitas audio kurang jelas, mohon perbaiki mixing dan kirim ulang."
            ></textarea>
          </div>
          <div class="flex gap-3">
            <Button type="button" variant="outline" class="flex-1" @click="showConfirm = false" :disabled="actionLoading">
              Batal
            </Button>
            <Button 
              type="button" 
              :class="[
                'flex-1 gap-2',
                confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              ]"
              @click="executeAction" 
              :disabled="actionLoading"
            >
              <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
              <Check v-else-if="confirmAction.type === 'approve'" class="w-4 h-4" />
              <X v-else-if="confirmAction.type === 'reject'" class="w-4 h-4" />
              <Trash2 v-else class="w-4 h-4" />
              {{ confirmAction.type === 'approve' ? 'Setujui' : confirmAction.type === 'reject' ? 'Tolak' : 'Hapus' }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner Modal -->
    <div v-if="showBannerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showBannerModal = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100">
          <h2 class="font-bold text-lg">Pengaturan Banner</h2>
          <button @click="showBannerModal = false" class="p-1 hover:bg-stone-200 rounded">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <div class="mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="isBannerActive" class="w-4 h-4 rounded border-stone-300 text-brand-teal focus:ring-brand-teal">
              <span class="font-bold text-stone-700">Tampilkan sebagai Banner Carousel</span>
            </label>
            <p class="text-xs text-stone-500 mt-1 ml-6">
              Jika aktif, Film ini akan muncul di slider halaman utama.
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-bold text-stone-700 mb-2">
              Preview Banner
            </label>
            <div v-if="bannerPreview" class="relative aspect-video bg-stone-100 mb-2 rounded overflow-hidden border border-stone-200">
                <img :src="bannerPreview" class="w-full h-full object-cover">
            </div>
            <div v-else class="p-8 border-2 border-dashed border-stone-300 rounded text-center bg-stone-50">
                <ImageIcon class="w-12 h-12 mx-auto text-stone-300 mb-2" />
                <p class="text-stone-500 font-bold">Creator belum mengupload gambar banner.</p>
                <p class="text-xs text-stone-400 mt-1">Jika diaktifkan, sistem akan menggunakan gambar poster sebagai fallback.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <Button variant="outline" @click="showBannerModal = false">Batal</Button>
            <Button @click="saveBannerSettings" :disabled="bannerLoading">
              <Loader2 v-if="bannerLoading" class="w-4 h-4 animate-spin mr-2" />
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  <!-- </div> -->
</template>
