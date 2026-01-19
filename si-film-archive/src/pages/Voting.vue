<script setup>
import { ref, computed, onMounted } from 'vue'
import { ThumbsUp, Trophy, Film, TrendingUp, Clock, Filter, ChevronUp, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import FilmCard from '@/components/FilmCard.vue'
import Toast from '@/components/Toast.vue'
import { useVoting } from '@/composables/useVoting'
import { useToast } from '@/composables/useToast'

const { films, categories, isLoading, fetchFilms, voteFilm } = useVoting()

const selectedCategory = ref('all')
const sortBy = ref('votes')
const votingId = ref(null)
const { toast, showToast } = useToast()

onMounted(() => {
  fetchFilms()
})

const filteredFilms = computed(() => {
  let result = [...films.value]
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(f => f.category === selectedCategory.value)
  }
  
  if (sortBy.value === 'votes') {
    result.sort((a, b) => b.votes - a.votes)
  } else if (sortBy.value === 'year') {
    result.sort((a, b) => a.year - b.year)
  } else if (sortBy.value === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title))
  }
  
  return result
})

const topThree = computed(() => {
  return [...films.value].sort((a, b) => b.votes - a.votes).slice(0, 3)
})

const vote = async (film) => {
  if (!film.hasVoted) {
    votingId.value = film.id
    const result = await voteFilm(film.id)
    votingId.value = null
    
    if (result.success) {
      showToast('Terima kasih atas voting Anda!', 'success')
    } else {
      if (result.error === 'unauthorized') {
        showToast('Silakan login untuk memberikan voting', 'error')
      } else {
        showToast(result.message || 'Gagal memberikan voting', 'error')
      }
    }
  }
}

const getRankBadgeClass = (index) => {
  if (index === 0) return 'bg-yellow-400 text-stone-900'
  if (index === 1) return 'bg-stone-400 text-stone-900'
  if (index === 2) return 'bg-amber-600 text-white'
  return 'bg-stone-200 text-stone-700'
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />
    
    <Toast 
      v-if="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
    
    <main class="pt-28 pb-16">
      <div class="max-w-7xl mx-auto px-4 md:px-8">
        
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 bg-brand-red border-2 border-stone-900 shadow-brutal px-4 py-1 mb-4">
            <Trophy class="w-5 h-5 text-white" />
            <span class="font-body text-white text-sm font-bold uppercase tracking-widest">Pilihan Komunitas</span>
          </div>
          <h1 class="font-heading text-5xl md:text-7xl text-stone-900 tracking-wide mb-4">
            PILIH KARYA FAVORITMU
          </h1>
          <p class="font-body text-stone-600 text-lg max-w-2xl mx-auto">
            Bantu kami mengkurasi arsip terbaik. Beri suara untuk film yang layak diarsipkan dan dirayakan.
          </p>
        </div>

        <div v-if="isLoading && films.length === 0" class="flex justify-center py-20">
          <Loader2 class="w-12 h-12 animate-spin text-brand-orange" />
        </div>

        <template v-else>
          <!-- Top 3 Podium -->
          <div v-if="topThree.length > 0" class="mb-16">
            <h2 class="font-display text-2xl text-stone-900 mb-6 text-center">Peringkat Sementara</h2>
            <div class="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6">
              <!-- 2nd Place -->
              <div v-if="topThree[1]" class="order-2 md:order-1 w-full md:w-56">
                <div class="bg-white border-2 border-stone-900 shadow-brutal p-4 text-center">
                  <div class="w-12 h-12 bg-stone-400 border-2 border-stone-900 mx-auto mb-3 flex items-center justify-center">
                    <span class="font-heading text-2xl text-stone-900">2</span>
                  </div>
                  <img :src="topThree[1].image" :alt="topThree[1].title" class="w-full aspect-[2/3] object-cover border-2 border-stone-900 mb-3" />
                  <h3 class="font-display text-lg text-stone-900 truncate">{{ topThree[1].title }}</h3>
                  <p class="font-body text-sm text-stone-500">{{ topThree[1].year }}</p>
                  <div class="flex items-center justify-center gap-1 mt-2">
                    <ThumbsUp class="w-4 h-4 text-brand-teal" />
                    <span class="font-body font-bold text-stone-900">{{ topThree[1].votes.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 1st Place -->
              <div v-if="topThree[0]" class="order-1 md:order-2 w-full md:w-64">
                <div class="bg-white border-2 border-stone-900 shadow-brutal-lg p-4 text-center relative">
                  <div class="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div class="w-14 h-14 bg-yellow-400 border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center">
                      <Trophy class="w-7 h-7 text-stone-900" />
                    </div>
                  </div>
                  <div class="pt-8">
                    <img :src="topThree[0].image" :alt="topThree[0].title" class="w-full aspect-[2/3] object-cover border-2 border-stone-900 mb-3" />
                    <h3 class="font-display text-xl text-stone-900 truncate">{{ topThree[0].title }}</h3>
                    <p class="font-body text-sm text-stone-500">{{ topThree[0].year }}</p>
                    <div class="flex items-center justify-center gap-1 mt-2">
                      <ThumbsUp class="w-5 h-5 text-brand-teal" />
                      <span class="font-body font-bold text-lg text-stone-900">{{ topThree[0].votes.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 3rd Place -->
              <div v-if="topThree[2]" class="order-3 w-full md:w-52">
                <div class="bg-white border-2 border-stone-900 shadow-brutal p-4 text-center">
                  <div class="w-12 h-12 bg-amber-600 border-2 border-stone-900 mx-auto mb-3 flex items-center justify-center">
                    <span class="font-heading text-2xl text-white">3</span>
                  </div>
                  <img :src="topThree[2].image" :alt="topThree[2].title" class="w-full aspect-[2/3] object-cover border-2 border-stone-900 mb-3" />
                  <h3 class="font-display text-lg text-stone-900 truncate">{{ topThree[2].title }}</h3>
                  <p class="font-body text-sm text-stone-500">{{ topThree[2].year }}</p>
                  <div class="flex items-center justify-center gap-1 mt-2">
                    <ThumbsUp class="w-4 h-4 text-brand-teal" />
                    <span class="font-body font-bold text-stone-900">{{ topThree[2].votes.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col md:flex-row gap-4 mb-8">
            <!-- Category Filter -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="selectedCategory = cat.id"
                :class="[
                  'px-4 py-2 border-2 border-stone-900 font-body text-sm font-bold uppercase tracking-wide transition-all',
                  selectedCategory === cat.id 
                    ? 'bg-brand-teal text-white shadow-brutal-sm' 
                    : 'bg-white text-stone-700 hover:bg-stone-100'
                ]"
              >
                {{ cat.name }}
              </button>
            </div>
            
            <!-- Sort -->
            <div class="flex items-center gap-2 md:ml-auto">
              <Fi2lter class="w-4 h-4 text-stone-500" />
              <select 
                v-model="sortBy"
                class="bg-white border-2 border-stone-900 px-3 py-2 font-body text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="votes">Suara Terbanyak</option>
                <option value="year">Terlama Lebih Dulu</option>
                <option value="title">Judul A-Z</option>
              </select>
            </div>
          </div>

          <!-- Film Grid -->
          <div v-if="filteredFilms.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FilmCard 
              v-for="(film, index) in filteredFilms" 
              :key="film.id"
              :film="film"
              :subtitle="`${film.director} · ${film.year}`"
              :show-play-overlay="false"
              class="hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg"
            >
              <template #overlay>
                <Badge :class="['absolute top-2 left-2 border-2 border-stone-900', getRankBadgeClass(films.findIndex(f => f.id === film.id))]">
                  #{{ films.sort((a, b) => b.votes - a.votes).findIndex(f => f.id === film.id) + 1 }}
                </Badge>
              </template>

              <template #extra-content>
                <Badge variant="outline" class="text-xs mb-3">{{ film.categoryName }}</Badge>
              </template>

              <template #actions>
                <div class="flex items-center justify-between w-full border-t-2 border-stone-200 pt-3">
                  <div class="flex items-center gap-2">
                    <TrendingUp class="w-4 h-4 text-brand-teal" />
                    <span class="font-body font-bold text-stone-900">{{ film.votes.toLocaleString() }}</span>
                    <span class="font-body text-xs text-stone-500">suara</span>
                  </div>
                  
                  <Button
                    @click.stop="vote(film)"
                    :disabled="film.hasVoted || votingId === film.id"
                    :class="[
                      'border-2 border-stone-900 transition-all',
                      film.hasVoted 
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed' 
                        : 'bg-brand-red text-white shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                    ]"
                    size="sm"
                  >
                    <Loader2 v-if="votingId === film.id" class="w-4 h-4 mr-1 animate-spin" />
                    <ChevronUp v-else class="w-4 h-4 mr-1" />
                    {{ film.hasVoted ? 'Sudah Vote' : 'Vote' }}
                  </Button>
                </div>
              </template>
            </FilmCard>
          </div>
          
          <div v-else class="text-center py-12 border-2 border-stone-900 border-dashed bg-white/40">
            <Film class="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 class="font-body text-lg font-bold text-stone-800 mb-2">
              Belum ada film di kategori ini
            </h3>
            <p class="font-body text-stone-500 mb-4">
              Coba pilih kategori lain atau lihat semua film yang bisa kamu vote.
            </p>
            <Button
              variant="outline"
              class="border-2 border-stone-900 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              @click="selectedCategory = 'all'"
            >
              Lihat Semua Film
            </Button>
          </div>
        </template>

        <!-- Call to Action -->
        <div class="mt-16 bg-stone-900 border-2 border-stone-900 p-8 md:p-12 text-center">
          <Film class="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h2 class="font-heading text-3xl md:text-4xl text-white tracking-wide mb-4">
            BELUM ADA FILM FAVORITMU?
          </h2>
          <p class="font-body text-stone-400 mb-6 max-w-lg mx-auto">
            Ajukan film untuk ditambahkan ke koleksi voting dan bantu memperkaya arsip.
          </p>
          <Button class="bg-brand-orange text-stone-900 border-2 border-white shadow-brutal-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all px-6 py-3 h-auto">
            <span class="font-body font-bold uppercase tracking-wide">Ajukan Film</span>
          </Button>
        </div>

      </div>
    </main>

    <Footer />
  </div>
</template>
