<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import PageLayout from '@/components/PageLayout.vue'
import ArchiveCard from '@/components/ArchiveCard.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, Film } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

const route = useRoute()
const loading = ref(true)
const user = ref(null)
const films = ref([])
const error = ref(null)

const fetchProfile = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/api/users/${route.params.id}`)
    user.value = res.data
    films.value = res.data.films || []
    
    useHead({
      title: `${user.value.name} - Profil Kontributor`
    })
  } catch (err) {
    console.error('Failed to fetch profile:', err)
    error.value = 'Pengguna tidak ditemukan atau terjadi kesalahan'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfile)

// Refetch if route changes
watch(() => route.params.id, fetchProfile)
</script>

<template>
  <PageLayout>
    <!-- Profile Header -->
    <div v-if="loading" class="mb-12 flex flex-col items-center justify-center py-12">
      <div class="w-32 h-32 rounded-full bg-stone-200 animate-pulse mb-4 border-2 border-black"></div>
      <div class="h-8 w-48 bg-stone-200 animate-pulse mb-2"></div>
      <div class="h-4 w-32 bg-stone-200 animate-pulse"></div>
    </div>
    
    <div v-else-if="user" class="mb-12">
      <Card class="max-w-7xl mx-auto bg-white border-2 border-black shadow-brutal overflow-hidden">
        <div class="h-32 bg-stone-100 border-b-2 border-black relative overflow-hidden">
            <!-- Decorative pattern -->
            <div class="absolute inset-0 opacity-[0.1]" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 16px 16px;"></div>
        </div>
        <CardContent class="relative px-6 pb-6 pt-0 text-center">
          <div class="-mt-16 mb-4 flex justify-center">
             <div class="w-32 h-32 rounded-full border-4 border-white shadow-brutal bg-white overflow-hidden flex items-center justify-center">
                <img 
                    v-if="user.image" 
                    :src="user.image" 
                    :alt="user.name"
                    class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-brand-yellow flex items-center justify-center text-stone-900">
                    <span class="text-4xl font-bold font-display">{{ user.name.charAt(0).toUpperCase() }}</span>
                </div>
             </div>
          </div>
          
          <h1 class="text-3xl font-bold font-display mb-2">{{ user.name }}</h1>
          
          <div class="flex items-center justify-center gap-4 text-stone-500 text-sm mb-6">
            <div class="flex items-center gap-1 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              <User class="w-3.5 h-3.5" />
              <span>{{ user.role_id === 2 ? 'Kreator' : 'Anggota' }}</span>
            </div>
            <div class="flex items-center gap-1 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              <Calendar class="w-3.5 h-3.5" />
              <span>Bergabung {{ new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20">
      <h2 class="text-xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
      <p class="text-stone-600">{{ error }}</p>
    </div>

    <!-- Films Grid -->
    <div v-if="user" class="max-w-7xl mx-auto px-4">
      <div class="flex items-center gap-3 mb-8">
        <div class="bg-brand-red text-white p-2 border-2 border-black shadow-sm">
          <Film class="w-5 h-5" />
        </div>
        <h2 class="text-2xl font-bold font-display">Daftar Karya</h2>
        <span class="bg-stone-200 px-3 py-1 rounded-full text-sm font-bold border-2 border-black">
          {{ films.length }}
        </span>
      </div>

      <div v-if="films.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ArchiveCard 
          v-for="film in films" 
          :key="film.film_id" 
          :archive="film" 
          @click="$router.push(`/archive/${film.slug}`)"
          class="cursor-pointer h-full"
        />
      </div>
      
      <div v-else class="text-center py-12 bg-white border-2 border-dashed border-stone-300 rounded-lg">
        <Film class="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <p class="text-stone-500 font-medium">Belum ada karya yang dipublikasikan.</p>
      </div>
    </div>
  </PageLayout>
</template>
