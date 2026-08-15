<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";
import Navbar from "@/components/Navbar.vue";
import HeroSection from "@/components/HeroSection.vue";
import SectionHeader from "@/components/SectionHeader.vue";
import ArchiveCarousel from "@/components/ArchiveCarousel.vue";
import Footer from "@/components/Footer.vue";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Film,
  Play,
  User,
  Calendar,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
  Newspaper,
  Flame,
  Trophy,
  Crown,
  Rss,
  Clapperboard,
  Camera,
  Sparkles,
  Music,
  Zap,
  Heart,
  Compass,
} from "lucide-vue-next";
import { useHead } from "@unhead/vue";
import TrendingBanner from "@/components/TrendingBanner.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import TrendingCardSkeleton from "@/components/TrendingCardSkeleton.vue";
import CategoryCardSkeleton from "@/components/CategoryCardSkeleton.vue";
import CommunityDiscussion from "@/components/CommunityDiscussion.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import FeedCard from "@/components/production-feed/FeedCard.vue";
import FeedCardSkeleton from "@/components/production-feed/FeedCardSkeleton.vue";
import FeedErrorState from "@/components/production-feed/FeedErrorState.vue";
import { useProductionFeed } from "@/modules/production-feed/useProductionFeed";

useHead(() => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const logoUrl = `${origin}/logo-perfilman.png`;
  const title = "PF Space - Arsip Digital & Perfilman Karya Siswa";
  const description =
    "Platform kearsipan karya sinematik siswa SMK untuk apresiasi, dokumentasi, dan pembelajaran perfilman kreatif secara berkelanjutan.";

  return {
    title,
    meta: [
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "PF Space, Film Pendek SMK, Perfilman, Sinematografi, Arsip Film, Karya Siswa, Ekosistem Film",
      },
      { name: "author", content: "Tim PKM-PM UDINUS - PF Space" },

      // Open Graph / Facebook / WhatsApp
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "PF Space" },
      { property: "og:url", content: pageUrl },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: logoUrl },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: pageUrl },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: logoUrl },
    ],
    script: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PF Space",
          alternateName: "Perfilman Space",
          url: pageUrl || "http://localhost:5173",
          potentialAction: {
            "@type": "SearchAction",
            target: `${origin}/films?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PF Space",
          url: origin || "http://localhost:5173",
          logo: logoUrl,
          sameAs: ["https://instagram.com/pfspace.id"],
        }),
      },
    ],
  };
});

const router = useRouter();
const heroRef = ref(null);
const isLightTitle = ref(true);

// Production Feed preview (max 6 latest posts)
const {
  posts: feedPosts,
  isLoading: isFeedLoading,
  isError: isFeedError,
  fetchFeed,
  retry: retryFeed,
} = useProductionFeed({ limit: 6 });

// Data
const latestFilms = ref([]);
const trendingFilms = ref([]);
const categories = ref([]);
const loading = ref(true);

const getCategoryMeta = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("pendek") || lower.includes("short")) {
    return { icon: Clapperboard, bg: "bg-brand-red text-white", badge: "bg-brand-red/10 text-brand-red border-brand-red/30" };
  }
  if (lower.includes("dokumen") || lower.includes("docu")) {
    return { icon: Camera, bg: "bg-amber-400 text-stone-900", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" };
  }
  if (lower.includes("animas") || lower.includes("anim")) {
    return { icon: Sparkles, bg: "bg-purple-500 text-white", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" };
  }
  if (lower.includes("musik") || lower.includes("song")) {
    return { icon: Music, bg: "bg-sky-500 text-white", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" };
  }
  if (lower.includes("eksperimen") || lower.includes("exp")) {
    return { icon: Zap, bg: "bg-emerald-400 text-stone-900", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
  }
  if (lower.includes("romance") || lower.includes("drama") || lower.includes("fiksi") || lower.includes("fiction")) {
    return { icon: Heart, bg: "bg-rose-500 text-white", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30" };
  }
  return { icon: Film, bg: "bg-brand-teal text-white", badge: "bg-brand-teal/10 text-brand-teal border-brand-teal/30" };
};

const handleScroll = () => {
  if (heroRef.value) {
    const heroHeight =
      heroRef.value.$el?.offsetHeight || heroRef.value.offsetHeight || 600;
    isLightTitle.value = window.scrollY < heroHeight - 80;
  }
};

// Fetch data
const fetchData = async () => {
  loading.value = true;
  try {
    const results = await Promise.allSettled([
      api.get("/api/films/latest?limit=10"),
      api.get("/api/votes/trending?period=week&limit=6"),
      api.get("/api/categories/with-count"),
    ]);

    // Handle Latest Films
    if (results[0].status === "fulfilled") {
      latestFilms.value = results[0].value.data || [];
    } else {
      console.error("Failed to fetch latest films:", results[0].reason);
    }

    // Handle Trending Films
    if (results[1].status === "fulfilled") {
      trendingFilms.value = results[1].value.data || [];
    } else {
      console.error("Failed to fetch trending films:", results[1].reason);
    }

    // Handle Categories
    if (results[2].status === "fulfilled") {
      categories.value = results[2].value.data || [];
    } else {
      console.error("Failed to fetch categories:", results[2].reason);
    }
  } catch (err) {
    console.error("Unexpected error during data fetch:", err);
  } finally {
    loading.value = false;
  }
};

const goToDetail = (slug) => {
  router.push(`/archive/${slug}`);
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  handleScroll();
  fetchData();
  fetchFeed();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <Navbar :light-title="isLightTitle" />
    <main id="main-content" class="flex-1">
      <ErrorBoundary name="Hero Section">
        <HeroSection ref="heroRef" />
      </ErrorBoundary>

      <div class="relative bg-background overflow-hidden">
        <!-- Scratched/Texture Overlay Base -->
        <!-- <div
        class="absolute inset-0 opacity-[0.03] z-0 pointer-events-none"
        style="
          background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E&quot;);
        "
      ></div> -->

        <!-- Global Loading removed in favor of section-based skeletons -->

        <!-- Latest Films Section -->
        <section class="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
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
              <ArchiveCarousel :items="latestFilms" :loading="loading" />
            </div>
          </ErrorBoundary>
        </section>

        <!-- Production Feed Preview Section -->
        <section
          class="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10"
        >
          <!-- Section Badge & Header -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
            <div>
              <div
                class="inline-flex items-center gap-2 bg-brand-teal text-white border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-brutal-xs mb-3"
              >
                <Rss class="w-3.5 h-3.5" />
                <span>Behind The Scenes & Update Produksi</span>
              </div>
              <h2
                class="font-heading text-3xl md:text-5xl text-stone-900 dark:text-stone-100 uppercase tracking-tight leading-none"
              >
                Production Feed
              </h2>
              <p
                class="font-body text-stone-600 dark:text-stone-400 text-sm md:text-base mt-2 max-w-xl"
              >
                Catatan di balik layar, progress produksi, dan pengumuman terbaru langsung dari tim pembuat film PF Space.
              </p>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <Button
                @click="router.push('/feed')"
                class="h-10 md:h-11 px-5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold uppercase text-xs tracking-wider shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Jelajahi Feed</span>
                <ArrowRight class="w-4 h-4 text-brand-teal dark:text-teal-400" />
              </Button>
            </div>
          </div>

          <ErrorBoundary name="Production Feed">
            <!-- Loading -->
            <div
              v-if="isFeedLoading && feedPosts.length === 0"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <FeedCardSkeleton v-for="n in 6" :key="n" />
            </div>

            <!-- Error -->
            <FeedErrorState
              v-else-if="isFeedError && feedPosts.length === 0"
              @retry="retryFeed"
            />

            <!-- Empty -->
            <EmptyState
              v-else-if="feedPosts.length === 0"
              :icon="Newspaper"
              title="Belum Ada Postingan Feed"
              description="Feed produksi masih kosong. Nantikan update cerita pertama dari para kreator."
              variant="dashed"
            />

            <!-- Feed preview grid -->
            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
            >
              <div
                v-for="(post, index) in feedPosts"
                :key="post.postId"
                class="opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] flex flex-col"
                :class="`stagger-${(index % 6) + 1}`"
                @animationend="$event.target.style.opacity = 1"
              >
                <FeedCard :post="post" class="h-full" />
              </div>
            </div>
          </ErrorBoundary>

          <!-- View All Button -->
          <div class="text-center mt-10 md:mt-14">
            <Button
              @click="router.push('/feed')"
              class="h-11 md:h-12 px-8 gap-2 border-3 border-black bg-brand-teal text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-extrabold uppercase tracking-wider text-xs md:text-sm transition-all cursor-pointer"
            >
              <span>Lihat Semua Update Feed</span>
              <ArrowRight class="w-4 h-4" />
            </Button>
          </div>
        </section>

        <ErrorBoundary name="Promo Section">
          <div class="relative z-10">
            <TrendingBanner />
          </div>
        </ErrorBoundary>

        <!-- Trending Section -->
        <section
          v-if="loading || trendingFilms.length > 0"
          class="w-full py-16 md:py-24 relative z-10"
        >
          <!-- Background Pattern for Trending -->
          <div
            class="absolute inset-0 opacity-[0.05] pointer-events-none"
            style="
              background-image: radial-gradient(#1c1917 2px, transparent 2px);
              background-size: 32px 32px;
            "
          ></div>

          <div class="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <!-- Section Badge & Header -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12">
              <div>
                <div
                  class="inline-flex items-center gap-2 bg-brand-red text-white border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-brutal-xs mb-3"
                >
                  <Flame class="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>Pilihan Komunitas Real-Time</span>
                </div>
                <h2
                  class="font-heading text-3xl md:text-5xl text-stone-900 dark:text-stone-100 uppercase tracking-tight leading-none"
                >
                  Trending Minggu Ini
                </h2>
                <p
                  class="font-body text-stone-600 dark:text-stone-400 text-sm md:text-base mt-2 max-w-xl"
                >
                  Karya sinematik dengan apresiasi terbanyak dari komunitas pembuat & penonton film PF Space.
                </p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <Button
                  @click="router.push('/trending')"
                  class="h-10 md:h-11 px-5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold uppercase text-xs tracking-wider shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Jelajahi Peringkat</span>
                  <ArrowRight class="w-4 h-4 text-brand-red dark:text-red-400" />
                </Button>
              </div>
            </div>

            <ErrorBoundary name="Trending Cards" :inline="true">
              <div
                v-if="loading"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <TrendingCardSkeleton v-for="i in 6" :key="i" />
              </div>
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
              >
                <div
                  v-for="(film, index) in trendingFilms"
                  :key="film.film_id"
                  class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group/trend p-4 flex items-center gap-4 relative overflow-hidden"
                  @click="goToDetail(film.slug)"
                >
                  <!-- Rank Badge -->
                  <div
                    :class="[
                      'flex-shrink-0 w-9 h-9 md:w-10 md:h-10 border-2 border-black flex items-center justify-center font-heading text-sm md:text-base font-black shadow-brutal-xs shrink-0',
                      index === 0
                        ? 'bg-yellow-400 text-stone-900'
                        : index === 1
                        ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                        : index === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-brand-red text-white'
                    ]"
                  >
                    <Crown v-if="index === 0" class="w-5 h-5 text-stone-900" />
                    <span v-else>#{{ index + 1 }}</span>
                  </div>

                  <!-- Poster Image -->
                  <div
                    class="w-14 sm:w-16 md:w-20 aspect-[2/3] bg-stone-800 flex-shrink-0 overflow-hidden border-2 border-black dark:border-stone-100 shadow-brutal-xs relative"
                  >
                    <img
                      v-if="film.gambar_poster"
                      :src="assetUrl(film.gambar_poster)"
                      :alt="film.judul"
                      loading="lazy"
                      class="w-full h-full object-cover group-hover/trend:scale-105 transition-transform duration-500"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400"
                    >
                      <Film class="w-6 h-6 opacity-40" />
                    </div>
                  </div>

                  <!-- Film Information -->
                  <div class="flex-1 min-w-0">
                    <h3
                      class="font-display font-bold text-sm md:text-base text-stone-900 dark:text-stone-100 group-hover/trend:text-brand-red transition-colors truncate mb-1"
                    >
                      {{ film.judul }}
                    </h3>

                    <p
                      class="text-xs font-mono font-medium text-stone-600 dark:text-stone-400 truncate mb-2"
                    >
                      {{ film.creator?.name || film.sutradara || "Kreator SMK" }}
                    </p>

                    <!-- Vote Pill Tag -->
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-black dark:border-stone-700 text-xs font-bold shadow-brutal-xs">
                      <Flame class="w-3.5 h-3.5 text-brand-red animate-pulse" />
                      <span>{{ (film.vote_count || 0).toLocaleString() }}</span>
                      <span class="text-[10px] text-stone-500 uppercase font-mono">apresiasi</span>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorBoundary>

            <!-- View All Button -->
            <div class="text-center mt-10 md:mt-14">
              <Button
                @click="router.push('/trending')"
                class="h-11 md:h-12 px-8 gap-2 border-3 border-black bg-brand-red text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-extrabold uppercase tracking-wider text-xs md:text-sm transition-all cursor-pointer"
              >
                <span>Lihat Semua Peringkat Populer</span>
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
        <section
          v-if="loading || categories.length > 0"
          class="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative z-10"
        >
          <SectionHeader
            title="Jelajahi Kategori"
            subtitle="Temukan karya berdasarkan genre & bentuk sinematik"
            :light-text="false"
          />

          <ErrorBoundary name="Kategori">
            <div
              v-if="loading"
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5"
            >
              <CategoryCardSkeleton v-for="i in 6" :key="i" />
            </div>
            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5"
            >
              <div
                v-for="category in categories"
                :key="category.category_id"
                class="bg-white dark:bg-stone-900 border-2 md:border-3 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group/cat relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-5 text-center"
                @click="
                  router.push({
                    path: '/films',
                    query: { category_id: category.category_id },
                  })
                "
              >
                <!-- Dynamic Category Icon Circle -->
                <div
                  :class="[
                    'w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs mb-3 group-hover/cat:scale-110 transition-transform duration-300 shrink-0',
                    getCategoryMeta(category.nama_kategori).bg
                  ]"
                >
                  <component
                    :is="getCategoryMeta(category.nama_kategori).icon"
                    class="w-5 h-5 md:w-6 md:h-6"
                  />
                </div>

                <!-- Category Title -->
                <h3
                  class="font-heading font-extrabold text-xs md:text-sm text-stone-900 dark:text-stone-100 uppercase tracking-tight line-clamp-1 mb-2 group-hover/cat:text-brand-orange transition-colors"
                >
                  {{ category.nama_kategori }}
                </h3>

                <!-- Count Badge Pill -->
                <div
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-black dark:border-stone-700 text-[10px] md:text-xs font-bold font-mono shadow-brutal-xs"
                >
                  <span>{{ category.film_count || 0 }}</span>
                  <span class="text-[9px] text-stone-500 uppercase">karya</span>
                </div>
              </div>
            </div>
          </ErrorBoundary>

          <!-- View All Button -->
          <div class="text-center mt-10 md:mt-14">
            <Button
              @click="router.push('/films')"
              class="h-11 md:h-12 px-8 gap-2 border-3 border-black dark:border-stone-100 bg-brand-orange hover:bg-brand-orange/90 text-stone-900 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-extrabold uppercase tracking-wider text-xs md:text-sm transition-all cursor-pointer inline-flex items-center"
            >
              <span>Lihat Semua Arsip Karya</span>
              <ArrowRight class="w-4 h-4 text-stone-900" />
            </Button>
          </div>
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
    </main>

    <Footer />
  </div>
</template>
