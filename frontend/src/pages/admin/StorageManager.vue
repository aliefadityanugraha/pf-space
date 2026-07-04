<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  Database, Video, FileText, Image as ImageIcon, User as UserIcon, 
  HardDrive, AlertCircle, RefreshCcw, Loader2, ChevronRight
} from 'lucide-vue-next'

const loading = ref(true)
const storageStats = ref(null)

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getCategoryIcon = (key) => {
  switch (key) {
    case 'videos': return Video
    case 'documents': return FileText
    case 'images': return ImageIcon
    case 'avatars': return UserIcon
    default: return HardDrive
  }
}

const getCategoryColor = (key) => {
  switch (key) {
    case 'videos': return 'bg-purple-500'
    case 'documents': return 'bg-blue-500'
    case 'images': return 'bg-green-500'
    case 'avatars': return 'bg-orange-500'
    default: return 'bg-stone-500'
  }
}

const fetchStorageStats = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/admin/storage')
    if (response?.success) {
      storageStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch storage stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStorageStats()
})
</script>

<template>
  <div class="p-4 md:p-8">
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/admin" class="text-brand-teal hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-blue-100 text-blue-700 border-blue-300">File Manager</Badge>
    </nav>

    <PageHeader 
      title="Manajemen Penyimpanan" 
      description="Pantau penggunaan ruang disk untuk video, dokumen, and aset lainnya."
      :icon="Database"
      icon-color="bg-blue-600"
    >
      <template #actions>
        <Button variant="outline" class="gap-2" @click="fetchStorageStats" :disabled="loading">
          <RefreshCcw :class="['w-4 h-4', loading ? 'animate-spin' : '']" />
          Refresh
        </Button>
      </template>
    </PageHeader>

    <div v-if="loading && !storageStats" class="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 animate-spin text-brand-teal mb-4" />
      <p class="text-stone-500 font-mono uppercase tracking-widest">Menghitung Ukuran File...</p>
    </div>

    <template v-else-if="storageStats">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Total Storage Card -->
        <Card class="lg:col-span-1 border-2 border-stone-800 shadow-brutal">
          <CardHeader class="bg-stone-50 border-b border-stone-200">
            <CardTitle class="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <HardDrive class="w-4 h-4" />
              Total Penggunaan
            </CardTitle>
          </CardHeader>
          <CardContent class="p-6">
            <div class="text-5xl font-black text-stone-900 mb-2">{{ formatSize(storageStats.totalSize) }}</div>
            <p class="text-stone-500 text-sm mb-6 uppercase font-bold">Tersebar di {{ storageStats.totalCount }} file</p>
            <div v-if="storageStats.disk" class="mb-6">
              <div class="flex items-center justify-between text-[11px] font-mono mb-1">
                <span>Terpakai</span>
                <span>{{ Math.round((storageStats.disk.used / (storageStats.disk.total || 1)) * 100) }}%</span>
              </div>
              <div class="w-full h-3 bg-stone-200 border border-stone-800 overflow-hidden">
                <div 
                  class="h-full bg-stone-800"
                  :style="{ width: `${(storageStats.disk.used / (storageStats.disk.total || 1)) * 100}%` }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-stone-600">
                {{ formatSize(storageStats.disk.used) }} dari {{ formatSize(storageStats.disk.total) }} • Sisa {{ formatSize(storageStats.disk.free) }}
              </div>
            </div>

            <div class="space-y-4">
              <div v-for="(cat, key) in storageStats.categories" :key="key">
                <div class="flex items-center justify-between text-xs font-bold uppercase mb-1">
                  <span>{{ cat.name }}</span>
                  <span>{{ formatSize(cat.size) }}</span>
                </div>
                <div class="w-full h-3 bg-stone-200 border border-stone-800 overflow-hidden">
                  <div 
                    :class="getCategoryColor(key)" 
                    class="h-full transition-all duration-1000"
                    :style="{ width: `${(cat.size / (storageStats.totalSize || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Category Grid -->
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card v-for="(cat, key) in storageStats.categories" :key="key" class="hover:border-stone-800 transition-colors">
            <CardContent class="p-6 flex items-center gap-4">
              <div :class="['w-12 h-12 flex items-center justify-center border-2 border-stone-800 shadow-brutal-sm text-white', getCategoryColor(key)]">
                <component :is="getCategoryIcon(key)" class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold uppercase tracking-wide text-sm">{{ cat.name }}</h3>
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-black">{{ formatSize(cat.size) }}</span>
                  <span class="text-xs text-stone-500 uppercase font-bold">{{ cat.count }} File</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" class="rounded-none hover:bg-stone-100">
                <ChevronRight class="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

          <Card class="bg-amber-50 border-dashed border-2 border-amber-300">
            <CardContent class="p-6 flex items-center gap-4">
              <div class="w-12 h-12 flex items-center justify-center bg-amber-100 text-amber-700">
                <AlertCircle class="w-8 h-8" />
              </div>
              <div>
                <h3 class="font-bold text-amber-900 uppercase text-xs mb-1">Tips Efisiensi</h3>
                <p class="text-xs text-amber-800 leading-tight">Gunakan format WebP untuk gambar dan kompresi H.264 untuk video agar hemat ruang.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- System Info -->
      <Card class="border-2 border-stone-800">
        <CardHeader class="bg-lime-50 border-b-2 border-stone-800">
          <CardTitle class="text-sm font-bold uppercase tracking-widest">Detail Lokasi Penyimpanan</CardTitle>
        </CardHeader>
        <CardContent class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="(cat, key) in storageStats.categories" :key="key" class="font-mono text-[11px]">
              <div class="font-bold text-stone-400 mb-1 uppercase tracking-tighter">Direktori {{ key }}</div>
              <div class="bg-stone-900 text-lime-400 p-2 border border-stone-700">
                /var/www/html/.../uploads/{{ cat.name }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <Card v-else class="min-h-[200px] flex items-center justify-center bg-red-50 border-red-200">
      <div class="text-center p-8">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-bold text-red-900 uppercase">Gagal Memuat Data</h3>
        <p class="text-red-700 mb-4">Terjadi kesalahan saat mencoba mengakses sistem file server.</p>
        <Button variant="outline" @click="fetchStorageStats" class="border-red-300 hover:bg-red-100 uppercase font-bold text-xs">Coba Lagi</Button>
      </div>
    </Card>
  </div>
</template>
