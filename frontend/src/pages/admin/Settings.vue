<script setup>
import { ref, onMounted } from 'vue'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import { 
  Settings, Megaphone, Save, Loader2, AlertCircle, 
  CheckCircle, Power, Edit3, Link
} from 'lucide-vue-next'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader.vue'
import { useToast } from '@/composables/useToast'

const sidebarCollapsed = ref(false)
const loading = ref(true)
const saving = ref(false)
const { showToast } = useToast()

// Settings Data
const announcementConfig = ref({
  is_active: false,
  title: '',
  content: '',
  button_text: '',
  button_url: '',
  type: 'modal'
})

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/settings/announcement_modal')
    if (res.data && res.data.value) {
      announcementConfig.value = res.data.value
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err)
    showToast('Gagal memuat pengaturan', 'error')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await api.post('/api/settings/announcement_modal', {
      value: announcementConfig.value,
      is_public: true
    })
    showToast('Pengaturan berhasil disimpan')
  } catch (err) {
    console.error('Failed to save settings:', err)
    showToast('Gagal menyimpan pengaturan', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-14' : 'ml-56']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <router-link to="/" class="text-brand-teal hover:underline">Beranda</router-link>
        <span class="text-stone-400">/</span>
        <router-link to="/admin" class="text-stone-600 hover:underline">Administrasi</router-link>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Pengaturan</Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Pengaturan Sistem" 
        description="Konfigurasi parameter global dan fitur platform."
        :icon="Settings"
        icon-color="bg-stone-900"
      >
        <template #actions>
          <Button 
            @click="saveSettings" 
            :disabled="saving"
            class="bg-brand-teal text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            Simpan Perubahan
          </Button>
        </template>
      </PageHeader>

      <div class="p-0 md:p-0 flex-1 w-full space-y-8 mt-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <Loader2 class="w-10 h-10 animate-spin text-brand-teal mb-4" />
          <p class="font-mono text-sm uppercase tracking-widest text-stone-500">Menyiapkan konfigurasi...</p>
        </div>

        <template v-else>
          <!-- Announcement Settings Section -->
          <section class="space-y-6">
            <div class="flex items-center gap-3 mb-2">
              <Megaphone class="w-6 h-6 text-brand-orange" />
              <h2 class="text-xl font-display font-bold uppercase tracking-tight">Announcement Modal</h2>
            </div>
            
            <Card class="border-2 border-black shadow-brutal rounded-none overflow-hidden">
              <CardHeader class="bg-stone-50 border-b-2 border-black flex flex-row items-center justify-between py-4">
                <div class="flex items-center gap-2 text-stone-700">
                  <AlertCircle class="w-4 h-4" />
                  <span class="text-xs font-bold uppercase tracking-widest">Konfigurasi Pengumuman Utama</span>
                </div>
                
                <div class="flex items-center gap-3">
                  <span :class="[announcementConfig.is_active ? 'text-green-600' : 'text-stone-400', 'text-[10px] font-bold uppercase tracking-widest']">
                    {{ announcementConfig.is_active ? 'Aktif' : 'Non-aktif' }}
                  </span>
                  <button 
                    @click="announcementConfig.is_active = !announcementConfig.is_active"
                    :class="[
                      announcementConfig.is_active ? 'bg-green-500' : 'bg-stone-300',
                      'w-12 h-6 border-2 border-black rounded-full relative transition-colors'
                    ]"
                  >
                    <div :class="[announcementConfig.is_active ? 'translate-x-6' : 'translate-x-0', 'absolute top-0.5 left-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-transform']"></div>
                  </button>
                </div>
              </CardHeader>
              
              <CardContent class="p-6 md:p-8 space-y-6">
                <!-- Title & Content -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Edit3 class="w-3 h-3 text-stone-400" />
                        Judul Pengumuman
                      </label>
                      <Input 
                        v-model="announcementConfig.title" 
                        placeholder="Contoh: Pendaftaran PKM-PM 2024 Dibuka!" 
                        class="border-2 border-black focus-visible:ring-0 text-lg font-bold"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <FileText class="w-3 h-3 text-stone-400" />
                        Isi Pesan
                      </label>
                      <textarea 
                        v-model="announcementConfig.content" 
                        rows="5"
                        placeholder="Tuliskan detail pengumuman di sini..." 
                        class="w-full p-4 border-2 border-black focus:border-brand-teal focus:outline-none text-sm leading-relaxed"
                      ></textarea>
                    </div>
                  </div>

                  <!-- CTAs -->
                  <div class="space-y-4 bg-stone-50 p-6 border-2 border-black border-dashed">
                    <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Aksi Tombol (Optional)</h3>
                    
                    <div>
                      <label class="block text-[10px] font-bold uppercase tracking-widest mb-1 text-stone-500">Teks Tombol</label>
                      <Input 
                        v-model="announcementConfig.button_text" 
                        placeholder="Contoh: Daftar Sekarang" 
                        class="border-2 border-black focus-visible:ring-0"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-[10px] font-bold uppercase tracking-widest mb-1 text-stone-500 flex items-center gap-1">
                        <Link class="w-3 h-3" />
                        Link Tujuan
                      </label>
                      <Input 
                        v-model="announcementConfig.button_url" 
                        placeholder="Contoh: /about atau https://domain.com" 
                        class="border-2 border-black focus-visible:ring-0"
                      />
                    </div>

                    <div class="pt-4 mt-4 border-t border-stone-200">
                      <p class="text-[10px] text-stone-400 italic">
                        * Modal ini akan muncul satu kali per sesi browser untuk setiap pengguna ketika baru masuk ke halaman utama.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Preview Area -->
                <div class="mt-10">
                   <h3 class="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">Preview Tampilan</h3>
                   <div class="bg-stone-200 p-8 border-2 border-black border-dashed flex items-center justify-center">
                      <div class="bg-brand-cream border-4 border-black shadow-brutal p-6 w-full max-w-sm">
                         <div class="w-10 h-10 bg-brand-orange border-2 border-black shadow-brutal-sm flex items-center justify-center mb-4">
                            <Megaphone class="w-5 h-5 text-white" />
                         </div>
                         <h4 class="font-display font-bold text-xl mb-2">{{ announcementConfig.title || 'Judul Kosong' }}</h4>
                         <p class="text-xs text-stone-600 line-clamp-3 mb-4">{{ announcementConfig.content || 'Isi pesan akan tampil di sini...' }}</p>
                         <div v-if="announcementConfig.button_text" class="px-4 py-2 bg-brand-red text-white border-2 border-black text-[10px] font-bold uppercase text-center w-full">
                            {{ announcementConfig.button_text }}
                         </div>
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- More categories coming soon -->
          <div class="py-10 border-t-2 border-black border-dashed">
            <p class="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
              Pengaturan Tambahan Akan Datang
            </p>
          </div>
        </template>
      </div>
    </main>

    <!-- Toast Notification --></div>
</template>

<style scoped>
.shadow-brutal {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal-sm {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
</style>
