<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import FilmCard from '@/components/FilmCard.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Film, Play, User, Calendar, Loader2, TrendingUp, Clock, ArrowRight } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'
import VotingCTABanner from '@/components/VotingCTABanner.vue'

useHead({
  title: 'PF Space - Eksplorasi Arsip Film Mahasiswa',
  meta: [
    { name: 'description', content: 'Platform kearsipan film mahasiswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik.' },
    { property: 'og:title', content: 'PF Space - Arsip Film' },
    { property: 'og:description', content: 'Eksplorasi mahakarya film mahasiswa dan akses aset pembelajarannya.' },
    { property: 'og:image', content: '/banner.jpg' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
})

const router = useRouter()
const heroRef = ref(null)
const isLightTitle = ref(true)

// Data
const latestFilms = ref([])
const trendingFilms = ref([])
const categories = ref([])
const loading = ref(true)

const handleScroll = () => {
  if (heroRef.value) {
    const heroHeight = heroRef.value.$el?.offsetHeight || heroRef.value.offsetHeight || 600
    isLightTitle.value = window.scrollY < heroHeight - 80
  }
}

// Fetch data
const fetchData = async () => {
  loading.value = true
  try {
    const [filmsRes, trendingRes, categoriesRes] = await Promise.all([
      api.get('/api/films/latest?limit=6'),
      api.get('/api/votes/trending?period=week&limit=6'),
      api.get('/api/categories/with-count')
    ])
    
    latestFilms.value = filmsRes.data || []
    trendingFilms.value = trendingRes.data || []
    categories.value = categoriesRes.data || []
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
}

const goToDetail = (slug) => {
  router.push(`/film/${slug}`)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen  bg-[#F2EEE3]">
    <Navbar :light-title="isLightTitle" />
    <HeroSection ref="heroRef" />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
    </div>

    <template v-else>

      <!-- Latest Films Section -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <SectionHeader 
          title="Film Terbaru" 
          subtitle="Karya terbaru dari para kreator"
          :light-text="false"
        />
        
         <!-- Empty State -->
        <div v-if="latestFilms.length === 0" class="text-center py-12">
          <Film class="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <p class="text-stone-500">Belum ada film yang dipublikasi</p>
        </div>

        <!-- Films Grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <FilmCard 
            v-for="film in latestFilms" 
            :key="film.film_id"
            :film="film"
            @click="goToDetail(film.slug)"
            class="cursor-pointer"
          >
            <template #overlay>
              <Badge v-if="film.tahun_karya" class="absolute top-2 left-2 bg-black/70 text-white text-xs">
                {{ film.tahun_karya }}
              </Badge>
            </template>
            <template #subtitle-icon>
              <User class="w-3 h-3" />
            </template>
          </FilmCard>
        </div>
      </section>

      <VotingCTABanner />

      <!-- Trending Films Section -->
      <section v-if="trendingFilms.length > 0" class="w-full py-12">
        <div class="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeader 
            title="Trending Minggu Ini" 
            subtitle="Film dengan vote terbanyak"
            :light-text="false"
          />
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              v-for="(film, index) in trendingFilms" 
              :key="film.film_id"
              class="overflow-hidden cursor-pointer bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              @click="goToDetail(film.slug)"
            >
              <div class="flex gap-4 p-4">
                <!-- Rank -->
                <div class="flex-shrink-0 w-10 h-10 bg-brand-red text-white font-bold flex items-center justify-center border-2 border-black shadow-sm">
                  {{ index + 1 }}
                </div>
                <!-- Poster -->
                <div class="w-16 h-24 bg-stone-200 flex-shrink-0 overflow-hidden border-2 border-black shadow-sm">
                  <img 
                    v-if="film.gambar_poster" 
                    :src="film.gambar_poster" 
                    :alt="film.judul"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Film class="w-6 h-6 text-stone-400" />
                  </div>
                </div>
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold line-clamp-1 mb-1">{{ film.judul }}</h3>
                  <p class="text-sm text-stone-500 mb-2">{{ film.creator?.name || 'Unknown' }}</p>
                  <div class="flex items-center gap-2">
                    <Badge variant="secondary" class="gap-1">
                      <TrendingUp class="w-3 h-3" />
                      {{ film.vote_count }} votes
                    </Badge>
                    <Badge v-if="film.category" variant="outline">
                      {{ film.category.nama_kategori }}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- View All Button -->
          <div class="text-center mt-8">
            <Button variant="outline" @click="router.push('/voting')" class="gap-2 border-2 border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
              Lihat Semua Trending
              <ArrowRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section v-if="categories.length > 0" class="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <SectionHeader 
          title="Jelajahi Kategori" 
          subtitle="Temukan film berdasarkan kategori"
          :light-text="false"
        />
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card 
            v-for="category in categories" 
            :key="category.category_id"
            class="cursor-pointer bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <CardContent class="p-4 text-center">
              <div class="w-12 h-12 mx-auto mb-3 bg-brand-teal/10 rounded-full flex items-center justify-center border-2 border-black shadow-sm">
                <Film class="w-6 h-6 text-brand-teal" />
              </div>
              <h3 class="font-bold text-sm mb-1">{{ category.nama_kategori }}</h3>
              <p class="text-xs text-stone-500">{{ category.film_count || 0 }} film</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <Card class="bg-gradient-to-r from-brand-teal to-teal-600 text-white border-2 border-black shadow-brutal">
          <CardContent class="p-8 md:p-12 text-center">
            <h2 class="text-3xl md:text-4xl font-display mb-4 text-white">Punya Karya Film?</h2>
            <p class="text-lg opacity-90 mb-6 max-w-2xl mx-auto text-white">
              Upload karya filmmu dan bagikan ke komunitas. Dapatkan feedback dan vote dari penonton.
            </p>
            <Button 
              size="lg" 
              class="bg-white text-brand-teal hover:bg-stone-100 gap-2 shadow-brutal-sm border-2 border-black"
              @click="router.push('/upload')"
            >
              <Film class="w-5 h-5" />
              Upload Film Sekarang
            </Button>
          </CardContent>
        </Card>
      </section>
    </template>

    <Footer />
  </div>
</template>
