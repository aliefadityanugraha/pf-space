<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Play,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Film,
  Info,
  Calendar,
  User,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCarousel } from "@/composables/useCarousel";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";

const router = useRouter();

const staticSlides = [
  {
    title: "Sore: Istri dari Masa Depan",
    summary: "Fiksi Romansa",
    quote:
      "Mengisahkan fotografer Indonesia di Kroasia yang mendadak didatangi wanita misterius dari masa depan yang mengaku sebagai istrinya.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000",
    slug: "sore-istri-dari-masa-depan",
    director: "Yandy Laurens",
    year: "2025",
  },
  {
    title: "The Battleship Potemkin",
    summary: "Arsip Klasik & Editing",
    quote:
      "Karya monumental dalam teknik penyuntingan montage yang merevolusi bahasa sinematografi dunia.",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000",
    slug: "battleship-potemkin",
    director: "Sergei Eisenstein",
    year: "1925",
  },
  {
    title: "Metropolis",
    summary: "Ekspresionisme Sinema",
    quote:
      "Masterpiece fiksi ilmiah distopia buatan Fritz Lang yang menjadi fondasi estetika sinema abad ke-20.",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000",
    slug: "metropolis",
    director: "Fritz Lang",
    year: "1927",
  },
];

const slides = ref(staticSlides);
const loading = ref(true);

const { activeIndex, direction, nextSlide, prevSlide, goToSlide, resetTimer } =
  useCarousel(slides, 7000);

onMounted(async () => {
  try {
    const res = await api.get("/api/films/banners");
    if (res.data && res.data.length > 0) {
      slides.value = res.data.map((item) => ({
        title: item.judul,
        summary: item.category?.nama_kategori || "Sorotan Karya",
        quote: item.sinopsis || "Karya sinema siswa pilihan komunitas perfilman.",
        image: assetUrl(item.banner_url || item.gambar_poster),
        slug: item.slug,
        director: item.creator?.name || item.sutradara || "Kreator SMK",
        year: item.tahun_karya || "2025",
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

const handleExploreTrending = () => {
  router.push("/trending");
};
</script>

<template>
  <section
    class="hero-section-container relative min-h-[440px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[600px] overflow-hidden bg-stone-200 dark:bg-stone-950 text-white flex flex-col justify-end transition-colors duration-300"
  >
    <!-- Layer 1: Animated Background Image Carousel (Z-0) -->
    <div class="absolute inset-0 z-0 bg-stone-200 dark:bg-stone-950">
      <Transition name="hero-fade">
        <div :key="activeIndex" class="absolute inset-0 overflow-hidden">
          <img
            :src="slides[activeIndex].image"
            :alt="slides[activeIndex].title"
            class="w-full h-full object-cover opacity-90 dark:opacity-85 scale-105 animate-hero-zoom transition-all duration-1000"
          />
        </div>
      </Transition>
    </div>

    <!-- Layer 2: Vignette Overlays for Text Contrast (Z-10) -->
    <div
      class="absolute inset-0 z-10 bg-gradient-to-b from-stone-900/60 dark:from-stone-950/70 via-transparent to-transparent pointer-events-none"
    ></div>
    <div
      class="absolute inset-0 z-10 bg-gradient-to-r from-stone-900/70 dark:from-stone-950/80 via-stone-900/20 dark:via-stone-950/30 to-transparent w-full md:w-3/5 pointer-events-none"
    ></div>

    <!-- Layer 3: Soft & Calm Bottom Gradient Fade to Page Background (Z-15) -->
    <!-- Uses var(--background) with CSS @property animation for 100% frame-perfect synchronized theme transitions -->
    <div
      class="absolute inset-x-0 bottom-0 h-48 sm:h-64 md:h-80 z-15 bg-gradient-to-b from-transparent via-background/40 to-background pointer-events-none transition-all duration-350"
    ></div>

    <!-- Layer 4: Main Content Box & Floating Controls (Z-20) -->
    <div class="relative z-20 max-w-7xl mx-auto px-4 md:px-8 w-full pt-20 md:pt-28 pb-4 md:pb-6 flex flex-col justify-between min-h-[440px] sm:min-h-[500px] md:min-h-[560px]">
      <div class="max-w-4xl lg:max-w-5xl">
        <Transition name="hero-slide-up" mode="out-in">
          <div :key="activeIndex" class="space-y-3 md:space-y-4">
            
            <!-- Category & Status Badge -->
            <div class="flex flex-wrap items-center gap-2">
              <div
                class="inline-flex items-center gap-1.5 bg-brand-red text-white border-2 border-black px-2.5 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-brutal-xs"
              >
                <Sparkles class="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>{{ slides[activeIndex].summary || "Karya Pilihan" }}</span>
              </div>

              <div
                v-if="slides[activeIndex].director"
                class="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-stone-100 backdrop-blur-md border-2 border-black dark:border-stone-100 px-2.5 py-0.5 text-[10px] md:text-xs font-mono font-bold uppercase shadow-brutal-xs"
              >
                <User class="w-3 h-3 text-brand-teal" />
                <span>{{ slides[activeIndex].director }}</span>
                <span class="text-stone-400">•</span>
                <span>{{ slides[activeIndex].year }}</span>
              </div>
            </div>

            <!-- Single Line Title (Normal Title Case) -->
            <h1
              class="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight tracking-tight drop-shadow-md truncate max-w-full block"
            >
              {{ slides[activeIndex].title }}
            </h1>

            <!-- Synopsis Quote Card (Compact) -->
            <div class="relative max-w-xl pt-0.5">
              <div
                class="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-2 border-black dark:border-stone-100 p-3 sm:p-4 shadow-brutal hover:shadow-brutal-sm transition-all"
              >
                <div class="flex gap-2.5 sm:gap-3 items-start">
                  <div
                    class="w-1 self-stretch bg-brand-orange shrink-0 rounded-full"
                  ></div>
                  <p
                    class="text-xs sm:text-sm font-body font-medium text-stone-900 dark:text-stone-100 leading-relaxed line-clamp-3"
                  >
                    "{{ slides[activeIndex].quote }}"
                  </p>
                </div>
              </div>
            </div>

            <!-- Action Buttons Bar -->
            <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <Button
                @click="handleWatchNow"
                class="bg-brand-red text-white border-2 border-black shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none h-9 sm:h-10 px-5 sm:px-6 text-xs font-extrabold uppercase tracking-wider rounded-none transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>Tonton Karya</span>
              </Button>

              <Button
                @click="handleExploreTrending"
                class="bg-yellow-400 text-stone-900 border-2 border-black shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none h-9 sm:h-10 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Flame class="w-3.5 h-3.5 text-stone-900" />
                <span>Lihat Trending</span>
              </Button>
            </div>

          </div>
        </Transition>
      </div>

      <!-- Floating Controls Bar over Gradient Background -->
      <div class="flex items-center justify-between gap-4 pt-6 sm:pt-8 md:pt-10">
        <!-- Active Slide Counter & Indicators -->
        <div class="flex items-center gap-3 md:gap-4">
          <span class="font-mono text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100 drop-shadow-sm">
            <strong class="text-brand-orange text-sm md:text-base">0{{ activeIndex + 1 }}</strong> / 0{{ slides.length }}
          </span>

          <div class="flex items-center gap-1.5">
            <button
              v-for="(_, index) in slides"
              :key="index"
              @click="goToSlide(index)"
              :aria-label="`Buka slide ${index + 1}`"
              class="h-2.5 transition-all duration-300 cursor-pointer border-2 border-black dark:border-stone-100 shadow-brutal-xs"
              :class="
                index === activeIndex
                  ? 'w-8 bg-brand-red'
                  : 'w-3 bg-white dark:bg-stone-800 hover:bg-brand-orange'
              "
            ></button>
          </div>
        </div>

        <!-- Next / Prev Controls -->
        <div class="flex items-center gap-2">
          <button
            @click="
              prevSlide();
              resetTimer();
            "
            aria-label="Slide sebelumnya"
            title="Slide Sebelumnya"
            class="w-9 h-9 sm:w-10 sm:h-10 border-2 border-black dark:border-stone-100 flex items-center justify-center bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:bg-brand-red hover:text-white transition-all shadow-brutal-xs active:translate-y-0.5 cursor-pointer"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            @click="
              nextSlide();
              resetTimer();
            "
            aria-label="Slide berikutnya"
            title="Slide Berikutnya"
            class="w-9 h-9 sm:w-10 sm:h-10 border-2 border-black dark:border-stone-100 flex items-center justify-center bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:bg-brand-red hover:text-white transition-all shadow-brutal-xs active:translate-y-0.5 cursor-pointer"
          >
            <ChevronRight class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes heroZoom {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.08);
  }
}

.animate-hero-zoom {
  animation: heroZoom 12s ease-out forwards;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 800ms ease-in-out;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.hero-slide-up-enter-active {
  transition: all 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-slide-up-leave-active {
  transition: all 400ms ease-in;
}

.hero-slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.hero-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
