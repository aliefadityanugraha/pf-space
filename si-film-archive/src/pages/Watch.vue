<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Film, Play, User, Calendar, Loader2, Heart, 
  ArrowLeft, ChevronRight, ExternalLink, Share2, Bookmark
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const filmSlug = computed(() => route.params.slug)

const { user, isLoggedIn } = useAuth()

// Data
const film = ref(null)
const loading = ref(true)
const relatedFilms = ref([])
const voteData = ref({ vote_count: 0, has_voted: false })
const voting = ref(false)

// Film ID computed (after film is fetched)
const filmId = computed(() => film.value?.film_id)

// Fetch film detail by slug
const fetchFilm = async () => {
  if (!filmSlug.value) {
    router.push('/')
    return
  }
  
  loading.value = true
  try {
    const [filmRes, relatedRes] = await Promise.all([
      api.get(`/api/films/${filmSlug.value}`),
      api.get('/api/films/latest?limit=5')
    ])
    
    film.value = filmRes.data
    // Filter out current film from related
    relatedFilms.value = (relatedRes.data || []).filter(f => f.film_id !== film.value?.film_id)
    
    fetchVoteData()
  } catch (err) {
    console.error('Failed to fetch film:', err)
    router.push('/')
  } finally {
    loading.value = false
  }
}

// Fetch vote data
const fetchVoteData = async () => {
  if (!filmId.value) return
  try {
    const res = await api.get(`/api/votes/film/${filmId.value}`)
    voteData.value = res.data
  } catch (err) {
    console.error('Failed to fetch votes:', err)
  }
}

// Toggle vote
const toggleVote = async () => {
  if (!isLoggedIn.value) {
    router.push('/auth/login')
    return
  }
  if (!filmId.value) return
  
  voting.value = true
  try {
    const res = await api.post(`/api/votes/film/${filmId.value}/toggle`, {})
    voteData.value = {
      vote_count: res.data.vote_count,
      has_voted: res.data.voted
    }
  } catch (err) {
    console.error('Failed to vote:', err)
  } finally {
    voting.value = false
  }
}

// Get YouTube embed URL
const isYoutubeUrl = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`
  }
  return url
}

// Watch related film
const watchFilm = (slug) => {
  router.push(`/watch/${slug}`)
}

onMounted(fetchFilm)
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <!-- Simple Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 h-16 bg-[#F2EEE3]/95 backdrop-blur border-b-2 border-stone-300/50">
      <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            class="text-stone-600 hover:text-stone-900 hover:bg-stone-200"
            @click="router.back()"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div class="h-6 w-px bg-stone-300"></div>
          <router-link to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-brand-red border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center">
              <Film class="w-4 h-4 text-white" />
            </div>
            <span class="text-stone-900 font-display text-lg hidden sm:block">PF Space</span>
          </router-link>
        </div>
        
        <div v-if="film" class="hidden md:block text-center flex-1 px-4">
          <h1 class="text-stone-900 font-medium truncate">{{ film.judul }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            class="text-stone-600 hover:text-stone-900 hover:bg-stone-200"
          >
            <Share2 class="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            class="text-stone-600 hover:text-stone-900 hover:bg-stone-200"
          >
            <Bookmark class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
    </div>

    <template v-else-if="film">
      <!-- Main Content -->
      <div class="pt-16 flex flex-col lg:flex-row min-h-screen">
        <!-- Video Section -->
        <div class="flex-1 flex flex-col">
          <!-- Video Player -->
          <div class="w-full bg-black">
            <div class="max-w-[1400px] mx-auto">
              <div class="aspect-video">
                <iframe 
                  v-if="film.link_video_utama"
                  :src="getYoutubeEmbedUrl(film.link_video_utama)"
                  class="w-full h-full"
                  frameborder="0"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowfullscreen
                ></iframe>
                <div v-else class="w-full h-full flex items-center justify-center bg-stone-300">
                  <div class="text-center">
                    <Film class="w-16 h-16 text-stone-400 mx-auto mb-4" />
                    <p class="text-stone-500">Video tidak tersedia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Info -->
          <div class="flex-1 bg-[#F2EEE3] p-4 md:p-6">
            <div class="max-w-[1400px] mx-auto">
              <!-- Title & Actions -->
              <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div class="flex-1">
                  <h1 class="text-xl md:text-2xl font-bold text-stone-900 mb-2">{{ film.judul }}</h1>
                  <div class="flex flex-wrap items-center gap-3 text-sm text-stone-500">
                    <span class="flex items-center gap-1">
                      <User class="w-4 h-4" />
                      {{ film.creator?.name || 'Unknown' }}
                    </span>
                    <span v-if="film.tahun_karya" class="flex items-center gap-1">
                      <Calendar class="w-4 h-4" />
                      {{ film.tahun_karya }}
                    </span>
                    <Badge v-if="film.category" variant="secondary" class="bg-stone-200 text-stone-700">
                      {{ film.category.nama_kategori }}
                    </Badge>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <Button 
                    :variant="voteData.has_voted ? 'default' : 'outline'"
                    :class="voteData.has_voted ? 'bg-brand-red hover:bg-red-600 border-brand-red' : 'border-stone-400 text-stone-700 hover:bg-stone-200'"
                    @click="toggleVote"
                    :disabled="voting"
                  >
                    <Loader2 v-if="voting" class="w-4 h-4 mr-2 animate-spin" />
                    <Heart v-else :class="['w-4 h-4 mr-2', voteData.has_voted ? 'fill-current' : '']" />
                    {{ voteData.vote_count }}
                  </Button>
                  <Button 
                    variant="outline"
                    class="border-stone-400 text-stone-700 hover:bg-stone-200"
                    @click="router.push(`/film/${film.slug}`)"
                  >
                    Detail Film
                    <ChevronRight class="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              <!-- Synopsis -->
              <Card class="mb-6">
                <CardContent class="p-4">
                  <p class="text-stone-600 text-sm leading-relaxed">
                    {{ film.sinopsis || 'Tidak ada sinopsis.' }}
                  </p>
                </CardContent>
              </Card>

              <!-- Trailer Link -->
              <div v-if="film.link_trailer" class="mb-6">
                <a 
                  :href="film.link_trailer" 
                  target="_blank"
                  class="inline-flex items-center gap-2 text-brand-teal hover:underline text-sm"
                >
                  <ExternalLink class="w-4 h-4" />
                  Tonton Trailer
                </a>
              </div>

              <!-- Crew -->
              <div v-if="film.crew && film.crew.length > 0">
                <h3 class="text-stone-900 font-bold mb-3">Cast & Crew</h3>
                <div class="flex flex-wrap gap-2">
                  <div 
                    v-for="(item, idx) in film.crew" 
                    :key="idx" 
                    class="bg-stone-200 px-3 py-2 rounded text-sm"
                  >
                    <span class="text-stone-500">{{ item.jabatan }}:</span>
                    <span class="text-stone-800 ml-1">{{ item.anggota?.join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar - Related Films -->
        <div class="w-full lg:w-80 xl:w-96 bg-stone-100 border-t lg:border-t-0 lg:border-l-2 border-stone-300 p-4">
          <h3 class="text-stone-900 font-bold mb-4">Film Lainnya</h3>
          
          <div class="space-y-3">
            <div 
              v-for="related in relatedFilms" 
              :key="related.film_id"
              class="flex gap-3 p-2 rounded-lg hover:bg-stone-200 cursor-pointer transition-colors"
              @click="watchFilm(related.slug)"
            >
              <!-- Thumbnail -->
              <div class="w-40 h-24 bg-stone-300 flex-shrink-0 overflow-hidden rounded border border-stone-400">
                <img 
                  v-if="related.gambar_poster" 
                  :src="related.gambar_poster" 
                  :alt="related.judul"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Film class="w-8 h-8 text-stone-400" />
                </div>
              </div>
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h4 class="text-stone-900 text-sm font-medium line-clamp-2 mb-1">{{ related.judul }}</h4>
                <p class="text-stone-500 text-xs mb-1">{{ related.creator?.name }}</p>
                <p class="text-stone-400 text-xs">{{ related.tahun_karya }}</p>
              </div>
            </div>

            <div v-if="relatedFilms.length === 0" class="text-center py-8 text-stone-400">
              Tidak ada film lainnya
            </div>
          </div>

          <!-- View All -->
          <Button 
            variant="outline" 
            class="w-full mt-4 border-stone-400 text-stone-700 hover:bg-stone-200"
            @click="router.push('/')"
          >
            Lihat Semua Film
          </Button>
        </div>
      </div>
    </template>

    <Footer />
  </div>
</template>
