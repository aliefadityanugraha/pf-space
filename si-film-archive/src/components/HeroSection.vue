<script setup>
import { ref, onMounted } from 'vue'
import { Play, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCarousel } from '@/composables/useCarousel'
import { api } from '@/lib/api'

const staticSlides = [
  {
    title: "The Battleship Potemkin",
    summary: "Montage Editing",
    quote: "A seminal work in montage editing technique featuring revolutionary cinematic language. Experience the 1925 silent masterpiece that defined a genre.",
    image: "/banner.jpg",
  },
  {
    title: "Metropolis",
    summary: "Expressionism",
    quote: "Fritz Lang's 1927 masterpiece is one of the most famous and influential films in history. A stunning visual achievement of dystopian science fiction.",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000",
  },
  {
    title: "Citizen Kane",
    summary: "Directorial Genius",
    quote: "Often cited as the greatest film ever made, Orson Welles' masterpiece revolutionized cinematography, structure, and narrative.",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000",
  }
]

const slides = ref(staticSlides)
const loading = ref(true)

const { 
  activeIndex, 
  direction, 
  nextSlide, 
  prevSlide, 
  goToSlide, 
  resetTimer 
} = useCarousel(slides, 8000)

onMounted(async () => {
  try {
    const res = await api.get('/api/films/banners')
    if (res.data && res.data.length > 0) {
      // Map API data to component format
      slides.value = res.data.map(item => ({
        title: item.judul,
        summary: item.category?.nama_kategori || 'Featured Film',
        quote: item.sinopsis,
        image: item.banner_url || item.gambar_poster
      }))
    }
  } catch (err) {
    console.error('Failed to fetch carousel data:', err)
    // Fallback is already set (staticSlides)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="hero-section-container relative min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden bg-stone-900 text-stone-900">
    <!-- Carousel Slides -->
    <div class="absolute inset-0">
      <Transition :name="direction === 'right' ? 'hero-right' : 'hero-left'">
        <div 
          :key="activeIndex"
          class="absolute inset-0 slide-container"
        >
          <!-- Background Image with Scale Animation -->
          <div class="absolute inset-0 overflow-hidden">
            <img 
              :src="slides[activeIndex].image" 
              :alt="slides[activeIndex].title"
              class="w-full h-full object-cover opacity-60 hero-image transition-transform duration-[2000ms] ease-out"
            />
          </div>

          <!-- Content Overlay -->
          <!-- <div class="absolute inset-0 bg-gradient-to-t from-[#F2EEE3] via-transparent to-transparent"></div> -->
          
          <!-- Content Container -->
          <div class="absolute inset-0 z-10 flex flex-col justify-center md:justify-end translate-y-0 md:translate-y-0 md:pb-32">
            <div class="max-w-7xl mx-auto px-3 md:px-8 w-full">
              <div class="hero-content max-w-3xl">
                <!-- AI Summary Badge -->
                <div class="badge-wrapper mb-3 md:mb-4">
                  <Badge class="bg-brand-teal text-white border-2 border-black shadow-brutal-sm rounded-none px-2 md:px-3 py-1 text-xs md:text-sm font-bold uppercase tracking-wider">
                    <Sparkles class="w-4 h-4 mr-2" />
                    AI Summary
                  </Badge>
                </div>

                <!-- Title -->
                <h1 class="hero-title text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-black text-white mb-4 md:mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] leading-none">
                  {{ slides[activeIndex].title }}
                </h1>

                <!-- Quote Card -->
                <div class="hero-card bg-white border-2 border-black shadow-brutal p-3 md:p-6 mb-5 md:mb-8 transform -rotate-1 transition-transform hover:rotate-0 max-w-2xl">
                  <div class="flex gap-4">
                    <div class="w-1 bg-brand-red flex-shrink-0"></div>
                    <p class="text-sm sm:text-base md:text-xl font-medium text-stone-900 leading-relaxed font-serif">
                      "{{ slides[activeIndex].quote }}"
                    </p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="hero-actions flex flex-wrap gap-2.5 md:gap-4">
                  <Button class="bg-brand-red text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] h-9 md:h-12 px-3 md:px-8 text-xs sm:text-sm md:text-lg font-bold uppercase rounded-none transition-all">
                    <Play class="w-5 h-5 mr-2 fill-current" />
                    Watch Now
                  </Button>
                  <Button class="bg-[#F2EEE3] text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] h-9 md:h-12 px-3 md:px-8 text-xs sm:text-sm md:text-lg font-bold uppercase rounded-none transition-all">
                    <Heart class="w-5 h-5 mr-2" />
                    Vote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Controls -->
    <div class="absolute bottom-10 right-4 md:right-8 z-20 flex gap-4">
      <button 
        @click="prevSlide(); resetTimer();"
        class="w-7 h-7 md:w-10 md:h-10 border-2 border-black flex items-center justify-center bg-[#F2EEE3] hover:bg-brand-red hover:text-white transition-all shadow-brutal-sm active:translate-y-1 active:shadow-none"
      >
        <ChevronLeft class="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button 
        @click="nextSlide(); resetTimer();"
        class="w-7 h-7 md:w-10 md:h-10 border-2 border-black flex items-center justify-center bg-[#F2EEE3] hover:bg-brand-red hover:text-white transition-all shadow-brutal-sm active:translate-y-1 active:shadow-none"
      >
        <ChevronRight class="w-6 h-6 md:w-8 md:h-8" />
      </button>
    </div>
 
    <!-- Indicators -->
    <div class="absolute bottom-10 left-4 md:left-8 z-20 flex gap-2">
      <button 
        v-for="(_, index) in slides" 
        :key="index"
        @click="goToSlide(index)"
        class="h-2 md:h-3 transition-all border border-black"
        :class="activeIndex === index ? 'w-10 md:w-16 bg-brand-red shadow-brutal-xs' : 'w-4 md:w-6 bg-white/40'"
      ></button>
    </div>
  </section>
</template>

<style scoped>
/* Base Transition Styles - Only Opacity for Parent */
.hero-right-enter-active,
.hero-right-leave-active,
.hero-left-enter-active,
.hero-left-leave-active {
  transition: opacity 1.2s cubic-bezier(0.7, 0, 0.3, 1);
}

.hero-right-enter-from,
.hero-right-leave-to,
.hero-left-enter-from,
.hero-left-leave-to {
  opacity: 0;
}

/* Individual Layer Transitions */
.hero-image,
.hero-content {
  transition: transform 1.2s cubic-bezier(0.7, 0, 0.3, 1), opacity 1s linear;
}

/* Content specifically delayed */
.hero-content {
  transition-delay: 0.2s !important;
}

/* Slide Right (Next) */
.hero-right-enter-from .hero-image {
  transform: translateX(100%) scale(1.2);
}
.hero-right-leave-to .hero-image {
  transform: translateX(-100%) scale(1.1);
}

.hero-right-enter-from .hero-content {
  transform: translateX(150px);
  opacity: 0;
}
.hero-right-leave-to .hero-content {
  transform: translateX(-150px);
  opacity: 0;
}

/* Slide Left (Prev) */
.hero-left-enter-from .hero-image {
  transform: translateX(-100%) scale(1.2);
}
.hero-left-leave-to .hero-image {
  transform: translateX(100%) scale(1.1);
}

.hero-left-enter-from .hero-content {
  transform: translateX(-150px);
  opacity: 0;
}
.hero-left-leave-to .hero-content {
  transform: translateX(150px);
  opacity: 0;
}

/* Image Subtle Zoom (Ken Burns) - keep active state */
.hero-image {
  transform: scale(1.1);
  will-change: transform;
}

.slide-container[style*="display: none"] .hero-image {
  animation: none;
}

@keyframes kenburns {
  from { transform: scale(1.1); }
  to { transform: scale(1.25); }
}

.hero-image {
  animation: kenburns 15s infinite alternate ease-in-out;
}

.hero-card {
  box-shadow: var(--shadow-brutal-lg);
}
</style>
