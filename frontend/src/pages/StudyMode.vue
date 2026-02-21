<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { 
  ArrowLeft, FileText, ImageIcon, Film, 
  Menu, X, ExternalLink, Star, Award, 
  FileSpreadsheet, MonitorPlay, ChevronRight,
  MessageSquare, CheckCircle2, AlertCircle, Loader2
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'
import VideoPlayer from '@/components/VideoPlayer.vue'

const route = useRoute()
const router = useRouter()
const { user, isAdmin, isModerator } = useAuth()
const { showToast } = useToast()
const filmSlug = route.params.slug

const film = ref(null)
const evaluation = ref(null)
const loading = ref(true)
const saving = ref(false)
const activeTab = ref('naskah') // 'naskah' | 'storyboard' | 'rab' | 'evaluation'
const showSidebar = ref(false)

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

const fetchFilm = async () => {
  loading.value = true
  try {
    const res = await api.get(`/api/films/${filmSlug}`)
    const f = res.data || {}
    // Convert paths to absolute URLs
    f.link_video_utama = assetUrl(f.link_video_utama)
    f.link_trailer = assetUrl(f.link_trailer)
    f.link_bts = assetUrl(f.link_bts)
    f.file_naskah = assetUrl(f.file_naskah)
    f.file_storyboard = assetUrl(f.file_storyboard)
    f.file_rab = assetUrl(f.file_rab)
    f.gambar_poster = assetUrl(f.gambar_poster)
    
    film.value = f
    
    // Auto-select tab
    if (f.file_naskah && f.file_naskah !== assetUrl(null)) activeTab.value = 'naskah'
    else if (f.file_storyboard && f.file_storyboard !== assetUrl(null)) activeTab.value = 'storyboard'
    else if (f.file_rab && f.file_rab !== assetUrl(null)) activeTab.value = 'rab'
    else if (isStaff.value || isOwner.value) activeTab.value = 'evaluation'

    // Fetch Evaluation if Staff or Owner
    if (isStaff.value || isOwner.value) {
      const evalRes = await api.get(`/api/evaluations/${f.film_id}`)
      if (evalRes.data) {
        evaluation.value = evalRes.data
        // Fill form if staff
        if (isStaff.value) {
          Object.assign(evalForm, evalRes.data)
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch film:", err)
    router.push('/')
  } finally {
    loading.value = false
  }
}

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
      </nav>

      <div class="p-6 border-t border-white/10 text-[10px] uppercase font-black tracking-widest text-stone-600 flex items-center gap-2">
        <Film class="w-3 h-3 text-brand-teal" /> <span>PF Space Archive</span>
      </div>
    </aside>

    <!-- 3. MAIN CONTENT -->
    <main v-if="!loading && film" class="flex-1 flex flex-col min-w-0 relative h-full">
      
      <!-- Video Player Section -->
      <section class="w-full bg-black flex flex-col border-b border-black lg:border-b-2 relative shrink-0 overflow-hidden z-20 min-h-[30vh] lg:h-[50vh]">
        <VideoPlayer
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

              <div class="flex justify-end pt-4 pb-12">
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
            <div v-else-if="isOwner" class="space-y-6">
              <div v-if="!evaluation" class="bg-white border-2 border-dashed border-stone-300 p-12 text-center rounded-2xl">
                <div class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 class="w-8 h-8 text-stone-300 animate-spin" />
                </div>
                <h3 class="text-xl font-display font-black text-stone-400 uppercase">Menunggu Review Kurator</h3>
                <p class="text-stone-400 text-sm max-w-sm mx-auto mt-2">Karya Anda telah masuk antrean penilaian. Kami akan memberikan notifikasi setelah kurator selesai memberikan feedback.</p>
              </div>

              <div v-else class="space-y-8">
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
                
                <div class="flex items-center justify-between p-4 bg-white border-2 border-black">
                  <div class="flex items-center gap-3">
                    <img v-if="evaluation.moderator?.image" :src="assetUrl(evaluation.moderator.image)" class="w-8 h-8 rounded-full border border-black" />
                    <span class="text-[10px] font-black uppercase text-stone-900">Dinilai oleh: {{ evaluation.moderator?.name || 'Moderator' }}</span>
                  </div>
                  <span class="text-[9px] font-bold text-stone-400 uppercase">PF Space Quality Assurance System</span>
                </div>
              </div>
            </div>
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
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
