<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/lib/api'
import { API_BASE } from '@/lib/format'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Pencil, Trash2, Loader2, BookOpen, X, Save, AlertTriangle, 
  FileText, Youtube, CheckCircle, ExternalLink, Power, Upload, ArrowLeft
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import * as tus from 'tus-js-client'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Kelola Materi - PF Space'
})

const materials = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)

// Modal state
const showModal = ref(false)
const editingMaterial = ref(null)
const formData = ref({ 
  judul: '', 
  deskripsi: '', 
  tipe: 'pdf', 
  file_path: '', 
  video_url: '', 
  is_active: true 
})
const formError = ref('')

import { useAuth } from '@/composables/useAuth'

const { user, isAdmin, isModerator } = useAuth()
const isStaff = computed(() => isAdmin.value || isModerator.value)
const { showToast } = useToast()

// Fetch materials
const fetchMaterials = async () => {
  loading.value = true
  try {
    const params = { owner: 'true' }
    const res = await api.get('/api/learning-materials', { params })
    materials.value = res.data
  } catch (err) {
    console.error('Failed to fetch materials:', err)
    showToast('Gagal memuat materi', 'error')
  } finally {
    loading.value = false
  }
}

// Tus Upload
const uploadFileTus = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const endpoint = `${API_BASE}/api/files/` 

    const upload = new tus.Upload(file, {
      endpoint: endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type || 'application/octet-stream'
      },
      // Disable resuming to prevent 404/CORS errors from old, invalid fingerprints in localStorage
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      onError: (error) => {
        reject(error)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0)
        if (onProgress) onProgress(+percentage)
      },
      onSuccess: () => {
        try {
          // Get the filename from the tus URL (e.g., "uuid.pdf")
          const fileId = upload.url.split('/api/files/')[1]
          if (fileId && fileId.includes('/')) resolve(`/uploads/${fileId}`)
          else if (fileId) {
            const type = file.type || ''
            let subfolder = 'documents'
            if (type.startsWith('video/')) subfolder = 'videos'
            else if (type.startsWith('image/')) subfolder = 'images'
            resolve(`/uploads/${subfolder}/${fileId}`)
          } else resolve(upload.url)
        } catch (e) {
          resolve(upload.url)
        }
      }
    })

    // Start upload immediately
    upload.start()
  })
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    showToast('Hanya file PDF yang diizinkan', 'error')
    event.target.value = ''
    return
  }

  if (file.size > 20 * 1024 * 1024) {
    showToast('Ukuran file maksimal 20MB', 'error')
    event.target.value = ''
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  try {
    const url = await uploadFileTus(file, (percent) => {
      uploadProgress.value = percent
    })
    formData.value.file_path = url
    showToast('File berhasil diupload')
  } catch (err) {
    console.error('Upload failed:', err)
    showToast('Gagal mengupload file', 'error')
  } finally {
    uploading.value = false
  }
}

// Open modal for create/edit
const openModal = (material = null) => {
  editingMaterial.value = material
  if (material) {
    formData.value = { 
      judul: material.judul, 
      deskripsi: material.deskripsi || '', 
      tipe: material.tipe, 
      file_path: material.file_path || '', 
      video_url: material.video_url || '',
      is_active: material.is_active
    }
  } else {
    formData.value = { 
      judul: '', 
      deskripsi: '', 
      tipe: 'pdf', 
      file_path: '', 
      video_url: '', 
      is_active: true 
    }
  }
  formError.value = ''
  showModal.value = true
  uploadProgress.value = 0
}

const closeModal = () => {
  if (uploading.value) return
  showModal.value = false
  editingMaterial.value = null
}

// Save material
const saveMaterial = async () => {
  if (!formData.value.judul.trim()) {
    formError.value = 'Judul wajib diisi'
    return
  }

  if (formData.value.tipe === 'pdf' && !formData.value.file_path) {
    formError.value = 'File PDF wajib diupload'
    return
  }

  if (formData.value.tipe === 'video' && !formData.value.video_url) {
    formError.value = 'URL Video wajib diisi'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    const payload = {
      judul: formData.value.judul,
      deskripsi: formData.value.deskripsi,
      tipe: formData.value.tipe,
      is_active: formData.value.is_active,
      // Only send what's relevant to the type
      file_path: formData.value.tipe === 'pdf' ? formData.value.file_path : null,
      video_url: formData.value.tipe === 'video' ? formData.value.video_url : null
    }

    if (editingMaterial.value) {
      await api.put(`/api/learning-materials/${editingMaterial.value.materi_id}`, payload)
      showToast('Materi berhasil diperbarui')
    } else {
      await api.post('/api/learning-materials', payload)
      showToast('Materi berhasil ditambahkan')
    }
    closeModal()
    await fetchMaterials()
  } catch (err) {
    formError.value = err.message || 'Gagal menyimpan materi'
  } finally {
    saving.value = false
  }
}

// Delete material
const materialToDelete = ref(null)
const showConfirm = ref(false)

const confirmDelete = (material) => {
  materialToDelete.value = material
  showConfirm.value = true
}

const executeDelete = async () => {
  if (!materialToDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/api/learning-materials/${materialToDelete.value.materi_id}`)
    showToast('Materi berhasil dihapus')
    await fetchMaterials()
  } catch (err) {
    showToast('Gagal menghapus materi', 'error')
  } finally {
    deleting.value = false
    showConfirm.value = false
    materialToDelete.value = null
  }
}

const togglingIds = ref(new Set())

const toggleStatus = async (material) => {
  if (togglingIds.value.has(material.materi_id)) return
  
  togglingIds.value.add(material.materi_id)
  try {
    await api.patch(`/api/learning-materials/${material.materi_id}/toggle`)
    showToast('Status materi diperbarui')
    await fetchMaterials()
  } catch (err) {
    showToast('Gagal merubah status', 'error')
  } finally {
    togglingIds.value.delete(material.materi_id)
  }
}

onMounted(fetchMaterials)
</script>

<template>
  <PageLayout>
    <div class="w-full max-w-7xl mx-auto px-4 md:px-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-brand-red border-2 border-black shadow-brutal-sm">
            <BookOpen class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-display font-bold text-stone-900 leading-none">Kelola Materi</h1>
            <p class="text-stone-500 mt-2">Kelola materi pembelajaran untuk publik (PDF & Video).</p>
          </div>
        </div>
        
        <Button @click="openModal()" class="gap-2 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
          <Plus class="w-4 h-4" />
          Tambah Materi
        </Button>
      </div>

      <!-- Info Box mirip CreateArchive -->
      <div class="mb-8 p-4 bg-stone-50 border-2 border-black shadow-brutal-sm flex gap-3">
        <div class="mt-1 shrink-0">
          <AlertTriangle class="w-5 h-5 text-brand-orange" />
        </div>
        <div class="min-w-0">
          <p class="font-bold text-stone-900 mb-1 uppercase tracking-tight text-sm">Panduan Pengelolaan Materi</p>
          <ul class="list-disc pl-5 text-xs text-stone-700 space-y-1 font-medium">
            <li>Materi PDF harus memiliki ukuran maksimal 20MB.</li>
            <li>Pastikan judul materi deskriptif dan mudah dicari oleh siswa.</li>
            <li>Video harus menggunakan link YouTube yang valid (Full atau Shortened).</li>
            <li>Gunakan status "Aktif" untuk menampilkan materi di halaman publik secara instan.</li>
          </ul>
        </div>
      </div>

      <!-- Table View -->
      <Card class="border-2 border-black shadow-brutal rounded-none overflow-hidden">
        <CardHeader class="border-b-2 border-black bg-stone-100 p-4">
          <CardTitle class="text-sm font-bold uppercase tracking-widest text-stone-900">Daftar Materi Pembelajaran</CardTitle>
        </CardHeader>
        <CardContent class="p-0 overflow-x-auto bg-white">
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-brand-teal mb-2" />
            <span class="font-mono text-xs uppercase tracking-widest text-stone-500">Memuat data...</span>
          </div>

          <div v-else-if="materials.length === 0" class="text-center py-12 text-stone-400">
            <BookOpen class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada materi pembelajaran</p>
          </div>

          <template v-else>
            <table class="w-full text-left border-collapse min-w-[800px]">
              <thead class="bg-lime-50 border-b-2 border-black text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th class="px-6 py-3">Materi</th>
                  <th class="px-6 py-3">Tipe</th>
                  <th class="px-6 py-3">Pengunggah</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 bg-white">
                <tr v-for="m in materials" :key="m.materi_id" class="hover:bg-stone-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-stone-900 leading-tight">{{ m.judul }}</div>
                    <div class="text-xs text-stone-500 line-clamp-1 mt-1">{{ m.deskripsi || '-' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <Badge v-if="m.tipe === 'pdf'" variant="outline" class="bg-red-50 text-red-700 border-red-200 uppercase text-[10px]">
                      <FileText class="w-3 h-3 mr-1" /> PDF
                    </Badge>
                    <Badge v-else variant="outline" class="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">
                      <Youtube class="w-3 h-3 mr-1" /> VIDEO
                    </Badge>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-stone-200 border border-black overflow-hidden flex-shrink-0">
                        <img v-if="m.creator?.image" :src="m.creator.image" class="w-full h-full object-cover" />
                      </div>
                      <span class="text-xs">{{ m.creator?.name || 'Admin' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <button 
                      @click="toggleStatus(m)"
                      class="flex items-center gap-2 group"
                      :disabled="togglingIds.has(m.materi_id)"
                    >
                      <div :class="[m.is_active ? 'bg-green-500' : 'bg-stone-300', 'w-10 h-5 border-2 border-black rounded-full relative transition-colors', togglingIds.has(m.materi_id) ? 'opacity-50' : '']">
                        <div :class="[m.is_active ? 'translate-x-5' : 'translate-x-0', 'absolute top-0.5 left-0.5 w-3 h-3 bg-white border border-black rounded-full transition-transform']"></div>
                      </div>
                      <span :class="[m.is_active ? 'text-green-700 font-bold' : 'text-stone-400', 'text-[10px] uppercase tracking-tighter flex items-center gap-1']">
                        <Loader2 v-if="togglingIds.has(m.materi_id)" class="w-3 h-3 animate-spin" />
                        {{ m.is_active ? 'Aktif' : 'Nonaktif' }}
                      </span>
                    </button>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" @click="openModal(m)" class="border-2 border-black p-2 h-8">
                        <Pencil class="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" @click="confirmDelete(m)" class="border-2 border-black p-2 h-8 text-red-600 hover:bg-red-50">
                        <Trash2 class="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100">
          <h2 class="font-bold text-lg font-display uppercase tracking-tight">
            {{ editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru' }}
          </h2>
          <button @click="closeModal" class="p-1 hover:bg-stone-200 border-2 border-transparent hover:border-black transition-colors rounded">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveMaterial" class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div v-if="formError" class="p-3 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-medium">
            {{ formError }}
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Judul Materi *</label>
              <Input v-model="formData.judul" placeholder="Masukkan judul materi" class="border-2 border-black focus-visible:ring-0" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Deskripsi Singkat</label>
              <textarea 
                v-model="formData.deskripsi" 
                rows="3"
                placeholder="Deskripsi materi..." 
                class="w-full p-2 border-2 border-black focus:outline-none text-sm"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Tipe Materi</label>
                <div class="flex border-2 border-black">
                  <button 
                    type="button"
                    @click="formData.tipe = 'pdf'"
                    :class="[formData.tipe === 'pdf' ? 'bg-brand-red text-white' : 'bg-white text-black', 'flex-1 py-1.5 text-xs font-bold uppercase tracking-tighter transition-colors']"
                  >
                    PDF
                  </button>
                  <button 
                    type="button"
                    @click="formData.tipe = 'video'"
                    :class="[formData.tipe === 'video' ? 'bg-[#FF0000] text-white' : 'bg-white text-black', 'flex-1 py-1.5 text-xs font-bold uppercase tracking-tighter transition-colors']"
                  >
                    VIDEO
                  </button>
                </div>
              </div>
              <div class="flex items-end pb-1">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" v-model="formData.is_active" class="w-4 h-4 border-2 border-black rounded-none" />
                  <span class="text-xs font-bold uppercase tracking-widest">Tampilkan di Publik</span>
                </label>
              </div>
            </div>

            <!-- Conditional Inputs -->
            <div v-if="formData.tipe === 'pdf'" class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">File PDF *</label>
              <div v-if="formData.file_path" class="p-3 bg-green-50 border-2 border-green-200 text-green-700 text-xs flex items-center justify-between">
                <div class="flex items-center gap-2 truncate">
                  <CheckCircle class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ formData.file_path.split('/').pop() }}</span>
                </div>
                <button type="button" @click="formData.file_path = ''" class="text-green-700 hover:scale-110 transition-transform">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div v-else>
                <div class="relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    @change="handleFileUpload" 
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    :disabled="uploading"
                  />
                  <div class="border-2 border-dashed border-stone-300 p-6 text-center hover:bg-stone-50 transition-colors">
                    <template v-if="uploading">
                      <div class="space-y-2">
                        <div class="flex justify-between text-[10px] font-bold">
                          <span>MENGUNGGAH...</span>
                          <span>{{ uploadProgress }}%</span>
                        </div>
                        <div class="w-full h-2 bg-stone-100 border border-black relative">
                          <div class="h-full bg-brand-teal transition-all" :style="{ width: uploadProgress + '%' }"></div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <Upload class="w-6 h-6 mx-auto mb-2 text-stone-400" />
                      <p class="text-[10px] font-bold uppercase text-stone-500 tracking-widest">Klik atau seret file PDF</p>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-else>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">URL YouTube *</label>
              <Input v-model="formData.video_url" placeholder="https://youtube.com/watch?v=..." class="border-2 border-black focus-visible:ring-0" />
              <p class="text-[10px] text-stone-500 mt-1 italic tracking-tight">Gunakan link full atau shortened (youtu.be)</p>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <Button type="button" variant="outline" class="flex-1 border-2 border-black" @click="closeModal" :disabled="saving">
              Batal
            </Button>
            <Button type="submit" class="flex-1 gap-2 border-2 border-black shadow-brutal-sm" :disabled="saving || uploading">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              Simpan Materi
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="showConfirm" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-sm p-6 overflow-hidden animate-in fade-in duration-200">
        <div class="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle class="w-6 h-6" />
          <h3 class="font-bold text-lg uppercase tracking-tight">Hapus Materi?</h3>
        </div>
        <p class="text-sm text-stone-600 mb-6 font-medium">Apakah Anda yakin ingin menghapus materi <span class="text-black font-bold">"{{ materialToDelete?.judul }}"</span>? Tindakan ini tidak dapat dibatalkan.</p>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1 border-2 border-black" @click="showConfirm = false">Batal</Button>
          <Button class="flex-1 bg-red-600 hover:bg-red-700 text-white border-2 border-black gap-2" @click="executeDelete" :disabled="deleting">
            <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-4 h-4" />
            Hapus
          </Button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
  </PageLayout>
</template>

<style scoped>
.shadow-brutal-sm {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}
</style>
