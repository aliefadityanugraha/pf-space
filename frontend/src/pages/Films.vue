<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import {
  Film,
  Search,
  X,
  RefreshCw,
  BookOpen,
  ChevronRight,
  Grid3x3,
  Clapperboard,
} from "lucide-vue-next";
import { api } from "@/lib/api";
import PageLayout from "@/components/PageLayout.vue";
import ArchiveCard from "@/components/ArchiveCard.vue";
import ArchiveSkeleton from "@/components/ArchiveSkeleton.vue";
import Pagination from "@/components/Pagination.vue";
import EmptyState from "@/components/EmptyState.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Router ─────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();

// ─── State ──────────────────────────────────────────────────────────────────
const films = ref([]);
const categories = ref([]);
const loadingFilms = ref(false);
const loadingCategories = ref(false);
const error = ref(null);
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 });

// Filter state — initialised from URL
const selectedCategoryId = ref(
  route.query.category_id ? parseInt(route.query.category_id) : null,
);
const searchQuery = ref(route.query.search || "");
const currentPage = ref(route.query.page ? parseInt(route.query.page) : 1);

let searchDebounce = null;

// ─── Computed ────────────────────────────────────────────────────────────────
const activeCategory = computed(
  () =>
    categories.value.find((c) => c.category_id === selectedCategoryId.value) ??
    null,
);

const hasActiveFilter = computed(
  () => selectedCategoryId.value !== null || searchQuery.value.trim() !== "",
);

const resultLabel = computed(() => {
  if (activeCategory.value && searchQuery.value.trim()) {
    return `${activeCategory.value.nama_kategori} · "${searchQuery.value.trim()}"`;
  }
  if (activeCategory.value) return activeCategory.value.nama_kategori;
  if (searchQuery.value.trim())
    return `Pencarian: "${searchQuery.value.trim()}"`;
  return "Semua Karya";
});

// ─── SEO ────────────────────────────────────────────────────────────────────
useHead(() => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const logoUrl = `${origin}/logo-perfilman.png`;
  const title = activeCategory.value
    ? `${activeCategory.value.nama_kategori} — Arsip Karya · PF Space`
    : "Jelajahi Arsip Karya — PF Space";
  const description = activeCategory.value
    ? `Jelajahi karya sinematik siswa dalam kategori ${activeCategory.value.nama_kategori} di PF Space.`
    : "Jelajahi seluruh arsip karya sinematik siswa PF Space — platform kearsipan, apresiasi, dan pembelajaran.";

  return {
    title,
    meta: [
      { name: "description", content: description },

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
  };
});

// ─── URL sync ────────────────────────────────────────────────────────────────
const syncUrl = () => {
  const query = {};
  if (selectedCategoryId.value) query.category_id = selectedCategoryId.value;
  if (searchQuery.value.trim()) query.search = searchQuery.value.trim();
  if (currentPage.value > 1) query.page = currentPage.value;
  router.replace({ query });
};

// ─── Fetch ───────────────────────────────────────────────────────────────────
const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    const res = await api.get("/api/categories");
    categories.value = res.data || [];
  } catch (err) {
    console.error("[Films] fetchCategories error:", err);
  } finally {
    loadingCategories.value = false;
  }
};

const fetchFilms = async () => {
  loadingFilms.value = true;
  error.value = null;
  try {
    const params = { page: currentPage.value, limit: pagination.value.limit };
    if (selectedCategoryId.value) params.category_id = selectedCategoryId.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();

    const res = await api.get("/api/films", { params });
    films.value = res.data || [];
    if (res.pagination)
      pagination.value = { ...pagination.value, ...res.pagination };
  } catch (err) {
    console.error("[Films] fetchFilms error:", err);
    error.value = err.message || "Gagal memuat arsip.";
    films.value = [];
  } finally {
    loadingFilms.value = false;
  }
};

// ─── Actions ─────────────────────────────────────────────────────────────────
const selectCategory = (categoryId) => {
  selectedCategoryId.value =
    categoryId === selectedCategoryId.value ? null : categoryId;
  currentPage.value = 1;
  syncUrl();
  fetchFilms();
};

const clearCategory = () => {
  selectedCategoryId.value = null;
  currentPage.value = 1;
  syncUrl();
  fetchFilms();
};

const clearSearch = () => {
  searchQuery.value = "";
  currentPage.value = 1;
  syncUrl();
  fetchFilms();
};

const clearAllFilters = () => {
  selectedCategoryId.value = null;
  searchQuery.value = "";
  currentPage.value = 1;
  syncUrl();
  fetchFilms();
};

const onSearchInput = () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentPage.value = 1;
    syncUrl();
    fetchFilms();
  }, 400);
};

const handlePageChange = (page) => {
  currentPage.value = page;
  syncUrl();
  fetchFilms();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const retry = () => {
  error.value = null;
  fetchFilms();
};

// ─── Browser Back / Forward (URL-driven state) ───────────────────────────────
watch(
  () => route.query,
  (q) => {
    const newCatId = q.category_id ? parseInt(q.category_id) : null;
    const newSearch = q.search || "";
    const newPage = q.page ? parseInt(q.page) : 1;

    if (
      newCatId !== selectedCategoryId.value ||
      newSearch !== searchQuery.value ||
      newPage !== currentPage.value
    ) {
      selectedCategoryId.value = newCatId;
      searchQuery.value = newSearch;
      currentPage.value = newPage;
      fetchFilms();
    }
  },
  { deep: true },
);

// ─── Mount ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchCategories();
  await fetchFilms();
});
</script>

<template>
  <PageLayout>
    <!-- ══════════════════════════════════════════════════════════════════════
         HERO / PAGE HEADER
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="relative bg-stone-900 overflow-hidden border-b-4 border-black">
      <!-- Dot pattern texture -->
      <div
        class="absolute inset-0 opacity-[0.07] pointer-events-none"
        style="
          background-image: radial-gradient(#fff 1px, transparent 1px);
          background-size: 24px 24px;
        "
      />

      <div class="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 relative">
        <div
          class="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <!-- Left: Copy -->
          <div class="flex-1">
            <!-- Label chip -->
            <div
              class="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal border-2 border-black shadow-brutal-xs mb-5"
            >
              <Clapperboard class="w-3.5 h-3.5 text-white" />
              <span
                class="text-[10px] font-black uppercase tracking-widest text-white"
                >Arsip Karya</span
              >
            </div>

            <h1
              class="font-heading text-4xl sm:text-6xl md:text-8xl text-white leading-none mb-4 tracking-wide"
            >
              JELAJAHI<br class="hidden sm:block" />
              <span class="text-brand-orange">ARSIP</span>
            </h1>

            <p
              class="font-body text-stone-400 text-sm md:text-base max-w-lg leading-relaxed"
            >
              Temukan, apresiasi, dan pelajari karya sinematik siswa PF Space —
              dari film pendek, dokumenter, eksperimental, hingga musikal.
            </p>
          </div>

          <!-- Right: Stats -->
          <div class="flex gap-3 md:gap-4 md:flex-shrink-0">
            <div
              class="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal px-5 py-4 text-center min-w-[80px]"
            >
              <div
                class="font-heading text-3xl md:text-4xl text-stone-900 dark:text-stone-100 leading-none"
              >
                {{ loadingFilms ? "—" : pagination.total }}
              </div>
              <div
                class="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 mt-1"
              >
                Karya
              </div>
            </div>
            <div
              class="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal px-5 py-4 text-center min-w-[80px]"
            >
              <div
                class="font-heading text-3xl md:text-4xl text-stone-900 dark:text-stone-100 leading-none"
              >
                {{ loadingCategories ? "—" : categories.length }}
              </div>
              <div
                class="text-[9px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 mt-1"
              >
                Kategori
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         FILTER BAR
         ══════════════════════════════════════════════════════════════════════ -->
    <div
      class="sticky top-[64px] md:top-[80px] z-20 bg-background border-b-2 border-border shadow-brutal-sm transition-colors duration-300 w-full"
    >
      <div
        class="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full min-w-0"
      >
        <!-- Search -->
        <div class="relative w-full sm:w-72 lg:w-96 flex-shrink-0">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          />
          <input
            id="films-search"
            v-model="searchQuery"
            type="search"
            placeholder="Cari judul atau sinopsis…"
            autocomplete="off"
            aria-label="Cari karya"
            class="w-full pl-9 pr-8 py-2 bg-card border-2 border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors"
            @input="onSearchInput"
          />
          <button
            v-if="searchQuery"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal cursor-pointer"
            aria-label="Hapus pencarian"
            @click="clearSearch"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Category pills — horizontal scroll on mobile -->
        <div class="w-full sm:flex-1 overflow-x-auto min-w-0 py-1 scrollbar-none touch-pan-x overscroll-x-contain">
          <div
            class="flex gap-1.5 min-w-max pb-0.5"
            role="group"
            aria-label="Filter kategori"
          >
            <!-- "Semua" pill -->
            <button
              id="category-tab-all"
              role="radio"
              :aria-checked="selectedCategoryId === null"
              class="flex-shrink-0 px-3.5 py-1.5 border-2 border-border font-body text-[11px] font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal cursor-pointer"
              :class="
                selectedCategoryId === null
                  ? 'bg-foreground text-background shadow-brutal-xs translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal-xs'
              "
              @click="clearCategory"
            >
              Semua
            </button>

            <!-- Skeleton pills while loading -->
            <template v-if="loadingCategories">
              <div
                v-for="n in 6"
                :key="n"
                class="flex-shrink-0 h-[34px] bg-stone-200 border-2 border-stone-300 animate-pulse"
                :style="`width: ${60 + n * 8}px`"
              />
            </template>

            <!-- Category pills -->
            <button
              v-for="cat in categories"
              :key="cat.category_id"
              :id="`category-tab-${cat.category_id}`"
              role="radio"
              :aria-checked="selectedCategoryId === cat.category_id"
              class="flex-shrink-0 px-3.5 py-1.5 border-2 border-border font-body text-[11px] font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal whitespace-nowrap cursor-pointer"
              :class="
                selectedCategoryId === cat.category_id
                  ? 'bg-brand-teal text-white shadow-brutal-xs translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal-xs'
              "
              @click="selectCategory(cat.category_id)"
            >
              {{ cat.nama_kategori }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         CONTENT AREA
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <!-- Result Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
      >
        <div>
          <h2
            class="font-display text-xl md:text-2xl font-bold text-stone-900 leading-tight"
          >
            {{ resultLabel }}
          </h2>
          <p class="text-xs font-body text-stone-500 mt-0.5">
            <template v-if="loadingFilms">Memuat…</template>
            <template v-else> {{ pagination.total }} karya ditemukan </template>
          </p>
        </div>

        <!-- Clear filters button -->
        <Button
          v-if="hasActiveFilter && !loadingFilms"
          variant="outline"
          size="sm"
          class="self-start sm:self-auto gap-1.5 border-2 border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900 font-body text-xs font-semibold uppercase tracking-wide"
          @click="clearAllFilters"
        >
          <X class="w-3 h-3" />
          Hapus Filter
        </Button>
      </div>

      <!-- ── Error State ─────────────────────────────────────────────────── -->
      <div v-if="error && !loadingFilms" class="py-16 flex justify-center">
        <div
          class="flex flex-col items-center gap-5 bg-white border-2 border-stone-900 shadow-brutal px-8 py-10 max-w-sm w-full text-center"
        >
          <div
            class="w-14 h-14 bg-red-50 border-2 border-red-200 flex items-center justify-center"
          >
            <Film class="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 class="font-display text-lg font-bold text-stone-900 mb-1">
              Gagal Memuat Arsip
            </h3>
            <p class="font-body text-sm text-stone-500 leading-relaxed">
              {{ error }}
            </p>
          </div>
          <Button
            class="gap-2 border-2 border-stone-900 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-bold uppercase tracking-wide text-xs"
            @click="retry"
          >
            <RefreshCw class="w-4 h-4" />
            Coba Lagi
          </Button>
        </div>
      </div>

      <!-- Loading Skeleton Grid -->
      <div v-if="loadingFilms" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        <ArchiveSkeleton v-for="n in 8" :key="n" />
      </div>

      <!-- Empty State -->
      <div v-else-if="films.length === 0" class="py-12 flex justify-center">
        <EmptyState
          :icon="Film"
          title="Tidak ada karya ditemukan"
          description="Coba cari dengan kata kunci lain atau pilih kategori yang berbeda."
          variant="dashed"
        >
          <template #action>
            <Button
              v-if="hasActiveFilter"
              class="gap-2 border-2 border-stone-900 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-bold uppercase tracking-wide text-xs"
              @click="clearAllFilters"
            >
              <ChevronRight class="w-4 h-4" />
              Lihat Semua Karya
            </Button>
          </template>
        </EmptyState>
      </div>

      <!-- Film Grid -->
      <template v-else>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
        >
          <router-link
            v-for="(film, index) in films"
            :key="film.film_id"
            :to="`/archive/${film.slug}`"
            class="block group opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]"
            :class="`stagger-${(index % 8) + 1}`"
            @animationend="$event.target.style.opacity = 1"
            :aria-label="`Buka arsip: ${film.judul}`"
          >
            <ArchiveCard
              :archive="film"
              :subtitle="film.creator?.name || ''"
              :show-status="false"
              class="h-full transition-all duration-200 group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-brutal-lg"
            />
          </router-link>
        </div>

        <!-- Pagination -->
        <Pagination
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          class="mt-12"
          @change="handlePageChange"
        />
      </template>
    </div>
  </PageLayout>
</template>
