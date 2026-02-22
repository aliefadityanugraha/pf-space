<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import PageLayout from '@/components/PageLayout.vue'
import ArchiveCard from '@/components/ArchiveCard.vue'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, User, Film, MapPin, Globe, 
  Instagram, Linkedin, Award, Eye, 
  ExternalLink, Briefcase
} from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

const route = useRoute()
const loading = ref(true)
const user = ref(null)
const films = ref([])
const error = ref(null)

useHead({
  title: () => user.value ? `${user.value.name} - Filmmaker Portfolio` : 'Filmmaker Portfolio'
})

const fetchProfile = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/api/users/${route.params.id}`)
    const u = res.data || {}
    u.image = assetUrl(u.image)
    user.value = u
    
    const userFilms = Array.isArray(res.data?.films) ? res.data.films : []
    films.value = userFilms.map(f => ({
      ...f,
      gambar_poster: assetUrl(f.gambar_poster),
    }))
  } catch (err) {
    console.error('Failed to fetch profile:', err)
    error.value = 'Pengguna tidak ditemukan atau terjadi kesalahan'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfile)
watch(() => route.params.id, fetchProfile)
</script>

<template>
  <PageLayout>
    <div v-if="loading" class="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
       <div class="w-24 h-24 rounded-full bg-stone-200 animate-pulse border-2 border-black mb-4"></div>
       <div class="h-8 w-48 bg-stone-200 animate-pulse mb-6"></div>
       <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div v-for="i in 3" :key="i" class="h-32 bg-stone-100 animate-pulse border-2 border-dashed border-stone-300 rounded-xl"></div>
       </div>
    </div>

    <div v-else-if="user" class="max-w-7xl mx-auto px-4 pb-20">
      <!-- 1. HERO PORTFOLIO -->
      <section class="mb-12">
        <div class="relative bg-white border-4 border-black shadow-[12px_12px_0px_#000] p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          <!-- Profile Badge -->
          <div class="absolute -top-4 -right-4 bg-brand-teal text-white border-2 border-black px-4 py-1 font-black uppercase text-xs rotate-3 shadow-brutal-xs">
            {{ user.role_id === 2 ? 'Official Creator' : 'PF Contributor' }}
          </div>

          <!-- Left: Image -->
          <div class="shrink-0">
             <div class="w-32 h-32 md:w-48 md:h-48 border-4 border-black shadow-[6px_6px_0px_#000] overflow-hidden bg-brand-yellow">
                <img v-if="user.image" :src="user.image" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-6xl font-black text-black">
                   {{ user.name.charAt(0) }}
                </div>
             </div>
          </div>

          <!-- Center: Info -->
          <div class="flex-1">
             <h1 class="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">{{ user.name }}</h1>
             
             <div class="flex flex-wrap items-center gap-4 text-stone-500 font-bold text-xs uppercase mb-6">
                <div v-if="user.location" class="flex items-center gap-1.5">
                   <MapPin class="w-3.5 h-3.5 text-brand-red" /> {{ user.location }}
                </div>
                <div class="flex items-center gap-1.5">
                   <Calendar class="w-3.5 h-3.5 text-stone-400" /> Sejak {{ new Date(user.created_at).getFullYear() }}
                </div>
                <div v-if="user.website" class="flex items-center gap-1.5 text-stone-900">
                   <Globe class="w-3.5 h-3.5" /> 
                   <a :href="user.website" target="_blank" class="hover:underline">Website</a>
                </div>
             </div>

             <p class="text-stone-800 font-medium leading-relaxed max-w-2xl mb-8">
                {{ user.bio || 'Filmmaker dan kontributor di PF Space. Fokus pada pengembangan karya sinematik yang bermakna.' }}
             </p>

             <!-- Social Links -->
             <div class="flex items-center gap-3">
                <a v-if="user.instagram" :href="`https://instagram.com/${user.instagram}`" target="_blank" class="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-stone-100 transition-colors shadow-brutal-xs">
                   <Instagram class="w-5 h-5 text-stone-950" />
                </a>
                <a v-if="user.linkedin" :href="user.linkedin" target="_blank" class="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-stone-100 transition-colors shadow-brutal-xs">
                   <Linkedin class="w-5 h-5 text-stone-950" />
                </a>
             </div>
          </div>

          <!-- Right: Stats -->
          <div class="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0 w-full md:w-auto">
             <div class="bg-stone-50 border-2 border-black p-4 flex flex-col items-center">
                <span class="text-3xl font-black">{{ user.stats.totalFilms }}</span>
                <span class="text-[10px] font-black uppercase text-stone-400">Total Karya</span>
             </div>
             <div class="bg-stone-50 border-2 border-black p-4 flex flex-col items-center">
                <span class="text-3xl font-black">{{ user.stats.totalViews }}</span>
                <span class="text-[10px] font-black uppercase text-stone-400">Total Views</span>
             </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
         <!-- Sidebar Skills -->
         <aside class="lg:col-span-1 space-y-10">
            <div>
               <div class="flex items-center gap-2 mb-6">
                  <div class="bg-brand-yellow p-1.5 border-2 border-black">
                     <Award class="w-4 h-4" />
                  </div>
                  <h3 class="font-black uppercase text-sm tracking-widest">Keahlian Utama</h3>
               </div>
               <div v-if="user.topSkills && user.topSkills.length > 0" class="flex flex-wrap gap-2">
                  <span v-for="skill in user.topSkills" :key="skill" class="bg-stone-100 border-2 border-black px-3 py-1 text-[10px] font-black uppercase">
                     {{ skill }}
                  </span>
               </div>
               <p v-else class="text-[10px] text-stone-400 font-bold uppercase italic">Berdasarkan credit film</p>
            </div>

            <div class="p-6 bg-brand-teal/10 border-2 border-brand-teal border-dashed rounded-lg">
               <div class="flex items-center gap-2 mb-4">
                  <Briefcase class="w-4 h-4 text-brand-teal" />
                  <h3 class="font-black uppercase text-xs text-brand-teal">Kolaborasi?</h3>
               </div>
               <p class="text-xs text-stone-600 font-medium leading-loose mb-6">Terbuka untuk kolaborasi kreatif dan proyek film baru.</p>
               <a :href="`mailto:${user.email}`" class="block text-center bg-black text-white text-[10px] font-black uppercase py-2 tracking-widest hover:bg-brand-teal transition-colors">
                  Hubungi Kreator
               </a>
            </div>
         </aside>

         <!-- Main Gallery -->
         <div class="lg:col-span-3">
            <div class="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
               <div class="flex items-center gap-3">
                  <Film class="w-6 h-6" />
                  <h2 class="text-2xl font-black uppercase tracking-tighter">Showcase Karya</h2>
               </div>
            </div>

            <div v-if="films.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
               <ArchiveCard 
                 v-for="film in films" 
                 :key="film.film_id" 
                 :archive="film" 
                 @click="$router.push(`/archive/${film.slug}`)"
                 class="cursor-pointer h-full border-2 border-black shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
               />
            </div>
            
            <div v-else class="text-center py-20 bg-white border-4 border-black border-dashed">
               <Film class="w-16 h-16 text-stone-200 mx-auto mb-4" />
               <p class="text-stone-400 font-black uppercase tracking-widest text-sm">Belum ada karya yang dipublikasikan.</p>
            </div>
         </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-32 text-center">
       <div class="inline-block p-6 bg-red-50 border-4 border-red-600 shadow-brutal mb-6">
          <Eye class="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 class="text-2xl font-black uppercase mb-2">Profil Tidak Ditemukan</h2>
          <p class="text-red-700 font-medium">{{ error }}</p>
       </div>
       <div>
          <button @click="$router.back()" class="bg-black text-white px-8 py-3 font-black uppercase tracking-widest hover:bg-stone-800 transition-colors">Kembali</button>
       </div>
    </div>
  </PageLayout>
</template>
