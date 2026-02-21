<script setup>
import { ref, onMounted } from 'vue'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  Vote, Trash2, AlertTriangle, Loader2, CheckCircle2, TrendingUp, X, Film as FilmIcon, RefreshCw
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'

const { toast, showToast } = useToast()
const sidebarCollapsed = ref(false)
const loading = ref(false)
const trendingKaryas = ref([])
const loadingTrending = ref(true)
const showResetConfirm = ref(false)

const fetchTrending = async () => {
  loadingTrending.value = true
  try {
    const res = await api.get('/api/votes/trending', { params: { limit: 10, period: 'all' } })
    // api.js returns data directly, trending endpoint usually returns an array or { success: true, data: [] }
    if (Array.isArray(res)) {
      trendingKaryas.value = res
    } else if (res?.data && Array.isArray(res.data)) {
      trendingKaryas.value = res.data
    } else if (res?.success && Array.isArray(res.data)) {
      trendingKaryas.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch trending:', err)
  } finally {
    loadingTrending.value = false
  }
}

const openResetConfirm = () => {
  showResetConfirm.value = true
}

const resetVotes = async () => {
  loading.value = true
  try {
    const response = await api.delete('/api/votes/reset')
    // Check various success indicators based on common API patterns
    if (response?.success || response?.message?.toLowerCase().includes('success')) {
      showToast('Semua voting telah direset.', 'success')
      showResetConfirm.value = false
      await fetchTrending() // Refresh list
    } else {
      throw new Error(response?.message || 'Gagal mereset voting')
    }
  } catch (error) {
    console.error('Reset votes error:', error)
    const msg = error.message || 'Terjadi kesalahan saat mereset voting.'
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTrending()
})
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <router-link to="/admin" class="text-brand-teal hover:underline">Administrasi</router-link>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-blue-100 text-blue-700 border-blue-300">Manajer Trending</Badge>
      </nav>

      <PageHeader 
        title="Manajemen Trending" 
        description="Kelola sistem trending dan reset status apresiasi karya."
        :icon="Vote"
        icon-color="bg-blue-500"
      />

      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Voting Rank Status -->
        <Card class="border-2 border-black shadow-brutal h-fit">
          <CardHeader class="bg-stone-50 border-b-2 border-black">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <TrendingUp class="w-5 h-5" />
                <CardTitle>Status Peringkat Trending</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8 hover:bg-stone-200"
                @click="fetchTrending"
                :disabled="loadingTrending"
              >
                <RefreshCw 
                  class="w-4 h-4" 
                  :class="{ 'animate-spin': loadingTrending }"
                />
              </Button>
            </div>
            <CardDescription>
              Top 10 karya dengan apresiasi terbanyak saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="loadingTrending" class="p-8 flex justify-center">
              <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
            </div>
            <div v-else-if="trendingKaryas.length === 0" class="p-8 text-center text-stone-500 italic">
              Belum ada data trending.
            </div>
            <div v-else class="divide-y divide-stone-200">
              <div 
                v-for="(karya, index) in trendingKaryas" 
                :key="karya.film_id"
                class="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
              >
                <div 
                  class="w-8 h-8 flex items-center justify-center font-bold font-mono border-2 border-black shadow-brutal-sm"
                  :class="index < 3 ? 'bg-yellow-400' : 'bg-white'"
                >
                  #{{ index + 1 }}
                </div>
                
                <div class="w-10 h-14 bg-stone-200 border border-stone-800 flex-shrink-0 overflow-hidden">
                  <img v-if="karya.gambar_poster" :src="karya.gambar_poster" class="w-full h-full object-cover" />
                  <FilmIcon v-else class="w-full h-full p-2 text-stone-400" />
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-sm truncate">{{ karya.judul }}</h4>
                  <p class="text-xs text-stone-500">{{ karya.category?.nama_kategori || '-' }}</p>
                </div>

                <Badge variant="secondary" class="font-mono bg-stone-800 text-white border-none">
                  {{ karya.vote_count }} Suara
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Danger Zone -->
        <Card class="border-2 border-red-200 shadow-brutal h-fit">
          <CardHeader class="bg-red-50 border-b border-red-100">
            <div class="flex items-center gap-2 text-red-700">
              <AlertTriangle class="w-5 h-5" />
              <CardTitle>Zona Bahaya</CardTitle>
            </div>
            <CardDescription class="text-red-600">
              Tindakan di bawah ini bersifat destruktif dan tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent class="p-6">
            <div class="flex flex-col gap-4">
              <div>
                <h3 class="font-bold text-stone-900 mb-1">Reset Statistik Trending</h3>
                <p class="text-sm text-stone-500">
                  Menghapus seluruh data apresiasi dari database. Jumlah suara pada semua karya akan kembali menjadi 0.
                </p>
              </div>
              <Button 
                variant="destructive" 
                class="w-full sm:w-auto bg-red-600 hover:bg-red-700 border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all justify-center"
                @click="openResetConfirm"
                :disabled="loading"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Reset Trending
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="!loading ? showResetConfirm = false : null"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-red-50">
          <div class="flex items-center gap-2 text-red-700">
            <AlertTriangle class="w-5 h-5" />
            <h2 class="font-bold text-lg">Konfirmasi Reset</h2>
          </div>
          <button 
            @click="showResetConfirm = false" 
            class="p-1 hover:bg-red-100 rounded transition-colors"
            :disabled="loading"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6">
          <p class="text-stone-700 mb-6 leading-relaxed">
            Apakah Anda yakin ingin mereset <strong>SEMUA</strong> data trending? 
            <br><br>
            <span class="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 border border-red-200 rounded">
              Tindakan ini tidak dapat dibatalkan!
            </span>
          </p>
          
          <div class="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              @click="showResetConfirm = false" 
              :disabled="loading"
            >
              Batal
            </Button>
            <Button 
              type="button" 
              class="bg-red-600 hover:bg-red-700 text-white gap-2" 
              @click="resetVotes" 
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
              Ya, Reset Semua
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  </div>
</template>

