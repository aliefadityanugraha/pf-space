<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";
import PageLayout from "@/components/PageLayout.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Youtube,
  ExternalLink,
  Download,
  Play,
  Search,
  Filter,
  ChevronRight,
  BookOpen,
  Star,
  Clock,
  User,
  Share2,
  X,
  Eye,
  MonitorPlay,
  Plus,
  LayoutGrid,
  FolderKanban,
} from "lucide-vue-next";
import { useHead } from "@unhead/vue";
import { useToast } from "@/composables/useToast";
import { useAuth } from "@/composables/useAuth";

useHead(() => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const logoUrl = `${origin}/logo-perfilman.png`;
  const title = "Materi Pembelajaran Sinematografi & Perfilman — PF Space";
  const description =
    "Akses modul pembelajaran perfilman, panduan tata kamera, pencahayaan, editing, dan produksi sinema SMK secara gratis.";

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
    script: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Pembelajaran Perfilman SMK",
          description: description,
          provider: {
            "@type": "Organization",
            name: "PF Space",
            sameAs: pageUrl,
          },
        }),
      },
    ],
  };
});

const { showToast } = useToast();
const { isModerator, isAdmin } = useAuth();
const canManage = computed(() => isModerator.value || isAdmin.value);

const materials = ref([]);
const categoryObjects = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedType = ref("all");
const selectedCategory = ref("Semua");
const viewMode = ref("grid"); // 'grid' | 'grouped'

// Modal for preview
const showPreviewModal = ref(false);
const previewMaterial = ref(null);

const fetchCategories = async () => {
  try {
    const res = await api.get('/api/material-categories');
    if (res.success) {
      categoryObjects.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch material categories:', err);
  }
};

const categoryPills = computed(() => {
  return ["Semua", ...categoryObjects.value.map((c) => c.nama_kategori)];
});

const fetchData = async () => {
  loading.value = true;
  try {
    await fetchCategories();
    const res = await api.get("/api/learning-materials");
    if (res.success) {
      materials.value = res.data;
    }
  } catch (err) {
    console.error("Failed to fetch materials:", err);
  } finally {
    loading.value = false;
  }
};

const featuredMaterial = computed(() => {
  return (
    materials.value.find((m) => m.is_featured) ||
    (materials.value.length > 0 ? materials.value[0] : null)
  );
});

const filteredMaterials = computed(() => {
  return materials.value.filter((m) => {
    const matchesSearch =
      m.judul.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (m.deskripsi &&
        m.deskripsi.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesType =
      selectedType.value === "all" || m.tipe === selectedType.value;
    
    const matCatName = m.materialCategory?.nama_kategori || m.kategori;
    const matchesCategory =
      selectedCategory.value === "Semua" ||
      matCatName === selectedCategory.value;
    return matchesSearch && matchesType && matchesCategory;
  });
});

const groupedMaterials = computed(() => {
  const groups = {};
  
  // Initialize groups for fetched categories
  categoryObjects.value.forEach((cat) => {
    groups[cat.nama_kategori] = {
      meta: cat,
      items: []
    };
  });

  // Group filtered materials
  filteredMaterials.value.forEach((m) => {
    const catName = m.materialCategory?.nama_kategori || m.kategori || "Materi Umum";
    if (!groups[catName]) {
      groups[catName] = {
        meta: { nama_kategori: catName, deskripsi: "Materi pembelajaran perfilman", icon: "BookOpen" },
        items: []
      };
    }
    groups[catName].items.push(m);
  });

  // Filter out empty groups unless specific category selected
  return Object.values(groups).filter((g) => g.items.length > 0);
});

const getYoutubeId = (url) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1].split("?")[0];
  }
  return videoId;
};

const getYoutubeEmbedUrl = (url) => {
  const videoId = getYoutubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
};

const getFullUrl = (path) => {
  if (!path) return "";
  return assetUrl(path);
};

const openPreview = (material) => {
  previewMaterial.value = material;
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewMaterial.value = null;
};

const copyLink = (material) => {
  const url =
    window.location.origin +
    (material.tipe === "pdf"
      ? getFullUrl(material.file_path)
      : material.video_url);
  navigator.clipboard.writeText(url);
  showToast("Link berhasil disalin ke clipboard");
};

onMounted(fetchData);
</script>

<template>
  <PageLayout>
    <!-- HERO SECTION -->
    <div class="relative bg-brand-cream overflow-hidden mb-10">
      <div
        class="absolute inset-0 opacity-[0.03] pointer-events-none"
        style="
          background-image: radial-gradient(#000 1px, transparent 1px);
          background-size: 20px 20px;
        "
      ></div>

      <div class="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-24 relative">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              class="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-brutal-xs mb-6"
            >
              <BookOpen class="w-4 h-4 text-brand-teal" />
              <span
                class="text-[10px] font-black uppercase tracking-widest text-stone-600"
                >Knowledge Base</span
              >
            </div>
            <h1
              class="text-3xl md:text-7xl font-display font-black text-stone-900 leading-none mb-4 md:mb-6"
            >
              Materi
              <span
                class="text-brand-teal italic underline md:decoration-4 underline-offset-8"
                >Terbuka</span
              >
              Pembelajaran
            </h1>
            <p
              class="text-lg md:text-xl text-stone-600 dark:text-stone-300 font-medium leading-relaxed max-w-xl mb-10"
            >
              Akses koleksi materi pendukung produksi film, mulai dari
              dasar-dasar sinematografi hingga manajemen sistem informasi
              produksi.
            </p>

            <div class="flex flex-wrap gap-4">
              <div
                class="flex items-center gap-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-4 shadow-brutal-sm"
              >
                <div
                  class="w-10 h-10 bg-brand-red border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center justify-center shrink-0"
                >
                  <FileText class="w-6 h-6 text-white" />
                </div>
                <div>
                  <div class="text-xl font-black leading-tight text-stone-900 dark:text-stone-100">
                    {{ materials.filter((m) => m.tipe === "pdf").length }}
                  </div>
                  <div class="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Arsip PDF
                  </div>
                </div>
              </div>

              <div
                class="flex items-center gap-3 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-4 shadow-brutal-sm"
              >
                <div
                  class="w-10 h-10 bg-[#FF0000] border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center justify-center shrink-0"
                >
                  <Youtube class="w-6 h-6 text-white" />
                </div>
                <div>
                  <div class="text-xl font-black leading-tight text-stone-900 dark:text-stone-100">
                    {{ materials.filter((m) => m.tipe === "video").length }}
                  </div>
                  <div class="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Materi Video
                  </div>
                </div>
              </div>
            </div>

            <div v-if="canManage" class="mt-6">
              <router-link to="/manage-materi">
                <Button
                  class="bg-brand-orange text-stone-900 border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-bold uppercase transition-all gap-2 h-11 px-5 text-sm cursor-pointer"
                >
                  <Plus class="w-4 h-4" />
                  <span>+ Unggah & Kelola Materi</span>
                </Button>
              </router-link>
            </div>
          </div>

          <!-- Featured Card Hero -->
          <div v-if="featuredMaterial" class="hidden lg:block">
            <div class="bg-white dark:bg-stone-900 border-4 border-black dark:border-stone-100 shadow-brutal group">
              <div
                class="aspect-video bg-stone-100 dark:bg-stone-800 border-b-4 border-black dark:border-stone-100 relative overflow-hidden"
              >
                <img
                  v-if="featuredMaterial.tipe === 'video'"
                  :src="`https://img.youtube.com/vi/${getYoutubeId(featuredMaterial.video_url)}/maxresdefault.jpg`"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-brand-red/5 dark:bg-brand-red/10"
                >
                  <FileText class="w-24 h-24 text-brand-red opacity-20" />
                </div>

                <div class="absolute top-4 left-4 flex gap-2">
                  <Badge
                    class="bg-brand-orange text-white border-2 border-black font-black uppercase tracking-widest text-[10px] py-1"
                    >Featured</Badge
                  >
                  <Badge
                    class="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 text-stone-900 dark:text-stone-100 font-black uppercase tracking-widest text-[10px] py-1"
                    >{{ featuredMaterial.kategori || "Materi" }}</Badge
                  >
                </div>

                <button
                  @click="openPreview(featuredMaterial)"
                  class="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all group cursor-pointer"
                >
                  <div
                    class="w-16 h-16 bg-white dark:bg-stone-800 border-4 border-black dark:border-stone-100 shadow-brutal-sm scale-0 group-hover:scale-100 transition-all flex items-center justify-center"
                  >
                    <Play
                      v-if="featuredMaterial.tipe === 'video'"
                      class="w-8 h-8 fill-stone-900 dark:fill-stone-100 text-stone-900 dark:text-stone-100"
                    />
                    <Eye v-else class="w-8 h-8 text-stone-900 dark:text-stone-100" />
                  </div>
                </button>
              </div>
              <div class="p-8">
                <h2 class="text-2xl font-black uppercase mb-3 line-clamp-1 text-stone-900 dark:text-stone-100">
                  {{ featuredMaterial.judul }}
                </h2>
                <p
                  class="text-stone-600 dark:text-stone-400 text-sm mb-6 line-clamp-2 leading-relaxed"
                >
                  {{ featuredMaterial.deskripsi }}
                </p>
                <Button
                  @click="openPreview(featuredMaterial)"
                  class="w-full gap-2 border-2 border-black dark:border-stone-100 shadow-brutal-sm hover:shadow-none translate-y-[-2px] hover:translate-y-0 transition-all py-6 h-auto text-lg uppercase font-black tracking-widest bg-brand-teal text-white cursor-pointer"
                >
                  Mulai Belajar
                  <ChevronRight class="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <!-- CATEGORY TABS & SEARCH -->
      <div class="flex flex-col xl:flex-row gap-8 items-start mb-12">
        <!-- Tabs -->
        <div class="flex-1 w-full">
          <div class="flex items-center gap-2 mb-4">
            <Filter class="w-4 h-4 text-stone-400" />
            <span
              class="text-[10px] font-black uppercase tracking-widest text-stone-400"
              >Filter Kategori</span
            >
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categoryPills"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-4 py-2 border-2 border-black dark:border-stone-100 text-xs font-black uppercase tracking-tight transition-all cursor-pointer',
                selectedCategory === cat
                  ? 'bg-brand-teal text-white shadow-brutal-xs translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 shadow-none',
              ]"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Search & Type & View Mode Toggle -->
        <div class="w-full xl:w-96 shrink-0 flex flex-col gap-4">
          <div class="relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kata kunci materi..."
              class="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-700 shadow-brutal-sm focus:outline-none focus:ring-0 text-sm font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          <div class="flex gap-2">
            <!-- Type Toggle -->
            <div
              class="flex-1 flex border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 h-10 shadow-brutal-xs overflow-hidden"
            >
              <button
                @click="selectedType = 'all'"
                :class="[
                  selectedType === 'all'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700',
                  'flex-1 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer',
                ]"
              >
                Semua
              </button>
              <button
                @click="selectedType = 'pdf'"
                :class="[
                  selectedType === 'pdf'
                    ? 'bg-brand-red text-white'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700',
                  'flex-1 border-x-2 border-black dark:border-stone-700 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer',
                ]"
              >
                Dokumen
              </button>
              <button
                @click="selectedType = 'video'"
                :class="[
                  selectedType === 'video'
                    ? 'bg-[#FF0000] text-white'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700',
                  'flex-1 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer',
                ]"
              >
                Video
              </button>
            </div>

            <!-- View Mode Toggle -->
            <div class="flex border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 h-10 shadow-brutal-xs overflow-hidden shrink-0">
              <button
                @click="viewMode = 'grid'"
                :title="'Tampilan Grid'"
                :class="[
                  viewMode === 'grid' ? 'bg-brand-teal text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700',
                  'px-3 flex items-center justify-center transition-colors cursor-pointer'
                ]"
              >
                <LayoutGrid class="w-4 h-4" />
              </button>
              <button
                @click="viewMode = 'grouped'"
                :title="'Tampilan Berkelompok per Kategori'"
                :class="[
                  viewMode === 'grouped' ? 'bg-brand-teal text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700',
                  'px-3 flex items-center justify-center border-l-2 border-black dark:border-stone-700 transition-colors cursor-pointer'
                ]"
              >
                <FolderKanban class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN MATERIALS GRID -->
      <div
        v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-96 animate-pulse bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-700 shadow-brutal-sm"
        />
      </div>

      <div
        v-else-if="filteredMaterials.length === 0"
        class="py-20 border-2 border-black dark:border-stone-700 border-dashed bg-stone-50 dark:bg-stone-900 text-center"
      >
        <BookOpen class="w-16 h-16 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
        <h3 class="text-xl font-black uppercase text-stone-900 dark:text-stone-100 mb-2">
          Tidak Ada Materi Pembelajaran
        </h3>
        <p class="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto">
          Tidak ada materi yang sesuai dengan kata kunci atau kriteria filter yang Anda pilih.
        </p>
      </div>

      <!-- GROUPED VIEW MODE -->
      <div v-else-if="viewMode === 'grouped'" class="space-y-16">
        <section v-for="group in groupedMaterials" :key="group.meta.nama_kategori" class="space-y-6">
          <div class="flex items-center gap-3 border-b-4 border-black dark:border-stone-100 pb-4">
            <div class="w-10 h-10 bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center justify-center font-bold">
              <BookOpen class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100">
                  {{ group.meta.nama_kategori }}
                </h2>
                <Badge class="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-mono font-bold">
                  {{ group.items.length }} Materi
                </Badge>
              </div>
              <p v-if="group.meta.deskripsi" class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {{ group.meta.deskripsi }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card
              v-for="material in group.items"
              :key="material.materi_id"
              class="bg-white dark:bg-stone-900 border-4 border-black dark:border-stone-100 shadow-brutal hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all flex flex-col group overflow-hidden"
            >
              <div class="aspect-video bg-stone-100 dark:bg-stone-800 border-b-4 border-black dark:border-stone-100 relative overflow-hidden shrink-0">
                <img
                  v-if="material.tipe === 'video'"
                  :src="`https://img.youtube.com/vi/${getYoutubeId(material.video_url)}/hqdefault.jpg`"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-brand-red/5 dark:bg-brand-red/10">
                  <FileText class="w-16 h-16 text-brand-red opacity-30" />
                </div>
                <div class="absolute top-3 left-3">
                  <Badge v-if="material.tipe === 'video'" class="bg-[#FF0000] text-white border-2 border-black text-[10px] font-black uppercase">
                    Video
                  </Badge>
                  <Badge v-else class="bg-brand-red text-white border-2 border-black text-[10px] font-black uppercase">
                    PDF
                  </Badge>
                </div>
                <button @click="openPreview(material)" class="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all group/btn cursor-pointer">
                  <div class="w-12 h-12 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs scale-0 group-hover/btn:scale-100 transition-all flex items-center justify-center">
                    <Play v-if="material.tipe === 'video'" class="w-6 h-6 fill-stone-900 dark:fill-stone-100 text-stone-900 dark:text-stone-100" />
                    <Eye v-else class="w-6 h-6 text-stone-900 dark:text-stone-100" />
                  </div>
                </button>
              </div>
              <CardContent class="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="font-black text-lg uppercase mb-2 line-clamp-1 text-stone-900 dark:text-stone-100">
                    {{ material.judul }}
                  </h3>
                  <p class="text-stone-600 dark:text-stone-400 text-xs line-clamp-2 leading-relaxed mb-4">
                    {{ material.deskripsi || "Tidak ada deskripsi singkat." }}
                  </p>
                </div>
                <Button @click="openPreview(material)" class="w-full gap-2 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-none bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-black uppercase tracking-wider py-4 h-auto cursor-pointer">
                  Lihat Materi
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="material in filteredMaterials"
          :key="material.materi_id"
          class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 text-stone-900 dark:text-stone-100 shadow-brutal-sm hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all group overflow-hidden flex flex-col"
        >
          <!-- Card Thumbnail -->
          <div
            class="aspect-video bg-stone-100 dark:bg-stone-800 border-b-2 border-black dark:border-stone-100 relative overflow-hidden shrink-0"
          >
            <template v-if="material.tipe === 'video'">
              <img
                :src="`https://img.youtube.com/vi/${getYoutubeId(material.video_url)}/mqdefault.jpg`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                class="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center"
              >
                <div
                  class="w-12 h-12 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-center justify-center group-hover:bg-brand-teal group-hover:text-white transition-colors"
                >
                  <Play class="w-6 h-6 fill-current" />
                </div>
              </div>
              <div class="absolute top-3 left-3">
                <Badge
                  class="bg-[#FF0000] text-white border border-black font-black uppercase text-[8px] px-2 py-0.5 shadow-brutal-xs"
                  >VIDEO</Badge
                >
              </div>
            </template>
            <template v-else>
              <div
                class="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-red/5 dark:bg-brand-red/10"
              >
                <FileText
                  class="w-12 h-12 text-brand-red opacity-50 group-hover:scale-110 transition-transform"
                />
              </div>
              <div class="absolute top-3 left-3">
                <Badge
                  class="bg-brand-red text-white border border-black font-black uppercase text-[8px] px-2 py-0.5 shadow-brutal-xs"
                  >DOCUMENT</Badge
                >
              </div>
            </template>

            <div
              class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex gap-2"
            >
              <button
                @click.stop="copyLink(material)"
                class="p-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                title="Salin Link"
              >
                <Share2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 flex-1 flex flex-col">
            <div class="flex items-center gap-2 mb-2">
              <span
                class="text-[9px] font-black uppercase tracking-widest text-brand-teal px-1.5 py-0.5 border border-brand-teal bg-teal-50 dark:bg-teal-950/40"
                >{{ material.kategori || "Uncategorized" }}</span
              >
              <div v-if="material.is_featured" class="text-brand-orange">
                <Star class="w-3 h-3 fill-current" />
              </div>
            </div>

            <h3
              class="text-lg font-black uppercase leading-tight mb-2 text-stone-900 dark:text-stone-100 group-hover:text-brand-teal transition-colors line-clamp-2"
            >
              {{ material.judul }}
            </h3>
            <p
              class="text-xs text-stone-500 dark:text-stone-400 font-medium mb-6 line-clamp-2 leading-relaxed"
            >
              {{
                material.deskripsi ||
                "Tidak ada deskripsi tersedia untuk materi pembelajaran ini."
              }}
            </p>

            <div
              class="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 border border-black dark:border-stone-100 flex items-center justify-center shrink-0 shadow-brutal-xs overflow-hidden"
                >
                  <img
                    v-if="material.creator?.image"
                    :src="assetUrl(material.creator.image)"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-[10px] font-black text-stone-900 dark:text-stone-100">{{
                    material.creator?.name?.[0]?.toUpperCase()
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-[9px] font-black uppercase tracking-tight text-stone-900 dark:text-stone-100"
                    >{{ material.creator?.name }}</span
                  >
                  <span class="text-[8px] text-stone-400 font-bold uppercase">{{
                    timeAgo(material.created_at)
                  }}</span>
                </div>
              </div>

              <button
                @click="openPreview(material)"
                class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-900 hover:text-brand-teal transition-colors group/link"
              >
                <span>Lihat Detail</span>
                <ChevronRight
                  class="w-4 h-4 translate-x-0 group-hover/link:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PREVIEW MODAL -->
    <div
      v-if="showPreviewModal && previewMaterial"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
    >
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-md"
        @click="closePreview"
      ></div>

      <div
        class="relative bg-white border-4 border-black shadow-brutal w-full max-w-5xl h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
      >
        <!-- Close Button Desktop -->
        <button
          @click="closePreview"
          class="absolute -top-12 right-0 text-white flex items-center gap-2 font-black uppercase tracking-widest hover:text-brand-teal transition-colors md:flex hidden"
        >
          Tutup <X class="w-6 h-6" />
        </button>

        <div class="flex-1 overflow-hidden flex flex-col">
          <!-- Header Mobile -->
          <div
            class="flex items-center justify-between p-4 border-b-4 border-black bg-stone-100 md:hidden shrink-0"
          >
            <h3 class="font-black uppercase text-sm truncate pr-4">
              {{ previewMaterial.judul }}
            </h3>
            <button
              @click="closePreview"
              class="p-1 border-2 border-black bg-white shadow-brutal-xs"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            <!-- Content Area -->
            <div
              class="flex-1 bg-stone-100 overflow-hidden relative border-b-4 md:border-b-0 md:border-r-4 border-black order-1"
            >
              <!-- Video Embed -->
              <template v-if="previewMaterial.tipe === 'video'">
                <iframe
                  class="w-full h-full"
                  :src="getYoutubeEmbedUrl(previewMaterial.video_url)"
                  frameborder="0"
                  allow="
                    accelerometer;
                    autoplay;
                    clipboard-write;
                    encrypted-media;
                    gyroscope;
                    picture-in-picture;
                  "
                  allowfullscreen
                ></iframe>
              </template>
              <!-- PDF Preview -->
              <template v-else>
                <iframe
                  class="w-full h-full"
                  :src="getFullUrl(previewMaterial.file_path) + '#toolbar=0'"
                  frameborder="0"
                ></iframe>
              </template>
            </div>

            <!-- Sidebar Info -->
            <div
              class="w-full md:w-80 lg:w-96 bg-white p-6 md:p-8 flex flex-col h-full overflow-y-auto order-2 shrink-0"
            >
              <div class="inline-flex items-center gap-2 mb-4">
                <Badge
                  v-if="previewMaterial.tipe === 'pdf'"
                  class="bg-brand-red text-white border-2 border-black font-black uppercase text-[10px]"
                  >Dokumen</Badge
                >
                <Badge
                  v-else
                  class="bg-[#FF0000] text-white border-2 border-black font-black uppercase text-[10px]"
                  >Video</Badge
                >
                <span
                  class="text-[10px] font-black uppercase text-brand-teal"
                  >{{ previewMaterial.kategori }}</span
                >
              </div>

              <h2
                class="text-2xl md:text-3xl font-black uppercase leading-tight mb-4"
              >
                {{ previewMaterial.judul }}
              </h2>
              <p class="text-stone-500 text-sm leading-relaxed mb-8">
                {{
                  previewMaterial.deskripsi ||
                  "Tidak ada deskripsi lengkap untuk materi ini."
                }}
              </p>

              <div class="space-y-4 mb-8">
                <div
                  class="flex items-center gap-3 p-3 bg-stone-50 border-2 border-black"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-brutal-xs shrink-0 overflow-hidden"
                  >
                    <img
                      v-if="previewMaterial.creator?.image"
                      :src="assetUrl(previewMaterial.creator.image)"
                      class="w-full h-full object-cover"
                    />
                    <User v-else class="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      class="text-[10px] font-bold text-stone-400 uppercase leading-none mb-1"
                    >
                      Diterbitkan Oleh
                    </div>
                    <div
                      class="text-[11px] font-black uppercase tracking-tight"
                    >
                      {{ previewMaterial.creator?.name }}
                    </div>
                  </div>
                </div>
                <div
                  class="flex items-center gap-3 p-3 bg-stone-50 border-2 border-black"
                >
                  <Clock class="w-5 h-5 text-stone-400 shrink-0" />
                  <div>
                    <div
                      class="text-[10px] font-bold text-stone-400 uppercase leading-none mb-1"
                    >
                      Waktu Terbit
                    </div>
                    <div
                      class="text-[11px] font-black uppercase tracking-tight"
                    >
                      {{
                        new Date(previewMaterial.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="mt-auto pt-6 border-t-2 border-stone-100 flex flex-col gap-3"
              >
                <Button
                  as="a"
                  :href="
                    previewMaterial.tipe === 'pdf'
                      ? getFullUrl(previewMaterial.file_path)
                      : previewMaterial.video_url
                  "
                  target="_blank"
                  class="w-full py-6 h-auto text-sm uppercase font-black tracking-widest border-2 border-black shadow-brutal-xs translate-y-[-2px] hover:translate-y-0 transition-all hover:shadow-none"
                >
                  <Download
                    v-if="previewMaterial.tipe === 'pdf'"
                    class="w-4 h-4 mr-2"
                  />
                  <ExternalLink v-else class="w-4 h-4 mr-2" />
                  {{
                    previewMaterial.tipe === "pdf"
                      ? "Unduh PDF"
                      : "Buka di YouTube"
                  }}
                </Button>
                <Button
                  variant="outline"
                  @click="copyLink(previewMaterial)"
                  class="w-full border-2 border-black font-black uppercase tracking-widest h-12"
                >
                  <Share2 class="w-4 h-4 mr-2" />
                  Bagikan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script>
// Non-setup script for utility functions
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default {
  methods: {
    timeAgo(date) {
      if (!date) return "Baru";
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: id,
      });
    },
  },
};
</script>

<style scoped>
.shadow-brutal-xs {
  box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
}
.shadow-brutal-sm {
  box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
}
.shadow-brutal {
  box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
}

/* Modal animation */
.animate-in {
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
