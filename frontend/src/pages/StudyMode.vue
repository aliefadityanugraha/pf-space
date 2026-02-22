<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl, timeAgo } from '@/lib/format'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { 
  ArrowLeft, FileText, ImageIcon, Film, 
  Menu, X, ExternalLink, Star, Award, 
  FileSpreadsheet, MonitorPlay, ChevronRight,
  MessageSquare, CheckCircle2, AlertCircle, Loader2,
  StickyNote, Plus, PlayCircle, Trash, Pencil, Check,
  ListVideo, Clock
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const { user, isAdmin, isModerator } = useAuth()
const { showToast } = useToast()
const filmSlug = route.params.slug

const film = ref(null)
const evaluation = ref(null)
const loading = ref(true)
const saving = ref(false)
const activeTab = ref('naskah') // 'naskah' | 'storyboard' | 'rab' | 'evaluation' | 'notes' | 'scenes'
const showSidebar = ref(false)
const videoPlayer = ref(null)

// Notes State
const notes = ref([])
const newNote = ref('')
const loadingNotes = ref(false)
const addingNote = ref(false)

// Scenes State
const scenes = ref([])
const newSceneTitle = ref('')
const loadingScenes = ref(false)
const savingScenes = ref(false)
const editingSceneIndex = ref(null)
const editSceneTitle = ref('')

// Confirm Dialog State
const confirmState = reactive({
  show: false,
  title: '',
  message: '',
  loading: false,
  onConfirm: null
})

/**
 * Handles the confirmation logic when the 'Confirm' button is clicked in the dialog.
 * Executes the stored callback and manages the loading state.
 */
const handleConfirm = async () => {
  if (confirmState.onConfirm) {
    confirmState.loading = true
    try {
      await confirmState.onConfirm()
    } finally {
      confirmState.loading = false
      confirmState.show = false
    }
  }
}

/**
 * Opens the confirmation dialog with a specific title, message, and callback.
 * 
 * @param {string} title - The title of the dialog.
 * @param {string} message - The message body.
 * @param {Function} onConfirm - The function to execute on confirmation.
 */
const openConfirm = (title, message, onConfirm) => {
  confirmState.title = title
  confirmState.message = message
  confirmState.onConfirm = onConfirm
  confirmState.show = true
}

const isOwner = computed(() => film.value && user.value && film.value.user_id === user.value.id)
const isStaff = computed(() => isAdmin.value || isModerator.value)

// Evaluation Form State
const evalForm = reactive({
  script_score: 0,
  script_comment: '',
  cinematography_score: 0,
  cinematography_comment: '',
  editing_score: 0,
  editing_comment: '',
  production_score: 0,
  production_comment: '',
  overall_feedback: ''
})

const criteria = [
  { id: 'script', label: 'Naskah & Cerita', scoreKey: 'script_score', commentKey: 'script_comment' },
  { id: 'cinematography', label: 'Teknis & Sinematografi', scoreKey: 'cinematography_score', commentKey: 'cinematography_comment' },
  { id: 'editing', label: 'Editing & Ritme', scoreKey: 'editing_score', commentKey: 'editing_comment' },
  { id: 'production', label: 'Produksi & Dokumen', scoreKey: 'production_score', commentKey: 'production_comment' }
]

/**
 * Fetches the complete film data including associated files and evaluation.
 * Initializes the current active tab and triggers fetching for notes and scenes.
 */
const fetchFilm = async () => {
  loading.value = true
  try {
    const res = await api.get(`/api/films/${filmSlug}`)
    const f = res.data || {}
    
    // Normalize asset URLs for consistent display
    f.link_video_utama = assetUrl(f.link_video_utama)
    f.link_trailer = assetUrl(f.link_trailer)
    f.link_bts = assetUrl(f.link_bts)
    f.file_naskah = assetUrl(f.file_naskah)
    f.file_storyboard = assetUrl(f.file_storyboard)
    f.file_rab = assetUrl(f.file_rab)
    f.gambar_poster = assetUrl(f.gambar_poster)
    
    film.value = f
    
    // Determine the initial tab based on available production assets
    if (f.file_naskah && f.file_naskah !== assetUrl(null)) activeTab.value = 'naskah'
    else if (f.file_storyboard && f.file_storyboard !== assetUrl(null)) activeTab.value = 'storyboard'
    else if (f.file_rab && f.file_rab !== assetUrl(null)) activeTab.value = 'rab'
    else if (isStaff.value || isOwner.value) activeTab.value = 'evaluation'

    // Load evaluation if it was eager-loaded with the film
    if (f.evaluation) {
      evaluation.value = f.evaluation
      if (isStaff.value) {
        Object.assign(evalForm, f.evaluation)
      }
    }
    
    // Fetch related dynamic content
    if (f.film_id) {
       fetchNotes(f.film_id)
       fetchScenes(f.film_id)
    }
  } catch (err) {
    console.error("[StudyMode] Failed to fetch film:", err)
    router.push('/')
  } finally {
    loading.value = false
  }
}

/**
 * Fetches private study notes for the specific film.
 * @param {number} filmId - The ID of the film to fetch notes for.
 */
const fetchNotes = async (filmId) => {
  loadingNotes.value = true
  try {
    const res = await api.get(`/api/study-notes/${filmId}`)
    notes.value = res.data
  } catch (err) {
    console.error("[StudyMode] Failed to fetch notes:", err)
  } finally {
    loadingNotes.value = false
  }
}

/**
 * Creates a new timestamped study note.
 * Captures current video playback time and saves the content.
 */
const addNote = async () => {
  if (!newNote.value.trim() || !film.value) return
  
  addingNote.value = true
  try {
    const currentTime = videoPlayer.value?.getCurrentTime() || 0
    const res = await api.post(`/api/study-notes/${film.value.film_id}`, {
      content: newNote.value,
      timestamp: currentTime
    })
    
    notes.value.push(res.data)
    notes.value.sort((a, b) => a.timestamp - b.timestamp)
    newNote.value = ''
    showToast("Catatan waktu disimpan", "success")
  } catch (err) {
    showToast("Gagal menyimpan catatan", "error")
  } finally {
    addingNote.value = false
  }
}

/**
 * Fetches the scene breakdown (chapters) for the film.
 * @param {number} filmId - The film ID.
 */
const fetchScenes = async (filmId) => {
  loadingScenes.value = true
  try {
    const res = await api.get(`/api/film-scenes/${filmId}`)
    scenes.value = res.data
  } catch (err) {
    console.error("[StudyMode] Failed to fetch scenes:", err)
  } finally {
    loadingScenes.value = false
  }
}

/**
 * Marks a new scene at the current video playback time.
 * Triggers an immediate persistent sync with the backend.
 */
const addScene = async () => {
  if (!newSceneTitle.value.trim() || !film.value) return
  
  const currentTime = videoPlayer.value?.getCurrentTime() || 0
  const scene = {
    title: newSceneTitle.value,
    start_time: currentTime,
    film_id: film.value.film_id
  }
  
  // Optimistic update for responsive UI
  scenes.value = [...scenes.value, scene].sort((a, b) => a.start_time - b.start_time)
  newSceneTitle.value = ''

  syncScenes()
}

/**
 * Synchronizes the entire scene list with the backend.
 * Uses a bulk update approach to maintain chapter order.
 */
const syncScenes = async () => {
  if (!film.value) return
  savingScenes.value = true
  try {
    const res = await api.post(`/api/film-scenes/${film.value.film_id}`, 
      scenes.value.map(({ title, start_time, end_time, description }) => ({ 
        title, 
        start_time,
        end_time: end_time || null,
        description: description || null
      }))
    )
    scenes.value = res.data
    showToast("Struktur adegan diperbarui", "success")
  } catch (err) {
    const msg = err.data?.message || err.message || "Gagal menyimpan struktur adegan"
    showToast(msg, "error")
  } finally {
    savingScenes.value = false
  }
}

/**
 * Removes a scene from the list after confirmation.
 * @param {number} index - The index of the scene in the local reactive array.
 */
const removeScene = (index) => {
  openConfirm(
    'Hapus Adegan',
    `Apakah Anda yakin ingin menghapus adegan "${scenes.value[index].title}"?`,
    () => {
      scenes.value.splice(index, 1)
      syncScenes()
    }
  )
}

/**
 * Initiates the inline editing mode for a specific scene.
 * @param {number} index - Scene index.
 */
const startEditScene = (index) => {
  editingSceneIndex.value = index
  editSceneTitle.value = scenes.value[index].title
}

/**
 * Cancels the current inline scene editing.
 */
const cancelEditScene = () => {
  editingSceneIndex.value = null
  editSceneTitle.value = ''
}

/**
 * Persists the edited scene title and triggers a backend sync.
 */
const saveEditScene = () => {
  if (!editSceneTitle.value.trim() || editingSceneIndex.value === null) return
  
  scenes.value[editingSceneIndex.value].title = editSceneTitle.value.trim()
  editingSceneIndex.value = null
  editSceneTitle.value = ''
  syncScenes()
}

/**
 * Deletes a note permanently after user confirmation.
 * @param {number} id - Note ID.
 */
const deleteNote = async (id) => {
  openConfirm(
    'Hapus Catatan',
    'Catatan waktu ini akan dihapus secara permanen. Lanjutkan?',
    async () => {
      try {
        await api.delete(`/api/study-notes/${id}`)
        notes.value = notes.value.filter(n => n.note_id !== id)
        showToast("Catatan dihapus", "success")
      } catch (err) {
        showToast("Gagal menghapus catatan", "error")
      }
    }
  )
}

/**
 * Commands the video player to seek to a specific timestamp.
 * @param {number} timestamp - Time in seconds.
 */
const seekToNote = (timestamp) => {
  videoPlayer.value?.seekTo(timestamp)
}

/**
 * Formats seconds into a readable HH:MM:SS or MM:SS string.
 * @param {number} seconds - Duration in seconds.
 * @returns {string} Formatted time string.
 */
const formatTimestamp = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [
    h > 0 ? h : null,
    m.toString().padStart(h > 0 ? 2 : 1, '0'),
    s.toString().padStart(2, '0')
  ].filter(x => x !== null).join(':')
}

/**
 * Saves or updates a moderator's film evaluation.
 * Accessible only by Staff roles.
 */
const saveEvaluation = async () => {
  if (!film.value) return
  saving.value = true
  try {
    const res = await api.post(`/api/evaluations/${film.value.film_id}`, evalForm)
    evaluation.value = res.data
    showToast("Penilaian karya telah disimpan dan dikirim ke kreator.", "success")
  } catch (err) {
    showToast("Gagal menyimpan penilaian.", "error")
  } finally {
    saving.value = false
  }
}

const activeDocUrl = computed(() => {
  if (!film.value) return null
  switch (activeTab.value) {
    case 'naskah': return film.value.file_naskah;
    case 'storyboard': return film.value.file_storyboard;
    case 'rab': return film.value.file_rab;
    default: return null;
  }
})

const selectTab = (tab) => {
  activeTab.value = tab
  showSidebar.value = false
}

onMounted(() => {
  fetchFilm()
})

useHead({
  title: computed(() => film.value ? `Studi: ${film.value.judul} - PF Space` : 'Loading...')
})
</script>

<template>
  <div class="h-screen flex flex-col lg:flex-row bg-stone-950 text-white overflow-hidden">
    
    <!-- 1. MOBILE HEADER -->
    <header class="lg:hidden h-14 bg-stone-900 border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-50">
      <button @click="router.back()" class="p-2 hover:bg-white/5 rounded-full transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-sm font-bold truncate max-w-[200px]">{{ film?.judul || 'Mode Studi' }}</h1>
      <button @click="showSidebar = !showSidebar" class="p-2 hover:bg-white/5 rounded-full transition-colors text-brand-teal">
        <Menu v-if="!showSidebar" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>
    </header>

    <!-- 2. SIDEBAR NAVIGATION -->
    <aside 
      :class="[
        'fixed inset-y-0 left-0 w-72 bg-stone-900 border-r border-white/10 flex flex-col shrink-0 z-40 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div v-if="showSidebar" @click="showSidebar = false" class="lg:hidden fixed inset-0 bg-black/60 z-[-1]"></div>

      <div class="hidden lg:block p-6 border-b border-white/10">
        <button @click="router.back()" class="flex items-center text-sm text-white/50 hover:text-white transition-colors mb-6 group">
          <ArrowLeft class="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Kembali
        </button>
        <div v-if="film">
          <h1 class="font-display font-medium text-lg text-white leading-tight mb-2">{{ film.judul }}</h1>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-brand-teal/10 text-brand-teal border border-brand-teal/20 uppercase tracking-widest">Mode Studi</span>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-6 overflow-y-auto mt-14 lg:mt-0">
        <div>
          <div class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] px-3 mb-4">Aset Produksi</div>
          <div class="space-y-2">
            <button 
              v-if="film?.file_naskah" @click="selectTab('naskah')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
              :class="activeTab === 'naskah' ? 'bg-brand-teal border-black shadow-[4px_4px_0px_#000] text-white -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
            >
              <FileText class="w-4 h-4" /> <span class="flex-1 text-left">Naskah</span>
            </button>
            <button 
              v-if="film?.file_storyboard" @click="selectTab('storyboard')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
              :class="activeTab === 'storyboard' ? 'bg-brand-teal border-black shadow-[4px_4px_0px_#000] text-white -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
            >
              <ImageIcon class="w-4 h-4" /> <span class="flex-1 text-left">Storyboard</span>
            </button>
            <button 
              v-if="film?.file_rab" @click="selectTab('rab')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
              :class="activeTab === 'rab' ? 'bg-brand-teal border-black shadow-[4px_4px_0px_#000] text-white -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
            >
              <FileSpreadsheet class="w-4 h-4" /> <span class="flex-1 text-left">RAB</span>
            </button>
            <button 
              @click="selectTab('scenes')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
              :class="activeTab === 'scenes' ? 'bg-brand-teal border-black shadow-[4px_4px_0px_#000] text-white -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
            >
              <ListVideo class="w-4 h-4" /> <span class="flex-1 text-left">Struktur Adegan</span>
            </button>
          </div>
        </div>
        <div v-if="isStaff || isOwner">
          <div class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] px-3 mb-4">Evaluasi Kurator</div>
          <button 
            @click="selectTab('evaluation')"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
            :class="activeTab === 'evaluation' ? 'bg-orange-500 border-black shadow-[4px_4px_0px_#000] text-white -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
          >
            <Award class="w-4 h-4" /> 
            <span class="flex-1 text-left">Penilaian Karya</span>
            <div v-if="evaluation" class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          </button>
        </div>
        
        <div>
          <div class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] px-3 mb-4">Pengamatan Pribadi</div>
          <button 
            @click="selectTab('notes')"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2"
            :class="activeTab === 'notes' ? 'bg-amber-400 border-black shadow-[4px_4px_0px_#000] text-black -translate-y-0.5' : 'bg-stone-800/40 border-transparent text-stone-400 hover:bg-stone-800'"
          >
            <StickyNote class="w-4 h-4" /> 
            <span class="flex-1 text-left">Catatan Waktu</span>
            <Badge v-if="notes.length > 0" variant="outline" class="bg-white/10 text-white border-white/20 text-[10px]">{{ notes.length }}</Badge>
          </button>
        </div>
      </nav>
    </aside>

    <!-- 3. MAIN CONTENT -->
    <main v-if="!loading && film" class="flex-1 flex flex-col min-w-0 relative h-full">
      
      <!-- Video Player Section -->
      <section class="w-full bg-black flex flex-col border-b border-black lg:border-b-2 relative shrink-0 overflow-hidden z-20 min-h-[30vh] lg:h-[50vh]">
        <ErrorBoundary name="Pemutar Video">
          <VideoPlayer
            ref="videoPlayer"
            v-if="film.link_video_utama"
            :src="film.link_video_utama"
            :title="film.judul || 'Video'"
            :poster="film.gambar_poster || null"
            :storageKey="film?.film_id ? `study-${film.film_id}` : (film?.slug ? `study-${film.slug}` : '')"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-600 gap-4">
            <MonitorPlay class="w-16 h-16 opacity-10" />
            <span class="text-xs uppercase font-black tracking-widest">Video tidak tersedia</span>
          </div>
        </ErrorBoundary>
      </section>

      <!-- Viewer Section -->
      <section class="flex-1 w-full bg-stone-100 relative flex flex-col min-h-0 overflow-hidden">
        
        <!-- Tab: Evaluation -->
        <div v-if="activeTab === 'evaluation'" class="flex-1 overflow-y-auto bg-stone-50 p-4 md:p-8 no-scrollbar">
          <div class="w-full space-y-8 pb-12">
            
            <!-- HEADER EVALUATION -->
            <div class="flex items-center justify-between border-b-4 border-black pb-4">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-orange-500 border-2 border-black shadow-brutal-sm flex items-center justify-center">
                  <Award class="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 class="text-2xl font-display font-black text-stone-900 uppercase">Evaluasi & Feedback</h2>
                  <p class="text-stone-500 text-xs font-bold uppercase tracking-wider">Khusus Moderator & Pemilik Karya</p>
                </div>
              </div>

              <!-- STATUS BADGE -->
              <div class="hidden md:block">
                <div v-if="evaluation" class="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500 border-2 border-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#000]">
                  <CheckCircle2 class="w-4 h-4" /> Karya Telah Dinilai
                </div>
                <div v-else class="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500 border-2 border-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#000]">
                  <AlertCircle class="w-4 h-4" /> Menunggu Penilaian
                </div>
              </div>
            </div>

            <!-- Mobile Only Status Badge -->
            <div class="md:hidden flex justify-start">
              <div v-if="evaluation" class="inline-flex items-center gap-2 px-3 py-1 bg-green-500 border-2 border-black text-white text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#000]">
                <CheckCircle2 class="w-3 h-3" /> Telah Dinilai
              </div>
              <div v-else class="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 border-2 border-black text-white text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#000]">
                <AlertCircle class="w-3 h-3" /> Belum Dinilai
              </div>
            </div>

            <!-- IF STAFF: EDIT MODE -->
            <div v-if="isStaff" class="space-y-6">
              <!-- Added metadata for Staff view at TOP -->
              <div v-if="evaluation" class="flex flex-col md:flex-row items-center justify-between p-4 bg-orange-50 border-2 border-stone-200 gap-4 mb-6">
                <div class="flex items-center gap-3">
                  <img v-if="evaluation.moderator?.image" :src="assetUrl(evaluation.moderator.image)" class="w-10 h-10 rounded-full border-2 border-black object-cover" />
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase text-stone-900 leading-none mb-1">Kurator Terakhir:</span>
                    <span class="text-xs font-bold text-orange-600 uppercase tracking-widest">{{ evaluation.moderator?.name || 'Moderator' }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-[9px] font-black uppercase text-stone-400 mb-1">Terakhir Diperbarui:</span>
                  <span class="text-[10px] font-bold text-stone-600">{{ new Date(evaluation.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB</span>
                </div>
              </div>

              <div class="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-xs text-blue-700 font-medium leading-relaxed">
                  Anda sedang dalam mode <strong>Moderator</strong>. Berikan penilaian objektif (1-10) dan feedback spesifik untuk setiap kategori aset yang tersedia.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-for="item in criteria" :key="item.id" class="bg-white border-2 border-black p-4 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  <div class="flex justify-between items-center mb-4">
                    <label class="text-sm font-black uppercase text-stone-900">{{ item.label }}</label>
                    <div class="flex items-center gap-2">
                       <input 
                        type="number" min="0" max="10" 
                        v-model.number="evalForm[item.scoreKey]"
                        class="w-12 h-8 border-2 border-black text-center font-black text-brand-teal focus:outline-none bg-white"
                      />
                      <span class="text-[10px] font-bold text-stone-400">/10</span>
                    </div>
                  </div>
                  <textarea 
                    v-model="evalForm[item.commentKey]"
                    placeholder="Tulis masukan spesifik..."
                    class="w-full h-24 border-2 border-black p-2 text-xs font-medium focus:outline-none resize-none bg-stone-50 text-stone-900 placeholder:text-stone-400"
                  ></textarea>
                </div>
              </div>

              <div class="bg-white border-4 border-black p-6 shadow-brutal-md">
                <label class="block text-sm font-black uppercase text-stone-900 mb-3">Kesimpulan & Arahan Pengembangan</label>
                <textarea 
                  v-model="evalForm.overall_feedback"
                  placeholder="Ceritakan apa yang bisa ditingkatkan secara keseluruhan..."
                  class="w-full h-32 border-2 border-black p-4 text-sm font-medium focus:outline-none bg-stone-50 text-stone-900 placeholder:text-stone-400"
                ></textarea>
              </div>

              <div class="flex justify-end pt-4">
                <Button 
                  @click="saveEvaluation" 
                  :disabled="saving"
                  class="bg-brand-teal hover:bg-brand-teal/90 text-white border-2 border-stone-900 shadow-brutal px-6 py-2 rounded-none font-display font-black text-lg h-auto flex justify-center items-center gap-2"
                >
                  <Loader2 v-if="saving" class="w-5 h-5 animate-spin" />
                  <CheckCircle2 v-else class="w-5 h-5" />
                  Publikasi Nilai
                </Button>
              </div>
            </div>

            <!-- IF OWNER: VIEW MODE -->
            <ErrorBoundary name="Detail Evaluasi" v-else-if="isOwner">
              <div v-if="!evaluation" class="bg-white border-2 border-dashed border-stone-300 p-12 text-center rounded-2xl">
                <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 class="w-8 h-8 text-stone-300 animate-spin" />
                </div>
                <h3 class="text-xl font-display font-black text-stone-400 uppercase">Menunggu Review Kurator</h3>
                <p class="text-stone-400 text-sm max-w-sm mx-auto mt-2">Karya Anda telah masuk antrean penilaian. Kami akan memberikan notifikasi setelah kurator selesai memberikan feedback.</p>
              </div>

              <div v-else class="space-y-8">
                <!-- Added metadata for Owner view at TOP -->
                <div class="flex flex-col md:flex-row items-center justify-between p-4 bg-white border-2 border-black gap-4 shadow-brutal-sm">
                  <div class="flex items-center gap-3">
                    <img v-if="evaluation.moderator?.image" :src="assetUrl(evaluation.moderator.image)" class="w-10 h-10 rounded-full border-2 border-black object-cover" />
                    <div class="flex flex-col">
                      <span class="text-[10px] font-black uppercase text-stone-900 leading-none mb-1">Kurator Penilai:</span>
                      <span class="text-xs font-bold text-brand-teal uppercase tracking-widest">{{ evaluation.moderator?.name || 'Moderator' }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-[9px] font-black uppercase text-stone-400 mb-1">Waktu Penilaian:</span>
                    <span class="text-[10px] font-bold text-stone-600">{{ new Date(evaluation.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} WIB</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div v-for="item in criteria" :key="item.id" class="bg-white border-2 border-black p-6 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-2 bg-stone-100 border-l-2 border-b-2 border-black font-black text-xl text-brand-teal">
                       {{ evaluation[item.scoreKey] }}<span class="text-[10px] text-stone-400 font-bold ml-0.5">/10</span>
                     </div>
                     <h4 class="text-xs font-black uppercase text-stone-400 mb-4">{{ item.label }}</h4>
                     <p v-if="evaluation[item.commentKey]" class="text-sm font-medium text-stone-800 leading-relaxed italic border-l-4 border-orange-400 pl-4 py-1">
                       "{{ evaluation[item.commentKey] }}"
                     </p>
                     <p v-else class="text-xs text-stone-400 italic">Tidak ada catatan spesifik.</p>
                   </div>
                </div>

                <div class="bg-stone-900 text-white border-4 border-black p-8 shadow-brutal-lg">
                  <div class="flex items-center gap-3 mb-6">
                    <Award class="w-6 h-6 text-orange-400" />
                    <h3 class="text-xl font-display font-black uppercase tracking-wider">Kesimpulan Kurator</h3>
                  </div>
                  <p class="text-lg font-medium leading-relaxed text-stone-300">
                    {{ evaluation.overall_feedback || 'Belum ada umpan balik keseluruhan.' }}
                  </p>
                </div>
              </div>
            </ErrorBoundary>
          </div>
        </div>

        <!-- Tab: Notes -->
        <div v-else-if="activeTab === 'notes'" class="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
           <!-- Header Notes -->
           <div class="p-4 md:p-6 border-b-2 border-black bg-white flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                 <div class="w-10 h-10 bg-amber-400 border-2 border-black shadow-brutal-xs flex items-center justify-center">
                    <StickyNote class="w-5 h-5 text-black" />
                 </div>
                 <div>
                    <h2 class="font-black uppercase text-sm md:text-base leading-none">Catatan Waktu</h2>
                    <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-1">Tautkan analisis Anda pada menit tertentu</p>
                 </div>
              </div>
           </div>

           <!-- Add Note Form -->
           <div class="p-4 md:p-6 bg-white border-b-2 border-black shrink-0">
             <div class="flex gap-3">
                <div class="flex-1 relative">
                   <textarea 
                     v-model="newNote"
                     @keydown.enter.exact.prevent="addNote"
                     placeholder="Tulis pengamatan di menit ini..."
                     class="w-full border-2 border-black p-3 text-xs font-medium focus:outline-none bg-stone-50 resize-none h-20 text-stone-900"
                   ></textarea>
                   <div class="absolute bottom-2 right-2 text-[10px] font-black text-stone-300 uppercase">
                      Tekan Enter untuk Simpan
                   </div>
                </div>
                <button 
                  @click="addNote"
                  :disabled="addingNote || !newNote.trim()"
                  class="bg-brand-teal text-white border-2 border-black shadow-brutal-xs px-4 h-20 flex flex-col items-center justify-center gap-1 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                >
                   <Plus class="w-5 h-5" />
                   <span class="text-[9px] font-black uppercase">Simpan</span>
                </button>
             </div>
           </div>

           <!-- Notes List -->
           <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar pb-10">
              <div v-if="loadingNotes" class="flex flex-col items-center justify-center py-10 opacity-20">
                 <Loader2 class="w-8 h-8 animate-spin" />
              </div>
              <div v-else-if="notes.length === 0" class="text-center py-10 opacity-30">
                 <StickyNote class="w-12 h-12 mx-auto mb-3" />
                 <p class="text-xs font-black uppercase tracking-widest">Belum ada catatan waktu</p>
              </div>
              <template v-else>
                 <div 
                   v-for="note in notes" 
                   :key="note.note_id"
                   class="bg-white border-2 border-black p-4 shadow-brutal-xs hover:shadow-none hover:translate-x-[2px] transition-all group"
                 >
                    <div class="flex items-start justify-between gap-4">
                       <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2">
                             <button 
                               @click="seekToNote(note.timestamp)"
                               class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-stone-900 border border-black text-brand-teal text-[10px] font-black rounded hover:bg-black transition-colors"
                             >
                                <PlayCircle class="w-3 h-3" />
                                {{ formatTimestamp(note.timestamp) }}
                             </button>
                             <span class="text-[9px] font-bold text-stone-300 uppercase">{{ timeAgo(note.created_at) }}</span>
                          </div>
                          <p class="text-sm font-medium text-stone-800 leading-relaxed">{{ note.content }}</p>
                       </div>
                       <button 
                         @click="deleteNote(note.note_id)"
                         class="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                          <Trash class="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </template>
           </div>
        </div>

        <!-- Tab: Scenes -->
        <div v-else-if="activeTab === 'scenes'" class="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
           <div class="p-4 md:p-6 border-b-2 border-black bg-white flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                 <div class="w-10 h-10 bg-brand-teal border-2 border-black shadow-brutal-xs flex items-center justify-center">
                    <ListVideo class="w-5 h-5 text-white" />
                 </div>
                 <div>
                    <h2 class="font-black uppercase text-sm md:text-base leading-none">Struktur Adegan</h2>
                    <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-1">Daftar Bab & Segmentasi Cerita</p>
                 </div>
              </div>
           </div>

           <!-- Add Scene (Only Owner/Staff) -->
           <div v-if="isOwner || isStaff" class="p-4 md:p-6 bg-white border-b-2 border-black shrink-0">
              <div class="flex gap-3">
                 <div class="flex-1 relative">
                    <input 
                      v-model="newSceneTitle"
                      @keydown.enter="addScene"
                      placeholder="Judul adegan/bab baru..."
                      class="w-full border-2 border-black p-3 text-sm font-bold focus:outline-none bg-stone-50 h-12 text-stone-900"
                    />
                 </div>
                 <button 
                   @click="addScene"
                   :disabled="savingScenes || !newSceneTitle.trim()"
                   class="bg-black text-white px-4 h-12 flex items-center justify-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50"
                 >
                    <Plus class="w-4 h-4" />
                    <span class="text-[10px] font-black uppercase">Tanda Adegan</span>
                 </button>
              </div>
              <p class="text-[9px] text-stone-400 font-bold uppercase mt-2">Adegan akan ditandai pada menit video saat ini.</p>
           </div>

           <!-- Scenes List -->
           <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar pb-10">
              <div v-if="loadingScenes" class="flex flex-col items-center justify-center py-10 opacity-20">
                 <Loader2 class="w-8 h-8 animate-spin" />
              </div>
              <div v-else-if="scenes.length === 0" class="text-center py-10 opacity-30">
                 <ListVideo class="w-12 h-12 mx-auto mb-3" />
                 <p class="text-xs font-black uppercase tracking-widest">Belum ada struktur adegan</p>
              </div>
              <template v-else>
                 <div 
                   v-for="(scene, index) in scenes" 
                   :key="index"
                   class="group flex items-center justify-between p-3 bg-white border-2 border-black hover:bg-stone-50 transition-all cursor-pointer shadow-brutal-xs hover:shadow-none translate-x-0 hover:translate-x-1"
                   @click="seekToNote(scene.start_time)"
                 >
                    <div class="flex items-center gap-4">
                       <div class="flex items-center gap-1.5 px-2 py-1 bg-stone-100 border border-black rounded text-[10px] font-black text-stone-800">
                         <Clock class="w-3 h-3 text-stone-800" />
                         {{ formatTimestamp(scene.start_time) }}
                       </div>
                       <input 
                         v-if="editingSceneIndex === index"
                         v-model="editSceneTitle"
                         @click.stop
                         @keydown.enter="saveEditScene"
                         @keydown.esc="cancelEditScene"
                         class="flex-1 border-b-2 border-brand-teal focus:outline-none bg-transparent text-sm font-black text-stone-900 uppercase py-0.5"
                         autofocus
                       />
                       <span v-else class="text-sm font-black text-stone-900 uppercase truncate max-w-[200px] md:max-w-md">{{ scene.title }}</span>
                    </div>
                    
                    <div class="flex items-center gap-1 ml-4 shrink-0">
                       <template v-if="editingSceneIndex === index">
                          <button @click.stop="saveEditScene" class="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded transition-colors">
                             <Check class="w-4 h-4" />
                          </button>
                          <button @click.stop="cancelEditScene" class="p-1.5 text-stone-400 hover:bg-stone-100 rounded transition-colors">
                             <X class="w-4 h-4" />
                          </button>
                       </template>
                       <template v-else-if="isOwner || isStaff">
                          <button 
                            @click.stop="startEditScene(index)"
                            class="p-1.5 text-stone-300 hover:text-brand-teal transition-colors opacity-0 group-hover:opacity-100"
                          >
                             <Pencil class="w-3.5 h-3.5" />
                          </button>
                          <button 
                            @click.stop="removeScene(index)"
                            class="p-1.5 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                             <Trash class="w-3.5 h-3.5" />
                          </button>
                       </template>
                       <ChevronRight v-else class="w-4 h-4 text-stone-200" />
                    </div>
                 </div>
              </template>
           </div>
        </div>

        <!-- Tab: Documents (Naskah/Storyboard/RAB) -->
        <div v-else class="flex-1 w-full h-full bg-stone-200 relative">
          <div class="lg:hidden absolute top-3 left-3 z-30 pointer-events-none">
            <div class="bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[9px] font-black uppercase text-brand-teal tracking-tighter">
              {{ activeTab }}
            </div>
          </div>
          <iframe 
            v-if="activeDocUrl"
            :src="activeDocUrl + '#view=FitH&scrollbar=0&toolbar=0&navpanes=0'"
            class="absolute inset-0 w-full h-full border-0"
            frameborder="0"
          ></iframe>
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div class="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6 animate-bounce">
              <FileText class="w-10 h-10 text-stone-300" />
            </div>
            <h3 class="font-display font-bold text-stone-900 text-xl mb-2">Pilih Dokumen Produksi</h3>
            <p class="text-sm text-stone-500 max-w-xs mx-auto font-body">Pilih salah satu dokumen di menu untuk mulai menganalisis teknik produksi film ini.</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Loading State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-6 bg-stone-950">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 border-4 border-white/10 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-t-brand-teal rounded-full animate-spin"></div>
      </div>
      <p class="text-xs font-black uppercase tracking-[0.3em] text-stone-400 animate-pulse">Menyiapkan Ruang Studi...</p>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      v-model:show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :loading="confirmState.loading"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
