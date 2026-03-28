<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Ticket, Star, ArrowRight, Film } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Festival Mode - PF Space',
  meta: [
    { name: 'description', content: 'Eksibisi khusus karya sinematik siswa. Nikmati penayangan eksklusif!' }
  ]
})

const router = useRouter()
const latestFilms = ref([])
const loading = ref(true)
const mainFilm = ref(null)

const fetchFilms = async () => {
  try {
    const res = await api.get('/api/films/latest?limit=10')
    if (res.data && res.data.length > 0) {
      // Pick the first as main feature, rest as lineup
      mainFilm.value = res.data[0]
      latestFilms.value = res.data.slice(1)
    }
  } catch (err) {
    console.error('Failed to fetch festival films:', err)
  } finally {
    loading.value = false
  }
}

const goToDetail = (slug) => {
  router.push(`/archive/${slug}`)
}

const checkFestivalStatus = async () => {
  try {
    const res = await api.get('/api/settings/public')
    const festivalSetting = res.data?.find(s => s.key === 'festival_mode')
    if (!festivalSetting || !festivalSetting.value || !festivalSetting.value.is_active) {
      // Redirect if disabled
      router.replace('/')
      return false
    }
    return true
  } catch (err) {
    console.error('Failed to check festival status', err)
    return true // Optimistically load on error
  }
}

onMounted(async () => {
  const isActive = await checkFestivalStatus()
  if (isActive) {
    fetchFilms()
  }
})
</script>

<template>
  <div class="min-h-screen bg-stone-900 text-stone-100 font-body selection:bg-brand-red selection:text-white pb-0">
    <!-- Navbar -->
    <Navbar :light-title="false" />

    <!-- HERO SECTION -->
    <div class="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b-8 border-brand-red bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMxYzE5MTciPjwvcmVjdD48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMjkyNTI0Ij48L3JlY3Q+PC9zdmc+')]">
      
      <!-- Decorative Elements -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-brand-red/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-brand-orange/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      
      <div class="max-w-7xl mx-auto px-4 md:px-8 relative z-10 flex flex-col items-center text-center">
        
        <Badge class="bg-yellow-400 text-stone-900 border-2 border-stone-900 font-black uppercase tracking-widest text-xs md:text-sm px-4 py-1.5 shadow-[4px_4px_0px_rgba(28,25,23,1)] mb-8 transform -rotate-2">
          Special Event
        </Badge>
        
        <h1 class="font-heading text-6xl md:text-8xl lg:text-[120px] leading-[0.85] tracking-tight text-white uppercase drop-shadow-[5px_5px_0px_rgba(239,68,68,1)] mb-6">
          PF <span class="text-transparent text-stroke-2 text-stroke-yellow-400">SPACE</span><br/>
          FESTIVAL
        </h1>
        
        <p class="max-w-2xl text-lg md:text-2xl font-mono text-stone-300 mb-10 border-l-4 border-brand-red pl-4 text-left">
          Eksibisi puncak karya sinematik siswa. Temukan inovasi, cerita tak terduga, dan bibit sineas masa depan langsung dari layar ini.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-10">
          <Button 
            @click="mainFilm ? goToDetail(mainFilm.slug) : null"
            class="bg-brand-red hover:bg-red-700 text-white border-2 border-stone-900 font-bold uppercase tracking-widest px-8 md:px-12 py-6 h-auto text-sm md:text-base shadow-[6px_6px_0px_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(28,25,23,1)] transition-all rounded-none gap-3"
          >
            <Play class="w-6 h-6 fill-current" />
            Tonton Pembuka
          </Button>
          
          <Button 
            variant="outline"
            class="bg-transparent text-white border-2 border-white hover:bg-white hover:text-stone-900 font-bold uppercase tracking-widest px-8 md:px-12 py-6 h-auto text-sm md:text-base shadow-[6px_6px_0px_rgba(250,204,21,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(250,204,21,1)] transition-all rounded-none gap-3"
            @click="() => { const el = document.getElementById('lineup'); if(el) el.scrollIntoView({behavior: 'smooth'}) }"
          >
            <Ticket class="w-6 h-6" />
            Jadwal Tayang
          </Button>
        </div>
      </div>
      
      <!-- Scrolling Marquee Banner -->
      <div class="absolute bottom-0 left-0 w-full overflow-hidden bg-yellow-400 border-t-4 border-stone-900 py-2 md:py-3 z-20 flex">
        <div class="flex whitespace-nowrap animate-marquee">
          <span class="text-stone-900 font-heading font-black uppercase text-xl md:text-3xl tracking-widest px-4">⚡ EXCLUSIVE PREMIERE ⚡ NOW PLAYING ⚡ DIRECTOR'S CUT ⚡</span>
          <span class="text-stone-900 font-heading font-black uppercase text-xl md:text-3xl tracking-widest px-4">⚡ EXCLUSIVE PREMIERE ⚡ NOW PLAYING ⚡ DIRECTOR'S CUT ⚡</span>
          <span class="text-stone-900 font-heading font-black uppercase text-xl md:text-3xl tracking-widest px-4">⚡ EXCLUSIVE PREMIERE ⚡ NOW PLAYING ⚡ DIRECTOR'S CUT ⚡</span>
        </div>
      </div>
    </div>

    <!-- MAIN FEATURE SECTION -->
    <section v-if="mainFilm" class="max-w-7xl mx-auto px-4 md:px-8 py-20 relative">
      <div class="flex items-center gap-4 mb-10">
        <div class="h-1 w-12 bg-yellow-400"></div>
        <h2 class="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-wider">Main Feature</h2>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center bg-stone-800 border-2 border-stone-700 p-4 md:p-8 shadow-[8px_8px_0px_rgba(250,204,21,0.2)]">
        <!-- Poster -->
        <div class="lg:col-span-5 relative group cursor-pointer" @click="goToDetail(mainFilm.slug)">
          <div class="aspect-[2/3] w-full bg-stone-900 border-2 border-stone-900 relative overflow-hidden shadow-[10px_10px_0px_rgba(28,25,23,1)] z-10 transition-transform group-hover:-translate-y-2">
            <img 
              v-if="mainFilm.gambar_poster" 
              :src="assetUrl(mainFilm.gambar_poster)" 
              :alt="mainFilm.judul"
              class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center">
              <Film class="w-16 h-16 text-stone-700 opacity-50 mb-4" />
            </div>
            
            <!-- Play overlay -->
            <div class="absolute inset-0 bg-brand-red/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <div class="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center pl-2 scale-50 group-hover:scale-100 transition-transform duration-300">
                 <Play class="w-10 h-10 text-white fill-current" />
               </div>
            </div>
          </div>
          <Badge class="absolute -top-4 -right-4 bg-yellow-400 text-stone-900 border-2 border-stone-900 z-20 font-black px-3 py-1 text-sm shadow-[4px_4px_0px_rgba(28,25,23,1)] transform rotate-12">
            MUST WATCH
          </Badge>
        </div>
        
        <!-- Details -->
        <div class="lg:col-span-7 space-y-6">
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline" class="border-stone-500 text-stone-300 font-mono tracking-widest uppercase rounded-none">
              {{ mainFilm.tahun_karya }}
            </Badge>
            <Badge variant="outline" class="border-yellow-400 text-yellow-400 font-mono tracking-widest uppercase rounded-none">
              {{ mainFilm.category?.nama_kategori }}
            </Badge>
          </div>
          
          <h3 class="font-heading text-5xl md:text-7xl text-white leading-[0.9] uppercase hover:text-yellow-400 transition-colors cursor-pointer" @click="goToDetail(mainFilm.slug)">
            {{ mainFilm.judul }}
          </h3>
          
          <p class="text-stone-400 font-mono text-sm md:text-base leading-relaxed line-clamp-4 border-l-2 border-stone-600 pl-4 mt-8">
            {{ mainFilm.sinopsis }}
          </p>
          
          <div class="grid grid-cols-2 gap-4 pt-6 mt-8 border-t border-stone-700">
            <div>
              <p class="text-[10px] md:text-xs text-stone-500 uppercase font-bold tracking-widest mb-1">Sutradara</p>
              <p class="font-bold text-white text-lg font-display italic">{{ mainFilm.sutradara || mainFilm.creator?.name || 'Anonim' }}</p>
            </div>
            <div>
              <p class="text-[10px] md:text-xs text-stone-500 uppercase font-bold tracking-widest mb-1">Apresiasi</p>
              <div class="flex items-center gap-2">
                <Star class="w-5 h-5 text-yellow-400 fill-current" />
                <span class="font-bold text-white text-lg">{{ mainFilm.vote_count }}</span>
              </div>
            </div>
          </div>
          
          <div class="pt-6">
            <Button 
              @click="goToDetail(mainFilm.slug)"
              class="bg-white text-stone-900 hover:bg-stone-200 border-2 border-stone-900 font-bold uppercase tracking-widest px-8 md:px-10 py-6 h-auto text-sm w-full md:w-auto shadow-[4px_4px_0px_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none"
            >
              Lihat Karyanya Sekarang
              <ArrowRight class="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- LOADING STATE -->
    <div v-if="loading" class="py-32 text-center flex flex-col items-center">
      <div class="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-mono text-yellow-400 uppercase tracking-widest font-bold">Menyiapkan Proyektor...</p>
    </div>

    <!-- FESTIVAL LINEUP -->
    <section v-if="latestFilms.length > 0" id="lineup" class="max-w-7xl mx-auto px-4 md:px-8 py-16 mb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b-4 border-stone-800 pb-4">
        <div>
           <div class="flex items-center gap-4 mb-2">
             <div class="h-1 w-8 bg-brand-red"></div>
             <h2 class="font-heading font-black text-4xl md:text-5xl text-white uppercase tracking-wider">Festival Lineup</h2>
           </div>
           <p class="text-stone-400 font-mono text-sm max-w-lg">Karya-karya pilihan lain yang wajib masuk daftar tontonan Anda selama masa eksibisi.</p>
        </div>
        <Button variant="outline" class="bg-transparent border-2 border-stone-600 text-stone-300 font-bold uppercase tracking-widest hover:bg-stone-800 hover:text-white rounded-none shadow-brutal-xs hover:shadow-none transition-all" @click="router.push('/')">
          Jelajahi Arsip Induk
        </Button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <div 
          v-for="(film, i) in latestFilms" 
          :key="film.film_id"
          class="group bg-stone-900 border-2 border-stone-700 hover:border-yellow-400 transition-colors duration-300 relative cursor-pointer flex flex-col h-full"
          @click="goToDetail(film.slug)"
        >
           <!-- Index -->
           <div class="absolute -top-3 -left-3 w-8 h-8 bg-brand-red text-white flex items-center justify-center font-black z-20 border-2 border-stone-900 rotate-[-5deg] shadow-brutal-xs">
             {{ i + 1 }}
           </div>
           
           <div class="aspect-video w-full bg-stone-800 relative overflow-hidden border-b-2 border-stone-700 group-hover:border-yellow-400 transition-colors">
             <img 
               v-if="film.gambar_poster" 
               :src="assetUrl(film.gambar_poster)" 
               :alt="film.judul"
               class="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
             />
             <div class="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-300"></div>
             
             <!-- Play Button overlay -->
             <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div class="w-12 h-12 bg-yellow-400 flex items-center justify-center pl-1 border-2 border-stone-900 shadow-brutal-xs transform group-hover:-translate-y-2 transition-transform duration-300">
                 <Play class="w-6 h-6 text-stone-900 fill-current" />
               </div>
             </div>
           </div>
           
           <div class="p-5 flex flex-col flex-1">
             <div class="flex justify-between items-start mb-4">
                <Badge variant="outline" class="border-stone-600 text-stone-400 font-mono text-[10px] uppercase rounded-none">
                  {{ film.category?.nama_kategori }}
                </Badge>
                <div class="flex items-center gap-1 text-yellow-400 bg-stone-800 px-2 py-0.5 border border-stone-700">
                  <Star class="w-3.5 h-3.5 fill-current" />
                  <span class="text-xs font-bold">{{ film.vote_count }}</span>
                </div>
             </div>
             
             <h4 class="font-heading text-2xl md:text-3xl text-white uppercase leading-tight mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
               {{ film.judul }}
             </h4>
             <div class="mt-auto pt-4 border-t border-stone-800/50">
                <p class="text-xs text-stone-500 font-mono uppercase tracking-widest">Directed By <span class="text-stone-200 font-bold">{{ film.sutradara || film.creator?.name || 'Anonim' }}</span></p>
             </div>
           </div>
        </div>
      </div>
    </section>
    
    <!-- SCHEDULE/CTA SECTION -->
    <section class="border-t-4 border-stone-900 bg-yellow-400 py-16 md:py-24 relative overflow-hidden">
       <!-- Decoration Vector -->
       <Film class="absolute -right-20 -bottom-20 w-[300px] h-[300px] md:w-[500px] md:h-[500px] text-stone-900/10 rotate-12 pointer-events-none" />
       
       <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
         <h2 class="font-heading text-6xl md:text-[100px] text-stone-900 uppercase leading-[0.9] mb-6 drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
           Siap Untuk Turut Serta?
         </h2>
         <p class="font-mono text-stone-900 font-medium text-lg md:text-xl mb-10 border-b-2 border-stone-900 inline-block pb-2">
           Berikan vote dan diskusikan karya terbaik favoritmu sekarang juga.
         </p>
         <div class="flex justify-center flex-wrap gap-4">
           <Button class="bg-stone-900 text-yellow-400 hover:bg-stone-800 border-2 border-stone-900 font-black uppercase tracking-widest px-8 md:px-12 py-6 h-auto text-sm md:text-base shadow-[6px_6px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all rounded-none" @click="router.push('/trending')">
             Vote Karya
           </Button>
           <Button class="bg-white text-stone-900 hover:bg-stone-100 border-2 border-stone-900 font-black uppercase tracking-widest px-8 md:px-12 py-6 h-auto text-sm md:text-base shadow-[6px_6px_0px_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(28,25,23,1)] transition-all rounded-none" @click="router.push('/upload')">
              Submit Karya
           </Button>
         </div>
       </div>
    </section>

    <!-- Base Footer -->
    <Footer class="!bg-stone-950 !text-white !border-t-0" />
    
  </div>
</template>

<style scoped>
.text-stroke-2 {
  -webkit-text-stroke-width: 2px;
}
.text-stroke-yellow-400 {
  -webkit-text-stroke-color: #facc15; /* Tailwind yellow-400 */
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.33%); }
}
.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
  white-space: nowrap;
}
</style>
