<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Play,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCarousel } from "@/composables/useCarousel";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";

const router = useRouter();

const staticSlides = [
  {
    title: "The Battleship Potemkin",
    summary: "Montage Editing",
    quote:
      "A seminal work in montage editing technique featuring revolutionary cinematic language. Experience the 1925 silent masterpiece that defined a genre.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000",
    slug: "battleship-potemkin",
  },
  {
    title: "Metropolis",
    summary: "Expressionism",
    quote:
      "Fritz Lang's 1927 masterpiece is one of the most famous and influential films in history. A stunning visual achievement of dystopian science fiction.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000",
    slug: "metropolis",
  },
  {
    title: "The Balkan Line",
    summary: "Directorial Genius",
    quote:
      "During the 1999 Kosovo conflict, Serbian soldiers race against time to secure and defend a strategic airport, protecting local civilians until Russian reinforcements can arrive.",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000",
    slug: "the-balkan-line",
  },
];

const slides = ref(staticSlides);
const loading = ref(true);

const { activeIndex, direction, nextSlide, prevSlide, goToSlide, resetTimer } =
  useCarousel(slides, 8000);

onMounted(async () => {
  try {
    const res = await api.get("/api/films/banners");
    if (res.data && res.data.length > 0) {
      // Map API data to component format
      slides.value = res.data.map((item) => ({
        title: item.judul,
        summary: item.category?.nama_kategori || "Karya Unggulan",
        quote: item.sinopsis || "",
        image: assetUrl(item.banner_url || item.gambar_poster),
        slug: item.slug,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch carousel data:", err);
  } finally {
    loading.value = false;
  }
});

const handleWatchNow = () => {
  const slug = slides.value[activeIndex.value]?.slug;
  if (slug) {
    router.push(`/archive/${slug}`);
  }
};

const handleVote = () => {
  router.push("/trending");
};
</script>

<template>
  <section
    class="hero-section-container relative min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden bg-[#09090b] text-[#ffffff]"
  >
    <!-- Layer 1: Background Images (Z-0) -->
    <div class="absolute inset-0 z-0 bg-[#09090b]">
      <Transition :name="direction === 'right' ? 'hero-right' : 'hero-left'">
        <div :key="activeIndex" class="absolute inset-0 slide-container">
          <div class="absolute inset-0 overflow-hidden">
            <img
              :src="slides[activeIndex].image"
              :alt="slides[activeIndex].title"
              class="w-full h-full object-cover opacity-75 hero-image"
            />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Layer 2: Static Gradient Overlay (Z-10) -->
    <!-- Blends seamlessly into section background below -->
    <div
      class="absolute bottom-0 left-0 right-0 h-[200px] md:h-[250px] z-10 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none transition-colors duration-300"
    ></div>

    <!-- Layer 3: Content (Z-20) -->
    <div class="absolute inset-0 z-20 pointer-events-none">
      <Transition :name="direction === 'right' ? 'hero-right' : 'hero-left'">
        <div
          :key="activeIndex"
          class="absolute inset-0 slide-container flex flex-col justify-end pb-24 md:pb-32"
        >
          <div
            class="max-w-7xl mx-auto px-3 md:px-8 w-full pointer-events-auto"
          >
            <div class="hero-content max-w-3xl relative z-20 pb-8">
              <!-- Badge: Minimalist Editorial -->
              <div class="mb-3 sm:mb-4 mt-2 sm:mt-0">
                <div
                  class="inline-flex items-center gap-2 bg-brand-cream px-2.5 py-1 border border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] group hover:-translate-y-0.5 transition-transform"
                >
                  <Sparkles class="w-3 h-3 text-brand-red" />
                  <span
                    class="font-bold text-stone-900 uppercase tracking-[0.2em] text-[8px] sm:text-[10px]"
                  >
                    {{ slides[activeIndex].summary || "Sorotan" }}
                  </span>
                </div>
              </div>

              <!-- Title: Cinematic typography -->
              <h1
                class="hero-title font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-5 text-[#fafaf9] leading-[1.1] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] mix-blend-normal"
              >
                {{ slides[activeIndex].title }}
              </h1>

              <!-- Quote Card: Elegant box with brand red accent -->
              <div class="hero-card relative max-w-xl mb-6 group cursor-text">
                <div
                  class="bg-white border-2 border-black p-3.5 sm:p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all duration-300"
                >
                  <div class="flex gap-3 sm:gap-4 items-start">
                    <div
                      class="w-1.5 h-full min-h-[2.5rem] bg-brand-red flex-shrink-0 mt-0.5"
                    ></div>
                    <p
                      class="text-[13px] sm:text-sm md:text-base font-medium text-stone-900 leading-[1.6] font-serif line-clamp-3 md:line-clamp-4"
                    >
                      "{{ slides[activeIndex].quote }}"
                    </p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="hero-actions flex flex-wrap gap-3 sm:gap-4 mt-4">
                <Button
                  @click="handleWatchNow"
                  class="bg-brand-red text-stone-950 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] h-9 sm:h-10 md:h-11 px-5 sm:px-6 md:px-8 text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider rounded-none transition-all cursor-pointer"
                >
                  <Play class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 fill-current" />
                  Lihat Karya
                </Button>

                <Button
                  @click="handleVote"
                  class="bg-brand-cream text-stone-900 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] h-9 sm:h-10 md:h-11 px-5 sm:px-6 md:px-8 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider rounded-none transition-all group"
                >
                  <Heart
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 group-hover:text-brand-red group-hover:fill-brand-red transition-colors"
                  />
                  Populer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Controls -->
    <div class="absolute bottom-10 right-4 md:right-8 z-30 flex gap-4">
      <button
        @click="
          prevSlide();
          resetTimer();
        "
        aria-label="Slide sebelumnya"
        title="Slide sebelumnya"
        class="w-7 h-7 md:w-10 md:h-10 border-2 border-black flex items-center justify-center bg-brand-cream hover:bg-brand-red hover:text-[#fafaf9] transition-all shadow-brutal-sm active:translate-y-1 active:shadow-none cursor-pointer"
      >
        <ChevronLeft class="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button
        @click="
          nextSlide();
          resetTimer();
        "
        aria-label="Slide berikutnya"
        title="Slide berikutnya"
        class="w-7 h-7 md:w-10 md:h-10 border-2 border-black flex items-center justify-center bg-brand-cream hover:bg-brand-red hover:text-[#fafaf9] transition-all shadow-brutal-sm active:translate-y-1 active:shadow-none cursor-pointer"
      >
        <ChevronRight class="w-6 h-6 md:w-8 md:h-8" />
      </button>
    </div>

    <!-- Indicators -->
    <div class="absolute bottom-10 left-4 md:left-8 z-30 flex gap-2">
      <button
        v-for="(_, index) in slides"
        :key="index"
        @click="goToSlide(index)"
        :aria-label="`Buka slide ${index + 1}`"
        :title="`Slide ${index + 1}`"
        class="w-3 h-3 md:w-4 md:h-4 border-2 border-black transition-all cursor-pointer"
        :class="
          index === activeIndex
            ? 'bg-brand-teal scale-110 shadow-brutal-xs'
            : 'bg-white hover:bg-stone-200'
        "
      ></button>
    </div>
  </section>
</template>

<style scoped>
/* Base Transition Styles - Simple Cross Dissolve */
.hero-right-enter-active,
.hero-right-leave-active,
.hero-left-enter-active,
.hero-left-leave-active {
  transition: opacity 1000ms ease-in-out;
}

.hero-right-enter-from,
.hero-right-leave-to,
.hero-left-enter-from,
.hero-left-leave-to {
  opacity: 0;
}

/* Ensure images and content just sit there without moving */

/* Idle Zoom Animation (Ken Burns Effect) */
@keyframes zoom-idle {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.15);
  }
}

.hero-image {
  animation: zoom-idle 30s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  will-change: transform;
}
</style>
