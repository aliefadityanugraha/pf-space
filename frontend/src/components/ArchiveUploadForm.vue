<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, Film, Plus, Trash2, Loader2, Send, Save,
  CheckCircle, X, CloudUpload, AlertCircle, RotateCcw,
  FileText, Image as ImageIcon, Video, User, Check, Play,
  Maximize2, Eye, Volume2, ExternalLink, Download,
  ShieldCheck, Zap, Layers, RefreshCw, Sparkles
} from 'lucide-vue-next'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useFilmDraft } from '@/composables/useFilmDraft'
import { uploadFileTus } from '@/lib/uploadFileTus'

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
const draftPreviewTitle = ref('')
let stopAutoSave = null

const categories = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const localLoading = ref(false)
const showVideoUploadModal = ref(false)
const activeVideoField = ref('') // 'link_video_utama' or 'link_trailer' or 'link_bts'
const selectedVideoFile = ref(null)
const selectedVideoPreviewUrl = ref('')
const videoModalInput = ref(null)

const setVideoFile = (file) => {
  if (selectedVideoPreviewUrl.value) {
    URL.revokeObjectURL(selectedVideoPreviewUrl.value)
  }
  selectedVideoFile.value = file
  if (file) {
    selectedVideoPreviewUrl.value = URL.createObjectURL(file)
  } else {
    selectedVideoPreviewUrl.value = ''
  }
}

const closeVideoUploadModal = () => {
  if (uploading.value) return
  showVideoUploadModal.value = false
  setVideoFile(null)
}

const handleModalVideoChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith('video/')) {
    emit('error', 'File harus berupa format video (MP4, WebM)')
    event.target.value = ''
    return
  }
  setVideoFile(file)
  event.target.value = ''
}

// Video Review Modal State
const showVideoReviewModal = ref(false)
const reviewVideo = ref({
  url: '',
  title: '',
  type: ''
})
const videoPlayerRef = ref(null)

// Image Review Modal State
const showImageReviewModal = ref(false)
const reviewImage = ref({
  url: '',
  title: '',
  subtitle: ''
})

// Document Review Modal State (PDF)
const showDocReviewModal = ref(false)
const reviewDoc = ref({
  url: '',
  title: '',
  type: ''
})

// Autocomplete state for user tagging
const activeSearchIndex = ref(null)
const searchResults = ref([])
const searchLoading = ref(false)

// Form validation error highlights
const validationErrors = ref({})

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
  crew: [{ jabatan: '', anggota: [{ name: '', user_id: null }] }]
})

// Initialize form when initialData changes or on mount
watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.keys(form.value).forEach(key => {
      if (newData[key] !== undefined && newData[key] !== null) {
        if (key === 'crew') {
          if (Array.isArray(newData[key]) && newData[key].length > 0) {
            form.value.crew = newData[key].map(g => ({
              jabatan: g.jabatan || '',
              anggota: Array.isArray(g.anggota) ? g.anggota.map(m => {
                if (typeof m === 'object' && m !== null) {
                  return { name: m.name || '', user_id: m.user_id || null }
                }
                return { name: String(m), user_id: null }
              }) : [{ name: '', user_id: null }]
            }))
          } else if (!props.isEdit) {
            // Keep default
          } else {
            form.value.crew = [{ jabatan: '', anggota: [{ name: '', user_id: null }] }]
          }
        } else {
          form.value[key] = newData[key]
        }
      }
    })
    
    if (newData.category?.category_id) {
      form.value.category_id = newData.category.category_id
    }
  }
}, { immediate: true })

const handleFileUpload = async (event, fieldName) => {
  const file = event.target.files[0]
  if (!file) return

  // Validasi ukuran video
  const isVideo = file.type.startsWith('video/')
  if (isVideo) {
    activeVideoField.value = fieldName
    setVideoFile(file)
    showVideoUploadModal.value = true
    event.target.value = '' // Reset input
    return
  }
  
  const limit = 10 * 1024 * 1024 // 10MB for others

  if (file.size > limit) {
    emit('error', `Ukuran file terlalu besar (maksimal 10MB)`)
    event.target.value = '' 
    return
  }

  // Validasi tipe gambar
  if ((fieldName === 'gambar_poster' || fieldName === 'banner_url') && !file.type.startsWith('image/')) {
    emit('error', 'File harus berupa gambar (JPG, PNG, WebP)')
    event.target.value = ''
    return
  }
  
  // Validasi tipe PDF
  if ((fieldName === 'file_naskah' || fieldName === 'file_storyboard' || fieldName === 'file_rab') && file.type !== 'application/pdf') {
     emit('error', 'File dokumen harus berupa format PDF')
     event.target.value = ''
     return
  }

  uploading.value = true
  try {
    const url = await uploadFileTus(file, null, fieldName)
    
    if (url) {
      form.value[fieldName] = url
      if (validationErrors.value[fieldName]) {
        delete validationErrors.value[fieldName]
      }
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
  const limit = 1024 * 1024 * 1024 * 4 // 4GB

  if (file.size > limit) {
    emit('error', 'Ukuran video terlalu besar (maksimal 4GB)')
    showVideoUploadModal.value = false
    setVideoFile(null)
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
      showVideoUploadModal.value = false
      setVideoFile(null)
      if (validationErrors.value[activeVideoField.value]) {
        delete validationErrors.value[activeVideoField.value]
      }
    }
  } catch (err) {
    console.error('Upload failed:', err)
    emit('error', 'Gagal mengupload video: ' + (err.message || 'Server error'))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Open Video Review Modal
const openVideoReview = (videoUrl, typeName) => {
  if (!videoUrl) return
  reviewVideo.value = {
    url: videoUrl,
    title: form.value.judul ? `${form.value.judul} — ${typeName}` : `Pratinjau ${typeName}`,
    type: typeName
  }
  showVideoReviewModal.value = true
}

const closeVideoReview = () => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause()
  }
  showVideoReviewModal.value = false
  reviewVideo.value = { url: '', title: '', type: '' }
}

// Open Image Review Modal
const openImageReview = (imageUrl, title, subtitle) => {
  if (!imageUrl) return
  reviewImage.value = {
    url: imageUrl,
    title: title || 'Pratinjau Gambar',
    subtitle: subtitle || ''
  }
  showImageReviewModal.value = true
}

const closeImageReview = () => {
  showImageReviewModal.value = false
  reviewImage.value = { url: '', title: '', subtitle: '' }
}

// Open Document Review Modal
const openDocReview = (docUrl, title, typeName) => {
  if (!docUrl) return
  reviewDoc.value = {
    url: docUrl,
    title: form.value.judul ? `${title} — ${form.value.judul}` : title,
    type: typeName
  }
  showDocReviewModal.value = true
}

const closeDocReview = () => {
  showDocReviewModal.value = false
  reviewDoc.value = { url: '', title: '', type: '' }
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

// Autocomplete search functions
const searchContributors = async (crewIdx, memberIdx, query) => {
  if (!query || query.trim().length < 2) {
    searchResults.value = []
    return
  }
  
  activeSearchIndex.value = `${crewIdx}-${memberIdx}`
  searchLoading.value = true
  try {
    const res = await api.get('/api/users/search', { params: { q: query } })
    searchResults.value = res.data || []
  } catch (err) {
    console.error('Failed to search users:', err)
  } finally {
    searchLoading.value = false
  }
}

const selectUser = (crewIdx, memberIdx, user) => {
  form.value.crew[crewIdx].anggota[memberIdx] = {
    name: user.name,
    user_id: user.id
  }
  searchResults.value = []
  activeSearchIndex.value = null
}

const onMemberNameInput = (crewIdx, memberIdx) => {
  if (form.value.crew[crewIdx]?.anggota[memberIdx]) {
    form.value.crew[crewIdx].anggota[memberIdx].user_id = null
    const name = form.value.crew[crewIdx].anggota[memberIdx].name
    searchContributors(crewIdx, memberIdx, name)
  }
}

const closeDropdown = () => {
  setTimeout(() => {
    activeSearchIndex.value = null
    searchResults.value = []
  }, 200)
}

// Crew management
const addCrew = () => {
  form.value.crew.push({ jabatan: '', anggota: [{ name: '', user_id: null }] })
}

const removeCrew = (index) => {
  form.value.crew.splice(index, 1)
}

const addCrewMember = (crewIndex) => {
  form.value.crew[crewIndex].anggota.push({ name: '', user_id: null })
}

const removeCrewMember = (crewIndex, memberIndex) => {
  form.value.crew[crewIndex].anggota.splice(memberIndex, 1)
}

// Form validation & submit
const handleSubmit = () => {
  const errors = {}

  if (!form.value.judul || !form.value.judul.trim()) {
    errors.judul = 'Judul karya wajib diisi.'
  }

  if (!form.value.category_id) {
    errors.category_id = 'Kategori karya wajib dipilih.'
  }

  if (!form.value.sinopsis || !form.value.sinopsis.trim()) {
    errors.sinopsis = 'Sinopsis karya wajib diisi.'
  }

  if (!form.value.link_video_utama) {
    errors.link_video_utama = 'File Video Utama (MP4/WebM) wajib diunggah.'
  }

  if (!form.value.gambar_poster) {
    errors.gambar_poster = 'Gambar Poster film wajib diunggah.'
  }

  validationErrors.value = errors

  if (Object.keys(errors).length > 0) {
    const errorMessages = Object.values(errors).join(' ')
    emit('error', 'Mohon lengkapi kolom wajib: ' + errorMessages)
    return
  }

  emit('submit', form.value)
  clearDraft()
}

const restoreDraft = () => {
  const draft = loadDraft()
  if (draft) {
    Object.keys(form.value).forEach(key => {
      if (draft[key] !== undefined && draft[key] !== null) {
        if (key === 'crew') {
          if (Array.isArray(draft[key])) {
            form.value.crew = draft[key].map(g => ({
              jabatan: g.jabatan || '',
              anggota: Array.isArray(g.anggota) ? g.anggota.map(m => {
                if (typeof m === 'object' && m !== null) {
                  return { name: m.name || '', user_id: m.user_id || null }
                }
                return { name: String(m), user_id: null }
              }) : [{ name: '', user_id: null }]
            }))
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
  
  if (!props.isEdit && checkDraft()) {
    const d = loadDraft()
    if (d) {
      draftPreviewTitle.value = d.judul?.trim() ? d.judul : 'Tanpa Judul'
      showDraftBanner.value = true
    }
  }
  
  if (!props.isEdit) {
    stopAutoSave = createAutoSave(form, 3000)
  }
})

onUnmounted(() => {
  if (selectedVideoPreviewUrl.value) {
    URL.revokeObjectURL(selectedVideoPreviewUrl.value)
  }
  if (stopAutoSave) {
    stopAutoSave()
  }
})
</script>

<template>
  <div class="space-y-8">
    <!-- Draft Banner (Compact, Right-Aligned Actions, High-Contrast & Shows Previous Title) -->
    <div 
      v-if="showDraftBanner" 
      class="p-3 sm:px-4 sm:py-3 bg-amber-100/90 dark:bg-stone-850 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-300"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-7 h-7 bg-amber-400 text-stone-950 border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
          <RotateCcw class="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div class="min-w-0">
          <h3 class="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm flex items-center gap-1.5 truncate">
            <span>Draft Karya <strong class="text-amber-700 dark:text-amber-400">"{{ draftPreviewTitle }}"</strong> Ditemukan</span>
          </h3>
          <p class="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">
            Tersimpan otomatis {{ formatDraftTime() }}. Apakah Anda ingin memulihkannya?
          </p>
        </div>
      </div>

      <!-- Action Buttons Aligned on Right -->
      <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button 
          type="button" 
          size="sm" 
          variant="outline" 
          @click="discardDraft"
          class="border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-8 px-3 cursor-pointer shadow-brutal-xs hover:shadow-none"
        >
          Abaikan
        </Button>
        <Button 
          type="button" 
          size="sm" 
          @click="restoreDraft"
          class="bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 cursor-pointer h-8 px-3.5"
        >
          <RotateCcw class="w-3 h-3 stroke-[2.5]" />
          Pulihkan Draft
        </Button>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <div 
      v-if="!props.isEdit && hasDraft && !showDraftBanner" 
      class="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-3 py-1.5 border border-stone-300 dark:border-stone-700 w-fit"
    >
      <CheckCircle class="w-3.5 h-3.5 text-emerald-500" />
      <span>Auto-save aktif: Draft tersimpan {{ formatDraftTime() }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- 1. Basic Info (Wajib & Opsional) -->
      <Card 
        class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden"
        :class="{'ring-2 ring-red-500': validationErrors.judul || validationErrors.category_id || validationErrors.sinopsis}"
      >
        <div class="px-6 py-4 bg-stone-50 dark:bg-stone-800/60 border-b-2 border-black dark:border-stone-100 flex items-center justify-between">
          <h2 class="text-base md:text-lg font-bold uppercase tracking-wide flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
            <span class="w-7 h-7 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <Film class="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            Informasi Dasar Film
          </h2>
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 border border-stone-300 dark:border-stone-700">
            Bagian 1
          </span>
        </div>

        <CardContent class="p-6 md:p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Judul Karya (Wajib) -->
            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                  Judul Karya <span class="text-red-500 font-black">* (Wajib)</span>
                </label>
                <span v-if="validationErrors.judul" class="text-xs text-red-500 font-bold">
                  {{ validationErrors.judul }}
                </span>
              </div>
              <Input 
                v-model="form.judul" 
                placeholder="Masukkan judul karya film..." 
                class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs h-11 text-sm focus-visible:ring-0 focus:border-brand-teal"
                :class="{'border-red-500': validationErrors.judul}"
              />
            </div>

            <!-- Kategori (Wajib) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                  Kategori <span class="text-red-500 font-black">* (Wajib)</span>
                </label>
                <span v-if="validationErrors.category_id" class="text-xs text-red-500 font-bold">
                  {{ validationErrors.category_id }}
                </span>
              </div>
              <select 
                v-model="form.category_id"
                class="w-full h-11 px-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm shadow-brutal-xs focus:outline-none focus:border-brand-teal cursor-pointer"
                :class="{'border-red-500': validationErrors.category_id}"
              >
                <option value="" disabled class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">Pilih kategori film</option>
                <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                  {{ cat.nama_kategori }}
                </option>
              </select>
            </div>

            <!-- Tahun Karya (Opsional) -->
            <div>
              <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-2 text-stone-900 dark:text-stone-100">
                Tahun Karya <span class="text-stone-400 font-normal">(Opsional)</span>
              </label>
              <Input 
                v-model="form.tahun_karya" 
                type="number" 
                min="1900" 
                :max="new Date().getFullYear()" 
                class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs h-11 text-sm focus-visible:ring-0 focus:border-brand-teal" 
              />
            </div>

            <!-- Sinopsis (Wajib) -->
            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                  Sinopsis <span class="text-red-500 font-black">* (Wajib)</span>
                </label>
                <div class="flex items-center gap-3">
                  <span v-if="validationErrors.sinopsis" class="text-xs text-red-500 font-bold">
                    {{ validationErrors.sinopsis }}
                  </span>
                  <span 
                    class="text-xs font-mono font-bold"
                    :class="(form.sinopsis || '').length > 1000 ? 'text-red-500' : 'text-stone-500 dark:text-stone-400'"
                  >
                    {{ (form.sinopsis || '').length }} / 1000
                  </span>
                </div>
              </div>
              <textarea 
                v-model="form.sinopsis"
                rows="4"
                maxlength="1000"
                placeholder="Ceritakan ringkasan sinopsis jalan cerita film..."
                class="w-full p-3.5 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm shadow-brutal-xs resize-none focus:outline-none focus:border-brand-teal transition-colors font-body leading-relaxed"
                :class="{'border-red-500': validationErrors.sinopsis}"
              ></textarea>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 2. Link & Video Upload (Visual Video Thumbnail + In-Form Preview + Review Modal) -->
      <Card 
        class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden"
        :class="{'ring-2 ring-red-500': validationErrors.link_video_utama}"
      >
        <div class="px-6 py-4 bg-stone-50 dark:bg-stone-800/60 border-b-2 border-black dark:border-stone-100 flex items-center justify-between">
          <h2 class="text-base md:text-lg font-bold uppercase tracking-wide flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
            <span class="w-7 h-7 bg-brand-orange text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <Video class="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            File & Link Video Film
          </h2>
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 border border-stone-300 dark:border-stone-700">
            Bagian 2
          </span>
        </div>

        <CardContent class="p-6 md:p-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 2.1 Video Utama (WAJIB) -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                  Video Utama <span class="text-red-500 font-black">* (Wajib)</span>
                </label>
                <span v-if="validationErrors.link_video_utama" class="text-[11px] text-red-500 font-bold">
                  Wajib Diunggah
                </span>
              </div>

              <!-- Uploaded State Card with Real Video Frame Thumbnail & Play Button Overlay -->
              <div 
                v-if="form.link_video_utama" 
                class="p-3 bg-stone-50 dark:bg-stone-800/60 border-2 border-teal-600 dark:border-teal-400 shadow-brutal-xs space-y-2.5"
              >
                <!-- Video Thumbnail Container -->
                <div 
                  class="relative group aspect-video w-full bg-black border-2 border-black dark:border-stone-700 overflow-hidden cursor-pointer"
                  @click="openVideoReview(form.link_video_utama, 'Video Utama')"
                  title="Klik untuk memutar pratinjau video"
                >
                  <!-- Native Video Element to Render First Frame as Thumbnail -->
                  <video 
                    :src="assetUrl(form.link_video_utama)" 
                    preload="metadata" 
                    muted 
                    playsinline
                    class="w-full h-full object-cover pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
                  ></video>
                  
                  <!-- Thumbnail Gradient & Play Overlay (Matching Homepage Poster Style) -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <div class="flex items-center justify-between">
                      <span class="bg-teal-600 text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                        Video Utama
                      </span>
                    </div>

                    <!-- Center Play Icon Overlay (Matching Archive Card) -->
                    <div class="flex items-center justify-center my-auto">
                      <Play class="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                    </div>

                    <p class="text-[11px] font-bold text-white truncate drop-shadow">
                      {{ form.link_video_utama.split('/').pop() }}
                    </p>
                  </div>
                </div>

                <!-- Video Card Bottom Actions -->
                <div class="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    @click="openVideoReview(form.link_video_utama, 'Video Utama')"
                    class="flex-1 bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 h-9 cursor-pointer"
                  >
                    <Play class="w-3.5 h-3.5 fill-current" />
                    Review Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="$refs.videoUtamaInput.click()"
                    class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer"
                    :disabled="uploading"
                    title="Ganti Video"
                  >
                    <Upload class="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="form.link_video_utama = ''"
                    class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer transition-colors"
                    title="Hapus Video"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <!-- Unuploaded Trigger -->
              <div v-else>
                <Button 
                  type="button" 
                  variant="outline" 
                  class="w-full h-36 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex flex-col gap-2 hover:border-brand-teal hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  :class="{'border-red-500 bg-red-50/30': validationErrors.link_video_utama}"
                  @click="$refs.videoUtamaInput.click()"
                  :disabled="uploading"
                >
                  <div class="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950/60 text-brand-teal flex items-center justify-center">
                    <Upload class="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div class="text-center">
                    <span class="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                      Pilih Video Utama <span class="text-red-500">*</span>
                    </span>
                    <span class="block text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">MP4 / WebM • Maks 4GB</span>
                  </div>
                </Button>
              </div>
              <input 
                type="file" 
                ref="videoUtamaInput"
                accept="video/*"
                @change="(e) => handleFileUpload(e, 'link_video_utama')"
                class="hidden"
              />
            </div>

            <!-- 2.2 Video Trailer (Opsional) -->
            <div class="space-y-2.5">
              <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                Video Trailer <span class="text-stone-400 font-normal">(Opsional)</span>
              </label>

              <!-- Uploaded State Card with Real Video Frame Thumbnail -->
              <div 
                v-if="form.link_trailer" 
                class="p-3 bg-stone-50 dark:bg-stone-800/60 border-2 border-teal-600 dark:border-teal-400 shadow-brutal-xs space-y-2.5"
              >
                <div 
                  class="relative group aspect-video w-full bg-black border-2 border-black dark:border-stone-700 overflow-hidden cursor-pointer"
                  @click="openVideoReview(form.link_trailer, 'Video Trailer')"
                  title="Klik untuk memutar pratinjau trailer"
                >
                  <video 
                    :src="assetUrl(form.link_trailer)" 
                    preload="metadata" 
                    muted 
                    playsinline
                    class="w-full h-full object-cover pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
                  ></video>
                  
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <div class="flex items-center justify-between">
                      <span class="bg-teal-600 text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                        Trailer
                      </span>
                    </div>

                    <div class="flex items-center justify-center my-auto">
                      <Play class="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                    </div>

                    <p class="text-[11px] font-bold text-white truncate drop-shadow">
                      {{ form.link_trailer.split('/').pop() }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    @click="openVideoReview(form.link_trailer, 'Video Trailer')"
                    class="flex-1 bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 h-9 cursor-pointer"
                  >
                    <Play class="w-3.5 h-3.5 fill-current" />
                    Review Trailer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="$refs.trailerInput.click()"
                    class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer"
                    :disabled="uploading"
                    title="Ganti Trailer"
                  >
                    <Upload class="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="form.link_trailer = ''"
                    class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer transition-colors"
                    title="Hapus Trailer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <!-- Unuploaded Trigger -->
              <div v-else>
                <Button 
                  type="button" 
                  variant="outline" 
                  class="w-full h-36 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex flex-col gap-2 hover:border-brand-teal hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  @click="$refs.trailerInput.click()"
                  :disabled="uploading"
                >
                  <div class="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                    <Upload class="w-4 h-4" />
                  </div>
                  <div class="text-center">
                    <span class="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">Pilih Video Trailer</span>
                    <span class="block text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">MP4 / WebM • Maks 4GB</span>
                  </div>
                </Button>
              </div>
              <input 
                type="file" 
                ref="trailerInput"
                accept="video/*"
                @change="(e) => handleFileUpload(e, 'link_trailer')"
                class="hidden"
              />
            </div>

            <!-- 2.3 Video BTS (Opsional) -->
            <div class="space-y-2.5">
              <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                Video Behind The Scene <span class="text-stone-400 font-normal">(Opsional)</span>
              </label>

              <!-- Uploaded State Card with Real Video Frame Thumbnail -->
              <div 
                v-if="form.link_bts" 
                class="p-3 bg-stone-50 dark:bg-stone-800/60 border-2 border-teal-600 dark:border-teal-400 shadow-brutal-xs space-y-2.5"
              >
                <div 
                  class="relative group aspect-video w-full bg-black border-2 border-black dark:border-stone-700 overflow-hidden cursor-pointer"
                  @click="openVideoReview(form.link_bts, 'Video BTS')"
                  title="Klik untuk memutar pratinjau BTS"
                >
                  <video 
                    :src="assetUrl(form.link_bts)" 
                    preload="metadata" 
                    muted 
                    playsinline
                    class="w-full h-full object-cover pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
                  ></video>
                  
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                    <div class="flex items-center justify-between">
                      <span class="bg-teal-600 text-white text-[9px] font-mono font-bold uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                        BTS Film
                      </span>
                    </div>

                    <div class="flex items-center justify-center my-auto">
                      <Play class="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                    </div>

                    <p class="text-[11px] font-bold text-white truncate drop-shadow">
                      {{ form.link_bts.split('/').pop() }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    @click="openVideoReview(form.link_bts, 'Video BTS')"
                    class="flex-1 bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 h-9 cursor-pointer"
                  >
                    <Play class="w-3.5 h-3.5 fill-current" />
                    Review BTS
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="$refs.btsInput.click()"
                    class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer"
                    :disabled="uploading"
                    title="Ganti BTS"
                  >
                    <Upload class="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="form.link_bts = ''"
                    class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer transition-colors"
                    title="Hapus BTS"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <!-- Unuploaded Trigger -->
              <div v-else>
                <Button 
                  type="button" 
                  variant="outline" 
                  class="w-full h-36 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex flex-col gap-2 hover:border-brand-teal hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  @click="$refs.btsInput.click()"
                  :disabled="uploading"
                >
                  <div class="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                    <Upload class="w-4 h-4" />
                  </div>
                  <div class="text-center">
                    <span class="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">Pilih Video BTS</span>
                    <span class="block text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">MP4 / WebM • Maks 4GB</span>
                  </div>
                </Button>
              </div>
              <input 
                type="file" 
                ref="btsInput"
                accept="video/*"
                @change="(e) => handleFileUpload(e, 'link_bts')"
                class="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 3. Visual & Dokumen Pendukung (Poster Wajib + Modal Review Gambar & PDF) -->
      <Card 
        class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden"
        :class="{'ring-2 ring-red-500': validationErrors.gambar_poster}"
      >
        <div class="px-6 py-4 bg-stone-50 dark:bg-stone-800/60 border-b-2 border-black dark:border-stone-100 flex items-center justify-between">
          <h2 class="text-base md:text-lg font-bold uppercase tracking-wide flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
            <span class="w-7 h-7 bg-brand-yellow text-black border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <ImageIcon class="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            Visual Poster, Banner & Dokumen
          </h2>
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 border border-stone-300 dark:border-stone-700">
            Bagian 3
          </span>
        </div>

        <CardContent class="p-6 md:p-8 space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Kolom Kiri: Visual Gambar (Poster & Banner) -->
            <div class="space-y-6">
              <!-- 3.1 Gambar Poster (WAJIB) -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-mono uppercase tracking-wider font-bold text-stone-900 dark:text-stone-100">
                    Gambar Poster <span class="text-red-500 font-black">* (Wajib)</span>
                  </label>
                  <span v-if="validationErrors.gambar_poster" class="text-xs text-red-500 font-bold">
                    {{ validationErrors.gambar_poster }}
                  </span>
                </div>
                
                <!-- Poster Uploaded State with Full Preview & Review Modal Button -->
                <div 
                  v-if="form.gambar_poster" 
                  class="p-4 bg-stone-50 dark:bg-stone-800/50 border-2 border-black dark:border-stone-700 shadow-brutal-xs flex flex-col sm:flex-row items-center sm:items-start gap-4"
                >
                  <!-- Poster Thumbnail Frame -->
                  <div class="relative group w-32 h-48 bg-stone-200 dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-[2px_2px_0px_#000] overflow-hidden shrink-0">
                    <img 
                      :src="assetUrl(form.gambar_poster)" 
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      alt="Poster Film"
                    />
                    <button 
                      type="button"
                      @click="openImageReview(form.gambar_poster, 'Poster Film: ' + (form.judul || 'Karya Baru'), 'Rasio Vertikal Standar 2:3')"
                      class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer"
                      title="Lihat Ukuran Penuh"
                    >
                      <Eye class="w-6 h-6" />
                      <span class="text-[10px] font-mono uppercase font-bold tracking-wider">Perbesar</span>
                    </button>
                  </div>

                  <!-- Poster Details & Actions -->
                  <div class="flex-1 flex flex-col justify-between self-stretch space-y-3 text-center sm:text-left">
                    <div>
                      <div class="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                        <span class="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-400">Rasio Standar 2:3</span>
                      </div>
                      <p class="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        Poster film Anda telah siap. Klik tombol review untuk mengecek kejelasan visual sebelum disimpan.
                      </p>
                    </div>

                    <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                      <Button
                        type="button"
                        size="sm"
                        @click="openImageReview(form.gambar_poster, 'Poster Film: ' + (form.judul || 'Karya Baru'), 'Rasio Vertikal Standar 2:3')"
                        class="bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 h-9 cursor-pointer"
                      >
                        <Maximize2 class="w-3.5 h-3.5" />
                        Review Poster
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="$refs.posterInput.click()"
                        class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-9 px-3.5 shadow-brutal-xs hover:shadow-none cursor-pointer gap-1.5"
                        :disabled="uploading"
                      >
                        <Upload class="w-3.5 h-3.5" />
                        Ganti File
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="form.gambar_poster = ''"
                        class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer transition-colors"
                        title="Hapus Poster"
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- Poster Unuploaded Trigger -->
                <div v-else>
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full h-28 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex items-center justify-center gap-3 hover:border-brand-teal hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    :class="{'border-red-500 bg-red-50/30': validationErrors.gambar_poster}"
                    @click="$refs.posterInput.click()"
                    :disabled="uploading"
                  >
                    <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <ImageIcon class="w-5 h-5" />
                    </div>
                    <div class="text-left">
                      <span class="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        Pilih Gambar Poster <span class="text-red-500">*</span>
                      </span>
                      <span class="block text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">Format JPG, PNG, WebP • Maks. 10MB</span>
                    </div>
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref="posterInput"
                  accept="image/*"
                  @change="(e) => handleFileUpload(e, 'gambar_poster')"
                  class="hidden"
                />
              </div>

              <!-- 3.2 Gambar Banner (Opsional) -->
              <div>
                <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-2 text-stone-900 dark:text-stone-100">
                  Gambar Banner <span class="text-stone-400 font-normal">(Opsional - 16:9 Landscape)</span>
                </label>

                <!-- Banner Uploaded State with Full Preview & Review Modal Button -->
                <div 
                  v-if="form.banner_url" 
                  class="p-4 bg-stone-50 dark:bg-stone-800/50 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-3"
                >
                  <div class="relative group w-full h-40 bg-stone-200 dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-[2px_2px_0px_#000] overflow-hidden">
                    <img 
                      :src="assetUrl(form.banner_url)" 
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      alt="Banner Landscape"
                    />
                    <button 
                      type="button"
                      @click="openImageReview(form.banner_url, 'Banner Film: ' + (form.judul || 'Karya Baru'), 'Rasio Landscape 16:9')"
                      class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 cursor-pointer font-bold text-xs uppercase font-mono tracking-wider"
                      title="Lihat Ukuran Penuh"
                    >
                      <Eye class="w-5 h-5" />
                      <span>Review Ukuran Penuh</span>
                    </button>
                    <div class="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-mono px-2 py-0.5 uppercase border border-stone-600">
                      Landscape 16:9
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-2 pt-1 border-t border-stone-200 dark:border-stone-700">
                    <Button
                      type="button"
                      size="sm"
                      @click="openImageReview(form.banner_url, 'Banner Film: ' + (form.judul || 'Karya Baru'), 'Rasio Landscape 16:9')"
                      class="bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider border-2 border-black shadow-brutal-xs hover:shadow-none gap-1.5 h-9 cursor-pointer"
                    >
                      <Maximize2 class="w-3.5 h-3.5" />
                      Review Banner
                    </Button>
                    <div class="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="$refs.bannerInput.click()"
                        class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs uppercase tracking-wider h-9 px-3.5 shadow-brutal-xs hover:shadow-none cursor-pointer gap-1.5"
                        :disabled="uploading"
                      >
                        <Upload class="w-3.5 h-3.5" />
                        Ganti File
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        @click="form.banner_url = ''"
                        class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase tracking-wider h-9 px-3 shadow-brutal-xs hover:shadow-none cursor-pointer transition-colors"
                        title="Hapus Banner"
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- Banner Unuploaded Trigger -->
                <div v-else>
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full h-24 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex items-center justify-center gap-3 hover:border-brand-teal hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    @click="$refs.bannerInput.click()"
                    :disabled="uploading"
                  >
                    <div class="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                      <ImageIcon class="w-4 h-4" />
                    </div>
                    <div class="text-left">
                      <span class="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">Pilih Banner Landscape (16:9)</span>
                      <span class="block text-[10px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">Rekomendasi 1920x1080px • Maks. 10MB</span>
                    </div>
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref="bannerInput"
                  accept="image/*"
                  @change="(e) => handleFileUpload(e, 'banner_url')"
                  class="hidden"
                />
              </div>
            </div>

            <!-- Kolom Kanan: Dokumen PDF dengan Modal Review Dokumen -->
            <div class="space-y-4">
              <div class="pb-2 border-b border-stone-200 dark:border-stone-800">
                <h3 class="text-xs font-mono uppercase tracking-wider font-bold text-stone-800 dark:text-stone-200">
                  Dokumen Pendukung Produksi (PDF)
                </h3>
                <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Opsional: Lampirkan berkas akademik untuk kurator & arsip pembelajaran.
                </p>
              </div>

              <!-- Naskah -->
              <div>
                <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-1.5 text-stone-900 dark:text-stone-100">
                  File Naskah / Script (PDF)
                </label>
                
                <div v-if="form.file_naskah" class="p-3 bg-teal-50 dark:bg-teal-950/30 border-2 border-brand-teal flex items-center justify-between gap-2 shadow-brutal-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <FileText class="w-5 h-5 text-brand-teal shrink-0" />
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">{{ form.file_naskah.split('/').pop() }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openDocReview(form.file_naskah, 'Naskah Film', 'Naskah (Script)')"
                      class="bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase font-mono px-3 h-8.5 border-2 border-black shadow-brutal-xs hover:shadow-none cursor-pointer gap-1.5"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      Review
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="form.file_naskah = ''" 
                      class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase h-8.5 px-2.5 shadow-brutal-xs hover:shadow-none cursor-pointer" 
                      title="Hapus Naskah"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div v-else>
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full h-12 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex items-center justify-between px-4 hover:border-brand-teal hover:bg-teal-50/40 cursor-pointer shadow-brutal-xs"
                    @click="$refs.naskahInput.click()"
                    :disabled="uploading"
                  >
                    <div class="flex items-center gap-2">
                      <FileText class="w-4 h-4 text-stone-500" />
                      <span class="text-xs font-bold text-stone-800 dark:text-stone-200">Pilih File Naskah (PDF)</span>
                    </div>
                    <span class="text-[10px] font-mono text-stone-500">Maks 10MB</span>
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref="naskahInput"
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_naskah')"
                  class="hidden"
                />
              </div>

              <!-- Storyboard -->
              <div>
                <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-1.5 text-stone-900 dark:text-stone-100">
                  File Storyboard (PDF)
                </label>

                <div v-if="form.file_storyboard" class="p-3 bg-teal-50 dark:bg-teal-950/30 border-2 border-brand-teal flex items-center justify-between gap-2 shadow-brutal-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <FileText class="w-5 h-5 text-brand-teal shrink-0" />
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">{{ form.file_storyboard.split('/').pop() }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openDocReview(form.file_storyboard, 'Storyboard Film', 'Storyboard Visual')"
                      class="bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase font-mono px-3 h-8.5 border-2 border-black shadow-brutal-xs hover:shadow-none cursor-pointer gap-1.5"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      Review
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="form.file_storyboard = ''" 
                      class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase h-8.5 px-2.5 shadow-brutal-xs hover:shadow-none cursor-pointer" 
                      title="Hapus Storyboard"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div v-else>
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full h-12 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex items-center justify-between px-4 hover:border-brand-teal hover:bg-teal-50/40 cursor-pointer shadow-brutal-xs"
                    @click="$refs.storyboardInput.click()"
                    :disabled="uploading"
                  >
                    <div class="flex items-center gap-2">
                      <FileText class="w-4 h-4 text-stone-500" />
                      <span class="text-xs font-bold text-stone-800 dark:text-stone-200">Pilih File Storyboard (PDF)</span>
                    </div>
                    <span class="text-[10px] font-mono text-stone-500">Maks 10MB</span>
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref="storyboardInput"
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_storyboard')"
                  class="hidden"
                />
              </div>

              <!-- RAB -->
              <div>
                <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-1.5 text-stone-900 dark:text-stone-100">
                  File RAB / Anggaran Produksi (PDF)
                </label>

                <div v-if="form.file_rab" class="p-3 bg-teal-50 dark:bg-teal-950/30 border-2 border-brand-teal flex items-center justify-between gap-2 shadow-brutal-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <FileText class="w-5 h-5 text-brand-teal shrink-0" />
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">{{ form.file_rab.split('/').pop() }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      @click="openDocReview(form.file_rab, 'RAB Anggaran Film', 'Rancangan Anggaran Biaya')"
                      class="bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs uppercase font-mono px-3 h-8.5 border-2 border-black shadow-brutal-xs hover:shadow-none cursor-pointer gap-1.5"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      Review
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="form.file_rab = ''" 
                      class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-bold text-xs uppercase h-8.5 px-2.5 shadow-brutal-xs hover:shadow-none cursor-pointer" 
                      title="Hapus RAB"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div v-else>
                  <Button 
                    type="button" 
                    variant="outline" 
                    class="w-full h-12 border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-stone-100 flex items-center justify-between px-4 hover:border-brand-teal hover:bg-teal-50/40 cursor-pointer shadow-brutal-xs"
                    @click="$refs.rabInput.click()"
                    :disabled="uploading"
                  >
                    <div class="flex items-center gap-2">
                      <FileText class="w-4 h-4 text-stone-500" />
                      <span class="text-xs font-bold text-stone-800 dark:text-stone-200">Pilih File RAB (PDF)</span>
                    </div>
                    <span class="text-[10px] font-mono text-stone-500">Maks 10MB</span>
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref="rabInput"
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_rab')"
                  class="hidden"
                />
              </div>
            </div>
          </div>

          <!-- Informasi Tambahan (Rich Text Editor) -->
          <div class="pt-4 border-t-2 border-stone-100 dark:border-stone-800">
            <label class="block text-xs font-mono uppercase tracking-wider font-bold mb-2 text-stone-900 dark:text-stone-100">
              Informasi Tambahan <span class="text-stone-400 font-normal">(Backstory, Director Statement, Catatan Produksi)</span>
            </label>
            <RichTextEditor 
              v-model="form.deskripsi_lengkap"
              placeholder="Ceritakan sejarah pembuatan karya, statement sutradara, atau info menarik lainnya..."
            />
          </div>
        </CardContent>
      </Card>

      <!-- 4. Crew & Kontributor -->
      <Card class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden">
        <div class="px-6 py-4 bg-stone-50 dark:bg-stone-800/60 border-b-2 border-black dark:border-stone-100 flex items-center justify-between">
          <h2 class="text-base md:text-lg font-bold uppercase tracking-wide flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
            <span class="w-7 h-7 bg-brand-red text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-[1px_1px_0px_#000]">
              <User class="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            Crew & Kontributor Film
          </h2>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            @click="addCrew" 
            class="gap-1.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none font-bold uppercase tracking-wider text-xs cursor-pointer h-9 px-3"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" /> Tambah Jabatan
          </Button>
        </div>

        <CardContent class="p-6 md:p-8 space-y-6">
          <div 
            v-for="(crew, crewIdx) in form.crew" 
            :key="crewIdx" 
            class="p-5 bg-stone-50 dark:bg-stone-800/60 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <Input 
                  v-model="crew.jabatan" 
                  placeholder="Jabatan / Peran (cth: Sutradara, DOP, Editor, Penulis Naskah)"
                  class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs font-bold text-sm h-10 focus-visible:ring-0 focus:border-brand-teal"
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white shadow-brutal-xs hover:shadow-none cursor-pointer h-10 px-3 shrink-0"
                @click="removeCrew(crewIdx)"
                v-if="form.crew.length > 1"
                title="Hapus Jabatan Ini"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <div class="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-stone-300 dark:border-stone-700">
              <div 
                v-for="(member, memberIdx) in crew.anggota" 
                :key="memberIdx" 
                class="relative flex items-center gap-2"
              >
                <span class="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 w-5 shrink-0">
                  {{ memberIdx + 1 }}.
                </span>
                <div class="flex-1 relative">
                  <Input 
                    v-model="member.name" 
                    placeholder="Ketik nama anggota atau cari akun siswa/guru..."
                    class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 shadow-brutal-xs pr-24 text-sm h-10 focus-visible:ring-0 focus:border-brand-teal"
                    @focus="activeSearchIndex = `${crewIdx}-${memberIdx}`; searchContributors(crewIdx, memberIdx, member.name)"
                    @input="onMemberNameInput(crewIdx, memberIdx)"
                    @blur="closeDropdown"
                  />

                  <!-- Autocomplete suggestions dropdown -->
                  <div 
                    v-if="activeSearchIndex === `${crewIdx}-${memberIdx}` && (searchLoading || searchResults.length > 0)"
                    class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 z-50 shadow-brutal max-h-48 overflow-y-auto"
                  >
                    <div v-if="searchLoading" class="p-3 text-xs text-stone-500 dark:text-stone-400 italic">
                      Mencari akun terdaftar...
                    </div>
                    <div v-else class="divide-y divide-stone-100 dark:divide-stone-700">
                      <button
                        v-for="u in searchResults"
                        :key="u.id"
                        type="button"
                        @mousedown="selectUser(crewIdx, memberIdx, u)"
                        class="w-full text-left p-2.5 hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <div class="w-6 h-6 rounded-full border border-black dark:border-stone-700 overflow-hidden bg-brand-yellow shrink-0">
                          <img v-if="u.image" :src="assetUrl(u.image)" class="w-full h-full object-cover" />
                          <div v-else class="w-full h-full flex items-center justify-center text-[10px] text-black font-bold">
                            {{ u.name.charAt(0) }}
                          </div>
                        </div>
                        <span class="truncate">{{ u.name }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Tagged badge indicator -->
                  <span 
                    v-if="member.user_id" 
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 bg-brand-teal text-white text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000] pointer-events-none"
                    title="User Terdaftar di PF Space"
                  >
                    Akun Terhubung
                  </span>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  @click="removeCrewMember(crewIdx, memberIdx)"
                  v-if="crew.anggota.length > 1"
                  class="border-2 border-black dark:border-stone-700 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white shadow-brutal-xs hover:shadow-none cursor-pointer h-10 px-2.5 shrink-0"
                  title="Hapus Anggota Ini"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>

              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                @click="addCrewMember(crewIdx)"
                class="text-xs text-brand-teal hover:text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider hover:underline cursor-pointer pl-0 mt-1 flex items-center gap-1"
              >
                <Plus class="w-3.5 h-3.5" /> Tambah Nama Anggota
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Bottom Action Bar -->
      <div class="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          @click="$emit('cancel')" 
          class="border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none font-bold uppercase tracking-wider text-xs h-11 px-6 cursor-pointer"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          :disabled="loading || uploading" 
          class="gap-2 bg-stone-950 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] font-bold uppercase tracking-wider text-xs h-11 px-8 cursor-pointer transition-all"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Save v-if="isEdit" class="w-4 h-4 stroke-[2.5]" />
            <Send v-else class="w-4 h-4 stroke-[2.5]" />
          </template>
          {{ isEdit ? 'Simpan Perubahan' : 'Submit untuk Review' }}
        </Button>
      </div>
    </form>

    <!-- 1. Video Upload Modal with Progress & Live Preview (Compact, Non-Scrollable & Neo-Brutalist) -->
    <div v-if="showVideoUploadModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeVideoUploadModal"></div>
      <div class="relative w-full max-w-lg bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100 overflow-hidden">
        <!-- Modal Top Bar -->
        <div class="px-5 py-3.5 bg-stone-50 dark:bg-stone-800 border-b-2 border-black dark:border-stone-700 flex items-center justify-between text-stone-900 dark:text-stone-100">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 bg-brand-teal text-white flex items-center justify-center border-2 border-black dark:border-stone-100 shrink-0 shadow-[1px_1px_0px_#000]">
              <Video class="w-3.5 h-3.5" />
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-sm uppercase tracking-tight truncate">Upload File Video</h3>
              <p class="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-bold">
                {{ activeVideoField === 'link_video_utama' ? 'Video Utama (Wajib)' : activeVideoField === 'link_trailer' ? 'Video Trailer (Opsional)' : 'Video BTS (Opsional)' }}
              </p>
            </div>
          </div>
          <button 
            v-if="!uploading" 
            type="button"
            @click="closeVideoUploadModal" 
            class="p-1.5 bg-white dark:bg-stone-700 hover:bg-red-600 hover:text-white text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-600 transition-colors cursor-pointer shadow-brutal-xs hover:shadow-none"
            title="Tutup Modal (ESC)"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Modal Body (Compact, No Scroll) -->
        <div class="p-5 space-y-3.5">
          <!-- Video Local Preview (16:9 Compact Frame) -->
          <div class="relative aspect-video w-full bg-black border-2 border-black dark:border-stone-700 shadow-brutal-xs overflow-hidden">
            <video 
              v-if="selectedVideoPreviewUrl"
              :src="selectedVideoPreviewUrl" 
              controls 
              preload="metadata"
              playsinline
              class="w-full h-full object-contain"
            ></video>
            <div v-else class="w-full h-full flex items-center justify-center text-stone-500">
              <Film class="w-8 h-8 opacity-30" />
            </div>
          </div>

          <!-- Essential File Info Bar -->
          <div class="p-2.5 bg-stone-50 dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="bg-teal-600 text-white text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_#000] shrink-0">
                {{ selectedVideoFile?.name?.split('.').pop()?.toUpperCase() || 'MP4' }}
              </span>
              <span class="font-mono font-bold truncate text-stone-900 dark:text-stone-100 text-xs">
                {{ selectedVideoFile?.name }}
              </span>
              <span class="text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0 font-bold">
                • {{ (selectedVideoFile?.size / (1024 * 1024)).toFixed(2) }} MB
              </span>
            </div>
            <button 
              v-if="!uploading" 
              type="button" 
              @click="$refs.videoModalInput.click()" 
              class="shrink-0 text-brand-teal hover:underline text-[11px] font-bold font-mono uppercase cursor-pointer"
              title="Ganti Berkas Video"
            >
              Ganti
            </button>
          </div>
          <input 
            type="file" 
            ref="videoModalInput" 
            accept="video/*" 
            @change="handleModalVideoChange" 
            class="hidden" 
          />

          <!-- Uploading Progress Bar (Only shown when uploading) -->
          <div v-if="uploading" class="space-y-2 p-3 bg-teal-50/60 dark:bg-teal-950/30 border-2 border-brand-teal shadow-brutal-xs">
            <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
              <span class="text-brand-teal flex items-center gap-1.5">
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                Mengunggah Video...
              </span>
              <span class="text-stone-900 dark:text-stone-100 font-bold text-xs bg-white dark:bg-stone-800 px-2 py-0.5 border border-black dark:border-stone-600 shadow-brutal-xs">
                {{ uploadProgress }}%
              </span>
            </div>
            <div class="w-full h-3.5 bg-stone-200 dark:bg-stone-800 border-2 border-black dark:border-stone-100 overflow-hidden relative shadow-[1px_1px_0px_#000]">
              <div 
                class="h-full bg-brand-teal transition-all duration-300 ease-out"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400">
              <span>{{ ((selectedVideoFile?.size || 0) * uploadProgress / 100 / (1024 * 1024)).toFixed(2) }} MB / {{ ((selectedVideoFile?.size || 0) / (1024 * 1024)).toFixed(2) }} MB</span>
              <span>Chunked Streaming</span>
            </div>
          </div>
        </div>

        <!-- Modal Bottom Action Bar -->
        <div class="px-5 py-3.5 bg-stone-50 dark:bg-stone-800 border-t-2 border-black dark:border-stone-700 flex items-center justify-end gap-2.5">
          <Button 
            v-if="!uploading"
            type="button"
            variant="outline" 
            size="sm"
            class="border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none font-bold uppercase text-xs tracking-wider h-9 px-4 cursor-pointer"
            @click="closeVideoUploadModal"
          >
            Batal
          </Button>
          <Button 
            type="button"
            size="sm"
            class="bg-brand-teal hover:bg-teal-600 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-bold uppercase text-xs tracking-wider h-9 px-5 cursor-pointer gap-1.5 transition-all"
            @click="startVideoUpload"
            :disabled="uploading"
          >
            <Loader2 v-if="uploading" class="w-3.5 h-3.5 animate-spin" />
            <CloudUpload v-else class="w-3.5 h-3.5" />
            {{ uploading ? 'Mengunggah...' : 'Mulai Upload' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 2. Video Review Modal (Dual Dark/Light Mode Supported) -->
    <div v-if="showVideoReviewModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeVideoReview"></div>
      <div class="relative w-full max-w-4xl bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden animate-in fade-in zoom-in duration-200">
        <!-- Modal Top Bar -->
        <div class="p-4 bg-stone-50 dark:bg-stone-800 border-b-2 border-black dark:border-stone-700 flex items-center justify-between text-stone-900 dark:text-stone-100">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 bg-brand-teal text-white flex items-center justify-center border-2 border-black dark:border-stone-100 shrink-0 shadow-[1px_1px_0px_#000]">
              <Film class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-sm sm:text-base uppercase tracking-tight truncate">{{ reviewVideo.title }}</h3>
              <p class="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-bold">Pratinjau Pemutaran Video Langsung</p>
            </div>
          </div>
          <button 
            type="button" 
            @click="closeVideoReview"
            class="p-1.5 bg-white dark:bg-stone-700 hover:bg-red-600 hover:text-white text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-600 transition-colors cursor-pointer"
            title="Tutup Pratinjau (ESC)"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Video Player Container -->
        <div class="relative aspect-video w-full bg-black flex items-center justify-center">
          <video 
            ref="videoPlayerRef"
            controls 
            autoplay 
            playsinline
            class="w-full h-full object-contain"
            :src="assetUrl(reviewVideo.url)"
          >
            Browser Anda tidak mendukung pemutar video HTML5.
          </video>
        </div>

        <!-- Modal Bottom Bar -->
        <div class="p-4 bg-stone-50 dark:bg-stone-800 border-t-2 border-black dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-700 dark:text-stone-300">
          <div class="flex items-center gap-2 text-xs">
            <Volume2 class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Periksa kestabilan audio dan visual sebelum mengirim karya untuk kurasi.</span>
          </div>
          <Button 
            type="button" 
            size="sm" 
            @click="closeVideoReview"
            class="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs uppercase font-mono px-5 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-none cursor-pointer"
          >
            Tutup Pratinjau
          </Button>
        </div>
      </div>
    </div>

    <!-- 3. Image Review Modal (Poster & Banner - Dual Dark/Light Mode Supported) -->
    <div v-if="showImageReviewModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeImageReview"></div>
      <div class="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <!-- Header -->
        <div class="p-4 bg-stone-50 dark:bg-stone-800 border-b-2 border-black dark:border-stone-700 flex items-center justify-between text-stone-900 dark:text-stone-100 shrink-0">
          <div class="min-w-0">
            <h3 class="font-bold text-sm sm:text-base uppercase tracking-tight truncate">{{ reviewImage.title }}</h3>
            <p v-if="reviewImage.subtitle" class="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase mt-0.5">
              {{ reviewImage.subtitle }}
            </p>
          </div>
          <button 
            type="button" 
            @click="closeImageReview"
            class="p-1.5 bg-white dark:bg-stone-700 hover:bg-red-600 hover:text-white text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-600 transition-colors cursor-pointer"
            title="Tutup Pratinjau (ESC)"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Image Content (Scrollable & Responsive) -->
        <div class="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-stone-100 dark:bg-stone-950/80">
          <img 
            :src="assetUrl(reviewImage.url)" 
            class="max-w-full max-h-[65vh] object-contain border-2 border-black dark:border-stone-700 shadow-brutal-xs bg-white dark:bg-stone-900" 
            alt="Review Visual"
          />
        </div>

        <!-- Footer -->
        <div class="p-3.5 bg-stone-50 dark:bg-stone-800 border-t-2 border-black dark:border-stone-700 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 shrink-0">
          <span>Pratinjau resolusi asli berkas gambar yang terunggah.</span>
          <Button 
            type="button" 
            size="sm" 
            @click="closeImageReview"
            class="bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs uppercase font-mono px-4 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-none cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>

    <!-- 4. Document Review Modal (Naskah, Storyboard, RAB PDF Viewer - Dual Dark/Light Mode Supported) -->
    <div v-if="showDocReviewModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="closeDocReview"></div>
      <div class="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <!-- Header -->
        <div class="p-4 bg-stone-50 dark:bg-stone-800 border-b-2 border-black dark:border-stone-700 flex items-center justify-between text-stone-900 dark:text-stone-100 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 bg-brand-red text-white flex items-center justify-center border-2 border-black dark:border-stone-100 shrink-0 shadow-[1px_1px_0px_#000]">
              <FileText class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-sm sm:text-base uppercase tracking-tight truncate">{{ reviewDoc.title }}</h3>
              <p class="text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase font-bold">Pratinjau Dokumen PDF • {{ reviewDoc.type }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a 
              :href="assetUrl(reviewDoc.url)" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-900 dark:text-stone-100 text-xs font-bold font-mono uppercase border-2 border-black dark:border-stone-600 shadow-brutal-xs"
              title="Buka PDF di Tab Baru"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              Tab Baru
            </a>
            <button 
              type="button" 
              @click="closeDocReview"
              class="p-1.5 bg-white dark:bg-stone-700 hover:bg-red-600 hover:text-white text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-600 transition-colors cursor-pointer"
              title="Tutup Pratinjau (ESC)"
            >
              <X class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- PDF Embedded Viewer Body -->
        <div class="flex-1 w-full min-h-[50vh] sm:min-h-[65vh] bg-stone-100 dark:bg-stone-950 overflow-hidden relative">
          <iframe 
            :src="assetUrl(reviewDoc.url)" 
            class="w-full h-full border-0 bg-white" 
            title="Pratinjau Dokumen PDF"
          >
            <div class="p-8 text-center space-y-4">
              <p class="text-sm font-bold text-stone-800 dark:text-stone-200">Pratinjau PDF tidak didukung langsung oleh browser Anda.</p>
              <a 
                :href="assetUrl(reviewDoc.url)" 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white font-bold text-xs uppercase"
              >
                <Download class="w-4 h-4" /> Unduh / Buka Dokumen PDF
              </a>
            </div>
          </iframe>
        </div>

        <!-- Footer -->
        <div class="p-3.5 bg-stone-50 dark:bg-stone-800 border-t-2 border-black dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400 shrink-0">
          <span>Gunakan scroll untuk membaca seluruh isi dokumen PDF.</span>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <a 
              :href="assetUrl(reviewDoc.url)" 
              target="_blank" 
              download
              class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-900 dark:text-stone-100 text-xs font-bold font-mono uppercase border-2 border-black dark:border-stone-600"
            >
              <Download class="w-3.5 h-3.5" /> Unduh Berkas
            </a>
            <Button 
              type="button" 
              size="sm" 
              @click="closeDocReview"
              class="flex-1 sm:flex-none bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs uppercase font-mono px-4 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-none cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
