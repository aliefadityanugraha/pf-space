<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";
import PageLayout from "@/components/PageLayout.vue";
import ArchiveCard from "@/components/ArchiveCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  Film as FilmIcon,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Award,
  FileText,
  Star,
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Share2,
  Grid,
  Upload,
  Bookmark,
  Clapperboard,
  Mail,
  Camera,
} from "lucide-vue-next";
import { useHead } from "@unhead/vue";

const route = useRoute();
const router = useRouter();
const { user: authUser } = useAuth();
const { showToast } = useToast();

const loading = ref(true);
const error = ref(null);
const user = ref(null);
const films = ref([]);
const contributions = ref([]);
const showcaseFilter = ref("main"); // 'main' (karya) | 'contributions'
const gridCols = ref(3); // 3 or 5
const visibleFilmsCount = ref(6);
const imageError = ref(false);

// Fallback copy function
const fallbackCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast("Tautan profil publik berhasil disalin!");
  } catch (err) {
    showToast("Gagal menyalin tautan", "error");
  }
  document.body.removeChild(textArea);
};

// Copy Profile Link function
const copyProfileLink = () => {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast("Tautan profil publik berhasil disalin!");
      })
      .catch(() => {
        fallbackCopy(url);
      });
  } else {
    fallbackCopy(url);
  }
};

// Auto redirect if user is viewing their own profile
const checkSelfRedirect = () => {
  if (authUser.value?.id && String(authUser.value.id) === String(route.params.id)) {
    router.replace("/profile");
    return true;
  }
  return false;
};

// Fetch Public Profile Data
const fetchProfile = async () => {
  if (checkSelfRedirect()) return;

  loading.value = true;
  error.value = null;
  imageError.value = false;

  try {
    const res = await api.get(`/api/users/${route.params.id}`);
    const u = res.data || {};
    user.value = u;

    const userFilms = Array.isArray(u.films) ? u.films : [];
    films.value = userFilms.map((f) => ({
      ...f,
      gambar_poster: assetUrl(f.gambar_poster) || "",
    }));

    const userContribs = Array.isArray(u.contributions) ? u.contributions : [];
    contributions.value = userContribs
      .map((f) => ({
        ...f,
        gambar_poster: assetUrl(f.gambar_poster) || "",
      }))
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.updated_at || 0).getTime();
        const timeB = new Date(b.created_at || b.updated_at || 0).getTime();
        return timeB - timeA;
      });
  } catch (err) {
    console.error("Failed to fetch public profile:", err);
    error.value = "Pengguna tidak ditemukan atau terjadi kesalahan server.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProfile();
  visibleFilmsCount.value = gridCols.value === 3 ? 6 : 10;
});

watch(() => route.params.id, fetchProfile);
watch(() => authUser.value?.id, checkSelfRedirect);

// Setup Head Meta
useHead({
  title: () =>
    user.value?.name
      ? `Profil: ${user.value.name} - PF Space`
      : "Profil Publik - PF Space",
});

// Profile image url computed
const profileImageUrl = computed(() => {
  if (user.value?.image) return assetUrl(user.value.image);
  return null;
});

// Role Ribbon, Badge, and Classification
const roleName = computed(() => {
  const r = user.value?.role?.name || user.value?.role;
  if (typeof r === 'string' && r.trim() !== '') return r.toLowerCase();
  if (user.value?.role_id === 4 || user.value?.role_id === 3) return "admin";
  if (user.value?.role_id === 2) return "creator";
  if (films.value.length > 0) return "creator";
  return "user";
});

const isCreator = computed(() => roleName.value === "creator" || roleName.value === "admin");

const roleBadge = computed(() => {
  const name = roleName.value;
  if (name === "admin") {
    return {
      text: "Admin",
      bgClass: "bg-brand-red text-white border-black dark:border-stone-100",
      textStyle: "color: #ffffff !important;"
    };
  } else if (name === "creator") {
    return {
      text: "Creator",
      bgClass: "bg-brand-teal text-white border-black dark:border-stone-100",
      textStyle: "color: #ffffff !important;"
    };
  } else {
    return {
      text: "User",
      bgClass: "bg-brand-orange text-stone-900 border-black dark:border-stone-100",
      textStyle: "color: #1c1917 !important;"
    };
  }
});

const roleRibbon = computed(() => {
  const name = roleName.value;
  if (name === "admin") {
    return {
      text: "ADMIN PF SPACE",
      bgClass: "bg-brand-red text-white",
      textStyle: "color: #ffffff !important;"
    };
  } else if (name === "creator") {
    return {
      text: "PF CREATOR",
      bgClass: "bg-brand-teal text-white",
      textStyle: "color: #ffffff !important;"
    };
  } else {
    return {
      text: "PENIKMAT KARYA",
      bgClass: "bg-brand-orange text-stone-900",
      textStyle: "color: #1c1917 !important;"
    };
  }
});

const joinDate = computed(() => {
  const date = user.value?.createdAt || user.value?.created_at;
  if (!date) return "Tidak diketahui";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const badges = computed(() => (Array.isArray(user.value?.badges) ? user.value.badges : []));

// Badge classes supporting light & dark theme seamlessly
const getBadgeClasses = (badge) => {
  const map = {
    pioneer: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
    "script-master": "bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300",
    "trending-creator": "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    "active-debater": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    cinematographer: "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300",
  };
  return map[badge.id] || "bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20 dark:text-brand-teal";
};

// Computed active showcase list supporting lazy load pagination
const activeShowcaseFilms = computed(() => {
  if (showcaseFilter.value === "contributions") {
    return contributions.value;
  }
  return films.value;
});

const displayedFilms = computed(() => {
  return activeShowcaseFilms.value.slice(0, visibleFilmsCount.value);
});

const loadMoreFilms = () => {
  visibleFilmsCount.value += gridCols.value === 3 ? 6 : 10;
};
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-20">

      <!-- Loading State -->
      <LoadingState v-if="loading" text="Memuat profil..." class="py-24" />

      <!-- Error State -->
      <div v-else-if="error || !user" class="py-20 text-center max-w-md mx-auto">
        <div class="p-8 bg-white dark:bg-stone-900 border-4 border-black dark:border-stone-100 shadow-brutal text-center">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-950/40 border-2 border-brand-red flex items-center justify-center mx-auto mb-4">
            <User class="w-8 h-8 text-brand-red" />
          </div>
          <h3 class="font-heading font-black text-xl text-stone-900 dark:text-stone-100 uppercase mb-2">
            Pengguna Tidak Ditemukan
          </h3>
          <p class="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
            {{ error || "Profil yang Anda cari mungkin telah dihapus atau tidak tersedia." }}
          </p>
          <button
            @click="router.push('/films')"
            class="bg-brand-teal text-white border-2 border-black dark:border-stone-100 px-6 py-2.5 font-heading font-black text-xs uppercase tracking-wider shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            Jelajahi Arsip Film
          </button>
        </div>
      </div>

      <!-- Public Profile Content -->
      <div v-else class="animate-fade-in">
        
        <!-- ======================================================= -->
        <!-- SECTION 1: HEADER PROFIL HYBRID (Sama Persis dengan Profile.vue) -->
        <!-- ======================================================= -->
        <div
          class="relative p-5 md:p-6 bg-stone-50 dark:bg-stone-900 border-4 border-black dark:border-stone-100 shadow-[10px_10px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_rgba(255,255,255,0.15)] mb-8 transition-all duration-300"
        >
          <!-- Ribbon Lencana Peran Adaptif -->
          <div
            :class="[
              roleRibbon.bgClass,
              'absolute -top-4 -right-6 border-2 border-black dark:border-stone-100 px-8 py-1.5 font-heading font-black uppercase text-xs sm:text-sm rotate-6 shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] tracking-[0.2em] z-20'
            ]"
            :style="roleRibbon.textStyle"
          >
            {{ roleRibbon.text }}
          </div>

          <!-- Titik Dekorasi Pojok Kiri/Kanan Atas -->
          <div class="absolute top-2.5 left-2.5 flex gap-1">
            <div class="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse"></div>
            <div class="w-1.5 h-1.5 bg-brand-orange rounded-full"></div>
          </div>
          <div class="absolute top-2.5 right-12 flex gap-1">
            <div class="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-600 rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-600 rounded-full"></div>
          </div>

          <!-- Layout Atas: Foto Profil, Detail Teks, & Kotak Statistik -->
          <div class="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 mt-2 pb-0">
            
            <!-- Foto Profil Ukuran Proporsional 1:1 (Strict 140px Square, Read-Only) -->
            <div class="shrink-0 flex flex-col items-center">
              <div class="relative flex items-center justify-center" style="width: 140px; height: 140px;">
                <div
                  class="border-4 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-850 overflow-hidden relative shrink-0 flex items-center justify-center"
                  style="width: 140px !important; height: 140px !important; aspect-ratio: 1 / 1 !important;"
                >
                  <img
                    v-if="profileImageUrl && !imageError"
                    :src="profileImageUrl"
                    :alt="user?.name"
                    class="hover:scale-105 transition-transform duration-300"
                    style="width: 100% !important; height: 100% !important; object-fit: cover !important; aspect-ratio: 1 / 1 !important;"
                    @error="imageError = true"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    <User class="w-16 h-16 stroke-[1.5]" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Info Teks Utama Profil (Kolom Tengah) -->
            <div class="flex-1 flex flex-col justify-center text-center md:text-left min-w-0">
              <div class="flex flex-col md:flex-row items-center gap-3 mb-1.5 justify-center md:justify-start">
                <h1
                  class="text-2xl md:text-3xl font-heading font-black tracking-tight text-stone-900 dark:text-white uppercase leading-none"
                >
                  {{ user?.name || "User" }}
                </h1>

                <!-- Badge Peran Kecil -->
                <span
                  :class="[
                    roleBadge.bgClass,
                    'border-2 border-black dark:border-stone-100 text-[10px] font-black uppercase px-2 py-0.5 shadow-brutal-xs'
                  ]"
                  :style="roleBadge.textStyle"
                >
                  {{ roleBadge.text }}
                </span>
              </div>

              <!-- Website URL -->
              <a
                v-if="user?.website"
                :href="user.website"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-teal hover:underline text-xs font-mono font-bold mb-3 inline-flex items-center gap-1.5 justify-center md:justify-start"
              >
                <Globe class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">{{ user.website.replace(/^https?:\/\//, '') }}</span>
              </a>

              <!-- Bio Pengguna -->
              <p class="text-stone-600 dark:text-stone-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                {{ user?.bio || "Filmmaker dan kontributor di PF Space." }}
              </p>
            </div>

            <!-- Panel Statistik Sebelah Kanan (Brutal Stats Grid 2x2) -->
            <div v-if="isCreator" class="grid grid-cols-2 gap-2 shrink-0 w-full md:w-64 mt-4 md:mt-0">
              <!-- Total Karya (Kiri Atas) -->
              <div
                class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div class="w-7 h-7 rounded bg-brand-teal/10 dark:bg-brand-teal/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                  <FilmIcon class="w-3.5 h-3.5 text-brand-teal" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                    {{ user.stats?.totalFilms || films.length || 0 }}
                  </div>
                  <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                    Total Karya
                  </div>
                </div>
              </div>

              <!-- Kontribusi (Kanan Atas) -->
              <div
                class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div class="w-7 h-7 rounded bg-brand-orange/10 dark:bg-brand-orange/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                  <Clapperboard class="w-3.5 h-3.5 text-brand-orange" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                    {{ contributions.length || 0 }}
                  </div>
                  <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                    Kontribusi
                  </div>
                </div>
              </div>

              <!-- Total Apresiasi (Kiri Bawah) -->
              <div
                class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div class="w-7 h-7 rounded bg-brand-red/10 dark:bg-brand-red/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                  <ThumbsUp class="w-3.5 h-3.5 text-brand-red" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                    {{ user.stats?.totalVotes || 0 }}
                  </div>
                  <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                    Apresiasi
                  </div>
                </div>
              </div>

              <!-- Total Diskusi (Kanan Bawah) -->
              <div
                class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <div class="w-7 h-7 rounded bg-amber-500/10 dark:bg-amber-500/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                  <MessageSquare class="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                    {{ user.stats?.totalComments || 0 }}
                  </div>
                  <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                    Diskusi
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel Statistik untuk User Biasa (Hanya Kontribusi) -->
            <div v-else class="flex flex-col gap-2 shrink-0 w-full md:w-48 mt-4 md:mt-0">
              <div
                class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2.5 flex items-center gap-2 shadow-brutal-xs transition-colors"
              >
                <div class="w-8 h-8 rounded bg-brand-orange/10 dark:bg-brand-orange/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                  <Clapperboard class="w-4 h-4 text-brand-orange" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                    {{ contributions.length || 0 }}
                  </div>
                  <div class="text-[8px] font-black uppercase tracking-wider text-stone-400 leading-none">
                    Kontribusi Karya
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Garis Putus-putus Lebar Penuh -->
          <div class="border-t border-dashed border-stone-300 dark:border-stone-700 my-4 w-full"></div>

          <!-- Layout Bawah: Metadata Lokasi di Kiri & Tombol Aksi Sosial di Kanan -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full pt-0">
            
            <!-- Sisi Kiri: Lokasi & Tanggal Bergabung -->
            <div
              class="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs font-black uppercase text-stone-500 dark:text-stone-400"
            >
              <div v-if="user?.location" class="flex items-center gap-2">
                <MapPin class="w-4 h-4 text-brand-red shrink-0" />
                <span class="tracking-wider text-[11px] md:text-xs">{{ user.location }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-stone-400 shrink-0" />
                <span class="tracking-wider text-[11px] md:text-xs">Bergabung {{ joinDate }}</span>
              </div>
            </div>

            <!-- Sisi Kanan: Tombol Media Sosial & Salin Link -->
            <div class="flex items-center justify-center md:justify-end gap-2.5">
              <!-- Instagram -->
              <a
                v-if="user?.instagram"
                :href="`https://instagram.com/${user.instagram.replace('@', '')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
                title="Instagram"
              >
                <Instagram class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
              </a>

              <!-- LinkedIn -->
              <a
                v-if="user?.linkedin"
                :href="user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
                title="LinkedIn"
              >
                <Linkedin class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
              </a>

              <!-- Website -->
              <a
                v-if="user?.website"
                :href="user.website"
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
                title="Website"
              >
                <Globe class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
              </a>

              <!-- Tombol Salin Link -->
              <button
                @click="copyProfileLink"
                class="h-10 border-2 border-black dark:border-stone-100 bg-brand-orange hover:bg-orange-300 px-4 flex items-center gap-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] text-xs font-heading font-black uppercase tracking-wider cursor-pointer"
                title="Salin Tautan Profil"
                style="color: #1c1917 !important;"
              >
                <Share2 class="w-4 h-4 shrink-0" style="color: #1c1917 !important;" />
                <span>Salin Link</span>
              </button>
            </div>

          </div>
        </div>

        <!-- ======================================================= -->
        <!-- SECTION 2: TATA LETAK SPLIT (Sidebar 1/4 & Showcase 3/4) -->
        <!-- ======================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          <!-- KOLOM KIRI (SIDEBAR - 1/4 Lebar) -->
          <div class="lg:col-span-1 space-y-6">

            <!-- Box Koleksi Lencana (Kreator/Admin) -->
            <div
              v-if="isCreator"
              class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 shadow-brutal"
            >
              <h3 class="font-heading font-black uppercase text-xs sm:text-sm tracking-wider mb-4 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Award class="w-4 h-4 text-brand-teal" /> Koleksi Lencana
              </h3>
              
              <div v-if="badges.length > 0" class="flex flex-wrap gap-2.5">
                <div v-for="badge in badges" :key="badge.id" class="group relative">
                  <div
                    :class="[
                      'w-11 h-11 border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs hover:-rotate-3 transition-transform cursor-help',
                      getBadgeClasses(badge)
                    ]"
                  >
                    <component
                      :is="{ Award, FileText, Star, MessageSquare, Camera }[badge.icon] || Award"
                      class="w-5 h-5 shrink-0"
                    />
                  </div>
                  <!-- Tooltip Lencana -->
                  <div
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-[9px] font-bold uppercase tracking-tight text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/20 shadow-lg"
                  >
                    <p class="text-brand-orange mb-0.5">{{ badge.name }}</p>
                    <p class="text-stone-400 font-medium normal-case leading-tight">
                      {{ badge.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Placeholder Jika Lencana Kosong -->
              <div v-else class="text-center py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 p-3">
                <p class="text-[10px] font-medium text-stone-500 dark:text-stone-400 leading-normal">
                  Belum memiliki lencana penghargaan.
                </p>
              </div>
            </div>

            <!-- Box Kontribusi Terkait (Landscape List) -->
            <div
              v-if="contributions.length > 0"
              class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 shadow-brutal"
            >
              <div class="flex items-center justify-between gap-2 mb-4">
                <h3 class="font-heading font-black uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2 text-stone-900 dark:text-stone-100">
                  <Award class="w-4 h-4 text-brand-orange" /> Kontribusi
                </h3>
                
                <button
                  @click="showcaseFilter = 'contributions'"
                  class="bg-stone-100 dark:bg-stone-800 hover:bg-brand-orange hover:text-stone-900 text-stone-700 dark:text-stone-200 border border-black dark:border-stone-700 text-[9px] font-heading font-black uppercase px-2 py-0.5 shadow-brutal-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  title="Lihat Selengkapnya di Tampilan Utama"
                >
                  <span>LIHAT SEMUA</span>
                </button>
              </div>

              <!-- List Kontribusi 5 Teratas -->
              <div class="space-y-3">
                <div 
                  v-for="film in contributions.slice(0, 5)" 
                  :key="film.film_id || film.id"
                  @click="router.push('/archive/' + (film.slug || film.film_id || film.id))"
                  class="bg-stone-50 dark:bg-stone-850 border border-black dark:border-stone-800 p-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] flex gap-3 group hover:translate-y-[-1px] transition-all duration-200 cursor-pointer"
                >
                  <!-- Poster Kecil -->
                  <div class="w-14 shrink-0 aspect-[3/4] bg-stone-900 border border-black overflow-hidden relative">
                    <img 
                      v-if="film.gambar_poster" 
                      :src="film.gambar_poster" 
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-900 p-1 select-none text-center">
                      <FilmIcon class="w-4 h-4 mb-0.5 text-stone-500" />
                      <span class="text-[6px] font-mono font-black leading-tight tracking-tighter uppercase text-stone-400">NO POSTER</span>
                    </div>
                  </div>

                  <!-- Detail Teks -->
                  <div class="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 
                        class="font-heading font-black text-sm md:text-base text-stone-900 dark:text-stone-100 uppercase tracking-tight line-clamp-1 group-hover:text-brand-orange dark:group-hover:text-brand-orange transition-colors leading-tight mb-1"
                      >
                        {{ film.judul }}
                      </h4>
                      <div class="flex items-center gap-1.5 mt-0.5 truncate text-[10px] sm:text-[11px]">
                        <div class="w-4 h-4 rounded-full bg-brand-orange border border-black overflow-hidden flex items-center justify-center shrink-0">
                          <img 
                            v-if="film.creator?.image" 
                            :src="assetUrl(film.creator.image)" 
                            class="w-full h-full object-cover"
                          />
                          <User v-else class="w-2.5 h-2.5 text-stone-900" />
                        </div>
                        <router-link
                          v-if="film.creator?.id"
                          :to="`/creator/${film.creator.id}`"
                          @click.stop
                          class="font-semibold underline text-stone-700 dark:text-stone-200 hover:text-brand-teal dark:hover:text-brand-teal transition-colors cursor-pointer truncate"
                        >
                          {{ film.creator.name }}
                        </router-link>
                        <span v-else class="font-semibold text-stone-700 dark:text-stone-300 truncate">
                          {{ film.creator?.name || 'Kreator SMK' }}
                        </span>
                      </div>
                    </div>

                    <!-- Role Badge -->
                    <div class="flex flex-wrap gap-1 mt-2">
                      <span 
                        v-for="role in film.contribution_roles" 
                        :key="role"
                        class="bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black dark:border-stone-400 shadow-brutal-xs flex items-center gap-1 whitespace-nowrap"
                        style="color: #ffffff !important;"
                      >
                        <Clapperboard class="w-2.5 h-2.5 text-white shrink-0" />
                        <span>{{ role }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Box Kolaborasi (Di Bawah Sendiri Sisi Kiri di Bawah Kontribusi Saya) -->
            <div
              class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 shadow-brutal transition-colors"
            >
              <div class="flex items-center gap-2.5 mb-3">
                <div class="w-8 h-8 rounded bg-brand-orange/10 dark:bg-brand-orange/20 border-2 border-black dark:border-stone-700 flex items-center justify-center shrink-0">
                  <Mail class="w-4 h-4 text-brand-orange" />
                </div>
                <h3 class="font-heading font-black uppercase text-xs sm:text-sm tracking-wider text-stone-900 dark:text-stone-100">
                  Kolaborasi
                </h3>
              </div>
              <p class="text-[11px] text-stone-600 dark:text-stone-300 font-body leading-relaxed mb-4">
                Tertarik membuat proyek film bersama atau mengajak <span class="text-brand-orange font-bold">{{ user?.name }}</span> bergabung dalam tim produksi Anda?
              </p>
              <a
                v-if="user?.email"
                :href="`mailto:${user.email}?subject=${encodeURIComponent('Kolaborasi Produksi Film - PF Space')}&body=${encodeURIComponent(`Halo ${user.name},\n\nSaya melihat portofolio karya Anda di platform PF Space dan sangat tertarik untuk berkolaborasi dalam proyek film.\n\nDetail Rencana Proyek:\n-\n\nTerima kasih!`)}`"
                class="w-full h-10 border-2 border-black dark:border-stone-100 bg-brand-orange hover:bg-orange-300 text-stone-950 font-heading font-black uppercase tracking-wider text-xs shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                style="color: #1c1917 !important;"
              >
                <Mail class="w-4 h-4 shrink-0" style="color: #1c1917 !important;" />
                <span>Kirim Pesan Email</span>
              </a>
              <div v-else class="text-[10px] text-stone-400 font-mono italic text-center py-2">
                Kontak email tidak tersedia
              </div>
            </div>

          </div>

          <!-- KOLOM KANAN (DASHBOARD SHOWCASE - 3/4 Lebar) -->
          <div class="lg:col-span-3 space-y-6">

            <!-- Panel Showcase Karya -->
            <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 md:p-6 shadow-brutal">
              
              <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b-2 border-dashed border-stone-300 dark:border-stone-700"
              >
                <div>
                  <h2
                    class="text-base md:text-lg font-heading font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2"
                  >
                    <component 
                      :is="showcaseFilter === 'contributions' ? Award : FilmIcon" 
                      :class="['w-5 h-5', showcaseFilter === 'contributions' ? 'text-brand-orange' : 'text-brand-teal']" 
                    /> 
                    <template v-if="showcaseFilter === 'contributions'">
                      Kontribusi Karya
                    </template>
                    <template v-else>
                      Showcase Karya
                    </template>
                  </h2>
                  <p class="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                    <template v-if="showcaseFilter === 'contributions'">
                      Daftar karya film SMK di mana kreator ini terlibat dalam proses produksi.
                    </template>
                    <template v-else>
                      Daftar karya film yang telah dipublikasikan oleh kreator ini di platform PF Space.
                    </template>
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                  
                  <!-- Tombol Filter Konten (Karya / Kontribusi) -->
                  <div class="inline-flex items-center border-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-850 p-0.5 shadow-brutal-xs">
                    <button
                      @click="showcaseFilter = 'main'"
                      :class="[
                        'h-8 px-3 text-[10px] sm:text-xs font-heading font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5',
                        showcaseFilter === 'main'
                          ? 'bg-brand-teal text-white shadow-sm'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100',
                      ]"
                    >
                      <FilmIcon class="w-3.5 h-3.5" />
                      <span>Karya</span>
                    </button>
                    <button
                      v-if="contributions.length > 0"
                      @click="showcaseFilter = 'contributions'"
                      :class="[
                        'h-8 px-3 text-[10px] sm:text-xs font-heading font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5',
                        showcaseFilter === 'contributions'
                          ? 'bg-brand-orange text-stone-900 shadow-sm'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100',
                      ]"
                    >
                      <Award class="w-3.5 h-3.5" />
                      <span>Kontribusi</span>
                    </button>
                  </div>

                  <!-- Selector Grid (3 Kolom / 5 Kolom) -->
                  <div class="inline-flex items-center border-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-850 p-0.5 shadow-brutal-xs">
                    <button
                      @click="gridCols = 3"
                      :class="[
                        'h-8 w-8 flex items-center justify-center transition-all cursor-pointer',
                        gridCols === 3
                          ? 'bg-brand-teal text-white shadow-sm'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100',
                      ]"
                      title="Tampilan 3 Kolom (Besar)"
                    >
                      <Grid class="w-4 h-4" />
                    </button>
                    <button
                      @click="gridCols = 5"
                      :class="[
                        'h-8 w-8 flex items-center justify-center transition-all cursor-pointer',
                        gridCols === 5
                          ? 'bg-brand-teal text-white shadow-sm'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100',
                      ]"
                      title="Tampilan 5 Kolom (Kompak)"
                    >
                      <Grid class="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- STATE JIKA KARYA KOSONG -->
              <div
                v-if="activeShowcaseFilms.length === 0"
                class="col-span-full flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-center animate-fade-in"
              >
                <div class="w-16 h-16 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 flex items-center justify-center shadow-brutal-xs mb-4">
                  <component :is="showcaseFilter === 'contributions' ? Award : FilmIcon" class="w-8 h-8 text-stone-400 dark:text-stone-500 shrink-0" />
                </div>
                <h4 class="font-heading font-black text-sm uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-1">
                  <template v-if="showcaseFilter === 'contributions'">
                    Belum Ada Kontribusi Karya
                  </template>
                  <template v-else>
                    Belum Ada Karya yang Dipublikasikan
                  </template>
                </h4>
                <p class="text-xs text-stone-500 dark:text-stone-400 max-w-md leading-relaxed mb-5">
                  <template v-if="showcaseFilter === 'contributions'">
                    Kreator ini belum memiliki kontribusi dalam karya film.
                  </template>
                  <template v-else>
                    Kreator ini belum mempublikasikan karya film saat ini.
                  </template>
                </p>
                <button
                  @click="router.push('/films')"
                  class="bg-brand-teal text-white border-2 border-black dark:border-stone-100 py-2.5 px-6 font-heading font-black text-xs uppercase tracking-widest shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal transition-all cursor-pointer flex items-center gap-2"
                  style="color: #ffffff !important;"
                >
                  <FilmIcon class="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
                  <span class="text-white font-black tracking-wider">Jelajahi Karya Lainnya</span>
                </button>
              </div>

              <!-- Grid Card Karya (Tanpa Label Status Publish / Menunggu / Tolak) -->
              <div
                v-else
                :class="[
                  'grid gap-4 transition-all duration-300',
                  gridCols === 3
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
                ]"
              >
                <ArchiveCard
                  v-for="film in displayedFilms"
                  :key="film.film_id || film.id"
                  :archive="film"
                  :subtitle="film.creator?.name || user?.name || 'Kreator SMK'"
                  :showStatus="false"
                  :customBadge="showcaseFilter === 'contributions' && film.contribution_roles ? film.contribution_roles.join(', ') : ''"
                  :showStats="true"
                  :stackedBadge="gridCols === 5"
                  @click="router.push('/archive/' + (film.slug || film.film_id || film.id))"
                  class="cursor-pointer h-full border-2 border-black dark:border-stone-100 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white dark:bg-stone-900"
                />
              </div>

              <!-- TOMBOL PROGRESS LAZY LOAD -->
              <div v-if="visibleFilmsCount < activeShowcaseFilms.length" class="flex justify-center mt-8 pt-4 border-t border-dashed border-stone-200 dark:border-stone-800">
                <button
                  @click="loadMoreFilms"
                  class="group bg-white dark:bg-stone-850 hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal border-2 border-black dark:border-stone-100 px-6 py-2.5 font-heading font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-stone-900 dark:text-stone-100 flex items-center gap-2"
                >
                  <Upload class="w-4 h-4 rotate-180 text-brand-teal group-hover:text-white transition-colors animate-bounce" />
                  <span>Tampilkan Lebih Banyak</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  </PageLayout>
</template>
