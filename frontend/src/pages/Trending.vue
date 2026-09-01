<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  ThumbsUp,
  Trophy,
  Film,
  TrendingUp,
  Clock,
  Filter,
  ChevronUp,
  ChevronDown,
  Clapperboard,
  Loader2,
  Flame,
  Sparkles,
  Crown,
  Medal,
  Award,
  Search,
  ArrowUpRight,
  Plus,
  Heart,
  Check,
  X,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  GraduationCap,
  Layers,
  User,
  Play,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ArchiveCard from "@/components/ArchiveCard.vue";
import PageLayout from "@/components/PageLayout.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useVoting } from "@/composables/useVoting";
import { useAuth } from "@/composables/useAuth";
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
const { user, isAdmin, isCreator, isLoggedIn } = useAuth();
const { films, categories, isLoading, fetchFilms, voteFilm, toggleVoteFilm } = useVoting();

// Filter States
const selectedCategory = ref("all");
const selectedYear = ref("all"); // 'all', 2026, 2025, etc.
const selectedPeriod = ref("all"); // 'all', 'week', 'month'
const searchQuery = ref("");
const votingId = ref(null);
const imageErrors = ref({});
const isCategoryDropdownOpen = ref(false);
const categoryDropdownRef = ref(null);
const isYearDropdownOpen = ref(false);
const yearDropdownRef = ref(null);
const { showToast } = useToast();

// Available Years extracted dynamically from dataset
const availableYears = computed(() => {
  const yearsSet = new Set();
  films.value.forEach((f) => {
    const yr = f.year || f.tahun_karya;
    if (yr) yearsSet.add(parseInt(yr));
  });
  if (yearsSet.size === 0) {
    return [2026, 2025, 2024];
  }
  return Array.from(yearsSet).sort((a, b) => b - a);
});

const currentCategoryName = computed(() => {
  const cat = categories.value.find((c) => c.id === selectedCategory.value);
  return cat ? cat.name : "Semua Karya";
});

const currentYearName = computed(() => {
  return selectedYear.value === "all" ? "Semua Tahun" : `Tahun ${selectedYear.value}`;
});

const getCategoryCount = (catId) => {
  if (catId === "all") return films.value.length;
  return films.value.filter((f) => f.category === catId || f.category_id === catId).length;
};

const getYearCount = (yr) => {
  if (yr === "all") return films.value.length;
  return films.value.filter((f) => String(f.year || f.tahun_karya) === String(yr)).length;
};

const toggleCategoryDropdown = () => {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
  if (isCategoryDropdownOpen.value) {
    isYearDropdownOpen.value = false;
  }
};

const selectCategory = (catId) => {
  selectedCategory.value = catId;
  isCategoryDropdownOpen.value = false;
};

const toggleYearDropdown = () => {
  isYearDropdownOpen.value = !isYearDropdownOpen.value;
  if (isYearDropdownOpen.value) {
    isCategoryDropdownOpen.value = false;
  }
};

const selectYear = (yr) => {
  selectedYear.value = yr;
  isYearDropdownOpen.value = false;
};

const resetFilters = () => {
  selectedCategory.value = "all";
  selectedYear.value = "all";
  selectedPeriod.value = "all";
  searchQuery.value = "";
  isCategoryDropdownOpen.value = false;
  isYearDropdownOpen.value = false;
};

const hasActiveFilters = computed(() => {
  return (
    selectedCategory.value !== "all" ||
    selectedYear.value !== "all" ||
    selectedPeriod.value !== "all" ||
    searchQuery.value.trim() !== ""
  );
});

// Human-readable active filter summary label
const activeFilterLabel = computed(() => {
  const parts = [];
  if (selectedPeriod.value === "week") {
    parts.push("Trending Minggu Ini");
  } else if (selectedPeriod.value === "month") {
    parts.push("Trending Bulan Ini");
  }
  if (selectedYear.value !== "all") {
    parts.push(`Tahun ${selectedYear.value}`);
  }
  if (selectedCategory.value !== "all") {
    parts.push(currentCategoryName.value);
  }
  if (searchQuery.value.trim()) {
    parts.push(`"${searchQuery.value.trim()}"`);
  }
  return parts.length > 0 ? parts.join(" • ") : "Semua Waktu & Kategori";
});

// Watch period to re-fetch trending data from API if period changes
watch(selectedPeriod, async (newPeriod) => {
  await fetchFilms(true, newPeriod);
});

const handleClickOutside = (e) => {
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(e.target)) {
    isCategoryDropdownOpen.value = false;
  }
  if (yearDropdownRef.value && !yearDropdownRef.value.contains(e.target)) {
    isYearDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  fetchFilms(true, selectedPeriod.value);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const canUpload = computed(() => {
  if (!isLoggedIn.value) return false;
  const roleName = (user.value?.role?.name || user.value?.role_name || user.value?.role || "").toLowerCase();
  return roleName === "admin" || roleName === "creator" || roleName === "kreator" || isAdmin.value || isCreator.value;
});

// Total votes metric
const totalVotesCount = computed(() => {
  return films.value.reduce((acc, f) => acc + (f.votes || 0), 0);
});

// Filtered and sorted list (strictly ranked by votes)
const filteredFilms = computed(() => {
  let result = [...films.value];

  // Year filter
  if (selectedYear.value !== "all") {
    result = result.filter((f) => {
      const yr = f.year || f.tahun_karya;
      return yr && String(yr) === String(selectedYear.value);
    });
  }

  // Category filter
  if (selectedCategory.value !== "all") {
    result = result.filter((f) => f.category === selectedCategory.value || f.category_id === selectedCategory.value);
  }

  // Search query filter (instant live search across title, director, username, category, year)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (f) =>
        (f.title && f.title.toLowerCase().includes(q)) ||
        (f.judul && f.judul.toLowerCase().includes(q)) ||
        (f.director && f.director.toLowerCase().includes(q)) ||
        (f.creator?.name && f.creator.name.toLowerCase().includes(q)) ||
        (f.creator?.username && f.creator.username.toLowerCase().includes(q)) ||
        (f.categoryName && f.categoryName.toLowerCase().includes(q)) ||
        (f.year && String(f.year).includes(q)) ||
        (f.sinopsis && f.sinopsis.toLowerCase().includes(q))
    );
  }

  // Leaderboard is strictly sorted by votes descending
  result.sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return result;
});

// Highest vote count for progress percentage calculation in active view
const maxVotesCount = computed(() => {
  if (filteredFilms.value.length === 0) return 1;
  return Math.max(...filteredFilms.value.map((f) => f.votes || 0), 1);
});

// Dynamic Top 3 Podium strictly based on currently filtered films!
const topThree = computed(() => {
  return [...filteredFilms.value].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3);
});

const vote = async (film) => {
  votingId.value = film.id;
  const result = await toggleVoteFilm(film.id);
  votingId.value = null;

  if (result.success) {
    if (result.voted) {
      showToast("Terima kasih! Apresiasi Anda telah tercatat.");
    } else {
      showToast("Apresiasi berhasil dibatalkan.", "info");
    }
  } else {
    if (result.error === "unauthorized") {
      showToast("Silakan masuk ke akun untuk memberikan apresiasi", "error");
    } else {
      showToast(result.message || "Gagal memproses apresiasi", "error");
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
      
      <!-- ══════════════════════════════════════════════════════════════════════
           INTEGRATED HERO HEADER BANNER (STATS TOP-RIGHT + EMBEDDED FILTER BOTTOM)
           ══════════════════════════════════════════════════════════════════════ -->
      <div
        class="relative z-40 overflow-visible bg-stone-900 dark:bg-stone-950 border-4 border-black dark:border-stone-100 shadow-brutal-lg p-6 sm:p-8 md:p-10 mb-12 text-white"
      >
        <!-- Background Decorative Glows (Clipped safely inside this inner layer) -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            class="absolute -right-12 -bottom-12 w-64 h-64 md:w-96 md:h-96 bg-brand-red/20 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute right-1/3 -top-12 w-48 h-48 bg-brand-teal/20 rounded-full blur-2xl"
          ></div>
        </div>

        <!-- TOP SECTION: Left (Title & Intro) vs Right (Stat Cards) -->
        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
          
          <!-- Left Column: Badge, Main Title & Description -->
          <div class="lg:col-span-6 xl:col-span-7">
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
              class="font-body text-stone-300 text-sm md:text-base leading-relaxed max-w-xl"
            >
              Berikan suara untuk karya sinema indie yang paling menginspirasi Anda. Dukungan Anda membantu mengkurasi dan merayakan arsip film lokal berkualitas.
            </p>
          </div>

          <!-- Right Column: Stat Cards (Clear Bold Typography, Standard Comfortable Box Dimensions, Mepet Kanan) -->
          <div class="lg:col-span-5 xl:col-span-5 w-full flex justify-start lg:justify-end">
            <div class="grid grid-cols-2 gap-2.5 max-w-[320px] w-full items-start">
              
              <!-- 1. Total Suara Box -->
              <div class="bg-stone-850/90 border-2 border-stone-700 p-3.5 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-between gap-1 mb-2">
                  <span class="text-xs font-mono text-stone-300 uppercase tracking-wider font-bold">Total Suara</span>
                  <Heart class="w-4 h-4 text-brand-red fill-brand-red shrink-0" />
                </div>
                <span class="font-heading text-2xl sm:text-3xl text-brand-orange font-black leading-none">
                  {{ totalVotesCount.toLocaleString() }}
                </span>
              </div>

              <!-- 2. Film Berkompetisi Box -->
              <div class="bg-stone-850/90 border-2 border-stone-700 p-3.5 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-between gap-1 mb-2">
                  <span class="text-xs font-mono text-stone-300 uppercase tracking-wider font-bold">Kompetisi</span>
                  <Film class="w-4 h-4 text-brand-teal shrink-0" />
                </div>
                <span class="font-heading text-2xl sm:text-3xl text-brand-teal font-black leading-none">
                  {{ films.length }} <span class="text-xs sm:text-sm font-sans text-stone-300 font-medium">Karya</span>
                </span>
              </div>

              <!-- 3. Peringkat Real-Time Box -->
              <div class="col-start-2 bg-stone-850/90 border-2 border-stone-700 p-3.5 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-between gap-1 mb-2">
                  <span class="text-xs font-mono text-stone-300 uppercase tracking-wider font-bold">Peringkat</span>
                  <Trophy class="w-4 h-4 text-yellow-400 shrink-0" />
                </div>
                <span class="font-heading text-xl sm:text-2xl text-yellow-400 font-black tracking-wide leading-none">
                  REAL-TIME
                </span>
              </div>

            </div>
          </div>

        </div>

        <!-- ══════════════════════════════════════════════════════════════════════
             BOTTOM EMBEDDED FILTER TOOLBAR (INSIDE HERO BANNER CONTAINER)
             ══════════════════════════════════════════════════════════════════════ -->
        <div class="relative z-50 pt-6 border-t-2 border-stone-800">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            <!-- Left: Trending Period Segmented Tabs -->
            <div class="inline-flex p-1 bg-stone-950 border-2 border-stone-700 shrink-0 self-start lg:self-auto shadow-xs">
              <button
                @click="selectedPeriod = 'all'"
                :class="[
                  'px-3 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 select-none',
                  selectedPeriod === 'all'
                    ? 'bg-brand-red text-white shadow-xs border border-white/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                ]"
              >
                <Flame class="w-3.5 h-3.5 text-yellow-300" />
                <span>Semua Waktu</span>
              </button>
              <button
                @click="selectedPeriod = 'month'"
                :class="[
                  'px-3 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 select-none',
                  selectedPeriod === 'month'
                    ? 'bg-brand-red text-white shadow-xs border border-white/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                ]"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>Bulan Ini</span>
              </button>
              <button
                @click="selectedPeriod = 'week'"
                :class="[
                  'px-3 py-1.5 font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 select-none',
                  selectedPeriod === 'week'
                    ? 'bg-brand-red text-white shadow-xs border border-white/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                ]"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span>Minggu Ini</span>
              </button>
            </div>

            <!-- Middle / Right Controls: Category, Year, Instant Live Search & Reset -->
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-1 min-w-0">
              
              <!-- 1. Kategori Dropdown (Popover 2 Kolom) -->
              <div ref="categoryDropdownRef" class="relative shrink-0">
                <button
                  @click.stop="toggleCategoryDropdown"
                  type="button"
                  :class="[
                    'h-10 px-3 border-2 font-sans text-xs md:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-between gap-2 select-none',
                    selectedCategory !== 'all'
                      ? 'bg-brand-red text-white border-white shadow-xs'
                      : 'bg-stone-800 hover:bg-stone-750 text-stone-100 border-stone-700'
                  ]"
                >
                  <Clapperboard class="w-4 h-4 shrink-0 text-brand-orange" />
                  <span class="truncate max-w-[110px] sm:max-w-[140px]">
                    {{ currentCategoryName }}
                  </span>
                  <span
                    :class="[
                      'px-1.5 py-0.2 text-[10px] font-mono font-bold border rounded-xs shrink-0',
                      selectedCategory !== 'all'
                        ? 'bg-black/30 text-white border-white/30'
                        : 'bg-stone-700 text-stone-200 border-stone-600'
                    ]"
                  >
                    {{ getCategoryCount(selectedCategory) }}
                  </span>
                  <ChevronDown
                    class="w-3.5 h-3.5 transition-transform duration-200"
                    :class="{ 'rotate-180': isCategoryDropdownOpen }"
                  />
                </button>

                <!-- Category Dropdown Popover (2-Column Grid) -->
                <div
                  v-if="isCategoryDropdownOpen"
                  class="absolute top-full left-0 mt-2 z-[100] w-full sm:w-[360px] md:w-[400px] bg-stone-900 border-3 border-stone-200 shadow-brutal-lg p-3 md:p-4 animate-in fade-in zoom-in-95 duration-150 text-stone-100"
                >
                  <div class="flex items-center justify-between pb-2 mb-2 border-b-2 border-stone-800">
                    <div class="flex items-center gap-2">
                      <Film class="w-4 h-4 text-brand-red" />
                      <span class="font-sans font-bold text-xs uppercase tracking-wider text-stone-200">
                        Pilih Kategori Karya
                      </span>
                    </div>
                    <span class="text-[11px] font-mono font-bold text-stone-400">
                      {{ categories.length }} Kategori
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    <button
                      v-for="cat in categories"
                      :key="cat.id"
                      @click="selectCategory(cat.id)"
                      :class="[
                        'w-full text-left px-3 py-2 border font-sans text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2',
                        selectedCategory === cat.id
                          ? 'bg-brand-red text-white border-white font-bold shadow-xs'
                          : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                      ]"
                    >
                      <span class="truncate">{{ cat.name }}</span>
                      <span
                        :class="[
                          'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-xs shrink-0',
                          selectedCategory === cat.id
                            ? 'bg-black/30 text-white'
                            : 'bg-stone-700 text-stone-300'
                        ]"
                      >
                        {{ getCategoryCount(cat.id) }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 2. Tahun Projek / Angkatan Dropdown (Popover 2 Kolom) -->
              <div ref="yearDropdownRef" class="relative shrink-0">
                <button
                  @click.stop="toggleYearDropdown"
                  type="button"
                  :class="[
                    'h-10 px-3 border-2 font-sans text-xs md:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-between gap-2 select-none',
                    selectedYear !== 'all'
                      ? 'bg-brand-teal text-white border-white shadow-xs'
                      : 'bg-stone-800 hover:bg-stone-750 text-stone-100 border-stone-700'
                  ]"
                >
                  <GraduationCap class="w-4 h-4 shrink-0 text-brand-teal" />
                  <span class="truncate max-w-[110px] sm:max-w-[140px]">
                    {{ currentYearName }}
                  </span>
                  <span
                    :class="[
                      'px-1.5 py-0.2 text-[10px] font-mono font-bold border rounded-xs shrink-0',
                      selectedYear !== 'all'
                        ? 'bg-black/30 text-white border-white/30'
                        : 'bg-stone-700 text-stone-200 border-stone-600'
                    ]"
                  >
                    {{ getYearCount(selectedYear) }}
                  </span>
                  <ChevronDown
                    class="w-3.5 h-3.5 transition-transform duration-200"
                    :class="{ 'rotate-180': isYearDropdownOpen }"
                  />
                </button>

                <!-- Year Dropdown Popover (2-Column Grid) -->
                <div
                  v-if="isYearDropdownOpen"
                  class="absolute top-full left-0 mt-2 z-[100] w-full sm:w-[320px] md:w-[360px] bg-stone-900 border-3 border-stone-200 shadow-brutal-lg p-3 md:p-4 animate-in fade-in zoom-in-95 duration-150 text-stone-100"
                >
                  <div class="flex items-center justify-between pb-2 mb-2 border-b-2 border-stone-800">
                    <div class="flex items-center gap-2">
                      <GraduationCap class="w-4 h-4 text-brand-teal" />
                      <span class="font-sans font-bold text-xs uppercase tracking-wider text-stone-200">
                        Pilih Tahun Angkatan
                      </span>
                    </div>
                    <span class="text-[11px] font-mono font-bold text-stone-400">
                      {{ availableYears.length + 1 }} Opsi
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    <!-- Semua Tahun Option -->
                    <button
                      @click="selectYear('all')"
                      :class="[
                        'w-full text-left px-3 py-2 border font-sans text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2',
                        selectedYear === 'all'
                          ? 'bg-brand-teal text-white border-white font-bold shadow-xs'
                          : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                      ]"
                    >
                      <span class="truncate">Semua Tahun</span>
                      <span
                        :class="[
                          'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-xs shrink-0',
                          selectedYear === 'all'
                            ? 'bg-black/30 text-white'
                            : 'bg-stone-700 text-stone-300'
                        ]"
                      >
                        {{ getYearCount('all') }}
                      </span>
                    </button>

                    <!-- Individual Years -->
                    <button
                      v-for="yr in availableYears"
                      :key="yr"
                      @click="selectYear(yr)"
                      :class="[
                        'w-full text-left px-3 py-2 border font-sans text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2',
                        selectedYear === yr
                          ? 'bg-brand-teal text-white border-white font-bold shadow-xs'
                          : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                      ]"
                    >
                      <span class="truncate">Tahun {{ yr }}</span>
                      <span
                        :class="[
                          'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-xs shrink-0',
                          selectedYear === yr
                            ? 'bg-black/30 text-white'
                            : 'bg-stone-700 text-stone-300'
                        ]"
                      >
                        {{ getYearCount(yr) }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 3. Live Instant Search Input (Lebar, Nyaman & Langsung Berfungsi) -->
              <div class="relative flex-1 min-w-[160px]">
                <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari judul film atau kreator..."
                  class="w-full h-10 pl-9 pr-8 font-sans text-xs md:text-sm font-medium bg-stone-800 border-2 border-stone-700 text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-brand-red focus:bg-stone-850 transition-colors"
                />
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer transition-colors"
                  title="Hapus pencarian"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- 4. Reset All Filters Button -->
              <button
                v-if="hasActiveFilters"
                @click="resetFilters"
                class="h-10 px-3 border-2 border-dashed border-stone-500 hover:border-brand-red hover:bg-red-950/40 text-stone-300 hover:text-brand-red font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                title="Reset semua filter"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Reset</span>
              </button>

            </div>

          </div>

          <!-- Active Filter Indicator Line inside banner if any filter is applied -->
          <div
            v-if="hasActiveFilters"
            class="flex items-center justify-between border-t border-stone-800 pt-3 mt-3 text-xs font-sans"
          >
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-bold text-stone-400 shrink-0">Filter Aktif:</span>
              <span class="text-brand-orange font-bold truncate">{{ activeFilterLabel }}</span>
            </div>
            <span class="text-stone-400 font-mono text-[11px] shrink-0">
              <strong class="text-white">{{ filteredFilms.length }}</strong> karya ditemukan
            </span>
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
        <!-- ══════════════════════════════════════════════════════════════════════
             DYNAMIC TOP 3 OLYMPIC STEPPED PODIUM SHOWCASE (CALCULATED FROM ACTIVE FILTER)
             ══════════════════════════════════════════════════════════════════════ -->
        <div v-if="topThree.length > 0" class="mb-14 md:mb-20">
          <div class="flex flex-col items-center justify-center mb-10 md:mb-14 text-center">
            <div class="flex items-center gap-3 justify-center mb-2">
              <Trophy class="w-7 h-7 md:w-9 md:h-9 text-yellow-500 shrink-0" />
              <h2 class="font-heading text-2xl md:text-4xl text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                Papan Peringkat Teratas
              </h2>
            </div>
            <p class="font-sans text-xs md:text-sm text-stone-500 dark:text-stone-400 font-medium">
              Pemuncak apresiasi untuk: <strong class="text-stone-900 dark:text-stone-100">{{ activeFilterLabel }}</strong>
            </p>
          </div>

          <!-- Stepped Podium Showcase (Adapts gracefully if 1, 2, or 3 films) -->
          <div
            :class="[
              'grid gap-8 md:gap-5 items-end justify-center max-w-5xl mx-auto pt-10 md:pt-12',
              topThree.length === 1 ? 'grid-cols-1 max-w-sm' : topThree.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl' : 'grid-cols-1 md:grid-cols-3'
            ]"
          >
            <!-- 2nd PLACE (SILVER WING) - Only if 2+ films -->
            <div
              v-if="topThree[1]"
              class="order-2 md:order-1 w-full max-w-sm mx-auto group/podium"
            >
              <router-link
                :to="`/archive/${topThree[1].slug || topThree[1].id}`"
                class="block bg-white dark:bg-stone-900 border-3 border-black dark:border-stone-100 shadow-brutal p-4 md:p-5 pt-9 md:pt-11 text-center relative transition-all duration-300 group-hover/podium:-translate-y-1.5 group-hover/podium:shadow-brutal-lg cursor-pointer"
                :aria-label="`Buka film ${topThree[1].title}`"
              >
                <!-- Combined 2nd Place Floating Silver Badge (Slightly more compact) -->
                <div class="absolute -top-8 md:-top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                  <div class="absolute -inset-2.5 bg-slate-300/20 rounded-full blur-md pointer-events-none"></div>
                  <div class="relative flex flex-col items-center anim-silver-badge">
                    <div class="relative -mb-2 z-20 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                      <Medal class="w-6 h-6 md:w-7 md:h-7 text-stone-950 fill-slate-200 stroke-[2.5]" />
                      <Sparkles class="w-2.5 h-2.5 text-white fill-white absolute -top-1 -right-1 anim-sparkle [animation-delay:-0.8s]" />
                    </div>
                    <div
                      class="w-11 h-11 md:w-13 md:h-13 bg-gradient-to-b from-slate-100 via-stone-200 to-slate-400 border-3 border-black dark:border-stone-100 shadow-brutal-xs flex flex-col items-center justify-center rounded-full relative overflow-hidden group-hover/podium:scale-105 transition-transform duration-500"
                    >
                      <div class="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent anim-shimmer [animation-delay:-1.5s] pointer-events-none"></div>
                      <span class="font-heading font-black text-xl md:text-2xl text-stone-900 leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] z-10">
                        2
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Poster with Play Overlay that reveals on full card hover -->
                <div
                  class="block relative mb-3 overflow-hidden border-2 border-black dark:border-stone-100 aspect-[2/3] bg-stone-200 dark:bg-stone-800"
                >
                  <img
                    v-if="topThree[1].image && !imageErrors['podium-1']"
                    :src="assetUrl(topThree[1].image)"
                    :alt="topThree[1].title"
                    @error="imageErrors['podium-1'] = true"
                    class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-stone-100 dark:bg-stone-800 select-none">
                    <Film class="w-8 h-8 text-stone-400 dark:text-stone-500 mb-1" />
                    <span class="text-[9px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-tight">Poster Belum Tersedia</span>
                  </div>

                  <!-- Hover Overlay (Play) triggered by full card hover -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/podium:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                    <Play class="w-12 h-12 text-white" />
                  </div>

                  <!-- PERINGKAT 2 BADGE -->
                  <div class="absolute top-2 left-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 px-2.5 py-1 text-xs font-heading font-black uppercase tracking-wider border-2 border-black shadow-brutal-xs z-10 inline-flex items-center gap-1.5">
                    <Medal class="w-3.5 h-3.5 text-stone-900 dark:text-stone-100 shrink-0" />
                    <span>PERINGKAT 2</span>
                  </div>
                  <!-- Category & Year Badge (Top Right) -->
                  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <span v-if="topThree[1].year" class="bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 shadow-xs inline-flex items-center">
                      {{ topThree[1].year }}
                    </span>
                    <span v-if="topThree[1].categoryName" class="bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs inline-flex items-center">
                      {{ topThree[1].categoryName }}
                    </span>
                  </div>
                </div>

                <!-- Title Link / Display -->
                <h3
                  class="font-display font-bold text-base md:text-lg text-stone-900 dark:text-stone-100 truncate mb-1"
                >
                  {{ topThree[1].title }}
                </h3>
                <p class="font-mono text-xs text-stone-500 dark:text-stone-400 mb-3 truncate flex items-center justify-center gap-1.5">
                  <img
                    v-if="topThree[1].creator?.image"
                    :src="assetUrl(topThree[1].creator.image)"
                    :alt="topThree[1].director"
                    class="w-4 h-4 rounded-full object-cover border border-stone-300 dark:border-stone-600 shrink-0"
                  />
                  <User v-else class="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <router-link
                    v-if="topThree[1].creator?.id || topThree[1].creator?.user_id || topThree[1].user_id"
                    :to="`/p/${topThree[1].creator?.id || topThree[1].creator?.user_id || topThree[1].user_id}`"
                    class="hover:underline hover:text-brand-teal font-semibold text-stone-700 dark:text-stone-300 cursor-pointer truncate"
                    @click.stop
                  >
                    {{ topThree[1].director }}
                  </router-link>
                  <span v-else class="font-semibold text-stone-700 dark:text-stone-300 truncate">{{ topThree[1].director }}</span>
                </p>

                <div
                  class="flex items-center justify-between bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2.5 shadow-brutal-xs"
                >
                  <div class="flex items-center gap-1.5">
                    <Flame class="w-4 h-4 text-orange-500 shrink-0" />
                    <span class="font-heading font-black text-base text-stone-900 dark:text-stone-100">
                      {{ topThree[1].votes.toLocaleString() }}
                    </span>
                    <span class="font-body text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Suara
                    </span>
                  </div>
                  <Button
                    @click.stop.prevent="vote(topThree[1])"
                    :disabled="votingId === topThree[1].id"
                    size="sm"
                    :class="[
                      'border-2 border-black font-bold text-xs transition-all h-9 px-3.5 cursor-pointer inline-flex items-center group/btn shadow-brutal-xs',
                      topThree[1].hasVoted
                        ? 'bg-stone-200 hover:bg-red-600 text-stone-800 hover:text-white dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-red-600 dark:hover:text-white border-black'
                        : 'bg-brand-red text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                    ]"
                    :title="topThree[1].hasVoted ? 'Klik untuk membatalkan apresiasi' : 'Beri apresiasi untuk karya ini'"
                  >
                    <Loader2
                      v-if="votingId === topThree[1].id"
                      class="w-3.5 h-3.5 mr-1.5 animate-spin"
                    />
                    <template v-else-if="topThree[1].hasVoted">
                      <span class="inline-flex items-center group-hover/btn:hidden font-bold">
                        <Heart class="w-3.5 h-3.5 mr-1.5 fill-brand-red text-brand-red shrink-0" />
                        Diapresiasi
                      </span>
                      <span class="hidden group-hover/btn:inline-flex items-center text-white font-bold">
                        <X class="w-3.5 h-3.5 mr-1.5 text-white shrink-0" />
                        Batal Apresiasi
                      </span>
                    </template>
                    <template v-else>
                      <Heart class="w-3.5 h-3.5 mr-1.5 fill-white text-white" />
                      Apresiasi
                    </template>
                  </Button>
                </div>
              </router-link>
            </div>

            <!-- 1st PLACE (CENTER - GOLD CHAMPION - ELEVATED) -->
            <div
              v-if="topThree[0]"
              :class="[
                'order-1 w-full max-w-sm mx-auto group/podium z-20',
                topThree.length >= 3 ? 'md:order-2 md:-translate-y-10' : 'md:order-1'
              ]"
            >
              <router-link
                :to="`/archive/${topThree[0].slug || topThree[0].id}`"
                class="block bg-amber-400 dark:bg-amber-500 border-4 border-black shadow-brutal-lg p-5 md:p-6 pt-10 md:pt-13 text-center relative transition-all duration-300 group-hover/podium:-translate-y-2 group-hover/podium:shadow-brutal-xl cursor-pointer"
                :aria-label="`Buka film ${topThree[0].title}`"
              >
                <!-- Combined 1st Place Floating Royal Crown Badge (Slightly more compact) -->
                <div class="absolute -top-9 md:-top-11 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                  <!-- Glowing Aura Backing -->
                  <div class="absolute -inset-3 bg-yellow-400/30 rounded-full blur-lg animate-pulse pointer-events-none"></div>

                  <div class="relative flex flex-col items-center anim-champion-badge">
                    <!-- Royal Floating Crown with Breath Animation -->
                    <div class="relative -mb-2.5 z-20 anim-crown">
                      <Crown class="w-7 h-7 md:w-9 md:h-9 text-stone-950 fill-yellow-300 stroke-[2.5]" />
                      <Sparkles class="w-3.5 h-3.5 text-yellow-100 fill-white absolute -top-1 -right-1.5 anim-sparkle" />
                      <Sparkles class="w-2.5 h-2.5 text-amber-200 fill-amber-100 absolute -bottom-0.5 -left-1.5 anim-sparkle [animation-delay:-1.2s]" />
                    </div>
                    
                    <!-- Golden Champion Medallion Crest with Shimmer -->
                    <div
                      class="w-13 h-13 md:w-16 md:h-16 bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 border-3 md:border-4 border-black shadow-brutal-sm flex flex-col items-center justify-center rounded-full relative overflow-hidden group-hover/podium:scale-105 transition-transform duration-500"
                    >
                      <!-- Shimmer light reflection line -->
                      <div class="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent anim-shimmer pointer-events-none"></div>
                      
                      <!-- Coin detail ring -->
                      <div class="absolute inset-1 rounded-full border-2 border-dashed border-amber-950/30 pointer-events-none"></div>
                      
                      <span class="font-heading font-black text-2xl md:text-3xl text-amber-950 leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] z-10">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Poster with Play Overlay that reveals on full card hover -->
                <div
                  class="block relative mb-3 overflow-hidden border-3 border-black aspect-[2/3] bg-stone-900 shadow-brutal-sm"
                >
                  <img
                    v-if="topThree[0].image && !imageErrors['podium-0']"
                    :src="assetUrl(topThree[0].image)"
                    :alt="topThree[0].title"
                    @error="imageErrors['podium-0'] = true"
                    class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-stone-850 select-none">
                    <Film class="w-8 h-8 text-amber-400 mb-1" />
                    <span class="text-[9px] font-bold text-amber-300 uppercase tracking-tight">Poster Belum Tersedia</span>
                  </div>

                  <!-- Hover Overlay (Play) triggered by full card hover -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/podium:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                    <Play class="w-12 h-12 text-white" />
                  </div>

                  <!-- PERINGKAT 1 BADGE -->
                  <div class="absolute top-2 left-2 bg-yellow-400 text-stone-900 px-2.5 py-1 text-xs font-heading font-black uppercase tracking-wider border-2 border-black shadow-brutal-xs z-10 inline-flex items-center gap-1.5">
                    <Crown class="w-3.5 h-3.5 fill-stone-900 text-stone-900 shrink-0" />
                    <span>PERINGKAT 1</span>
                  </div>
                  <!-- Category & Year Badge (Top Right) -->
                  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <span v-if="topThree[0].year" class="bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 shadow-xs inline-flex items-center">
                      {{ topThree[0].year }}
                    </span>
                    <span v-if="topThree[0].categoryName" class="bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs inline-flex items-center">
                      {{ topThree[0].categoryName }}
                    </span>
                  </div>
                </div>

                <!-- Title Link / Display -->
                <h3
                  class="font-display font-black text-lg md:text-2xl text-stone-900 truncate mb-1 uppercase"
                >
                  {{ topThree[0].title }}
                </h3>

                <p class="font-mono text-xs md:text-sm text-stone-800 font-bold mb-4 truncate flex items-center justify-center gap-1.5">
                  <img
                    v-if="topThree[0].creator?.image"
                    :src="assetUrl(topThree[0].creator.image)"
                    :alt="topThree[0].director"
                    class="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover border border-stone-900 shrink-0"
                  />
                  <User v-else class="w-4 h-4 text-stone-900 shrink-0" />
                  <router-link
                    v-if="topThree[0].creator?.id || topThree[0].creator?.user_id || topThree[0].user_id"
                    :to="`/p/${topThree[0].creator?.id || topThree[0].creator?.user_id || topThree[0].user_id}`"
                    class="hover:underline hover:text-brand-red font-bold text-stone-900 cursor-pointer truncate"
                    @click.stop
                  >
                    {{ topThree[0].director }}
                  </router-link>
                  <span v-else class="font-bold text-stone-900 truncate">{{ topThree[0].director }}</span>
                </p>

                <div
                  class="flex items-center justify-between bg-white border-3 border-black p-3 shadow-brutal-xs"
                >
                  <div class="flex items-center gap-1.5">
                    <Flame class="w-5 h-5 text-brand-red animate-pulse shrink-0" />
                    <span class="font-heading font-black text-lg text-stone-900">
                      {{ topThree[0].votes.toLocaleString() }}
                    </span>
                    <span class="font-body text-[11px] font-black text-stone-900 uppercase tracking-wide">
                      Suara
                    </span>
                  </div>
                  <Button
                    @click.stop.prevent="vote(topThree[0])"
                    :disabled="votingId === topThree[0].id"
                    size="sm"
                    :class="[
                      'border-2 border-black font-bold text-xs transition-all h-9 px-4 cursor-pointer inline-flex items-center group/btn shadow-brutal-xs',
                      topThree[0].hasVoted
                        ? 'bg-stone-200 hover:bg-red-600 text-stone-800 hover:text-white border-stone-400 hover:border-black'
                        : 'bg-brand-red text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                    ]"
                    :title="topThree[0].hasVoted ? 'Klik untuk membatalkan apresiasi' : 'Beri apresiasi untuk karya ini'"
                  >
                    <Loader2
                      v-if="votingId === topThree[0].id"
                      class="w-3.5 h-3.5 mr-1.5 animate-spin"
                    />
                    <template v-else-if="topThree[0].hasVoted">
                      <span class="inline-flex items-center group-hover/btn:hidden font-bold">
                        <Heart class="w-3.5 h-3.5 mr-1.5 fill-brand-red text-brand-red shrink-0" />
                        Diapresiasi
                      </span>
                      <span class="hidden group-hover/btn:inline-flex items-center text-white font-bold">
                        <X class="w-3.5 h-3.5 mr-1.5 text-white shrink-0" />
                        Batal Apresiasi
                      </span>
                    </template>
                    <template v-else>
                      <Heart class="w-3.5 h-3.5 mr-1.5 fill-white text-white" />
                      Apresiasi
                    </template>
                  </Button>
                </div>
              </router-link>
            </div>

            <!-- 3rd PLACE (BRONZE WING) - Only if 3 films -->
            <div
              v-if="topThree[2]"
              class="order-3 w-full max-w-sm mx-auto group/podium"
            >
              <router-link
                :to="`/archive/${topThree[2].slug || topThree[2].id}`"
                class="block bg-white dark:bg-stone-900 border-3 border-black dark:border-stone-100 shadow-brutal p-4 md:p-5 pt-9 md:pt-11 text-center relative transition-all duration-300 group-hover/podium:-translate-y-1.5 group-hover/podium:shadow-brutal-lg cursor-pointer"
                :aria-label="`Buka film ${topThree[2].title}`"
              >
                <!-- Combined 3rd Place Floating Bronze Badge (Slightly more compact) -->
                <div class="absolute -top-8 md:-top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                  <div class="absolute -inset-2.5 bg-amber-600/20 rounded-full blur-md pointer-events-none"></div>
                  <div class="relative flex flex-col items-center anim-bronze-badge">
                    <div class="relative -mb-2 z-20 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                      <Award class="w-6 h-6 md:w-7 md:h-7 text-stone-950 fill-amber-300 stroke-[2.5]" />
                      <Sparkles class="w-2.5 h-2.5 text-amber-200 fill-white absolute -top-1 -right-1 anim-sparkle [animation-delay:-2s]" />
                    </div>
                    <div
                      class="w-11 h-11 md:w-13 md:h-13 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 border-3 border-black dark:border-stone-100 shadow-brutal-xs flex flex-col items-center justify-center rounded-full relative overflow-hidden group-hover/podium:scale-105 transition-transform duration-500"
                    >
                      <div class="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent anim-shimmer [animation-delay:-3s] pointer-events-none"></div>
                      <span class="font-heading font-black text-xl md:text-2xl text-white leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] z-10">
                        3
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Poster with Play Overlay that reveals on full card hover -->
                <div
                  class="block relative mb-3 overflow-hidden border-2 border-black dark:border-stone-100 aspect-[2/3] bg-stone-200 dark:bg-stone-800"
                >
                  <img
                    v-if="topThree[2].image && !imageErrors['podium-2']"
                    :src="assetUrl(topThree[2].image)"
                    :alt="topThree[2].title"
                    @error="imageErrors['podium-2'] = true"
                    class="w-full h-full object-cover group-hover/podium:scale-105 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-stone-100 dark:bg-stone-800 select-none">
                    <Film class="w-8 h-8 text-stone-400 dark:text-stone-500 mb-1" />
                    <span class="text-[9px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-tight">Poster Belum Tersedia</span>
                  </div>

                  <!-- Hover Overlay (Play) triggered by full card hover -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/podium:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                    <Play class="w-12 h-12 text-white" />
                  </div>

                  <!-- PERINGKAT 3 BADGE -->
                  <div class="absolute top-2 left-2 bg-amber-600 text-white px-2.5 py-1 text-xs font-heading font-black uppercase tracking-wider border-2 border-black shadow-brutal-xs z-10 inline-flex items-center gap-1.5">
                    <Award class="w-3.5 h-3.5 text-white shrink-0" />
                    <span>PERINGKAT 3</span>
                  </div>
                  <!-- Category & Year Badge (Top Right) -->
                  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <span v-if="topThree[2].year" class="bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 shadow-xs inline-flex items-center">
                      {{ topThree[2].year }}
                    </span>
                    <span v-if="topThree[2].categoryName" class="bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs inline-flex items-center">
                      {{ topThree[2].categoryName }}
                    </span>
                  </div>
                </div>

                <!-- Title Link / Display -->
                <h3
                  class="font-display font-bold text-base md:text-lg text-stone-900 dark:text-stone-100 truncate mb-1"
                >
                  {{ topThree[2].title }}
                </h3>
                <p class="font-mono text-xs text-stone-500 dark:text-stone-400 mb-3 truncate flex items-center justify-center gap-1.5">
                  <img
                    v-if="topThree[2].creator?.image"
                    :src="assetUrl(topThree[2].creator.image)"
                    :alt="topThree[2].director"
                    class="w-4 h-4 rounded-full object-cover border border-stone-300 dark:border-stone-600 shrink-0"
                  />
                  <User v-else class="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <router-link
                    v-if="topThree[2].creator?.id || topThree[2].creator?.user_id || topThree[2].user_id"
                    :to="`/p/${topThree[2].creator?.id || topThree[2].creator?.user_id || topThree[2].user_id}`"
                    class="hover:underline hover:text-brand-teal font-semibold text-stone-700 dark:text-stone-300 cursor-pointer truncate"
                    @click.stop
                  >
                    {{ topThree[2].director }}
                  </router-link>
                  <span v-else class="font-semibold text-stone-700 dark:text-stone-300 truncate">{{ topThree[2].director }}</span>
                </p>

                <div
                  class="flex items-center justify-between bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2.5 shadow-brutal-xs"
                >
                  <div class="flex items-center gap-1.5">
                    <Flame class="w-4 h-4 text-orange-500 shrink-0" />
                    <span class="font-heading font-black text-base text-stone-900 dark:text-stone-100">
                      {{ topThree[2].votes.toLocaleString() }}
                    </span>
                    <span class="font-body text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                      Suara
                    </span>
                  </div>
                  <Button
                    @click.stop.prevent="vote(topThree[2])"
                    :disabled="votingId === topThree[2].id"
                    size="sm"
                    :class="[
                      'border-2 border-black font-bold text-xs transition-all h-9 px-3.5 cursor-pointer inline-flex items-center group/btn shadow-brutal-xs',
                      topThree[2].hasVoted
                        ? 'bg-stone-200 hover:bg-red-600 text-stone-800 hover:text-white dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-red-600 dark:hover:text-white border-black'
                        : 'bg-brand-red text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                    ]"
                    :title="topThree[2].hasVoted ? 'Klik untuk membatalkan apresiasi' : 'Beri apresiasi untuk karya ini'"
                  >
                    <Loader2
                      v-if="votingId === topThree[2].id"
                      class="w-3.5 h-3.5 mr-1.5 animate-spin"
                    />
                    <template v-else-if="topThree[2].hasVoted">
                      <span class="inline-flex items-center group-hover/btn:hidden font-bold">
                        <Heart class="w-3.5 h-3.5 mr-1.5 fill-brand-red text-brand-red shrink-0" />
                        Diapresiasi
                      </span>
                      <span class="hidden group-hover/btn:inline-flex items-center text-white font-bold">
                        <X class="w-3.5 h-3.5 mr-1.5 text-white shrink-0" />
                        Batal Apresiasi
                      </span>
                    </template>
                    <template v-else>
                      <Heart class="w-3.5 h-3.5 mr-1.5 fill-white text-white" />
                      Apresiasi
                    </template>
                  </Button>
                </div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════════
             DAFTAR KARYA LAINNYA (PERINGKAT #4 DST. ATAU SELURUH HASIL FILTER)
             ══════════════════════════════════════════════════════════════════════ -->
        <div v-if="filteredFilms.length > 3">
          <div class="flex items-center justify-between mb-6 px-1">
            <div>
              <h3 class="font-heading text-xl md:text-2xl text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                Daftar Peringkat Selanjutnya
              </h3>
              <p class="font-sans text-xs md:text-sm text-stone-500 dark:text-stone-400">
                Peringkat #4 hingga #{{ filteredFilms.length }} pada kategori ini
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <router-link
              v-for="(film, idx) in filteredFilms.slice(3)"
              :key="film.id"
              :to="`/archive/${film.slug || film.id}`"
              class="block group/card cursor-pointer"
              :aria-label="`Buka film: ${film.title}`"
            >
              <ArchiveCard
                :archive="film"
                :subtitle="film.director"
                :show-play-overlay="true"
                class="h-full hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all"
              >
                <!-- Rank Badge Overlay (#4, #5, #6...) -->
                <template #overlay>
                  <Badge
                    :class="[
                      'absolute top-2 left-2 border-2 border-black shadow-brutal-xs px-2.5 py-0.5 text-xs font-heading font-black z-10',
                      getRankBadgeClass(idx + 3),
                    ]"
                  >
                    #{{ idx + 4 }}
                  </Badge>

                  <!-- Year & Category Badges -->
                  <div class="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <span
                      v-if="film.year || film.tahun_karya"
                      class="bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 shadow-xs inline-flex items-center"
                    >
                      {{ film.year || film.tahun_karya }}
                    </span>
                    <span
                      v-if="film.categoryName || film.category?.nama_kategori"
                      class="bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs inline-flex items-center"
                    >
                      {{ film.categoryName || film.category?.nama_kategori }}
                    </span>
                  </div>
                </template>

                <!-- Progress Bar -->
                <template #extra-content>
                  <div class="mb-3">
                    <div class="flex items-center justify-end text-xs mb-1">
                      <span class="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                        {{ Math.round((film.votes / maxVotesCount) * 100) }}% Kepopuleran
                      </span>
                    </div>
                    <div class="w-full bg-stone-200 dark:bg-stone-700 h-2 border border-black dark:border-stone-600 overflow-hidden">
                      <div
                        class="bg-brand-teal h-full transition-all duration-500"
                        :style="{ width: `${Math.max(8, Math.round((film.votes / maxVotesCount) * 100))}%` }"
                      ></div>
                    </div>
                  </div>
                </template>

                <!-- Actions Footer -->
                <template #actions>
                  <div
                    class="flex items-center justify-between w-full border-t-2 border-stone-200 dark:border-stone-800 pt-3 mt-1"
                  >
                    <div class="flex items-center gap-1.5">
                      <Flame class="w-4 h-4 text-orange-500 shrink-0" />
                      <span class="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                        {{ film.votes.toLocaleString() }}
                      </span>
                      <span class="font-body text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                        Suara
                      </span>
                    </div>

                    <Button
                      @click.prevent.stop="vote(film)"
                      :disabled="votingId === film.id"
                      :class="[
                        'border-2 border-black font-bold text-xs transition-all h-9 px-3.5 cursor-pointer inline-flex items-center group/btn shadow-brutal-xs',
                        film.hasVoted
                          ? 'bg-stone-200 hover:bg-red-600 text-stone-800 hover:text-white dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-red-600 dark:hover:text-white border-black'
                          : 'bg-brand-red text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
                      ]"
                      size="sm"
                      :title="film.hasVoted ? 'Klik untuk membatalkan apresiasi' : 'Beri apresiasi untuk karya ini'"
                    >
                      <Loader2
                        v-if="votingId === film.id"
                        class="w-3.5 h-3.5 mr-1.5 animate-spin"
                      />
                      <template v-else-if="film.hasVoted">
                        <span class="inline-flex items-center group-hover/btn:hidden font-bold">
                          <Heart class="w-3.5 h-3.5 mr-1.5 fill-brand-red text-brand-red shrink-0" />
                          Diapresiasi
                        </span>
                        <span class="hidden group-hover/btn:inline-flex items-center text-white font-bold">
                          <X class="w-3.5 h-3.5 mr-1.5 text-white shrink-0" />
                          Batal Apresiasi
                        </span>
                      </template>
                      <template v-else>
                        <Heart class="w-3.5 h-3.5 mr-1.5 fill-white text-white" />
                        Apresiasi
                      </template>
                    </Button>
                  </div>
                </template>
              </ArchiveCard>
            </router-link>
          </div>
        </div>

        <!-- Callout when 1-3 films exist and all are on the podium -->
        <div
          v-else-if="filteredFilms.length > 0"
          class="bg-stone-100 dark:bg-stone-900/60 border-2 border-dashed border-stone-300 dark:border-stone-700 p-6 text-center max-w-xl mx-auto mb-10"
        >
          <p class="font-sans text-xs md:text-sm text-stone-600 dark:text-stone-400 font-medium">
            🏆 Seluruh <strong>{{ filteredFilms.length }}</strong> karya pada filter ini telah ditampilkan di Papan Peringkat Teratas.
          </p>
        </div>

        <!-- EMPTY STATE (WHEN NO FILMS MATCH ACTIVE FILTERS) -->
        <EmptyState
          v-else
          :icon="Film"
          title="Tidak Ada Film Yang Sesuai Filter"
          description="Tidak ditemukan karya yang cocok dengan kombinasi semester, tahun, atau kategori yang dipilih."
          action-label="Reset Semua Filter"
          variant="dashed"
          @action="resetFilters"
        />
      </template>

      <!-- CALL TO ACTION BANNER (Only visible to admin and creator roles) -->
      <div
        v-if="canUpload"
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

<style scoped>
@keyframes championFloat {
  0%, 100% {
    transform: translateY(0px) rotate(-1.5deg);
  }
  50% {
    transform: translateY(-8px) rotate(1.5deg);
  }
}

@keyframes silverFloat {
  0%, 100% {
    transform: translateY(0px) rotate(1.5deg);
  }
  50% {
    transform: translateY(-6px) rotate(-1.5deg);
  }
}

@keyframes bronzeFloat {
  0%, 100% {
    transform: translateY(0px) rotate(-1deg);
  }
  50% {
    transform: translateY(-5px) rotate(1deg);
  }
}

@keyframes shimmerGleam {
  0% {
    transform: translateX(-180%) skewX(-25deg);
  }
  25%, 100% {
    transform: translateX(250%) skewX(-25deg);
  }
}

@keyframes crownPulse {
  0%, 100% {
    transform: scale(1) rotate(-3deg);
    filter: drop-shadow(0 4px 8px rgba(234, 179, 8, 0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  }
  50% {
    transform: scale(1.08) rotate(3deg) translateY(-2px);
    filter: drop-shadow(0 6px 16px rgba(234, 179, 8, 0.95)) drop-shadow(0 4px 8px rgba(0,0,0,0.6));
  }
}

@keyframes sparkleRotate {
  0%, 100% {
    transform: scale(0.8) rotate(0deg);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.25) rotate(180deg);
    opacity: 1;
  }
}

.anim-champion-badge {
  animation: championFloat 4s ease-in-out infinite;
}

.anim-silver-badge {
  animation: silverFloat 4.5s ease-in-out infinite;
  animation-delay: -1.5s;
}

.anim-bronze-badge {
  animation: bronzeFloat 5s ease-in-out infinite;
  animation-delay: -3s;
}

.anim-crown {
  animation: crownPulse 3s ease-in-out infinite;
}

.anim-shimmer {
  animation: shimmerGleam 4s ease-in-out infinite;
}

.anim-sparkle {
  animation: sparkleRotate 2.5s ease-in-out infinite;
}
</style>
