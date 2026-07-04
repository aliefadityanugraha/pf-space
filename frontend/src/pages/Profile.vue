<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useNotifications } from '@/composables/useNotifications'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import PageLayout from '@/components/PageLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  User, Mail, Eye, EyeOff, Camera, Save, 
  Loader2, ThumbsUp, MessageCircle, Film as FilmIcon, Upload,
  LayoutDashboard, Settings, MapPin, Globe, Instagram, Linkedin,
  Award, FileText, Star, MessageSquare
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

const router = useRouter()
const { user, refreshUser, initialized, isLoggedIn, isCreator } = useAuth()
const { showToast } = useToast()
const { fetchNotifications } = useNotifications()
const fileInput = ref(null)
const imageError = ref(false)

const userImageUrl = computed(() => assetUrl(user.value?.image || ''))

// Tabs State
const activeTab = ref('dashboard') // 'dashboard' | 'settings'

// Redirect if not logged in
watch([initialized, isLoggedIn], ([init, loggedIn]) => {
  if (init && !loggedIn) {
    router.push('/auth/login')
  }
}, { immediate: true })

// Setup head
useHead({
  title: () => user.value ? `Profil: ${user.value.name} - PF Space` : 'Profil Saya - PF Space'
})

// --- SETTINGS FORM STATE ---
const editName = ref('')
const editBio = ref('')
const editWebsite = ref('')
const editLocation = ref('')
const editInstagram = ref('')
const editLinkedin = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const savingProfile = ref(false)
const savingPassword = ref(false)

// Initialize form when user loads
watch(user, (newUser) => {
  if (newUser) {
    editName.value = newUser.name || ''
    editBio.value = newUser.bio || ''
    editWebsite.value = newUser.website || ''
    editLocation.value = newUser.location || ''
    editInstagram.value = newUser.instagram || ''
    editLinkedin.value = newUser.linkedin || ''
  }
}, { immediate: true })

const roleName = computed(() => user.value?.role?.name || 'user')
const joinDate = computed(() => {
  if (!user.value?.created_at) return 'Unknown'
  return new Date(user.value.created_at).toLocaleDateString('id-ID', { 
    month: 'long', 
    year: 'numeric' 
  })
})

const selectedFile = ref(null)
const previewImage = ref(null)

// --- DASHBOARD STATE ---
const dashboardLoading = ref(true)
const dashboardError = ref('')
const films = ref([])
const summary = ref({
  totalFilms: 0,
  pending: 0,
  published: 0,
  rejected: 0,
  totalVotes: 0,
  totalComments: 0
})
const badges = ref([])

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-900 border-yellow-900',
  published: 'bg-brand-teal text-white border-black',
  rejected: 'bg-brand-red text-white border-black'
}

const statusLabels = {
  pending: 'Menunggu Review',
  published: 'Dipublikasi',
  rejected: 'Ditolak'
}

// Fetch Dashboard Data
const fetchDashboardData = async () => {
  dashboardLoading.value = true
  dashboardError.value = ''
  try {
    // 1. Fetch Summary Stats (One Query)
    const statsRes = await api.get('/api/films/my-stats')
    summary.value = {
      totalFilms: statsRes.data.totalFilms || 0,
      pending: statsRes.data.pending || 0,
      published: statsRes.data.published || 0,
      rejected: statsRes.data.rejected || 0,
      totalVotes: statsRes.data.totalVotes || 0,
      totalComments: statsRes.data.totalComments || 0
    }
    badges.value = statsRes.data.badges || []

    // 2. Fetch Recent Films (For the list)
    const myFilmsRes = await api.get('/api/films/my-films', {
      params: { page: 1, limit: 10 }
    })
    const myFilms = Array.isArray(myFilmsRes.data) ? myFilmsRes.data : []

    // We still want basic vote/comment count for the recent list items
    // If they aren't in the film object, we might still need them, 
    // but the summary is now efficient.
    // Let's check if the film object already has these (usually it should if joined in backend)
    // For now, keep the list simple or we can join them in getMyFilms later.
    films.value = myFilms.map(f => ({
      ...f,
      gambar_poster: assetUrl(f.gambar_poster)
    }))

  } catch (err) {
    dashboardError.value = 'Gagal memuat data dashboard.'
    console.error(err)
  } finally {
    dashboardLoading.value = false
  }
}

// --- ACTIONS ---

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target.result
      imageError.value = false
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  if (!editName.value.trim()) {
    showToast('Nama tidak boleh kosong', 'error')
    return
  }
  
  savingProfile.value = true
  
  try {
    const formData = new FormData()
    formData.append('name', editName.value)
    formData.append('bio', editBio.value)
    formData.append('website', editWebsite.value)
    formData.append('location', editLocation.value)
    formData.append('instagram', editInstagram.value)
    formData.append('linkedin', editLinkedin.value)
    
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    if (selectedFile.value) {
       await api.upload('/api/auth/update-user', formData, { method: 'PATCH' })
    } else {
       await api.patch('/api/auth/update-user', { 
         name: editName.value,
         bio: editBio.value,
         website: editWebsite.value,
         location: editLocation.value,
         instagram: editInstagram.value,
         linkedin: editLinkedin.value
       })
    }

    await refreshUser()
    showToast('Profil berhasil diperbarui!')
    await api.post('/api/notifications', { type: 'system', title: 'Profil Diperbarui', message: 'Perubahan pada profil Anda telah berhasil disimpan.' })
    fetchNotifications()
    selectedFile.value = null
    previewImage.value = null
  } catch (err) {
    if (err.data && Array.isArray(err.data.details)) {
      showToast(err.data.details[0].message, 'error')
    } else {
      showToast(err.message || 'Gagal memperbarui profil', 'error')
    }
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value) {
    showToast('Mohon isi kata sandi lama dan baru', 'error')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showToast('Konfirmasi kata sandi tidak cocok', 'error')
    return
  }
  
  savingPassword.value = true
  
  try {
    await api.post('/api/auth/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showToast('Kata sandi berhasil diubah!')
    await api.post('/api/notifications', { type: 'system', title: 'Keamanan Akun', message: 'Kata sandi Anda berhasil diperbarui.' })
    fetchNotifications()
  } catch (err) {
    if (err.data && Array.isArray(err.data.details)) {
      showToast(err.data.details[0].message, 'error')
    } else {
      showToast(err.message || 'Gagal mengubah kata sandi', 'error')
    }
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  if (isCreator.value) {
    fetchDashboardData()
  } else {
    dashboardLoading.value = false
  }
})
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 mb-16">
      
      <!-- Compact Header (Brutal Style) -->
      <div class="flex flex-col md:flex-row items-center gap-5 md:gap-6 mb-8 p-5 md:p-6 bg-white border-2 border-white/20 shadow-brutal relative z-10">
        <!-- Decoration Dots -->
        <div class="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1">
          <div class="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
          <div class="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
        </div>

        <!-- Avatar -->
        <div class="relative group flex-shrink-0">
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept="image/*"
            @change="handleFileChange"
          />
          <div class="w-20 h-20 md:w-24 md:h-24 border-2 border-black bg-stone-200 overflow-hidden shadow-sm relative">
             <img 
              v-if="(previewImage || user?.image) && !imageError"
              :src="previewImage || userImageUrl" 
              :alt="user?.name"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover"
              @error="imageError = true"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-brand-teal/20">
              <User class="w-8 h-8 md:w-10 md:h-10 text-stone-900" />
            </div>
          </div>
          
          <button 
            @click="triggerFileInput"
            class="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-7 h-7 md:w-8 md:h-8 bg-brand-teal border-2 border-black flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] transition-transform cursor-pointer shadow-brutal-xs md:shadow-brutal-sm text-white"
            title="Ganti Foto"
          >
            <Camera class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </button>
        </div>

        <!-- Info -->
        <div class="flex-1 text-center md:text-left min-w-0">
          <div class="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-1 justify-center md:justify-start">
            <h1 class="text-xl md:text-3xl font-display font-bold text-stone-900 uppercase tracking-wide truncate max-w-full">{{ user?.name || 'User' }}</h1>
            <Badge variant="outline" class="capitalize border-2 border-black bg-brand-orange text-stone-900 font-bold shadow-brutal-xs md:shadow-brutal-sm text-[10px] md:text-xs px-2 py-0.5">{{ roleName }}</Badge>
          </div>
          <p class="text-stone-600 text-[10px] md:text-sm font-medium border-b-2 border-dashed border-stone-300 inline-block pb-0.5 mb-2 truncate max-w-full">{{ user?.email }}</p>
          <div class="flex items-center justify-center md:justify-start gap-2 text-[9px] md:text-xs font-bold uppercase tracking-widest text-stone-400 mt-0.5">
            <span>Bergabung {{ joinDate }}</span>
          </div>
        </div>

        <!-- Action / Stats Mini -->
        <div v-if="isCreator" class="flex gap-2 border-l-2 border-black pl-6 hidden md:flex">
           <div class="text-center px-4">
             <div class="text-2xl font-display font-bold text-stone-900">{{ summary.totalFilms }}</div>
             <div class="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Karya</div>
           </div>
           <div class="text-center px-4 border-l-2 border-dashed border-stone-300">
             <div class="text-2xl font-display font-bold text-stone-900">{{ summary.totalVotes }}</div>
             <div class="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Vote</div>
           </div>
        </div>
      </div>

      <!-- Tabs Navigation (Brutal Style) -->
      <div class="flex gap-2.5 md:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          @click="activeTab = 'dashboard'" 
          :class="['px-4 md:px-6 py-2.5 md:py-3 font-display font-bold uppercase tracking-widest text-[10px] md:text-sm border-2 border-black transition-all shadow-brutal-xs flex items-center gap-1.5 md:gap-2 whitespace-nowrap', activeTab === 'dashboard' ? 'bg-brand-teal text-white translate-x-[1px] translate-y-[1px] shadow-none' : 'bg-white text-stone-900']"
        >
          <LayoutDashboard class="w-3.5 h-3.5 md:w-4 md:h-4" />
          Ringkasan
        </button>
        <button 
          @click="activeTab = 'settings'" 
          :class="['px-4 md:px-6 py-2.5 md:py-3 font-display font-bold uppercase tracking-widest text-[10px] md:text-sm border-2 border-black transition-all shadow-brutal-xs flex items-center gap-1.5 md:gap-2 whitespace-nowrap', activeTab === 'settings' ? 'bg-stone-900 text-white translate-x-[1px] translate-y-[1px] shadow-none' : 'bg-white text-stone-900']"
        >
          <Settings class="w-3.5 h-3.5 md:w-4 md:h-4" />
          Pengaturan
        </button>
      </div>

      <!-- TAB 1: DASHBOARD / OVERVIEW -->
      <div v-if="activeTab === 'dashboard'">
        <!-- Creator Dashboard Content -->
        <div v-if="isCreator">
          <LoadingState v-if="dashboardLoading" text="Memuat statistik..." class="py-10" />
          
          <div v-else class="space-y-8 animate-fade-in">
            <!-- Badges Section -->
            <div v-if="badges.length > 0" class="bg-white border-2 border-black p-4 md:p-6 shadow-brutal relative overflow-hidden">
               <div class="absolute -right-6 -top-6 w-24 h-24 bg-brand-teal/10 rounded-full"></div>
               <h4 class="text-xs md:text-sm font-display font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Award class="w-4 h-4 text-brand-teal" /> Koleksi Lencana Kreator
               </h4>
               <div class="flex flex-wrap gap-3">
                 <div v-for="badge in badges" :key="badge.id" class="group relative">
                   <div :class="['w-12 h-12 md:w-14 md:h-14 border-2 border-black flex items-center justify-center shadow-brutal-xs transition-transform hover:-rotate-3 cursor-help', badge.color]">
                      <component :is="{ Award, FileText, Star, MessageSquare, Camera }[badge.icon]" class="w-6 h-6 md:w-7 md:h-7" />
                   </div>
                   <!-- Tooltip -->
                   <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2 bg-black text-white text-[10px] font-bold uppercase tracking-tight text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/20">
                     <p class="text-brand-teal mb-0.5">{{ badge.name }}</p>
                     <p class="text-stone-400 font-medium normal-case leading-tight">{{ badge.description }}</p>
                     <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black"></div>
                   </div>
                 </div>
               </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-3 md:p-5 flex items-center md:flex-col justify-start md:justify-center text-left md:text-center gap-3">
                   <div class="w-10 h-10 md:w-12 md:h-12 bg-stone-100 border-2 border-black flex items-center justify-center shadow-sm flex-shrink-0">
                     <FilmIcon class="w-5 h-5 md:w-6 md:h-6 text-stone-900" />
                   </div>
                   <div>
                     <div class="text-2xl md:text-4xl font-display font-bold text-stone-900 md:mb-1">{{ summary.totalFilms }}</div>
                     <div class="text-[9px] md:text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Karya</div>
                   </div>
                </CardContent>
              </Card>
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-3 md:p-5 flex items-center md:flex-col justify-start md:justify-center text-left md:text-center gap-3">
                   <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-teal/20 border-2 border-black flex items-center justify-center shadow-sm flex-shrink-0">
                     <ThumbsUp class="w-5 h-5 md:w-6 md:h-6 text-brand-teal" />
                   </div>
                   <div>
                     <div class="text-2xl md:text-4xl font-display font-bold text-stone-900 md:mb-1">{{ summary.totalVotes }}</div>
                     <div class="text-[9px] md:text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Apresiasi</div>
                   </div>
                </CardContent>
              </Card>
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-3 md:p-5 flex items-center md:flex-col justify-start md:justify-center text-left md:text-center gap-3">
                   <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-orange/20 border-2 border-black flex items-center justify-center shadow-sm flex-shrink-0">
                     <MessageCircle class="w-5 h-5 md:w-6 md:h-6 text-brand-orange" />
                   </div>
                   <div>
                     <div class="text-2xl md:text-4xl font-display font-bold text-stone-900 md:mb-1">{{ summary.totalComments }}</div>
                     <div class="text-[9px] md:text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Diskusi</div>
                   </div>
                </CardContent>
              </Card>
            </div>

            <!-- Recent Films -->
            <div>
              <div class="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                <h3 class="font-display font-bold text-xl text-stone-900 uppercase tracking-wide">Karya Terbaru Saya</h3>
                <Button variant="outline" size="sm" class="h-8 text-xs font-bold border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]" @click="router.push('/my-archive')" v-if="films.length > 0">
                  Kelola Semua
                </Button>
              </div>

               <div v-if="films.length === 0" class="text-center py-12 border-2 border-dashed border-stone-400 bg-stone-50/50">
                <FilmIcon class="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p class="font-bold text-stone-600 mb-4">Belum ada karya yang diupload.</p>
                <Button size="sm" @click="router.push('/upload')" class="bg-stone-900 text-white gap-2 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
                  <Upload class="w-4 h-4" /> Upload Karya Pertama
                </Button>
              </div>

              <div v-else class="space-y-3 md:space-y-4">
                <div v-for="film in films" :key="film.film_id" class="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border-2 border-black shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all overflow-hidden">
                   <div class="w-10 h-14 md:w-12 md:h-16 bg-stone-200 flex-shrink-0 overflow-hidden border border-black relative">
                      <img v-if="film.gambar_poster" :src="film.gambar_poster" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center bg-stone-100">
                         <FilmIcon class="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
                      </div>
                   </div>
                   <div class="flex-1 min-w-0">
                      <h4 class="text-xs md:text-sm font-display font-bold text-stone-900 truncate uppercase">{{ film.judul }}</h4>
                      <p class="text-[9px] md:text-xs font-mono text-stone-500 mb-1.5 border-b border-dashed border-stone-200 pb-0.5 w-fit">{{ film.tahun_karya }} • {{ film.category?.nama_kategori }}</p>
                      <Badge :class="['text-[8px] md:text-[10px] px-1.5 md:px-2 py-0 md:py-0.5 rounded-none border md:border-2 font-bold uppercase', statusColors[film.status]]">
                          {{ statusLabels[film.status] }}
                      </Badge>
                   </div>
                   <div class="text-right flex flex-col gap-1.5">
                       <Badge variant="outline" class="gap-1 border-stone-300 text-[9px] md:text-xs px-1 md:px-2">
                          <ThumbsUp class="w-2.5 h-2.5 md:w-3 md:h-3" /> {{ film.vote_count }}
                       </Badge>
                       <Badge variant="outline" class="gap-1 border-stone-300 text-[9px] md:text-xs px-1 md:px-2">
                          <MessageCircle class="w-2.5 h-2.5 md:w-3 md:h-3" /> {{ film.comment_count }}
                       </Badge>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Non-Creator Content -->
        <div v-else class="text-center py-16 border-2 border-black bg-white shadow-brutal">
           <div class="w-20 h-20 bg-brand-orange border-2 border-black flex items-center justify-center mx-auto mb-6 shadow-brutal">
              <User class="w-10 h-10 text-stone-900" />
           </div>
           <h3 class="font-display font-bold text-2xl mb-2 text-stone-900 uppercase">Halo, penikmat karya!</h3>
           <p class="text-stone-600 mb-8 font-medium max-w-sm mx-auto">Jelajahi karya-karya siswa di halaman utama atau atur koleksi favoritmu.</p>
           <div class="flex justify-center gap-4">
             <Button class="bg-stone-900 text-white border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-12 px-6" @click="router.push('/')">
                Cari Karya
              </Button>
             <Button variant="outline" class="bg-white text-stone-900 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-12 px-6" @click="router.push('/collections')">
                Lihat Koleksi
             </Button>
           </div>
        </div>
      </div>

      <!-- TAB 2: SETTINGS -->
      <div v-if="activeTab === 'settings'" class="animate-fade-in max-w-7xl mx-auto space-y-8">
         <!-- Personal Information -->
        <div class="bg-white p-6 border-2 border-black shadow-brutal relative">
           <div class="absolute top-0 right-0 w-4 h-4 bg-brand-teal border-l-2 border-b-2 border-black"></div>
           <h3 class="font-display font-bold text-xl text-stone-900 mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
             <User class="w-5 h-5" /> Informasi Dasar
           </h3>
           
           <div class="space-y-5 md:space-y-6">
              <div>
                <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Nama Tampilan</label>
                <Input v-model="editName" class="border-2 border-black shadow-brutal-xs md:shadow-brutal-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all h-10 md:h-12 text-sm md:text-lg font-medium" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Email</label>
                   <Input :value="user?.email" disabled class="bg-stone-50 border-2 border-stone-200 text-stone-400 h-10 md:h-12 cursor-not-allowed font-mono text-xs md:text-sm" />
                </div>
                <div>
                   <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Lokasi / Institusi</label>
                   <Input v-model="editLocation" placeholder="Contoh: Jakarta, Indonesia" class="border-2 border-black shadow-brutal-xs h-10 md:h-12 text-sm" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Bio Singkat</label>
                <textarea 
                  v-model="editBio"
                  rows="3"
                  placeholder="Ceritakan sedikit tentang diri Anda dan fokus karya Anda..."
                  class="w-full border-2 border-black p-3 text-sm font-medium focus:outline-none bg-white shadow-brutal-xs resize-none"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Website / Portofolio</label>
                    <Input v-model="editWebsite" placeholder="https://myportfolio.com" class="border-2 border-black shadow-brutal-xs h-10 md:h-12 text-sm" />
                 </div>
                 <div>
                    <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Instagram (Username)</label>
                    <div class="relative">
                       <span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">@</span>
                       <Input v-model="editInstagram" placeholder="username" class="border-2 border-black shadow-brutal-xs h-10 md:h-12 pl-8 text-sm" />
                    </div>
                 </div>
              </div>

              <div>
                 <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">LinkedIn (URL Lengkap)</label>
                 <Input v-model="editLinkedin" placeholder="https://linkedin.com/in/username" class="border-2 border-black shadow-brutal-xs h-10 md:h-12 text-sm" />
              </div>

              <div class="pt-2">
                 <Button @click="saveProfile" :disabled="savingProfile" class="w-full sm:w-auto bg-stone-900 text-white border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 md:h-12 px-6 md:px-8 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                    <Loader2 v-if="savingProfile" class="w-4 h-4 mr-2 animate-spin" />
                    Simpan Profil
                 </Button>
              </div>
           </div>
        </div>

        <!-- Change Password -->
        <div class="bg-white p-6 border-2 border-black shadow-brutal relative">
           <div class="absolute top-0 right-0 w-4 h-4 bg-brand-red border-l-2 border-b-2 border-black"></div>
           <h3 class="font-display font-bold text-xl text-stone-900 mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
             <Settings class="w-5 h-5" /> Keamanan Akun
           </h3>
           
           <div class="space-y-5 md:space-y-6">
              <div>
                <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Password Saat Ini</label>
                <div class="relative">
                  <Input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-xs md:shadow-brutal-sm h-10 md:h-12 pr-12 text-sm" placeholder="••••••••" />
                   <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900">
                    <Eye v-if="!showCurrentPassword" class="w-4 h-4 md:w-5 md:h-5" />
                    <EyeOff v-else class="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div>
                  <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Password Baru</label>
                   <Input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-xs md:shadow-brutal-sm h-10 md:h-12 text-sm" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-[10px] md:text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Konfirmasi</label>
                   <Input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-xs md:shadow-brutal-sm h-10 md:h-12 text-sm" placeholder="••••••••" />
                </div>
              </div>

              <div class="pt-2">
                 <Button variant="outline" @click="changePassword" :disabled="savingPassword" class="w-full sm:w-auto bg-white text-stone-900 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 md:h-12 px-6 md:px-8 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                    <Loader2 v-if="savingPassword" class="w-4 h-4 mr-2 animate-spin" />
                    Perbarui Kata Sandi
                 </Button>
              </div>
           </div>
        </div>
      </div>

    </div>


  </PageLayout>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
