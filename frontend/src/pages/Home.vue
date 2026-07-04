<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import Navbar from '@/components/Navbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import ArchiveCarousel from '@/components/ArchiveCarousel.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Film, Play, User, Calendar, Loader2, TrendingUp, Clock, ArrowRight } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'
import TrendingBanner from '@/components/TrendingBanner.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import TrendingCardSkeleton from '@/components/TrendingCardSkeleton.vue'
import CategoryCardSkeleton from '@/components/CategoryCardSkeleton.vue'
import CommunityDiscussion from '@/components/CommunityDiscussion.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'



useHead({
  title: 'PF Space - Eksplorasi Arsip Karya Siswa',
  meta: [
    { name: 'description', content: 'Platform kearsipan karya siswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik.' },
    { property: 'og:title', content: 'PF Space - Arsip Karya' },
    { property: 'og:description', content: 'Eksplorasi mahakarya siswa dan akses aset pembelajarannya.' },
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
    const results = await Promise.allSettled([
      api.get('/api/films/latest?limit=10'),
      api.get('/api/votes/trending?period=week&limit=6'),
      api.get('/api/categories/with-count')
    ])
    
    // Handle Latest Films
    if (results[0].status === 'fulfilled') {
      latestFilms.value = results[0].value.data || []
    } else {
      console.error('Failed to fetch latest films:', results[0].reason)
    }

    // Handle Trending Films
    if (results[1].status === 'fulfilled') {
      trendingFilms.value = results[1].value.data || []
    } else {
      console.error('Failed to fetch trending films:', results[1].reason)
    }

    // Handle Categories
    if (results[2].status === 'fulfilled') {
      categories.value = results[2].value.data || []
    } else {
      console.error('Failed to fetch categories:', results[2].reason)
    }
  } catch (err) {
    console.error('Unexpected error during data fetch:', err)
  } finally {
    loading.value = false
  }
}

const goToDetail = (slug) => {
  router.push(`/archive/${slug}`)
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
  <div class="min-h-screen bg-brand-cream">
    <Navbar :light-title="isLightTitle" />
    <ErrorBoundary name="Hero Section">
      <HeroSection ref="heroRef" />
    </ErrorBoundary>

    <div class="relative bg-brand-cream overflow-hidden">
      <!-- Decorative background elements -->
      <!-- <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[100px] pointer-events-none"></div> -->
      <!-- <div class="absolute bottom-40 left-0 w-[400px] h-[400px] bg-brand-orange/10 rounded-full blur-[80px] pointer-events-none"></div> -->
      <!-- <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-200/50 to-transparent pointer-events-none"></div> -->

      <!-- Scratched/Texture Overlay Base -->
      <div class="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>

      <!-- Global Loading removed in favor of section-based skeletons -->

      <!-- Latest Films Section -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10">
      <SectionHeader 
        title="Karya Terbaru" 
        subtitle="Eksplorasi karya terbaru dari para kontributor"
        :light-text="false"
      />
      
      <ErrorBoundary name="Karya Terbaru">
        <!-- Archive Carousel -->
        <div v-if="!loading && latestFilms.length === 0" class="w-full">
          <EmptyState 
            title="Belum ada karya yang dipublikasi"
            description="Silahkan unggah karya pertamamu."
          />
        </div>
        <div v-else class="w-full">
          <ArchiveCarousel 
            :items="latestFilms" 
            :loading="loading" 
          />
        </div>
      </ErrorBoundary>
    </section>

    <ErrorBoundary name="Promo Section">
      <div class="relative z-10">
        <TrendingBanner />
      </div>
    </ErrorBoundary>

    <!-- Trending Section -->
    <section v-if="loading || trendingFilms.length > 0" class="w-full py-16 md:py-24 relative z-10">
      <!-- Background Pattern for Trending -->
      <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: radial-gradient(#1c1917 2px, transparent 2px); background-size: 32px 32px;"></div>
      
      <div class="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <SectionHeader 
          title="Trending" 
          subtitle="Karya dengan apresiasi terbanyak"
          :light-text="false"
        />
        
        <ErrorBoundary name="Trending Cards" :inline="true">
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TrendingCardSkeleton v-for="i in 3" :key="i" />
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              v-for="(film, index) in trendingFilms" 
              :key="film.film_id"
              class="overflow-hidden opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] cursor-pointer bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              :class="`stagger-${(index % 6) + 1}`"
              @animationend="$event.target.style.opacity = 1"
              @click="goToDetail(film.slug)"
            >
              <div class="flex gap-4 p-4">
                <!-- Rank -->
                <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-brand-red text-white text-sm md:text-base font-bold flex items-center justify-center border-2 border-black shadow-sm">
                  {{ index + 1 }}
                </div>
                <!-- Poster -->
                <div class="w-12 h-20 md:w-16 md:h-24 bg-stone-200 flex-shrink-0 overflow-hidden border-2 border-black shadow-sm relative">
                  <!-- Crossfade Loading Placeholder -->
                  <div class="absolute inset-0 bg-stone-300 animate-pulse flex items-center justify-center"></div>
                  <img 
                    v-if="film.gambar_poster" 
                    :src="assetUrl(film.gambar_poster)" 
                    :alt="film.judul"
                    loading="lazy"
                    onload="this.previousElementSibling.style.opacity = 0"
                    class="w-full h-full object-cover transition-opacity duration-300 z-10 relative"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center z-10 relative bg-stone-200">
                    <Film class="w-6 h-6 text-stone-400" />
                  </div>
                </div>
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-sm md:text-base line-clamp-1 mb-0.5 md:mb-1">{{ film.judul }}</h3>
                  <div class="text-[10px] md:text-sm text-stone-500 mb-1.5 md:mb-2 z-10 relative">
                    <router-link 
                      v-if="film.creator?.id"
                      :to="`/p/${film.creator.id}`"
                      class="hover:text-brand-teal hover:underline"
                      @click.stop
                    >
                      {{ film.creator?.name || 'Tanpa Nama' }}
                    </router-link>
                    <span v-else>{{ film.creator?.name || 'Tanpa Nama' }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 md:gap-2">
                    <Badge variant="secondary" class="gap-1 h-5 md:h-6 text-[10px] md:text-xs border border-stone-200">
                      <TrendingUp class="w-2.5 h-2.5 md:w-3 md:h-3" />
                      {{ film.vote_count }} <span class="hidden sm:inline">apresiasi</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ErrorBoundary>

        <!-- View All Button -->
        <div class="text-center mt-8">
          <Button variant="outline" @click="router.push('/trending')" class="h-10 md:h-12 px-6 gap-2 border-2 border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] font-bold uppercase tracking-wider text-xs">
            Lihat Semua Populer
            <ArrowRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>

    <!-- Community Discussion Section -->
    <ErrorBoundary name="Diskusi Komunitas">
      <div class="relative z-10 py-12 md:py-16">
        <CommunityDiscussion />
      </div>
    </ErrorBoundary>

    <!-- Categories Section -->
    <section v-if="loading || categories.length > 0" class="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10">
      <SectionHeader 
        title="Jelajahi Kategori" 
        subtitle="Temukan karya berdasarkan kategori"
        :light-text="false"
      />
      
      <ErrorBoundary name="Kategori">
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <CategoryCardSkeleton v-for="i in 6" :key="i" />
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card 
            v-for="category in categories" 
            :key="category.category_id"
            class="cursor-pointer bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <CardContent class="p-3 md:p-4 text-center">
              <div class="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 bg-brand-teal/10 rounded-full flex items-center justify-center border-2 border-black shadow-sm">
                <Film class="w-5 h-5 md:w-6 md:h-6 text-brand-teal" />
              </div>
              <h3 class="font-bold text-xs md:text-sm mb-0.5 md:mb-1 uppercase tracking-tighter">{{ category.nama_kategori }}</h3>
              <p class="text-[10px] md:text-xs text-stone-500 font-medium uppercase tracking-widest">{{ category.film_count || 0 }} karya</p>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </section>

    <!-- CTA Section -->
    <!-- <section class="w-full bg-stone-900 py-20 md:py-32 relative z-10 border-t-8 border-brand-red overflow-hidden">
      <div class="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="400" height="400" viewBox="0 0 100 100" class="animate-[spin_20s_linear_infinite]">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="#facc15" stroke-width="2"/>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#facc15" stroke-width="2"/>
        </svg>
      </div>
      
      <div class="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        <div class="bg-yellow-400 border-4 border-stone-900 shadow-[12px_12px_0_rgba(28,25,23,1)] md:shadow-[20px_20px_0_rgba(28,25,23,1)] rotate-1 hover:rotate-0 transition-transform duration-500 p-8 md:p-16 text-center">
          <Badge class="bg-stone-900 border-2 border-stone-900 text-yellow-400 font-black uppercase text-xs md:text-sm px-4 py-1.5 shadow-[4px_4px_0_rgba(255,255,255,1)] mb-6 transform -rotate-3">
            OPEN SUBMISSION
          </Badge>
          <h2 class="text-4xl md:text-6xl font-heading font-black mb-4 md:mb-6 text-stone-900 uppercase tracking-tight leading-none drop-shadow-[2px_2px_0_rgba(255,255,255,1)]">
            KARYAMU ADALAH MAHKOTA KAMI
          </h2>
          <p class="text-base md:text-xl font-mono opacity-90 mb-8 md:mb-10 max-w-2xl mx-auto text-stone-800 font-bold border-b-2 border-stone-900 inline-block pb-2">
            Unggah karyamu ke arsip utama. Dapatkan eksposur, feedback membangun dari komunitas, dan apresiasi yang layak.
          </p>
          <div class="flex justify-center mt-2">
            <Button 
              size="lg" 
              class="bg-brand-red text-white hover:bg-red-700 gap-3 shadow-[6px_6px_0_rgba(28,25,23,1)] border-2 border-stone-900 md:h-16 md:px-10 h-auto py-4 text-sm md:text-lg font-black uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_rgba(28,25,23,1)] transition-all rounded-none"
              @click="router.push('/upload')"
            >
              <Film class="w-5 h-5 md:w-6 md:h-6" />
              Upload Karya Sekarang!
            </Button>
          </div>
        </div>
      </div>
    </section> -->
    </div>

    <Footer class="bg-stone-900 !text-white !border-t-0" />
  </div>
</template>
