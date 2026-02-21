<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { api } from '@/lib/api'
import PageLayout from '@/components/PageLayout.vue'
import LoadingState from '@/components/LoadingState.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Toast from '@/components/Toast.vue'
import { 
  User, Mail, Eye, EyeOff, Camera, Save, 
  Loader2, ThumbsUp, MessageCircle, Film as FilmIcon, Upload,
  LayoutDashboard, Settings
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

const router = useRouter()
const { user, refreshUser, initialized, isLoggedIn, isCreator } = useAuth()
const { toast, showToast } = useToast()
const fileInput = ref(null)

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
    const myFilmsRes = await api.get('/api/films/my-films', {
      params: { page: 1, limit: 10 }
    })
    const myFilms = Array.isArray(myFilmsRes.data) ? myFilmsRes.data : []

    const statsMap = {}
    if (myFilms.length > 0) {
      await Promise.all(
        myFilms.map(async (film) => {
          const filmId = film.film_id
          try {
            const [voteRes, commentRes] = await Promise.all([
              api.get(`/api/votes/film/${filmId}`),
              api.get(`/api/discussions/film/${filmId}/count`)
            ])
            statsMap[filmId] = {
              vote_count: voteRes.data?.vote_count ?? 0,
              comment_count: commentRes.data?.comment_count ?? 0
            }
          } catch {
            statsMap[filmId] = { vote_count: 0, comment_count: 0 }
          }
        })
      )
    }

    const merged = myFilms.map((film) => {
      const stats = statsMap[film.film_id] || {}
      return {
        ...film,
        vote_count: stats.vote_count || 0,
        comment_count: stats.comment_count || 0
      }
    })

    films.value = merged

    summary.value = {
      totalFilms: merged.length,
      pending: merged.filter((f) => f.status === 'pending').length,
      published: merged.filter((f) => f.status === 'published').length,
      rejected: merged.filter((f) => f.status === 'rejected').length,
      totalVotes: merged.reduce((sum, f) => sum + (f.vote_count || 0), 0),
      totalComments: merged.reduce((sum, f) => sum + (f.comment_count || 0), 0)
    }

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
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  savingProfile.value = true
  
  try {
    const formData = new FormData()
    formData.append('name', editName.value)
    
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    if (selectedFile.value) {
       await api.upload('/api/auth/update-user', formData, { method: 'PATCH' })
    } else {
       await api.patch('/api/auth/update-user', { name: editName.value })
    }

    await refreshUser()
    showToast('Profil berhasil diperbarui!', 'success')
    selectedFile.value = null
  } catch (err) {
    showToast(err.message || 'Gagal memperbarui profil', 'error')
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    showToast('Password tidak cocok', 'error')
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
    showToast('Password berhasil diubah!', 'success')
  } catch (err) {
    showToast(err.message || 'Gagal mengubah password', 'error')
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
    <div class="max-w-7xl mx-auto mb-16">
      
      <!-- Compact Header (Brutal Style) -->
      <div class="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-white border-2 border-black shadow-brutal relative z-10">
        <!-- Decoration Dots -->
        <div class="absolute top-2 right-2 flex gap-1">
          <div class="w-2 h-2 bg-black rounded-full"></div>
          <div class="w-2 h-2 bg-black rounded-full"></div>
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
          <div class="w-24 h-24 border-2 border-black bg-stone-200 overflow-hidden shadow-sm relative">
             <img 
              v-if="previewImage || user?.image"
              :src="previewImage || user.image" 
              :alt="user?.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-brand-teal/20">
              <User class="w-10 h-10 text-stone-900" />
            </div>
          </div>
          
          <button 
            @click="triggerFileInput"
            class="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-teal border-2 border-black flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] transition-transform cursor-pointer shadow-brutal-sm"
            title="Ganti Foto"
          >
            <Camera class="w-4 h-4 text-white" />
          </button>
        </div>

        <!-- Info -->
        <div class="flex-1 text-center md:text-left">
          <div class="flex flex-col md:flex-row items-center gap-3 mb-1 justify-center md:justify-start">
            <h1 class="text-3xl font-display font-bold text-stone-900 uppercase tracking-wide">{{ user?.name || 'User' }}</h1>
            <Badge variant="outline" class="capitalize border-2 border-black bg-brand-orange text-stone-900 font-bold shadow-brutal-sm">{{ roleName }}</Badge>
          </div>
          <p class="text-stone-600 text-sm font-medium border-b-2 border-dashed border-stone-300 inline-block pb-1 mb-2">{{ user?.email }}</p>
          <div class="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 mt-1">
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
      <div class="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          @click="activeTab = 'dashboard'" 
          :class="['px-6 py-3 font-display font-bold uppercase tracking-widest text-sm border-2 border-black transition-all shadow-brutal-sm hover:-translate-y-[1px] hover:-translate-x-[1px] flex items-center gap-2', activeTab === 'dashboard' ? 'bg-brand-teal text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-stone-900 hover:shadow-brutal']"
        >
          <LayoutDashboard class="w-4 h-4" />
          Ringkasan
        </button>
        <button 
          @click="activeTab = 'settings'" 
          :class="['px-6 py-3 font-display font-bold uppercase tracking-widest text-sm border-2 border-black transition-all shadow-brutal-sm hover:-translate-y-[1px] hover:-translate-x-[1px] flex items-center gap-2', activeTab === 'settings' ? 'bg-stone-900 text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white text-stone-900 hover:shadow-brutal']"
        >
          <Settings class="w-4 h-4" />
          Edit Profil
        </button>
      </div>

      <!-- TAB 1: DASHBOARD / OVERVIEW -->
      <div v-if="activeTab === 'dashboard'">
        <!-- Creator Dashboard Content -->
        <div v-if="isCreator">
          <LoadingState v-if="dashboardLoading" text="Memuat statistik..." class="py-10" />
          
          <div v-else class="space-y-8 animate-fade-in">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-5 flex flex-col items-center justify-center text-center">
                   <div class="w-12 h-12 bg-stone-100 border-2 border-black flex items-center justify-center mb-3 shadow-sm">
                     <FilmIcon class="w-6 h-6 text-stone-900" />
                   </div>
                   <div class="text-4xl font-display font-bold text-stone-900 mb-1">{{ summary.totalFilms }}</div>
                   <div class="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Karya</div>
                </CardContent>
              </Card>
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-5 flex flex-col items-center justify-center text-center">
                   <div class="w-12 h-12 bg-brand-teal/20 border-2 border-black flex items-center justify-center mb-3 shadow-sm">
                     <ThumbsUp class="w-6 h-6 text-brand-teal" />
                   </div>
                   <div class="text-4xl font-display font-bold text-stone-900 mb-1">{{ summary.totalVotes }}</div>
                   <div class="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Apresiasi</div>
                </CardContent>
              </Card>
              <Card class="bg-white border-2 border-black shadow-brutal">
                <CardContent class="p-5 flex flex-col items-center justify-center text-center">
                   <div class="w-12 h-12 bg-brand-orange/20 border-2 border-black flex items-center justify-center mb-3 shadow-sm">
                     <MessageCircle class="w-6 h-6 text-brand-orange" />
                   </div>
                   <div class="text-4xl font-display font-bold text-stone-900 mb-1">{{ summary.totalComments }}</div>
                   <div class="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Total Diskusi</div>
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

              <div v-else class="space-y-4">
                <div v-for="film in films" :key="film.film_id" class="flex items-center gap-4 p-4 bg-white border-2 border-black shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all">
                   <div class="w-12 h-16 bg-stone-200 flex-shrink-0 overflow-hidden border border-black relative">
                      <img v-if="film.gambar_poster" :src="film.gambar_poster" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center bg-stone-100">
                         <FilmIcon class="w-5 h-5 text-stone-400" />
                      </div>
                   </div>
                   <div class="flex-1 min-w-0">
                      <h4 class="font-display font-bold text-stone-900 truncate uppercase">{{ film.judul }}</h4>
                      <p class="text-xs font-mono text-stone-500 mb-2 border-b border-dashed border-stone-200 pb-1 w-fit">{{ film.tahun_karya }} • {{ film.category?.nama_kategori }}</p>
                      <Badge :class="['text-[10px] px-2 py-0.5 rounded-none border-2 font-bold uppercase', statusColors[film.status]]">
                          {{ statusLabels[film.status] }}
                      </Badge>
                   </div>
                   <div class="text-right flex flex-col gap-2">
                       <Badge variant="outline" class="gap-1 border-stone-300">
                          <ThumbsUp class="w-3 h-3" /> {{ film.vote_count }}
                       </Badge>
                       <Badge variant="outline" class="gap-1 border-stone-300">
                          <MessageCircle class="w-3 h-3" /> {{ film.comment_count }}
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
      <div v-if="activeTab === 'settings'" class="animate-fade-in max-w-3xl mx-auto space-y-8">
         <!-- Personal Information -->
        <div class="bg-white p-6 border-2 border-black shadow-brutal relative">
           <div class="absolute top-0 right-0 w-4 h-4 bg-brand-teal border-l-2 border-b-2 border-black"></div>
           <h3 class="font-display font-bold text-xl text-stone-900 mb-6 border-b-2 border-black pb-2 flex items-center gap-2">
             <User class="w-5 h-5" /> Informasi Dasar
           </h3>
           
           <div class="space-y-6">
              <div>
                <label class="block text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Nama Tampilan</label>
                <Input v-model="editName" class="border-2 border-black shadow-brutal-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all h-12 text-lg font-medium" />
              </div>

              <div>
                <label class="block text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Email</label>
                <Input :value="user?.email" disabled class="bg-stone-100 border-2 border-stone-300 text-stone-500 h-12 cursor-not-allowed font-mono" />
              </div>

              <div class="pt-2">
                 <Button @click="saveProfile" :disabled="savingProfile" class="w-full sm:w-auto bg-stone-900 text-white border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-12 px-8 font-bold uppercase tracking-widest text-xs">
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
           
           <div class="space-y-6">
              <div>
                <label class="block text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Password Saat Ini</label>
                <div class="relative">
                  <Input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-sm h-12 pr-12" placeholder="••••••••" />
                   <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900">
                    <Eye v-if="!showCurrentPassword" class="w-5 h-5" />
                    <EyeOff v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Password Baru</label>
                   <Input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-sm h-12" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-sm font-bold uppercase tracking-wide text-stone-900 mb-2">Konfirmasi</label>
                   <Input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="border-2 border-black shadow-brutal-sm h-12" placeholder="••••••••" />
                </div>
              </div>

              <div class="pt-2">
                 <Button variant="outline" @click="changePassword" :disabled="savingPassword" class="w-full sm:w-auto bg-white text-stone-900 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-12 px-8 font-bold uppercase tracking-widest text-xs">
                    <Loader2 v-if="savingPassword" class="w-4 h-4 mr-2 animate-spin" />
                    Update Password
                 </Button>
              </div>
           </div>
        </div>
      </div>

    </div>

    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
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
