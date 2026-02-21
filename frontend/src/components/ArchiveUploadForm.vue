<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, Film, Plus, Trash2, Loader2, Send, Save,
  CheckCircle, X, CloudUpload, AlertCircle, RotateCcw
} from 'lucide-vue-next'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useFilmDraft } from '@/composables/useFilmDraft'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'error'])

// Draft management
const { 
  hasDraft, 
  draftTimestamp, 
  saveDraft, 
  loadDraft, 
  clearDraft, 
  checkDraft, 
  formatDraftTime,
  createAutoSave 
} = useFilmDraft()

const showDraftBanner = ref(false)
let stopAutoSave = null

const categories = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const localLoading = ref(false)
const showVideoModal = ref(false)
const activeVideoField = ref('') // 'link_video_utama' or 'link_trailer'
const selectedVideoFile = ref(null)

// Form data
const form = ref({
  judul: '',
  category_id: '',
  sinopsis: '',
  tahun_karya: new Date().getFullYear(),
  link_video_utama: '',
  link_trailer: '',
  link_bts: '',
  gambar_poster: '',
  banner_url: '',
  deskripsi_lengkap: '',
  file_naskah: '',
  file_storyboard: '',
  file_rab: '',
  crew: [{ jabatan: '', anggota: [''] }]
})

// Initialize form when initialData changes or on mount
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Merge initial data into form
    Object.keys(form.value).forEach(key => {
      if (newData[key] !== undefined && newData[key] !== null) {
        // Handle crew specifically if needed, otherwise direct assignment works for most
        if (key === 'crew') {
          if (Array.isArray(newData[key]) && newData[key].length > 0) {
            form.value.crew = JSON.parse(JSON.stringify(newData[key]))
          } else if (!props.isEdit) {
            // Keep default crew for new entries if not provided
          } else {
            // For edit mode, if crew is empty from server, ensure at least one empty row
            form.value.crew = [{ jabatan: '', anggota: [''] }]
          }
        } else {
          form.value[key] = newData[key]
        }
      }
    })
    
    // Ensure category_id is handled correctly (sometimes it might be an object or int)
    if (newData.category?.category_id) {
        form.value.category_id = newData.category.category_id
    }
  }
}, { immediate: true })

import * as tus from 'tus-js-client'

const uploadFileTus = (file, onProgress, fieldName) => {
  return new Promise((resolve, reject) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const endpoint = `${baseUrl}/api/files/` 

    const upload = new tus.Upload(file, {
      endpoint: endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type || 'application/octet-stream'
      },
      storeFingerprintForResuming: false,
      onError: (error) => {
        reject(error)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0)
        if (onProgress) onProgress(+percentage)
      },
      onSuccess: () => {
        try {
          const id = upload.url.split('/api/files/')[1]
          if (id && id.includes('/')) {
            resolve(`/uploads/${id}`)
          } else {
            let subfolder = 'documents'
            if (file?.type?.startsWith('video/')) subfolder = 'videos'
            else if (file?.type === 'application/pdf') subfolder = 'documents'
            else if (file?.type?.startsWith('image/')) subfolder = 'images'
            else {
              if (fieldName === 'gambar_poster' || fieldName === 'banner_url') subfolder = 'images'
              else if (['file_naskah', 'file_storyboard', 'file_rab'].includes(fieldName)) subfolder = 'documents'
              else subfolder = 'videos'
            }
            resolve(id ? `/uploads/${subfolder}/${id}` : upload.url)
          }
        } catch (e) {
          resolve(upload.url)
        }
      }
    })

    upload.start()
  })
}



const handleFileUpload = async (event, fieldName) => {
  const file = event.target.files[0]
  if (!file) return

  // Validasi ukuran
  const isVideo = file.type.startsWith('video/')
  if (isVideo) {
    activeVideoField.value = fieldName
    selectedVideoFile.value = file
    showVideoModal.value = true
    event.target.value = '' // Reset input
    return
  }
  
  const limit = 10 * 1024 * 1024 // 10MB for others

  if (file.size > limit) {
    emit('error', `Ukuran file terlalu besar (maksimal 10MB)`)
    event.target.value = '' 
    return
  }

  // Validasi tipe file jika perlu (misal poster harus gambar)
  if (fieldName === 'gambar_poster' && !file.type.startsWith('image/')) {
    emit('error', 'File harus berupa gambar')
    event.target.value = ''
    return
  }
  
  if ((fieldName === 'file_naskah' || fieldName === 'file_storyboard' || fieldName === 'file_rab') && file.type !== 'application/pdf') {
     emit('error', 'File harus berupa PDF')
     event.target.value = ''
     return
  }

  uploading.value = true
  try {
    const url = await uploadFileTus(file, null, fieldName)
    
    if (url) {
      form.value[fieldName] = url
    }
  } catch (err) {
    console.error('Upload failed:', err)
    emit('error', 'Gagal mengupload file: ' + (err.message || 'Server error'))
    event.target.value = '' 
  } finally {
    uploading.value = false
  }
}

const startVideoUpload = async () => {
  if (!selectedVideoFile.value) return

  const file = selectedVideoFile.value
  const limit = 1024 * 1024 * 1024 // 1GB

  if (file.size > limit) {
    emit('error', 'Ukuran video terlalu besar (maksimal 1GB)')
    showVideoModal.value = false
    selectedVideoFile.value = null
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const url = await uploadFileTus(file, (percent) => {
      uploadProgress.value = percent
    }, activeVideoField.value)
    
    if (url) {
      form.value[activeVideoField.value] = url
      showVideoModal.value = false
      selectedVideoFile.value = null
    }
  } catch (err) {
    console.error('Upload failed:', err)
    emit('error', 'Gagal mengupload video: ' + (err.message || 'Server error'))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Fetch categories
const fetchCategories = async () => {
  localLoading.value = true
  try {
    const res = await api.get('/api/categories')
    categories.value = res.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    emit('error', 'Gagal mengambil data kategori')
  } finally {
    localLoading.value = false
  }
}

// Crew management
const addCrew = () => {
  form.value.crew.push({ jabatan: '', anggota: [''] })
}

const removeCrew = (index) => {
  form.value.crew.splice(index, 1)
}

const addCrewMember = (crewIndex) => {
  form.value.crew[crewIndex].anggota.push('')
}

const removeCrewMember = (crewIndex, memberIndex) => {
  form.value.crew[crewIndex].anggota.splice(memberIndex, 1)
}

const handleSubmit = () => {
  emit('submit', form.value)
  // Clear draft setelah submit berhasil
  clearDraft()
}

const restoreDraft = () => {
  const draft = loadDraft()
  if (draft) {
    Object.keys(form.value).forEach(key => {
      if (draft[key] !== undefined && draft[key] !== null) {
        if (key === 'crew') {
          if (Array.isArray(draft[key])) {
            form.value.crew = JSON.parse(JSON.stringify(draft[key]))
          }
        } else {
          form.value[key] = draft[key]
        }
      }
    })
    showDraftBanner.value = false
  }
}

const discardDraft = () => {
  clearDraft()
  showDraftBanner.value = false
}

onMounted(() => {
  fetchCategories()
  
  // Check for existing draft (hanya untuk mode create, bukan edit)
  if (!props.isEdit && checkDraft()) {
    showDraftBanner.value = true
  }
  
  // Setup auto-save (hanya untuk mode create)
  if (!props.isEdit) {
    stopAutoSave = createAutoSave(form, 3000) // Auto-save setiap 3 detik
  }
})

onUnmounted(() => {
  // Stop auto-save saat component unmount
  if (stopAutoSave) {
    stopAutoSave()
  }
})
</script>

<template>
  <div>
    <!-- Draft Banner -->
    <div 
      v-if="showDraftBanner" 
      class="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 shadow-brutal animate-in slide-in-from-top duration-300"
    >
      <div class="flex items-start gap-3">
        <AlertCircle class="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-bold text-yellow-900 mb-1">Draft Ditemukan</h3>
          <p class="text-sm text-yellow-800 mb-3">
            Ada draft yang tersimpan {{ formatDraftTime() }}. Ingin melanjutkan?
          </p>
          <div class="flex gap-2">
            <Button 
              type="button"
              size="sm" 
              @click="restoreDraft"
              class="bg-yellow-600 text-white border-2 border-black shadow-brutal-sm hover:shadow-none gap-2"
            >
              <RotateCcw class="w-4 h-4" />
              Pulihkan Draft
            </Button>
            <Button 
              type="button"
              size="sm" 
              variant="outline"
              @click="discardDraft"
              class="border-2 border-black"
            >
              Abaikan
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <div 
      v-if="!props.isEdit && hasDraft && !showDraftBanner" 
      class="mb-4 flex items-center gap-2 text-xs text-stone-500"
    >
      <CheckCircle class="w-3 h-3 text-green-500" />
      <span>Draft tersimpan otomatis {{ formatDraftTime() }}</span>
    </div>

  <form @submit.prevent="handleSubmit" class="space-y-8">
    <!-- Basic Info -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <Film class="w-5 h-5" /> Informasi Dasar
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold mb-2">Judul Karya *</label>
            <Input v-model="form.judul" placeholder="Masukkan judul karya" />
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Kategori *</label>
            <select 
              v-model="form.category_id"
              class="w-full h-10 px-3 border-2 border-black bg-white text-sm"
            >
              <option value="">Pilih kategori</option>
              <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id">
                {{ cat.nama_kategori }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Tahun Karya</label>
            <Input v-model="form.tahun_karya" type="number" min="1900" :max="new Date().getFullYear()" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold mb-2">Sinopsis</label>
            <textarea 
              v-model="form.sinopsis"
              rows="4"
              placeholder="Ceritakan sinopsis karya..."
              class="w-full p-3 border-2 border-black bg-white text-sm resize-none"
            ></textarea>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Links -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <Upload class="w-5 h-5" /> Link Video
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Video Utama (MP4/WebM)</label>
            <div class="space-y-3">
               <div v-if="form.link_video_utama" class="relative w-full bg-stone-100 border border-stone-300 rounded p-3 flex items-center gap-2">
                  <Film class="w-5 h-5 text-stone-500 shrink-0" />
                  <span class="text-xs text-stone-600 truncate flex-1">{{ form.link_video_utama.split('/').pop() }}</span>
                   <button 
                    type="button" 
                    @click="form.link_video_utama = ''"
                    class="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X class="w-4 h-4" />
                  </button>
               </div>
               <div class="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  class="w-full border-2 border-dashed border-stone-400 h-20 flex flex-col gap-1 hover:border-brand-teal hover:bg-teal-50"
                  @click="$refs.videoUtamaInput.click()"
                  :disabled="uploading"
                >
                  <Upload class="w-6 h-6 text-stone-400" />
                  <span class="text-xs font-bold uppercase text-stone-500">Pilih File Video</span>
                </Button>
                <input 
                  type="file" 
                  ref="videoUtamaInput"
                  accept="video/*"
                  @change="(e) => handleFileUpload(e, 'link_video_utama')"
                  class="hidden"
                />
               </div>
               <p class="text-xs text-stone-500 italic">Format: MP4, WebM. Max 1GB.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Video Trailer (MP4/WebM)</label>
            <div class="space-y-3">
               <div v-if="form.link_trailer" class="relative w-full bg-stone-100 border border-stone-300 rounded p-3 flex items-center gap-2">
                  <Film class="w-5 h-5 text-stone-500 shrink-0" />
                  <span class="text-xs text-stone-600 truncate flex-1">{{ form.link_trailer.split('/').pop() }}</span>
                   <button 
                    type="button" 
                    @click="form.link_trailer = ''"
                    class="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X class="w-4 h-4" />
                  </button>
               </div>
               <div class="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  class="w-full border-2 border-dashed border-stone-400 h-20 flex flex-col gap-1 hover:border-brand-teal hover:bg-teal-50"
                  @click="$refs.trailerInput.click()"
                  :disabled="uploading"
                >
                  <Upload class="w-6 h-6 text-stone-400" />
                  <span class="text-xs font-bold uppercase text-stone-500">Pilih File Trailer</span>
                </Button>
                <input 
                  type="file" 
                  ref="trailerInput"
                  accept="video/*"
                  @change="(e) => handleFileUpload(e, 'link_trailer')"
                  class="hidden"
                />
               </div>
               <p class="text-xs text-stone-500 italic">Format: MP4, WebM. Max 1GB.</p>
            </div>
          </div>
            
            <div>
              <label class="block text-sm font-bold mb-2">Video BTS (MP4/WebM) - Opsional</label>
              <div class="space-y-3">
                 <div v-if="form.link_bts" class="relative w-full bg-stone-100 border border-stone-300 rounded p-3 flex items-center gap-2">
                    <Film class="w-5 h-5 text-stone-500 shrink-0" />
                    <span class="text-xs text-stone-600 truncate flex-1">{{ form.link_bts.split('/').pop() }}</span>
                     <button 
                      type="button" 
                      @click="form.link_bts = ''"
                      class="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <X class="w-4 h-4" />
                    </button>
                 </div>
                 <div class="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full border-2 border-dashed border-stone-400 h-20 flex flex-col gap-1 hover:border-brand-teal hover:bg-teal-50"
                    @click="$refs.btsInput.click()"
                    :disabled="uploading"
                  >
                    <Upload class="w-6 h-6 text-stone-400" />
                    <span class="text-xs font-bold uppercase text-stone-500">Pilih File BTS</span>
                  </Button>
                  <input 
                    type="file" 
                    ref="btsInput"
                    accept="video/*"
                    @change="(e) => handleFileUpload(e, 'link_bts')"
                    class="hidden"
                  />
                 </div>
                 <p class="text-xs text-stone-500 italic">Format: MP4, WebM. Max 1GB.</p>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>

    <!-- Visual Assets -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold mb-4">Visual & Dokumen</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Gambar Poster</label>
            <div class="space-y-3">
              <div v-if="form.gambar_poster" class="relative w-40 h-60 bg-stone-100 border border-stone-300 rounded overflow-hidden">
                <img :src="assetUrl(form.gambar_poster)" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click="form.gambar_poster = ''"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
              
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  @change="(e) => handleFileUpload(e, 'gambar_poster')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-brand-teal file:text-white
                    hover:file:bg-teal-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <Loader2 v-if="uploading" class="w-5 h-5 animate-spin text-stone-400" />
              </div>
              <p class="text-xs text-stone-500">Format: JPG, PNG. Max 10MB.</p>
            </div>

            <div class="mt-6">
              <label class="block text-sm font-bold mb-2">Gambar Banner (Opsional)</label>
              <div class="space-y-3">
                <div v-if="form.banner_url" class="relative w-full h-32 bg-stone-100 border border-stone-300 rounded overflow-hidden">
                  <img :src="assetUrl(form.banner_url)" class="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    @click="form.banner_url = ''"
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                
                <div class="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    @change="(e) => handleFileUpload(e, 'banner_url')"
                    class="block w-full text-sm text-stone-500
                      file:mr-4 file:py-2 file:px-4
                      file:border-0 file:text-sm file:font-semibold
                      file:bg-brand-teal file:text-white
                      hover:file:bg-teal-700
                      cursor-pointer"
                    :disabled="uploading"
                  />
                </div>
                <p class="text-xs text-stone-500">
                  Format: JPG, PNG. Rekomendasi: 1920x1080px (Landscape) untuk Carousel.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2">File Naskah (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_naskah')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_naskah" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_naskah" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_naskah.split('/').pop() }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2">File Storyboard (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_storyboard')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_storyboard" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_storyboard" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_storyboard.split('/').pop() }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2">File RAB (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_rab')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_rab" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_rab" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_rab.split('/').pop() }}
              </p>
            </div>
          </div>

          <div class="md:col-span-2 mt-4">
            <label class="block text-sm font-bold mb-2">Informasi Tambahan (Backstory, Director Statement, dll)</label>
            <RichTextEditor 
              v-model="form.deskripsi_lengkap"
              placeholder="Ceritakan sejarah pembuatan karya, statement sutradara, atau info menarik lainnya..."
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Crew -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Crew & Kontributor</h2>
          <Button type="button" variant="outline" size="sm" @click="addCrew" class="gap-1">
            <Plus class="w-4 h-4" /> Tambah Jabatan
          </Button>
        </div>

        <div class="space-y-4">
          <div v-for="(crew, crewIdx) in form.crew" :key="crewIdx" class="p-4 bg-stone-100 border border-stone-300">
            <div class="flex items-center gap-2 mb-3">
              <Input 
                v-model="crew.jabatan" 
                placeholder="Jabatan (cth: Sutradara, Penulis)"
                class="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                class="text-red-600"
                @click="removeCrew(crewIdx)"
                v-if="form.crew.length > 1"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <div class="space-y-2 ml-4">
              <div v-for="(member, memberIdx) in crew.anggota" :key="memberIdx" class="flex items-center gap-2">
                <span class="text-xs text-stone-500 w-4">{{ memberIdx + 1 }}.</span>
                <Input 
                  v-model="crew.anggota[memberIdx]" 
                  placeholder="Nama anggota"
                  class="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  @click="removeCrewMember(crewIdx, memberIdx)"
                  v-if="crew.anggota.length > 1"
                >
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                @click="addCrewMember(crewIdx)"
                class="text-xs"
              >
                + Tambah Anggota
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Submit -->
    <div class="flex gap-4 justify-end">
      <Button type="button" variant="outline" @click="$emit('cancel')">
        Batal
      </Button>
      <Button type="submit" :disabled="loading || uploading" class="gap-2">
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Save v-if="isEdit" class="w-4 h-4" />
          <Send v-else class="w-4 h-4" />
        </template>
        {{ isEdit ? 'Simpan Perubahan' : 'Submit untuk Review' }}
      </Button>
    </div>
  </form>

  <!-- Video Upload Modal -->
  <div v-if="showVideoModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="!uploading ? showVideoModal = false : null"></div>
    <div class="relative w-full max-w-md bg-white border-2 border-black shadow-brutal animate-in fade-in zoom-in duration-200">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold font-display uppercase tracking-tight">Upload Video</h3>
          <button v-if="!uploading" @click="showVideoModal = false" class="text-stone-400 hover:text-black">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-6">
          <div class="p-4 bg-stone-100 border-2 border-stone-200 flex items-center gap-4">
            <div class="w-12 h-12 bg-white border border-stone-300 flex items-center justify-center">
              <Film class="w-6 h-6 text-brand-teal" />
            </div>
            <div class="flex-1 min-w-0">
               <p class="font-bold text-sm truncate">{{ selectedVideoFile?.name }}</p>
               <p class="text-[10px] text-stone-500 font-mono uppercase">{{ (selectedVideoFile?.size / (1024 * 1024)).toFixed(2) }} MB</p>
            </div>
          </div>

          <div v-if="uploading" class="space-y-2">
            <div class="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span class="text-brand-teal">Mengunggah...</span>
              <span>{{ uploadProgress }}%</span>
            </div>
            <div class="w-full h-4 bg-stone-100 border-2 border-black overflow-hidden relative">
              <div 
                class="h-full bg-brand-teal transition-all duration-300 ease-out"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
              <!-- Glitchy line effect -->
              <div class="absolute inset-0 bg-white/10 pointer-events-none"></div>
            </div>
            <p class="text-[10px] text-stone-400 italic text-center">Jangan tutup halaman ini hingga proses selesai.</p>
          </div>

          <div class="flex gap-3 pt-2">
            <Button 
              v-if="!uploading"
              variant="outline" 
              class="flex-1 border-2 border-black shadow-brutal-sm hover:shadow-none translate-x-[1px] translate-y-[1px] hover:translate-x-0 hover:translate-y-0"
              @click="showVideoModal = false"
            >
              Batal
            </Button>
            <Button 
              class="flex-1 bg-brand-teal text-white border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              @click="startVideoUpload"
              :disabled="uploading"
            >
              <Loader2 v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
              <CloudUpload v-else class="w-4 h-4 mr-2" />
              {{ uploading ? 'Mengunggah...' : 'Mulai Upload' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
