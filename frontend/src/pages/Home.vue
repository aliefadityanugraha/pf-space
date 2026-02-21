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

    <!-- Global Loading removed in favor of section-based skeletons -->

    <!-- Latest Films Section -->
    <section class="max-w-7xl mx-auto px-4 md:px-8">
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
      <TrendingBanner />
    </ErrorBoundary>

    <!-- Trending Section -->
    <section v-if="loading || trendingFilms.length > 0" class="w-full py-12">
      <div class="max-w-7xl mx-auto px-4 md:px-8">
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
              class="overflow-hidden cursor-pointer bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              @click="goToDetail(film.slug)"
            >
              <div class="flex gap-4 p-4">
                <!-- Rank -->
                <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-brand-red text-white text-sm md:text-base font-bold flex items-center justify-center border-2 border-black shadow-sm">
                  {{ index + 1 }}
                </div>
                <!-- Poster -->
                <div class="w-12 h-20 md:w-16 md:h-24 bg-stone-200 flex-shrink-0 overflow-hidden border-2 border-black shadow-sm">
                  <img 
                    v-if="film.gambar_poster" 
                    :src="assetUrl(film.gambar_poster)" 
                    :alt="film.judul"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
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
                    <Badge variant="secondary" class="gap-1 h-5 md:h-6 text-[9px] md:text-xs">
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
          <Button variant="outline" @click="router.push('/trending')" class="gap-2 border-2 border-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
            Lihat Semua Populer
            <ArrowRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>

    <!-- Community Discussion Section -->
    <ErrorBoundary name="Diskusi Komunitas">
      <CommunityDiscussion />
    </ErrorBoundary>

    <!-- Categories Section -->
    <section v-if="loading || categories.length > 0" class="max-w-7xl mx-auto px-4 md:px-8 py-12">
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
              <h3 class="font-bold text-[11px] md:text-sm mb-0.5 md:mb-1">{{ category.nama_kategori }}</h3>
              <p class="text-[10px] text-stone-500">{{ category.film_count || 0 }} karya</p>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </section>

    <!-- CTA Section -->
    <section class="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <Card class="bg-gradient-to-r from-brand-teal to-teal-600 text-white border-2 border-black shadow-brutal">
        <CardContent class="p-6 md:p-12 text-center">
          <h2 class="text-2xl md:text-4xl font-display mb-3 md:mb-4 text-white">Punya Karya?</h2>
          <p class="text-sm md:text-lg opacity-90 mb-6 max-w-2xl mx-auto text-white">
            Upload karyamu dan bagikan ke komunitas. Dapatkan feedback dan vote dari penonton.
          </p>
          <div class="flex justify-center">
            <Button 
              size="sm" 
              class="bg-white text-brand-teal hover:bg-stone-100 gap-2 shadow-brutal-sm border-2 border-black md:h-12 md:px-8 md:text-base font-bold"
              @click="router.push('/upload')"
            >
              <Film class="w-4 h-4 md:w-5 md:h-5" />
              Upload Karya
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>

    <Footer />
  </div>
</template>
