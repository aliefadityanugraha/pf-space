<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/lib/api";

import PageLayout from "@/components/PageLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import ArchiveCard from "@/components/ArchiveCard.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Film,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Search,
  Filter,
  LayoutGrid,
  Grid3X3,
  ThumbsUp,
  MessageCircle,
} from "lucide-vue-next";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import ArchiveSkeleton from "@/components/ArchiveSkeleton.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import Pagination from "@/components/Pagination.vue";
import ErrorBoundary from "@/components/ErrorBoundary.vue";
import { useToast } from "@/composables/useToast";
import { useHead } from "@unhead/vue";

useHead({
  title: "Manajemen Karya Saya - PF Space",
});

const router = useRouter();
const films = ref([]);
const loading = ref(true);
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 0 });
const statusFilter = ref("all");
const searchQuery = ref("");
const posterSize = ref("normal"); // 'normal' (besar/standar) | 'compact' (sedikit lebih kecil)
const statusSummary = ref({
  all: 0,
  pending: 0,
  published: 0,
  rejected: 0,
});
const summaryLoading = ref(false);

// Modal & Toast
const showConfirm = ref(false);
const filmToDelete = ref(null);
const deleting = ref(false);
const showRejectionModal = ref(false);
const selectedRejectionFilm = ref(null);
const { showToast } = useToast();

const openRejectionModal = (film) => {
  selectedRejectionFilm.value = film;
  showRejectionModal.value = true;
};

const statusColors = {
  pending:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500 font-bold",
  published:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500 font-bold",
  rejected:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500 font-bold",
};

const statusLabels = {
  pending: "Menunggu",
  published: "Dipublikasi",
  rejected: "Ditolak",
};

// Poster grid layout class based on size toggle
const gridClass = computed(() => {
  if (posterSize.value === "compact") {
    return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4";
  }
  return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
});

let searchTimeout = null;
const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    fetchFilms();
  }, 300);
};

const fetchFilms = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("page", pagination.value.page);
    params.append("limit", pagination.value.limit);
    if (statusFilter.value !== "all") {
      params.append("status", statusFilter.value);
    }
    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value.trim());
    }

    const res = await api.get(`/api/films/my-films?${params}`);
    let data = res.data || [];

    // Fallback client-side filter if backend didn't apply search param
    if (searchQuery.value.trim() && !res.pagination?.filteredByBackend) {
      const q = searchQuery.value.trim().toLowerCase();
      data = data.filter(
        (f) =>
          (f.judul && f.judul.toLowerCase().includes(q)) ||
          (f.deskripsi && f.deskripsi.toLowerCase().includes(q)) ||
          (f.category?.nama_kategori &&
            f.category.nama_kategori.toLowerCase().includes(q))
      );
    }

    films.value = data;
    if (res.pagination) {
      pagination.value = { ...pagination.value, ...res.pagination };
    }
  } catch (err) {
    console.error("Failed to fetch films:", err);
    showToast("Gagal memuat data film", "error");
  } finally {
    loading.value = false;
  }
};

const fetchStatusSummary = async () => {
  summaryLoading.value = true;
  try {
    const statuses = ["all", "pending", "published", "rejected"];
    const requests = statuses.map((status) =>
      api
        .get("/api/films/my-films", {
          params: {
            page: 1,
            limit: 1,
            status: status === "all" ? undefined : status,
          },
        })
        .then((res) => ({
          status,
          total:
            res.pagination?.total ||
            (Array.isArray(res.data) ? res.data.length : 0),
        }))
    );
    const results = await Promise.all(requests);
    const nextSummary = {
      all: 0,
      pending: 0,
      published: 0,
      rejected: 0,
    };
    for (const item of results) {
      nextSummary[item.status] = item.total;
    }
    statusSummary.value = nextSummary;
  } catch (err) {
    console.error("Failed to fetch film status summary:", err);
  } finally {
    summaryLoading.value = false;
  }
};

const confirmDelete = (film) => {
  filmToDelete.value = film;
  showConfirm.value = true;
};

const executeDelete = async () => {
  if (!filmToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/api/films/${filmToDelete.value.film_id}`);
    showToast("Film berhasil dihapus", "success");
    showConfirm.value = false;
    await Promise.all([fetchFilms(), fetchStatusSummary()]);
  } catch (err) {
    showToast(err.message || "Gagal menghapus film", "error");
  } finally {
    deleting.value = false;
    filmToDelete.value = null;
  }
};

const changeFilter = (status) => {
  statusFilter.value = status;
  pagination.value.page = 1;
  fetchFilms();
};

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pagination.value.totalPages) {
    pagination.value.page = newPage;
    fetchFilms();
  }
};

onMounted(async () => {
  await Promise.all([fetchFilms(), fetchStatusSummary()]);
});
</script>

<template>
  <PageLayout>
    <main class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <!-- Breadcrumbs Navigation (Matching Screenshot 1) -->
      <nav
        class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-2 md:pt-6"
      >
        <router-link to="/" class="text-brand-teal hover:underline font-bold">
          BERANDA
        </router-link>
        <span class="text-stone-400">/</span>
        <Badge
          variant="outline"
          class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold uppercase tracking-wider"
        >
          KARYA SAYA
        </Badge>
      </nav>

      <!-- Page Header -->
      <PageHeader
        title="Karya Saya"
        description="Kelola, pantau status kurasi, dan publikasi semua karya yang sudah kamu upload."
        icon-color="bg-brand-teal"
      >
        <template #actions>
          <Button
            @click="router.push('/upload')"
            class="gap-2 bg-brand-teal hover:bg-teal-600 active:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] transition-all h-10 md:h-11 font-bold uppercase tracking-wider text-xs px-5 cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[2.5]" />
            Upload Karya Baru
          </Button>
        </template>
      </PageHeader>

      <!-- Unified Single-Row Toolbar (Sejajar: Filter Status di Kiri, Ukuran Poster & Pencarian di Kanan) -->
      <div
        class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6"
      >
        <!-- Kiri: Filter Tombol Status (Border Jelas & Rapi) -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Semua (Active: Background Putih dengan shadow-brutal-xs) -->
          <button
            type="button"
            @click="changeFilter('all')"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
            :class="
              statusFilter === 'all'
                ? 'bg-white text-stone-950 border-black dark:border-white font-black'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-400'
            "
          >
            <Filter
              class="w-3.5 h-3.5 stroke-[2.5]"
              :class="
                statusFilter === 'all'
                  ? 'text-stone-950'
                  : 'text-stone-500 dark:text-stone-400'
              "
            />
            <span>Semua</span>
            <span
              class="px-1.5 py-0.2 text-[10px] font-mono font-bold border"
              :class="
                statusFilter === 'all'
                  ? 'bg-stone-200 text-stone-950 border-stone-400'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
              "
            >
              {{ summaryLoading ? "…" : statusSummary.all }}
            </span>
          </button>

          <!-- Menunggu Review -->
          <button
            type="button"
            @click="changeFilter('pending')"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
            :class="
              statusFilter === 'pending'
                ? 'bg-yellow-400 text-stone-950 border-black dark:border-white font-black'
                : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-yellow-500'
            "
          >
            <Clock
              class="w-3.5 h-3.5 stroke-[2.5]"
              :class="
                statusFilter === 'pending'
                  ? 'text-stone-950 stroke-[3]'
                  : 'text-yellow-500'
              "
            />
            <span>Menunggu Review</span>
            <span
              class="px-1.5 py-0.2 text-[10px] font-mono font-bold border"
              :class="
                statusFilter === 'pending'
                  ? 'bg-stone-950 text-yellow-300 border-black'
                  : 'bg-yellow-50 dark:bg-amber-950/80 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-amber-600/90'
              "
            >
              {{ summaryLoading ? "…" : statusSummary.pending }}
            </span>
          </button>

          <!-- Dipublikasi -->
          <button
            type="button"
            @click="changeFilter('published')"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
            :class="
              statusFilter === 'published'
                ? 'bg-brand-teal text-white border-black dark:border-white font-black'
                : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-brand-teal'
            "
          >
            <CheckCircle
              class="w-3.5 h-3.5 stroke-[2.5]"
              :class="
                statusFilter === 'published'
                  ? 'text-white'
                  : 'text-emerald-500 dark:text-emerald-400'
              "
            />
            <span>Dipublikasi</span>
            <span
              class="px-1.5 py-0.2 text-[10px] font-mono font-bold border"
              :class="
                statusFilter === 'published'
                  ? 'bg-white/20 text-white border-white'
                  : 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
              "
            >
              {{ summaryLoading ? "…" : statusSummary.published }}
            </span>
          </button>

          <!-- Ditolak -->
          <button
            type="button"
            @click="changeFilter('rejected')"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
            :class="
              statusFilter === 'rejected'
                ? 'bg-brand-red text-white border-black dark:border-white font-black'
                : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-brand-red'
            "
          >
            <XCircle
              class="w-3.5 h-3.5 stroke-[2.5]"
              :class="
                statusFilter === 'rejected'
                  ? 'text-white'
                  : 'text-rose-500'
              "
            />
            <span>Ditolak</span>
            <span
              class="px-1.5 py-0.2 text-[10px] font-mono font-bold border"
              :class="
                statusFilter === 'rejected'
                  ? 'bg-white/20 text-white border-white'
                  : 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
              "
            >
              {{ summaryLoading ? "…" : statusSummary.rejected }}
            </span>
          </button>
        </div>

        <!-- Kanan: Tombol Besar/Kecil Poster (Sebelah Kiri Pencarian) & Pencarian (Mepet Kanan) -->
        <div
          class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end shrink-0"
        >
          <!-- Tombol Ukuran Poster: Besar/Normal & Agak Kecil (Matching Screenshot 1 red box) -->
          <div
            class="flex items-center border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 shadow-brutal-xs shrink-0"
            title="Atur Ukuran Poster"
          >
            <button
              type="button"
              @click="posterSize = 'normal'"
              class="p-2 border-r-2 border-black dark:border-stone-100 transition-colors cursor-pointer"
              :class="
                posterSize === 'normal'
                  ? 'bg-brand-teal text-white'
                  : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              "
              title="Poster Standar / Besar"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="posterSize = 'compact'"
              class="p-2 transition-colors cursor-pointer"
              :class="
                posterSize === 'compact'
                  ? 'bg-brand-teal text-white'
                  : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              "
              title="Poster Sedikit Lebih Kecil"
            >
              <Grid3X3 class="w-4 h-4" />
            </button>
          </div>

          <!-- Input Pencarian (Mepet Kanan) -->
          <div class="relative w-full sm:w-64 md:w-72">
            <Search
              class="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              type="text"
              placeholder="Cari judul film, sutradara, kreator..."
              class="w-full pl-9 pr-8 text-xs h-9 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1 focus:outline-none"
            />
            <button
              v-if="searchQuery"
              @click="
                searchQuery = '';
                fetchFilms();
              "
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Hapus Pencarian"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="loading" :class="gridClass">
        <ArchiveSkeleton v-for="i in 8" :key="i" variant="landscape" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="films.length === 0"
        :icon="Film"
        :title="
          searchQuery
            ? 'Karya tidak ditemukan'
            : statusFilter === 'all'
            ? 'Belum ada karya'
            : `Belum ada karya dengan status ${statusLabels[statusFilter]}`
        "
        :description="
          searchQuery
            ? `Tidak ada karya yang cocok dengan kata kunci '${searchQuery}'.`
            : statusFilter === 'all'
            ? 'Mulai upload karya pertamamu sekarang!'
            : 'Coba pilih status lain atau upload karya baru.'
        "
        :actionLabel="searchQuery ? 'Reset Pencarian' : 'Upload Karya'"
        @action="
          searchQuery
            ? ((searchQuery = ''), fetchFilms())
            : router.push('/upload')
        "
      >
        <template #action-icon>
          <X v-if="searchQuery" class="w-4 h-4" />
          <Plus v-else class="w-4 h-4" />
        </template>
      </EmptyState>

      <!-- Grid Poster View (Disesuaikan dengan Toggle Ukuran Poster) -->
      <ErrorBoundary v-else name="Daftar Karya">
        <div :class="gridClass">
          <ArchiveCard
            v-for="item in films"
            :key="item.film_id"
            :archive="item"
            :show-play-overlay="item.status !== 'rejected'"
            @click="router.push(`/archive/${item.slug}`)"
            class="cursor-pointer h-full border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white dark:bg-stone-900"
          >
            <template #overlay>
              <!-- Default badges -->
              <Badge
                v-if="item.tahun_karya"
                class="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20"
              >
                {{ item.tahun_karya }}
              </Badge>
              <Badge
                v-if="item.category?.nama_kategori"
                class="absolute top-2 right-2 bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs"
              >
                {{ item.category.nama_kategori }}
              </Badge>

              <!-- Rejection Overlay inside Poster Box -->
              <div
                v-if="item.status === 'rejected'"
                class="absolute inset-x-0 bottom-0 bg-stone-950/95 border-t-2 border-brand-red text-white p-2.5 font-body z-10 flex flex-col gap-1 select-none backdrop-blur-xs"
              >
                <div
                  class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400"
                >
                  <XCircle class="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Publikasi Ditolak</span>
                </div>
                <div
                  v-if="item.rejection_reason"
                  class="text-[10px] sm:text-[11px] leading-snug text-stone-100 font-medium"
                >
                  <p class="line-clamp-2">
                    <span class="font-bold text-stone-300">Keterangan:</span>
                    {{ item.rejection_reason }}
                  </p>
                  <button
                    v-if="item.rejection_reason.length > 50"
                    @click.stop="openRejectionModal(item)"
                    class="text-[10px] font-bold text-rose-300 underline mt-0.5 hover:text-white cursor-pointer block text-left"
                  >
                    Lihat Selengkapnya &rarr;
                  </button>
                </div>
              </div>
            </template>

            <template #extra-content>
              <!-- Loves, Comments, and Status Footer Row -->
              <div
                class="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-dashed border-stone-300 dark:border-stone-700 min-w-0"
              >
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono"
                  >
                    <ThumbsUp
                      class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-red fill-current"
                    />
                    {{ item.vote_count || 0 }}
                  </span>
                  <span
                    class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono"
                  >
                    <MessageCircle class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-orange" />
                    {{ item.comment_count || 0 }}
                  </span>
                </div>
                <span
                  :class="[
                    'text-[9px] px-1.5 py-0.5 border shadow-brutal-xs font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 whitespace-nowrap',
                    statusColors[item.status],
                  ]"
                >
                  <Clock
                    v-if="item.status === 'pending'"
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 stroke-[2.5]"
                  />
                  <CheckCircle
                    v-else-if="item.status === 'published'"
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 stroke-[2.5]"
                  />
                  <XCircle
                    v-else-if="item.status === 'rejected'"
                    class="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 stroke-[2.5]"
                  />
                  <span>{{ statusLabels[item.status] }}</span>
                </span>
              </div>
            </template>

            <!-- Actions Row (CRUD buttons) -->
            <template #actions>
              <Button
                size="sm"
                variant="outline"
                class="flex-1 gap-1 h-7 sm:h-8 px-1.5 sm:px-2 font-bold text-[10px] sm:text-xs uppercase border-2 border-stone-800 dark:border-stone-100 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                @click.stop="router.push(`/edit-archive/${item.slug}`)"
              >
                <Pencil
                  class="w-3 h-3 text-brand-teal dark:text-teal-400 shrink-0"
                />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="flex-1 gap-1 h-7 sm:h-8 px-1.5 sm:px-2 font-bold text-[10px] sm:text-xs uppercase border-2 border-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
                @click.stop="confirmDelete(item)"
                title="Hapus Karya"
              >
                <Trash2
                  class="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0"
                />
                <span>Hapus</span>
              </Button>
            </template>
          </ArchiveCard>
        </div>
      </ErrorBoundary>

      <!-- Pagination (Theme-matching Neo-Brutalist Pagination) -->
      <Pagination
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @change="changePage"
      />
    </main>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :show="showConfirm"
      @update:show="showConfirm = $event"
      title="Hapus Karya"
      :message="`Hapus karya '${filmToDelete?.judul}'? Aksi ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      variant="danger"
      :loading="deleting"
      @confirm="executeDelete"
    >
      <template #confirm-icon>
        <Trash2 class="w-4 h-4" />
      </template>
    </ConfirmDialog>

    <!-- Rejection Reason Modal -->
    <div
      v-if="showRejectionModal && selectedRejectionFilm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/50"
        @click="showRejectionModal = false"
      ></div>
      <div
        class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-lg text-stone-900 dark:text-stone-100"
      >
        <div
          class="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-stone-100 bg-red-50 dark:bg-red-950/60"
        >
          <div class="flex items-center gap-3">
            <XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 class="font-bold text-lg text-red-800 dark:text-red-300">
              Alasan Penolakan
            </h2>
          </div>
          <button
            @click="showRejectionModal = false"
            class="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded text-red-800 dark:text-red-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <h3 class="font-bold text-lg mb-2 text-stone-900 dark:text-stone-100">
            {{ selectedRejectionFilm.judul }}
          </h3>
          <div
            class="p-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 whitespace-pre-wrap text-sm"
          >
            {{ selectedRejectionFilm.rejection_reason }}
          </div>
          <div class="mt-6 flex justify-end">
            <Button @click="showRejectionModal = false">Tutup</Button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>


