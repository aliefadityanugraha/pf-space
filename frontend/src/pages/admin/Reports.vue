<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, Loader2, Eye, CheckCircle, XCircle, Clock, 
  AlertTriangle, ChevronLeft, ChevronRight, MessageSquare, 
  Film, Reply, BookOpen, Trash2, Check, X, ShieldAlert
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/PageHeader.vue'
import { formatDate } from '@/lib/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { showToast } = useToast()

const reports = ref([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const statusFilter = ref('pending')
const targetTypeFilter = ref('all')

// Modal states
const showProcessModal = ref(false)
const processing = ref(false)
const selectedReport = ref(null)
const targetData = ref(null)
const loadingTarget = ref(false)
const adminNotes = ref('')

// Delete confirmation
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const deleteType = ref('') // 'target' or 'report'

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-stone-100 text-stone-800 border-stone-300'
}

const statusLabels = {
  pending: 'Menunggu',
  reviewed: 'Ditinjau',
  resolved: 'Selesai',
  rejected: 'Ditolak'
}

const targetIcons = {
  film: Film,
  comment: MessageSquare,
  discussion: MessageSquare,
  reply: Reply,
  material: BookOpen
}

const fetchReports = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page)
    params.append('limit', pagination.value.limit)
    if (statusFilter.value !== 'all') params.append('status', statusFilter.value)
    if (targetTypeFilter.value !== 'all') params.append('target_type', targetTypeFilter.value)

    const res = await api.get(`/api/reports?${params}`)
    reports.value = res.data
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination }
    }
  } catch (err) {
    showToast(err.message || 'Gagal memuat laporan', 'error')
  } finally {
    loading.value = false
  }
}

const fetchTargetData = async (report) => {
  loadingTarget.value = true
  targetData.value = null
  try {
    let endpoint = ''
    switch(report.target_type) {
      case 'film': endpoint = `/api/films/${report.target_id}`; break;
      case 'comment': endpoint = `/api/discussions/${report.target_id}`; break;
      case 'discussion': endpoint = `/api/community/${report.target_id}`; break;
      case 'reply': endpoint = `/api/community/replies/${report.target_id}`; break;
      case 'material': endpoint = `/api/learning-materials/${report.target_id}`; break;
    }
    const res = await api.get(endpoint)
    if (res.success) {
      targetData.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch target data:', err)
  } finally {
    loadingTarget.value = false
  }
}

const openProcessModal = async (report) => {
  selectedReport.value = report
  adminNotes.value = report.admin_notes || ''
  showProcessModal.value = true
  await fetchTargetData(report)
}

const updateReportStatus = async (status) => {
  if (!selectedReport.value) return
  
  processing.value = true
  try {
    await api.patch(`/api/reports/${selectedReport.value.report_id}/status`, {
      status,
      admin_notes: adminNotes.value
    })
    showToast(`Status laporan berhasil diubah menjadi ${statusLabels[status]}`)
    showProcessModal.value = false
    fetchReports()
  } catch (err) {
    showToast(err.message || 'Gagal memproses laporan', 'error')
  } finally {
    processing.value = false
  }
}

const deleteTarget = async () => {
  if (!targetData.value || !selectedReport.value) return
  
  deleting.value = true
  try {
    let endpoint = ''
    const id = selectedReport.value.target_id
    switch(selectedReport.value.target_type) {
      case 'film': endpoint = `/api/films/${id}`; break;
      case 'comment': endpoint = `/api/discussions/${id}`; break;
      case 'discussion': endpoint = `/api/community/${id}`; break;
      case 'reply': endpoint = `/api/community/moderator/replies/${id}`; break;
      case 'material': endpoint = `/api/learning-materials/${id}`; break;
    }
    
    await api.delete(endpoint)
    showToast('Konten yang dilaporkan berhasil dihapus')
    
    // Automatically resolve the report if content is deleted
    await updateReportStatus('resolved')
    
    showDeleteConfirm.value = false
  } catch (err) {
    showToast(err.message || 'Gagal menghapus konten', 'error')
  } finally {
    deleting.value = false
  }
}

const changePage = (page) => {
  pagination.value.page = page
  fetchReports()
}

onMounted(fetchReports)
</script>

<template>
  <div class="p-4 md:p-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/" class="text-brand-teal hover:underline">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Laporan</Badge>
    </nav>

    <!-- Header -->
    <PageHeader 
      title="Moderasi Laporan" 
      description="Tinjau dan proses laporan penyalahgunaan konten dari pengguna."
      :icon="ShieldAlert"
      icon-color="bg-red-600 font-white"
    />

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex gap-2 bg-white p-1 border-2 border-black">
        <button 
          v-for="s in ['all', 'pending', 'reviewed', 'resolved', 'rejected']" 
          :key="s"
          @click="statusFilter = s; pagination.page = 1; fetchReports()"
          :class="[
            'px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
            statusFilter === s ? 'bg-black text-white' : 'hover:bg-stone-100 text-stone-600'
          ]"
        >
          {{ s === 'all' ? 'Semua' : statusLabels[s] }}
        </button>
      </div>

      <select 
        v-model="targetTypeFilter" 
        @change="pagination.page = 1; fetchReports()"
        class="bg-white border-2 border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider h-full focus:outline-none"
      >
        <option value="all">Semua Tipe</option>
        <option value="film">Film / Karya</option>
        <option value="comment">Komentar Film</option>
        <option value="reply">Balasan Komunitas</option>
        <option value="material">Materi Belajar</option>
      </select>
    </div>

    <!-- Reports Table -->
    <Card class="border-2 border-black shadow-brutal-sm overflow-hidden">
      <CardHeader class="border-b-2 border-black bg-stone-50">
        <div class="flex items-center gap-2">
          <FileText class="w-5 h-5" />
          <CardTitle class="text-[14px] font-black uppercase tracking-tight">Daftar Laporan</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <Loader2 class="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p class="text-stone-500 font-mono text-xs uppercase animate-pulse">Memuat laporan...</p>
        </div>

        <div v-else-if="reports.length === 0" class="flex flex-col items-center justify-center py-20 px-4">
          <CheckCircle class="w-12 h-12 text-green-500 mb-4 opacity-20" />
          <h3 class="font-bold text-stone-900 mb-1">Tidak Ada Laporan</h3>
          <p class="text-sm text-stone-500">Semua bersih! Belum ada laporan yang sesuai kriteria.</p>
        </div>

        <table v-else class="w-full text-left border-collapse min-w-[800px]">
          <thead class="bg-stone-50 border-b-2 border-black uppercase text-[10px] font-black tracking-widest text-stone-500">
            <tr>
              <th class="px-6 py-4">Target</th>
              <th class="px-6 py-4">Pelapor</th>
              <th class="px-6 py-4">Alasan</th>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="report in reports" :key="report.report_id" class="hover:bg-stone-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 border-2 border-black bg-white shrink-0">
                    <component :is="targetIcons[report.target_type] || FileText" class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="block text-xs font-bold uppercase tracking-tight text-stone-900">{{ report.target_type }}</span>
                    <span class="text-[11px] text-stone-500">ID: {{ report.target_id }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-stone-200 border border-black flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img v-if="report.reporter?.image" :src="report.reporter.image" class="w-full h-full object-cover">
                    <span v-else>{{ report.reporter?.name?.charAt(0) }}</span>
                  </div>
                  <span class="text-xs font-medium text-stone-700">{{ report.reporter?.name || 'User unknown' }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <Badge variant="outline" class="bg-red-50 text-red-700 border-red-200 capitalize text-[10px]">
                  {{ report.reason.replace('_', ' ') }}
                </Badge>
                <p class="text-[11px] text-stone-500 mt-1 line-clamp-1 max-w-[200px]" :title="report.description">
                  {{ report.description || 'Tidak ada uraian' }}
                </p>
              </td>
              <td class="px-6 py-4 text-[11px] text-stone-500 whitespace-nowrap">
                {{ formatDate(report.created_at) }}
              </td>
              <td class="px-6 py-4">
                <Badge :class="statusColors[report.status]" class="text-[10px] whitespace-nowrap">
                  {{ statusLabels[report.status] }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-right">
                <Button 
                  size="sm" 
                  variant="outline" 
                  class="gap-2 border-2 border-black h-8 text-[11px] font-bold uppercase tracking-tight hover:bg-black hover:text-white transition-all shadow-brutal-xs active:shadow-none translate-y-[-1px] active:translate-y-0"
                  @click="openProcessModal(report)"
                >
                  <Eye class="w-3.5 h-3.5" />
                  Detail
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <Button 
        variant="outline" 
        size="icon" 
        :disabled="pagination.page === 1" 
        @click="changePage(pagination.page - 1)"
        class="w-10 h-10 border-2 border-black shadow-brutal-xs hover:shadow-none transition-all"
      >
        <ChevronLeft class="w-5 h-5" />
      </Button>
      <div class="flex gap-1.5">
        <Button 
          v-for="p in pagination.totalPages" 
          :key="p"
          @click="changePage(p)"
          :variant="pagination.page === p ? 'default' : 'outline'"
          :class="[
            'w-10 h-10 border-2 border-black font-bold font-mono',
            pagination.page === p ? 'bg-black text-white shadow-none' : 'bg-white text-black shadow-brutal-xs hover:shadow-none'
          ]"
        >
          {{ p }}
        </Button>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        :disabled="pagination.page === pagination.totalPages" 
        @click="changePage(pagination.page + 1)"
        class="w-10 h-10 border-2 border-black shadow-brutal-xs hover:shadow-none transition-all"
      >
        <ChevronRight class="w-5 h-5" />
      </Button>
    </div>

    <!-- Process Report Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showProcessModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showProcessModal = false"></div>
          
          <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b-2 border-black bg-stone-100 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <ShieldAlert class="w-5 h-5 text-red-600" />
                <h2 class="font-bold text-lg uppercase tracking-tight">Detail Laporan #{{ selectedReport?.report_id }}</h2>
              </div>
              <button @click="showProcessModal = false" class="p-1 hover:bg-stone-200 transition-colors">
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Report Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Tipe Konten</h4>
                    <Badge variant="outline" class="bg-white border-black border font-mono">
                      {{ selectedReport?.target_type }}
                    </Badge>
                  </div>
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Pelapor</h4>
                    <p class="text-sm font-bold">{{ selectedReport?.reporter?.name }}</p>
                    <p class="text-[11px] text-stone-500">{{ selectedReport?.reporter?.email }}</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Alasan</h4>
                    <p class="text-sm font-bold text-red-600 uppercase tracking-tight">{{ selectedReport?.reason.replace('_', ' ') }}</p>
                  </div>
                  <div>
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Waktu Laporan</h4>
                    <p class="text-sm font-medium">{{ formatDate(selectedReport?.created_at, true) }}</p>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="selectedReport?.description" class="bg-red-50 border-2 border-red-100 p-4 relative">
                <div class="absolute -top-3 -left-3 bg-red-600 text-white px-2 py-0.5 text-[9px] font-black uppercase border border-black italic">Pesan Pelapor</div>
                <p class="text-sm text-red-900 leading-relaxed italic">"{{ selectedReport.description }}"</p>
              </div>

              <!-- Target Content Preview -->
              <div class="border-2 border-black overflow-hidden bg-stone-50">
                <div class="px-4 py-2 border-b-2 border-black bg-stone-200 flex items-center justify-between">
                  <h4 class="text-[10px] font-black uppercase tracking-widest">Pratinjau Konten Terlapor</h4>
                  <Loader2 v-if="loadingTarget" class="w-3 h-3 animate-spin" />
                </div>
                <div class="p-4 min-h-[100px]">
                  <div v-if="loadingTarget" class="flex justify-center py-6">
                    <Loader2 class="w-6 h-6 animate-spin text-stone-400" />
                  </div>
                  <div v-else-if="!targetData" class="flex flex-col items-center justify-center py-6 text-stone-400">
                    <AlertTriangle class="w-8 h-8 mb-2 opacity-30" />
                    <p class="text-xs uppercase font-bold">Konten mungkin telah dihapus</p>
                  </div>
                  <!-- Content Type Specific Previews -->
                  <div v-else>
                    <!-- Film Preview -->
                    <div v-if="selectedReport?.target_type === 'film'" class="flex gap-4">
                      <div class="w-20 aspect-[3/4] bg-stone-300 border border-black shrink-0 relative overflow-hidden">
                        <img v-if="targetData.gambar_poster" :src="targetData.gambar_poster" class="w-full h-full object-cover">
                      </div>
                      <div class="flex-1 min-w-0">
                        <h5 class="font-black uppercase tracking-tight text-sm truncate">{{ targetData.judul }}</h5>
                        <p class="text-xs text-stone-600 mt-1 line-clamp-2 italic">"{{ targetData.sinopsis }}"</p>
                        <div class="mt-2 flex gap-2">
                           <a :href="'/archive/' + targetData.slug" target="_blank">
                             <Button size="sm" variant="outline" class="h-7 text-[9px] border-black">Lihat Halaman</Button>
                           </a>
                        </div>
                      </div>
                    </div>

                    <!-- Comment/Reply Preview -->
                    <div v-else-if="['comment', 'reply'].includes(selectedReport?.target_type)" class="space-y-2">
                      <div class="flex items-center gap-2 mb-2">
                        <div class="w-5 h-5 rounded-full bg-stone-200 border border-black"></div>
                        <span class="text-xs font-black uppercase tracking-tighter">{{ targetData.user?.name || 'User' }}</span>
                        <span class="text-[9px] text-stone-400">• {{ formatDate(targetData.created_at) }}</span>
                      </div>
                      <div class="p-3 bg-white border border-stone-300 italic text-sm text-stone-700">
                        "{{ targetData.isi_pesan || targetData.content }}"
                      </div>
                    </div>

                    <!-- Generic/Discussion/Material Preview -->
                    <div v-else class="space-y-1">
                      <h5 class="font-bold text-sm">{{ targetData.title || targetData.judul || targetData.nama_materi }}</h5>
                      <p class="text-xs text-stone-600 italic">"{{ targetData.description || targetData.sinopsis || targetData.deskripsi }}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Admin Resolution -->
              <div class="space-y-4 pt-4 border-t-2 border-stone-100">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-stone-900">Keputusan Moderasi</h4>
                <textarea 
                  v-model="adminNotes" 
                  rows="3" 
                  placeholder="Berikan catatan internal atau alasan keputusan anda..."
                  class="w-full p-4 border-2 border-black focus:outline-none focus:ring-0 text-sm bg-stone-50 focus:bg-white transition-colors font-body"
                ></textarea>
                
                <div class="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    class="h-9 text-[11px] font-black uppercase border-2 border-black gap-2 hover:bg-stone-100"
                    @click="updateReportStatus('reviewed')"
                    :disabled="processing"
                  >
                    Ditinjau
                  </Button>
                  <Button 
                    variant="outline"
                    class="h-9 text-[11px] font-black uppercase border-2 border-black text-red-600 hover:bg-red-50 gap-2"
                    @click="updateReportStatus('rejected')"
                    :disabled="processing"
                  >
                    Tolak Laporan
                  </Button>
                  <Button 
                    class="h-9 text-[11px] font-black uppercase border-2 border-black bg-brand-teal text-white shadow-brutal-xs hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 gap-2"
                    @click="updateReportStatus('resolved')"
                    :disabled="processing"
                  >
                    <CheckCircle class="w-4 h-4" /> Tandai Selesai
                  </Button>
                </div>
              </div>
            </div>

            <!-- Footer Meta -->
            <div class="px-6 py-3 border-t-2 border-black bg-stone-50 flex items-center justify-between shrink-0">
               <div v-if="targetData" class="flex gap-3">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    class="text-[10px] font-black uppercase bg-red-600 border-2 border-black shadow-brutal-xs hover:shadow-none transition-all gap-2"
                    @click="showDeleteConfirm = true"
                  >
                    <Trash2 class="w-3.5 h-3.5" /> Hapus Konten Terlapor
                  </Button>
               </div>
               <div class="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                  Process ID: REP-{{ selectedReport?.report_id }}-MOD
               </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Content Confirmation -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      @update:show="showDeleteConfirm = $event"
      title="Hapus Konten Terlapor"
      message="Apakah anda yakin ingin menghapus konten ini secara permanen? Aksi ini tidak dapat dibatalkan dan laporan akan otomatis ditandai sebagai 'Selesai'."
      variant="danger"
      confirm-label="Ya, Hapus Permanen"
      :loading="deleting"
      @confirm="deleteTarget"
    />

  </div>
</template>

<style scoped>
.shadow-brutal-sm {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal-xs {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}
</style>
