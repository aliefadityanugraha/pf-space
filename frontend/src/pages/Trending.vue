<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ThumbsUp,
  Trophy,
  Film,
  TrendingUp,
  Clock,
  Filter,
  ChevronUp,
  Loader2,
  Flame,
  Sparkles,
  Crown,
  Medal,
  Award,
  Search,
  ArrowUpRight,
  Plus,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ArchiveCard from "@/components/ArchiveCard.vue";
import PageLayout from "@/components/PageLayout.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useVoting } from "@/composables/useVoting";
import { useToast } from "@/composables/useToast";
import { assetUrl } from "@/lib/format";
import { useHead } from "@unhead/vue";

useHead({
  title: "Pilihan Komunitas & Trending - PF Space",
  meta: [
    {
      name: "description",
      content:
        "Jelajahi dan beri suara untuk karya sinema terbaik pilihan komunitas di PF Space.",
    },
  ],
});

const router = useRouter();
const { films, categories, isLoading, fetchFilms, voteFilm } = useVoting();

const selectedCategory = ref("all");
const sortBy = ref("votes");
const searchQuery = ref("");
const votingId = ref(null);
const { showToast } = useToast();

onMounted(() => {
  fetchFilms();
});

// Total votes metric
const totalVotesCount = computed(() => {
  return films.value.reduce((acc, f) => acc + (f.votes || 0), 0);
});

// Highest vote count for progress percentage calculation
const maxVotesCount = computed(() => {
  if (films.value.length === 0) return 1;
  return Math.max(...films.value.map((f) => f.votes || 0), 1);
});

// Filtered and sorted list
const filteredFilms = computed(() => {
  let result = [...films.value];

  // Category filter
  if (selectedCategory.value !== "all") {
    result = result.filter((f) => f.category === selectedCategory.value);
  }

  // Search query filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.director && f.director.toLowerCase().includes(q)) ||
        (f.categoryName && f.categoryName.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sortBy.value === "votes") {
    result.sort((a, b) => b.votes - a.votes);
  } else if (sortBy.value === "year_desc") {
    result.sort((a, b) => b.year - a.year);
  } else if (sortBy.value === "year_asc") {
    result.sort((a, b) => a.year - b.year);
  } else if (sortBy.value === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
});

// Top 3 Podium
const topThree = computed(() => {
  return [...films.value].sort((a, b) => b.votes - a.votes).slice(0, 3);
});

const vote = async (film) => {
  if (!film.hasVoted) {
    votingId.value = film.id;
    const result = await voteFilm(film.id);
    votingId.value = null;

    if (result.success) {
      showToast("Terima kasih! Apresiasi Anda telah tercatat.");
    } else {
      if (result.error === "unauthorized") {
        showToast("Silakan masuk ke akun untuk memberikan apresiasi", "error");
      } else {
        showToast(result.message || "Gagal memberikan apresiasi", "error");
      }
    }
  }
};

const getRankBadgeClass = (rankIndex) => {
  if (rankIndex === 0) return "bg-yellow-400 text-stone-900 border-black font-extrabold shadow-brutal-xs";
  if (rankIndex === 1) return "bg-stone-200 text-stone-900 border-black font-bold";
  if (rankIndex === 2) return "bg-amber-600 text-white border-black font-bold";
  return "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-400";
};
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-16">
      
      <!-- HERO HEADER BANNER -->
      <div
        class="relative overflow-hidden bg-stone-900 dark:bg-stone-950 border-4 border-black dark:border-stone-100 shadow-brutal-lg p-6 sm:p-8 md:p-12 mb-10 md:mb-14 text-white"
      >
        <!-- Background Decorative Accents -->
        <div
          class="absolute -right-12 -bottom-12 w-64 h-64 md:w-96 md:h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none"
        ></div>
        <div
          class="absolute right-1/3 -top-12 w-48 h-48 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none"
        ></div>

        <div class="relative z-10 max-w-3xl">
          <!-- Top Badge -->
          <div
            class="inline-flex items-center gap-2 bg-brand-red text-white border-2 border-black px-3 py-1 text-xs md:text-sm font-bold uppercase tracking-widest shadow-brutal-sm mb-4"
          >
            <Flame class="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>Pilihan Komunitas & Trending</span>
          </div>

          <!-- Main Title -->
          <h1
            class="font-heading text-3xl sm:text-5xl md:text-6xl tracking-wide uppercase leading-tight mb-4 text-white"
          >
            Apresiasi Karya <span class="text-brand-orange underline underline-offset-4 decoration-wavy decoration-brand-red">Terbaik</span>
          </h1>

          <p
            class="font-body text-stone-300 text-sm md:text-lg leading-relaxed mb-8 max-w-2xl"
          >
            Berikan suara untuk karya sinema indie yang paling menginspirasi Anda. Dukungan Anda membantu mengkurasi dan merayakan arsip film lokal berkualitas.
          </p>

          <!-- Metric Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-xl">
            <div class="bg-stone-800/90 border-2 border-stone-700 p-3 md:p-4 text-left">
              <span class="block text-xs font-mono text-stone-400 uppercase">Total Apresiasi</span>
              <span class="font-heading text-xl md:text-3xl text-brand-orange font-bold">
                {{ totalVotesCount.toLocaleString() }}
              </span>
            </div>
            <div class="bg-stone-800/90 border-2 border-stone-700 p-3 md:p-4 text-left">
              <span class="block text-xs font-mono text-stone-400 uppercase">Film Berkompetisi</span>
              <span class="font-heading text-xl md:text-3xl text-brand-teal font-bold">
                {{ films.length }}
              </span>
            </div>
            <div class="col-span-2 sm:col-span-1 bg-stone-800/90 border-2 border-stone-700 p-3 md:p-4 text-left">
              <span class="block text-xs font-mono text-stone-400 uppercase">Peringkat</span>
              <span class="font-heading text-xl md:text-3xl text-yellow-400 font-bold">
                Real-Time
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <LoadingState
        v-if="isLoading && films.length === 0"
        text="MEMUAT PERINGKAT TRENDING..."
        color="orange"
      />

      <template v-else>
        <!-- TOP 3 CHAMPION PODIUM SHOWCASE -->
        <div v-if="topThree.length > 0" class="mb-14 md:mb-20">
          <div class="flex items-center gap-3 justify-center mb-8">
            <Trophy class="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            <h2 class="font-heading text-2xl md:text-4xl text-stone-900 dark:text-stone-100 uppercase tracking-wide">
              Peringkat Teratas Saat Ini
            </h2>
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 items-end justify-center max-w-5xl mx-auto"
          >
            <!-- 2nd PLACE (LEFT ON DESKTOP) -->
            <div
              v-if="topThree[1]"
              class="order-2 md:order-1 w-full max-w-sm mx-auto group/podium"
            >
              <div
                class="bg-white dark:bg-stone-900 border-3 border-black dark:border-stone-100 shadow-brutal p-4 md:p-5 text-center relative transition-transform duration-300 group-hover/podium:-translate-y-1"
              >
                <div
                  class="w-10 h-10 md:w-12 md:h-12 bg-stone-300 dark:bg-stone-700 border-2 border-black dark:border-stone-100 shadow-brutal-xs mx-auto mb-3 flex items-center justify-center font-heading text-xl md:text-2xl text-stone-900 dark:text-stone-100"
                >
                  2
                </div>
                <div class="relative mb-3 overflow-hidden border-2 border-black dark:border-stone-100 aspect-[2/3] bg-stone-200">
                  <img
                    :src="assetUrl(topThree[1].image)"
                    :alt="topThree[1].title"
                    class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute top-2 left-2 bg-stone-800 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-black">
                    Runner Up
                  </div>
                </div>
                <h3
                  class="font-display font-bold text-base md:text-lg text-stone-900 dark:text-stone-100 truncate mb-1"
                >
                  {{ topThree[1].title }}
                </h3>
                <p class="font-mono text-xs text-stone-500 dark:text-stone-400 mb-3 truncate">
                  {{ topThree[1].director }} • {{ topThree[1].year }}
                </p>
                <div
                  class="flex items-center justify-between bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2.5"
                >
                  <div class="flex items-center gap-1.5">
                    <ThumbsUp class="w-4 h-4 text-brand-teal" />
                    <span class="font-body font-bold text-sm text-stone-900 dark:text-stone-100">
                      {{ topThree[1].votes.toLocaleString() }}
                    </span>
                  </div>
                  <Button
                    @click="vote(topThree[1])"
                    :disabled="topThree[1].hasVoted || votingId === topThree[1].id"
                    size="sm"
                    class="h-8 text-xs border-2 border-black bg-brand-teal text-white shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    {{ topThree[1].hasVoted ? 'Diapresiasi' : 'Dukung' }}
                  </Button>
                </div>
              </div>
            </div>

            <!-- 1st PLACE (CENTER - HIGHLIGHTED) -->
            <div
              v-if="topThree[0]"
              class="order-1 md:order-2 w-full max-w-sm mx-auto group/podium"
            >
              <div
                class="bg-amber-400 dark:bg-amber-500 border-4 border-black shadow-brutal-lg p-5 md:p-6 text-center relative transition-transform duration-300 group-hover/podium:-translate-y-2"
              >
                <!-- Crown Badge -->
                <div
                  class="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
                >
                  <div
                    class="w-12 h-12 md:w-16 md:h-16 bg-yellow-300 border-3 border-black shadow-brutal-sm flex items-center justify-center rounded-full animate-bounce"
                  >
                    <Crown class="w-7 h-7 md:w-9 md:h-9 text-stone-900" />
                  </div>
                </div>

                <div class="pt-4">
                  <div class="relative mb-3 overflow-hidden border-3 border-black aspect-[2/3] bg-stone-900 shadow-brutal-sm">
                    <img
                      :src="assetUrl(topThree[0].image)"
                      :alt="topThree[0].title"
                      class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                    />
                    <div class="absolute top-2 left-2 bg-brand-red text-white px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 border-black shadow-brutal-xs">
                      🏆 JUARA #1
                    </div>
                  </div>

                  <h3
                    class="font-display font-black text-lg md:text-2xl text-stone-900 truncate mb-1 uppercase"
                  >
                    {{ topThree[0].title }}
                  </h3>
                  <p class="font-mono text-xs md:text-sm text-stone-800 font-semibold mb-4 truncate">
                    {{ topThree[0].director }} • {{ topThree[0].year }}
                  </p>

                  <div
                    class="flex items-center justify-between bg-white border-3 border-black p-3 shadow-brutal-xs"
                  >
                    <div class="flex items-center gap-2">
                      <Flame class="w-5 h-5 text-brand-red animate-pulse" />
                      <span class="font-heading font-black text-lg text-stone-900">
                        {{ topThree[0].votes.toLocaleString() }} Suara
                      </span>
                    </div>
                    <Button
                      @click="vote(topThree[0])"
                      :disabled="topThree[0].hasVoted || votingId === topThree[0].id"
                      class="h-9 px-4 text-xs font-bold border-2 border-black bg-brand-red text-white shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    >
                      {{ topThree[0].hasVoted ? 'Diapresiasi' : '+ Dukung #1' }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3rd PLACE (RIGHT ON DESKTOP) -->
            <div
              v-if="topThree[2]"
              class="order-3 w-full max-w-sm mx-auto group/podium"
            >
              <div
                class="bg-white dark:bg-stone-900 border-3 border-black dark:border-stone-100 shadow-brutal p-4 md:p-5 text-center relative transition-transform duration-300 group-hover/podium:-translate-y-1"
              >
                <div
                  class="w-10 h-10 md:w-12 md:h-12 bg-amber-600 border-2 border-black dark:border-stone-100 shadow-brutal-xs mx-auto mb-3 flex items-center justify-center font-heading text-xl md:text-2xl text-white"
                >
                  3
                </div>
                <div class="relative mb-3 overflow-hidden border-2 border-black dark:border-stone-100 aspect-[2/3] bg-stone-200">
                  <img
                    :src="assetUrl(topThree[2].image)"
                    :alt="topThree[2].title"
                    class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute top-2 left-2 bg-amber-700 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-black">
                    Peringkat 3
                  </div>
                </div>
                <h3
                  class="font-display font-bold text-base md:text-lg text-stone-900 dark:text-stone-100 truncate mb-1"
                >
                  {{ topThree[2].title }}
                </h3>
                <p class="font-mono text-xs text-stone-500 dark:text-stone-400 mb-3 truncate">
                  {{ topThree[2].director }} • {{ topThree[2].year }}
                </p>
                <div
                  class="flex items-center justify-between bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2.5"
                >
                  <div class="flex items-center gap-1.5">
                    <ThumbsUp class="w-4 h-4 text-brand-teal" />
                    <span class="font-body font-bold text-sm text-stone-900 dark:text-stone-100">
                      {{ topThree[2].votes.toLocaleString() }}
                    </span>
                  </div>
                  <Button
                    @click="vote(topThree[2])"
                    :disabled="topThree[2].hasVoted || votingId === topThree[2].id"
                    size="sm"
                    class="h-8 text-xs border-2 border-black bg-brand-teal text-white shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                  >
                    {{ topThree[2].hasVoted ? 'Diapresiasi' : 'Dukung' }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEARCH AND FILTER CONTROLS BAR -->
        <div class="bg-white dark:bg-stone-900 border-3 border-black dark:border-stone-100 shadow-brutal p-4 md:p-6 mb-8">
          <div class="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            
            <!-- Category Pills (Horizontal Swipeable Touch Container) -->
            <div class="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 touch-pan-x overscroll-x-contain scrollbar-none w-full lg:w-auto">
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="selectedCategory = cat.id"
                :class="[
                  'px-3.5 py-2 border-2 border-black dark:border-stone-200 font-body text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 cursor-pointer',
                  selectedCategory === cat.id
                    ? 'bg-brand-red text-white shadow-brutal-xs translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-orange-50 dark:hover:bg-stone-700',
                ]"
              >
                {{ cat.name }}
              </button>
            </div>

            <!-- Search & Sort Inputs -->
            <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <!-- Search Input -->
              <div class="relative w-full sm:w-64">
                <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari film atau sutradara..."
                  class="w-full h-10 pl-9 pr-3 text-xs md:text-sm bg-stone-50 dark:bg-stone-800 border-2 border-black dark:border-stone-200 font-body font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:bg-white dark:focus:bg-stone-900 transition-colors"
                />
              </div>

              <!-- Sort Select -->
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <Filter class="w-4 h-4 text-stone-500 shrink-0" />
                <select
                  v-model="sortBy"
                  class="w-full sm:w-auto h-10 bg-stone-50 dark:bg-stone-800 border-2 border-black dark:border-stone-200 px-3 font-body text-xs md:text-sm font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
                >
                  <option value="votes">🔥 Suara Terbanyak</option>
                  <option value="year_desc">📅 Tahun Terbaru</option>
                  <option value="year_asc">📜 Tahun Terlama</option>
                  <option value="title">🔤 Judul A-Z</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        <!-- RESULT COUNTER -->
        <div class="flex items-center justify-between mb-6 px-1">
          <p class="font-mono text-xs md:text-sm text-stone-600 dark:text-stone-400">
            Menampilkan <strong class="text-stone-900 dark:text-stone-100">{{ filteredFilms.length }}</strong> karya pilihan
          </p>
        </div>

        <!-- MAIN TRENDING FILM CARDS GRID -->
        <div
          v-if="filteredFilms.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <ArchiveCard
            v-for="(film, idx) in filteredFilms"
            :key="film.id"
            :archive="film"
            :subtitle="`${film.director} · ${film.year}`"
            :show-play-overlay="false"
            class="hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all"
          >
            <!-- Rank Badge Overlay -->
            <template #overlay>
              <Badge
                :class="[
                  'absolute top-2 left-2 border-2 border-black shadow-brutal-xs px-2 py-0.5 text-xs font-heading font-black',
                  getRankBadgeClass(films.findIndex((f) => f.id === film.id)),
                ]"
              >
                #{{
                  films
                    .slice()
                    .sort((a, b) => b.votes - a.votes)
                    .findIndex((f) => f.id === film.id) + 1
                }}
              </Badge>
            </template>

            <!-- Category & Vote Progress Extra Content -->
            <template #extra-content>
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <Badge variant="outline" class="text-[10px] uppercase font-bold tracking-wider">
                    {{ film.categoryName }}
                  </Badge>
                  <span class="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                    {{ Math.round((film.votes / maxVotesCount) * 100) }}% Kepopuleran
                  </span>
                </div>

                <!-- Visual Popularity Progress Bar -->
                <div class="w-full bg-stone-200 dark:bg-stone-700 h-2 border border-black dark:border-stone-600 overflow-hidden">
                  <div
                    class="bg-brand-teal h-full transition-all duration-500"
                    :style="{ width: `${Math.max(8, Math.round((film.votes / maxVotesCount) * 100))}%` }"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Vote Actions Footer -->
            <template #actions>
              <div
                class="flex items-center justify-between w-full border-t-2 border-stone-200 dark:border-stone-800 pt-3 mt-1"
              >
                <div class="flex items-center gap-1.5">
                  <TrendingUp class="w-4 h-4 text-brand-teal shrink-0" />
                  <span class="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                    {{ film.votes.toLocaleString() }}
                  </span>
                  <span class="font-body text-[10px] text-stone-500 uppercase tracking-wide">
                    suara
                  </span>
                </div>

                <Button
                  @click.stop="vote(film)"
                  :disabled="film.hasVoted || votingId === film.id"
                  :class="[
                    'border-2 border-black font-bold text-xs transition-all h-9 px-3',
                    film.hasVoted
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed border-stone-400'
                      : 'bg-brand-red text-white shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                  ]"
                  size="sm"
                >
                  <Loader2
                    v-if="votingId === film.id"
                    class="w-3.5 h-3.5 mr-1 animate-spin"
                  />
                  <ChevronUp v-else-if="!film.hasVoted" class="w-3.5 h-3.5 mr-1" />
                  {{ film.hasVoted ? "Diapresiasi" : "Apresiasi" }}
                </Button>
              </div>
            </template>
          </ArchiveCard>
        </div>

        <!-- EMPTY STATE -->
        <EmptyState
          v-else
          :icon="Film"
          title="Tidak Ada Film Yang Sesuai"
          description="Coba ubah kata kunci pencarian atau pilih kategori film lain."
          action-label="Reset Semua Filter"
          variant="dashed"
          @action="
            selectedCategory = 'all';
            searchQuery = '';
          "
        />
      </template>

      <!-- CALL TO ACTION BANNER -->
      <div
        class="mt-14 md:mt-20 bg-stone-900 dark:bg-stone-950 border-4 border-black dark:border-stone-100 p-6 sm:p-10 md:p-14 text-center shadow-brutal-lg relative overflow-hidden text-white"
      >
        <div class="relative z-10 max-w-2xl mx-auto">
          <div class="w-14 h-14 bg-brand-orange border-2 border-black shadow-brutal-sm mx-auto mb-5 flex items-center justify-center text-stone-900">
            <Sparkles class="w-7 h-7" />
          </div>
          
          <h2
            class="font-heading text-2xl sm:text-4xl md:text-5xl text-white tracking-wide uppercase leading-tight mb-4"
          >
            Ingin Karya Film Mu Masuk Trending?
          </h2>
          <p
            class="font-body text-stone-300 text-xs sm:text-sm md:text-base mb-8 leading-relaxed"
          >
            Unggah karya sinema independen Anda ke PF Space dan dapatkan apresiasi serta ulasan langsung dari komunitas pembuat film se-Indonesia.
          </p>

          <router-link to="/upload">
            <Button
              class="bg-brand-orange text-stone-900 border-3 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all px-8 py-3 h-12 text-sm md:text-base font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2"
            >
              <Plus class="w-5 h-5" />
              <span>Unggah Karya Sekarang</span>
              <ArrowUpRight class="w-5 h-5" />
            </Button>
          </router-link>
        </div>
      </div>

    </div>
  </PageLayout>
</template>
