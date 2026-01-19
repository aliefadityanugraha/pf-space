<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import DashboardHero from '@/components/DashboardHero.vue'
import DashboardSection from '@/components/DashboardSection.vue'
import CuratedFilmCard from '@/components/CuratedFilmCard.vue'
import UserProfileCard from '@/components/UserProfileCard.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { formatDate } from '@/lib/format'
import { Clock, Loader2, Film as FilmIcon, MessageCircle, ThumbsUp } from 'lucide-vue-next'

const router = useRouter()
const { user } = useAuth()

const loading = ref(true)
const error = ref('')
const films = ref([])
const curatedFilms = ref([])
const summary = ref({
  totalFilms: 0,
  pending: 0,
  published: 0,
  rejected: 0,
  totalVotes: 0,
  totalComments: 0
})

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  published: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
}

const statusLabels = {
  pending: 'Menunggu Review',
  published: 'Dipublikasi',
  rejected: 'Ditolak'
}

const heroData = computed(() => {
  if (!films.value.length) {
    return {
      title: 'Selamat datang di Dashboard Kreator',
      category: 'PF Space',
      badge: 'Belum ada film',
      description: 'Upload film pertamamu untuk mulai memantau performa karya dan proses kurasi.',
      dueDate: '',
      backgroundImage: 'https://placehold.co/1028x480?text=PF+Space'
    }
  }

  const sorted = [...films.value].sort((a, b) => {
    const voteDiff = (b.vote_count || 0) - (a.vote_count || 0)
    if (voteDiff !== 0) return voteDiff
    return (b.comment_count || 0) - (a.comment_count || 0)
  })

  const best = sorted[0]

  return {
    title: best.judul,
    category: best.category?.nama_kategori || 'Karya Saya',
    badge: best.status === 'published' ? 'Sudah Dipublikasi' : best.status === 'pending' ? 'Menunggu Review' : 'Ditolak',
    description: `Film ini memiliki ${best.vote_count || 0} vote dan ${best.comment_count || 0} komentar.`,
    dueDate: best.updated_at ? formatDate(best.updated_at) : '',
    backgroundImage: best.gambar_poster || 'https://placehold.co/1028x480?text=PF+Space'
  }
})

const fetchDashboardData = async () => {
  loading.value = true
  error.value = ''
  try {
    const myFilmsRes = await api.get('/api/films/my-films', {
      params: { page: 1, limit: 50 }
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
            const voteCount = voteRes.data?.vote_count ?? 0
            const commentCount = commentRes.data?.comment_count ?? 0
            statsMap[filmId] = {
              vote_count: voteCount,
              comment_count: commentCount
            }
          } catch {
            statsMap[filmId] = {
              vote_count: 0,
              comment_count: 0
            }
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

    const totalFilms = merged.length
    const pending = merged.filter((f) => f.status === 'pending').length
    const published = merged.filter((f) => f.status === 'published').length
    const rejected = merged.filter((f) => f.status === 'rejected').length
    const totalVotes = merged.reduce((sum, f) => sum + (f.vote_count || 0), 0)
    const totalComments = merged.reduce((sum, f) => sum + (f.comment_count || 0), 0)

    summary.value = {
      totalFilms,
      pending,
      published,
      rejected,
      totalVotes,
      totalComments
    }

    const trendingRes = await api.get('/api/votes/trending', {
      params: { period: 'week', limit: 4 }
    })
    const trending = Array.isArray(trendingRes.data) ? trendingRes.data : trendingRes.data?.data || []
    curatedFilms.value = trending.map((film) => ({
      id: film.film_id,
      title: film.judul,
      year: film.tahun_karya,
      genre: film.category?.nama_kategori || 'Arsip PF Space'
    }))
  } catch {
    error.value = 'Gagal memuat data dashboard. Silakan coba beberapa saat lagi.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-12">
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 class="w-10 h-10 animate-spin text-brand-teal mb-4" />
        <p class="text-stone-500 font-mono text-xs tracking-[0.25em] uppercase">
          Memuat dashboard kreator...
        </p>
      </div>

      <template v-else>
        <DashboardHero 
          :title="heroData.title"
          :category="heroData.category"
          :badge="heroData.badge"
          :description="heroData.description"
          :due-date="heroData.dueDate"
          :background-image="heroData.backgroundImage"
          class="mb-12"
        />

        <div v-if="error" class="mb-6">
          <Card class="border-red-300 bg-red-50">
            <CardContent class="p-4 text-sm text-red-700">
              {{ error }}
            </CardContent>
          </Card>
        </div>

        <DashboardSection title="Ringkasan Kinerja Karya" class="mb-10">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card class="border-2 border-stone-900 shadow-brutal">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-stone-600">Total Film</span>
                  <FilmIcon class="w-5 h-5 text-stone-400" />
                </div>
                <p class="text-3xl font-display text-stone-900 mb-1">
                  {{ summary.totalFilms }}
                </p>
                <p class="text-xs text-stone-500">
                  {{ summary.published }} dipublikasi • {{ summary.pending }} menunggu • {{ summary.rejected }} ditolak
                </p>
              </CardContent>
            </Card>

            <Card class="border-2 border-stone-900 shadow-brutal">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-stone-600">Total Vote</span>
                  <ThumbsUp class="w-5 h-5 text-stone-400" />
                </div>
                <p class="text-3xl font-display text-stone-900 mb-1">
                  {{ summary.totalVotes }}
                </p>
                <p class="text-xs text-stone-500">
                  Akumulasi vote dari semua film yang sudah dipublikasi.
                </p>
              </CardContent>
            </Card>

            <Card class="border-2 border-stone-900 shadow-brutal">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-stone-600">Total Komentar</span>
                  <MessageCircle class="w-5 h-5 text-stone-400" />
                </div>
                <p class="text-3xl font-display text-stone-900 mb-1">
                  {{ summary.totalComments }}
                </p>
                <p class="text-xs text-stone-500">
                  Diskusi yang masuk di semua filmmu di PF Space.
                </p>
              </CardContent>
            </Card>
          </div>
        </DashboardSection>

        <DashboardSection title="Performa Setiap Film" link-text="Kelola di halaman Film Saya">
          <div v-if="films.length === 0" class="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center">
            <p class="text-lg font-display text-stone-800 mb-2">Belum ada film yang diupload.</p>
            <p class="text-sm text-stone-500 mb-4">
              Upload film pertamamu untuk mulai melihat statistik vote dan komentar.
            </p>
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 bg-stone-900 text-white text-sm font-medium border-2 border-stone-900 shadow-brutal hover:-translate-y-[2px] hover:-translate-x-[2px] transition-transform"
              @click="router.push('/upload')"
            >
              Upload Film
            </button>
          </div>

          <div v-else class="space-y-4">
            <Card
              v-for="film in films"
              :key="film.film_id"
              class="border-2 border-stone-900 shadow-brutal hover:-translate-y-[2px] hover:-translate-x-[2px] transition-transform"
            >
              <CardContent class="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex items-start gap-4">
                  <div class="w-14 h-20 bg-stone-200 border border-stone-400 flex items-center justify-center overflow-hidden">
                    <img
                      v-if="film.gambar_poster"
                      :src="film.gambar_poster"
                      :alt="film.judul"
                      class="w-full h-full object-cover"
                    />
                    <FilmIcon v-else class="w-6 h-6 text-stone-500" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-stone-900 line-clamp-1">
                        {{ film.judul }}
                      </h3>
                      <Badge :class="statusColors[film.status]">
                        {{ statusLabels[film.status] }}
                      </Badge>
                    </div>
                    <p class="text-xs text-stone-500 mb-1">
                      {{ film.category?.nama_kategori || 'Tanpa kategori' }} •
                      {{ film.tahun_karya || '-' }}
                    </p>
                    <p class="text-xs text-stone-400">
                      Diupdate {{ formatDate(film.updated_at || film.created_at, true) }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 md:gap-6">
                  <div class="text-center">
                    <p class="text-xs uppercase tracking-wider text-stone-500 mb-1">Vote</p>
                    <p class="text-2xl font-display text-stone-900">
                      {{ film.vote_count }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs uppercase tracking-wider text-stone-500 mb-1">Komentar</p>
                    <p class="text-2xl font-display text-stone-900">
                      {{ film.comment_count }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardSection>

        <UserProfileCard :name="user?.name || 'Kreator PF Space'" class="mb-12" />

        <div class="bg-stone-900 rounded-2xl p-6 md:p-8">
          <DashboardSection title="Kurasi Untukmu" :dark-mode="true">
            <template #header-right>
              <div class="flex items-center gap-2 text-stone-400">
                <Clock class="w-4 h-4" />
                <span class="text-sm font-body">Berbasis arsip dan vote terkini</span>
              </div>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <CuratedFilmCard 
                v-for="film in curatedFilms"
                :key="film.id"
                :title="film.title"
                :year="film.year"
                :genre="film.genre"
              />
            </div>
          </DashboardSection>
        </div>
      </template>
    </main>

    <Footer />
  </div>
</template>
