<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";
import { useNotifications } from "@/composables/useNotifications";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/format";
import PageLayout from "@/components/PageLayout.vue";
import LoadingState from "@/components/LoadingState.vue";
import ArchiveCard from "@/components/ArchiveCard.vue";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

import {
  User,
  Mail,
  Eye,
  EyeOff,
  Camera,
  Save,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Film as FilmIcon,
  Upload,
  LayoutDashboard,
  Settings,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Award,
  FileText,
  Star,
  MessageSquare,
  X,
  Check,
  Calendar,
  Grid,
  Sparkles,
  Briefcase,
  Key,
  Share2,
  Trash2,
  Bookmark,
  Clapperboard
} from "lucide-vue-next";
import { useHead } from "@unhead/vue";

const router = useRouter();
const { user, refreshUser, initialized, isLoggedIn, isCreator } = useAuth();
const { showToast } = useToast();
const { fetchNotifications } = useNotifications();

// Redirect if not logged in
watch(
  [initialized, isLoggedIn],
  ([init, loggedIn]) => {
    if (init && !loggedIn) {
      router.push("/auth/login");
    }
  },
  { immediate: true },
);

// Setup head
useHead({
  title: () =>
    user.value
      ? `Profil: ${user.value.name} - PF Space`
      : "Profil Saya - PF Space",
});

// Active Tab: 'dashboard' | 'settings'
const activeTab = ref("dashboard");

// Grid columns for showcase: 3 or 5
const gridCols = ref(3);

// Dynamic pagination limit
const visibleFilmsCount = ref(6);

// --- REAL DASHBOARD STATE ---
const dashboardLoading = ref(true);
const dashboardError = ref("");
const films = ref([]);
const savedFilms = ref([]);
const savedLoading = ref(false);
const contributions = ref([]);
const contributionsLoading = ref(false);
const showcaseFilter = ref("main"); // 'main' | 'contributions'
const summary = ref({
  totalFilms: 0,
  pending: 0,
  published: 0,
  rejected: 0,
  totalVotes: 0,
  totalComments: 0,
});
const badges = ref([]);

// Fetch user contributions where tagged as crew
async function fetchContributions() {
  if (!user.value?.id) return;
  contributionsLoading.value = true;
  try {
    const res = await api.get(`/api/users/${user.value.id}/contributions`);
    const contribs = Array.isArray(res.data) ? res.data : [];
    contributions.value = contribs
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
    console.error("Failed to fetch contributions:", err);
  } finally {
    contributionsLoading.value = false;
  }
}

// Fetch user's saved/bookmarked films from collection
async function fetchSavedFilms() {
  if (!user.value?.id) return;
  savedLoading.value = true;
  try {
    const res = await api.get("/api/collections");
    const arr = Array.isArray(res.data) ? res.data : [];
    savedFilms.value = arr.map((it) => {
      const film = it.film || {};
      return {
        ...film,
        gambar_poster: assetUrl(film.gambar_poster) || "",
      };
    });
  } catch (err) {
    console.error("Failed to fetch saved films:", err);
  } finally {
    savedLoading.value = false;
  }
}

// Fetch Real API Dashboard Data for Creator / Admin
async function fetchDashboardData() {
  dashboardLoading.value = true;
  dashboardError.value = null;

  try {
    const [summaryRes, myFilmsRes] = await Promise.all([
      api.get("/api/films/my-stats").catch((err) => {
        console.error("Failed to fetch stats:", err);
        return { data: { data: {} } };
      }),
      api.get("/api/films/my-films?limit=100").catch((err) => {
        console.error("Failed to fetch my-films:", err);
        return { data: { data: [] } };
      }),
    ]);

    const statsData = summaryRes.data?.data || summaryRes.data || {};
    summary.value = statsData;
    badges.value = Array.isArray(statsData.badges) ? statsData.badges : [];

    const rawMyFilms = Array.isArray(myFilmsRes.data)
      ? myFilmsRes.data
      : (myFilmsRes.data?.data || myFilmsRes.data?.films || []);

    films.value = rawMyFilms.map((f) => ({
      ...f,
      gambar_poster: assetUrl(f.gambar_poster) || "",
    }));
  } catch (err) {
    dashboardError.value = "Gagal memuat data dashboard.";
    console.error(err);
  } finally {
    dashboardLoading.value = false;
  }
}

// Form state for settings tab
const editName = ref("");
const editBio = ref("");
const editWebsite = ref("");
const editLocation = ref("");
const editInstagram = ref("");
const editLinkedin = ref("");
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const savingProfile = ref(false);
const savingPassword = ref(false);
const fileInput = ref(null);
const previewImage = ref(null);
const selectedFile = ref(null);
const imageError = ref(false);
const imageVersion = ref(Date.now());

// Photo Management Modal States
const showPhotoModal = ref(false);
const isUpdatingPhoto = ref(false);

// Cropper States
const cropImageSource = ref("");
const cropperImgRef = ref(null);
let cropperInstance = null;

// Initialize form inputs from active user
const initializeProfileData = () => {
  if (user.value) {
    editName.value = user.value.name || "";
    editBio.value = user.value.bio || "";
    editWebsite.value = user.value.website || "";
    editLocation.value = user.value.location || "";
    editInstagram.value = user.value.instagram || "";
    editLinkedin.value = user.value.linkedin || "";
  }
};

watch(user, (newUser) => {
  initializeProfileData();
  if (newUser?.id) {
    fetchContributions();
    fetchSavedFilms();
    if (isCreator.value) {
      fetchDashboardData();
    } else {
      dashboardLoading.value = false;
    }
  }
}, { immediate: true });

// Computed profile image url with cache-busting
const profileImageUrl = computed(() => {
  if (previewImage.value) return previewImage.value;
  if (user.value?.image) return `${assetUrl(user.value.image)}?v=${imageVersion.value}`;
  return null;
});

const roleName = computed(() => user.value?.role?.name || "user");

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
  if (!user.value?.createdAt && !user.value?.created_at) return "Unknown";
  const date = user.value?.createdAt || user.value?.created_at;
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

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

// Copy Profile Link function (copies public profile url)
const copyProfileLink = () => {
  const url = window.location.origin + "/p/" + user.value?.id;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast("Tautan profil publik Anda berhasil disalin!");
      })
      .catch(() => {
        fallbackCopy(url);
      });
  } else {
    fallbackCopy(url);
  }
};

const fallbackCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast("Tautan profil publik Anda berhasil disalin!");
  } catch (err) {
    showToast("Gagal menyalin tautan", "error");
  }
  document.body.removeChild(textArea);
};

// Reset visible items count when grid column changes (adjust page sizes dynamically)
watch(gridCols, (newCols) => {
  visibleFilmsCount.value = newCols === 3 ? 6 : 10;
});

// Load more action
const loadMoreFilms = () => {
  visibleFilmsCount.value += gridCols.value === 3 ? 6 : 5;
};

// --- CROPPER ENGINE METHODS ---
const initCropper = () => {
  if (cropperInstance) {
    cropperInstance.destroy();
  }
  if (cropperImgRef.value) {
    cropperInstance = new Cropper(cropperImgRef.value, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      restore: false,
      guides: false,
      center: false,
      background: false,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  }
};

const cancelCrop = () => {
  cropImageSource.value = "";
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
};

const confirmCrop = () => {
  if (!cropperInstance) return;

  const canvas = cropperInstance.getCroppedCanvas({
    width: 500,
    height: 500,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  previewImage.value = canvas.toDataURL("image/jpeg", 0.9);
  imageError.value = false;

  canvas.toBlob(
    async (blob) => {
      const croppedFile = new File([blob], "avatar.jpg", {
        type: "image/jpeg",
      });
      cancelCrop();
      await uploadProfilePhoto(croppedFile);
    },
    "image/jpeg",
    0.9,
  );
};

// Handle avatar image selection and open cropper modal
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImageSource.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  if (fileInput.value) fileInput.value.value = "";
};

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// Immediate Upload & Delete actions for photo management modal
const deleteProfilePhoto = async () => {
  isUpdatingPhoto.value = true;
  try {
    await api.patch("/api/auth/update-user", {
      image: null
    });
    await refreshUser();
    imageVersion.value = Date.now();
    previewImage.value = null;
    selectedFile.value = null;
    showPhotoModal.value = false;
    showToast("Foto profil berhasil dihapus!");
    
    // Trigger notification
    await api.post("/api/notifications", {
      type: "system",
      title: "Foto Profil Dihapus",
      message: "Foto profil Anda berhasil dihapus dan kembali ke ikon default.",
    });
    fetchNotifications();
  } catch (err) {
    showToast(err.message || "Gagal menghapus foto profil", "error");
  } finally {
    isUpdatingPhoto.value = false;
  }
};

const uploadProfilePhoto = async (file) => {
  isUpdatingPhoto.value = true;
  try {
    const formData = new FormData();
    formData.append("image", file);

    await api.upload("/api/auth/update-user", formData, { method: "PATCH" });
    await refreshUser();
    imageVersion.value = Date.now();
    previewImage.value = null;
    selectedFile.value = null;
    showToast("Foto profil berhasil diperbarui!");
    
    // Close the modal automatically upon success!
    showPhotoModal.value = false;
    
    // Trigger notification
    await api.post("/api/notifications", {
      type: "system",
      title: "Foto Profil Diperbarui",
      message: "Foto profil Anda berhasil diunggah dan diperbarui.",
    });
    fetchNotifications();
  } catch (err) {
    showToast(err.message || "Gagal mengunggah foto profil", "error");
  } finally {
    isUpdatingPhoto.value = false;
  }
};

// Save updated profile info (production patch API)
const saveProfile = async () => {
  if (!editName.value.trim()) {
    showToast("Nama tidak boleh kosong", "error");
    return;
  }

  savingProfile.value = true;
  try {
    await api.patch("/api/auth/update-user", {
      name: editName.value,
      bio: editBio.value,
      website: editWebsite.value,
      location: editLocation.value,
      instagram: editInstagram.value,
      linkedin: editLinkedin.value,
    });

    await refreshUser();
    showToast("Profil berhasil diperbarui!");
    
    // Trigger notification
    await api.post("/api/notifications", {
      type: "system",
      title: "Profil Diperbarui",
      message: "Perubahan pada profil Anda telah berhasil disimpan.",
    });
    fetchNotifications();
    
    activeTab.value = "dashboard";
  } catch (err) {
    if (err.data && Array.isArray(err.data.details)) {
      showToast(err.data.details[0].message, "error");
    } else {
      showToast(err.message || "Gagal memperbarui profil", "error");
    }
  } finally {
    savingProfile.value = false;
  }
};

// Change Password logic (production change password API)
const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value) {
    showToast("Mohon isi kata sandi lama dan baru", "error");
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    showToast("Konfirmasi kata sandi tidak cocok", "error");
    return;
  }

  savingPassword.value = true;
  try {
    await api.post("/api/auth/change-password", {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    showToast("Kata sandi berhasil diubah!");
    
    // Trigger security notification
    await api.post("/api/notifications", {
      type: "system",
      title: "Keamanan Akun",
      message: "Kata sandi Anda berhasil diperbarui.",
    });
    fetchNotifications();
  } catch (err) {
    if (err.data && Array.isArray(err.data.details)) {
      showToast(err.data.details[0].message, "error");
    } else {
      showToast(err.message || "Gagal mengubah kata sandi", "error");
    }
  } finally {
    savingPassword.value = false;
  }
};

// Computed display list supporting showcase pagination
const activeShowcaseFilms = computed(() => {
  if (showcaseFilter.value === "contributions") {
    return contributions.value;
  }
  return isCreator.value ? films.value : savedFilms.value;
});

const displayedFilms = computed(() => {
  return activeShowcaseFilms.value.slice(0, visibleFilmsCount.value);
});

onMounted(() => {
  if (isCreator.value) {
    fetchDashboardData();
  } else {
    dashboardLoading.value = false;
    fetchSavedFilms();
  }
  fetchContributions();
  // Set initial visible count depending on default columns
  visibleFilmsCount.value = gridCols.value === 3 ? 6 : 10;
});
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-8 pb-20">
      
      <!-- Input File Tersembunyi untuk Update Avatar -->
      <input
        type="file"
        ref="fileInput"
        class="hidden"
        accept="image/*"
        @change="handleFileChange"
      />

      <!-- ======================================================= -->
      <!-- SECTION 1: HEADER PROFIL HYBRID (Gaya Adaptif Gelap Terang) -->
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

        <!-- Titik Dekorasi Pojok Kiri/Kanan Atas (Gambar 1) -->
        <div class="absolute top-2.5 left-2.5 flex gap-1">
          <div class="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse"></div>
          <div class="w-1.5 h-1.5 bg-brand-orange rounded-full"></div>
        </div>
        <div class="absolute top-2.5 right-12 flex gap-1">
          <div class="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-600 rounded-full"></div>
          <div class="w-1.5 h-1.5 bg-stone-400 dark:bg-stone-600 rounded-full"></div>
        </div>

        <!-- Layout Atas: Foto Profil, Detail Teks, & Kotak Statistik (Pola items-center agar tidak dempet/tumpang tindih) -->
        <div class="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 mt-2 pb-0">
          
          <!-- Foto Profil Ukuran Proporsional Lebih Rapi & Garansi 1:1 (Strict 140px Square, Tanpa Shadow) dengan Keterangan -->
          <div class="shrink-0 flex flex-col items-center">
            <div class="relative group flex items-center justify-center" style="width: 140px; height: 140px;">
              <div
                class="border-4 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-850 overflow-hidden relative shrink-0 animate-fade-in flex items-center justify-center"
                style="width: 140px !important; height: 140px !important; aspect-ratio: 1 / 1 !important;"
              >
                <img
                  v-if="profileImageUrl && !imageError"
                  :src="profileImageUrl"
                  :alt="user?.name"
                  class="group-hover:scale-105 transition-transform duration-300"
                  style="width: 100% !important; height: 100% !important; object-fit: cover !important; aspect-ratio: 1 / 1 !important;"
                  @error="imageError = true"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                >
                  <User class="w-16 h-16 stroke-[1.5]" />
                </div>
                <!-- Hover Overlay -->
                <button 
                  @click="showPhotoModal = true"
                  class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-heading font-bold cursor-pointer"
                >
                  <Camera class="w-4 h-4 mb-1 text-brand-orange" />
                  KELOLA FOTO
                </button>
              </div>
            </div>
            <!-- Label Info Foto Dapat Diubah (Jelas, Mudah Dibaca & Proporsional) -->
            <button
              type="button"
              @click="showPhotoModal = true"
              class="mt-2 text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:text-brand-orange dark:hover:text-brand-orange transition-colors cursor-pointer select-none text-center max-w-[140px] leading-snug"
              title="Klik untuk merubah Foto Profil"
            >
              * Klik untuk merubah Foto Profil
            </button>
          </div>

          <!-- Info Teks Utama Profil (Kolom Tengah) -->
          <div class="flex-1 flex flex-col justify-center text-center md:text-left min-w-0">
            <div class="flex flex-col md:flex-row items-center gap-3 mb-1.5 justify-center md:justify-start">
              <h1
                class="text-2xl md:text-3xl font-heading font-black tracking-tight text-stone-900 dark:text-white uppercase leading-none"
              >
                {{ user?.name || "User" }}
              </h1>
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

            <!-- Email dengan Garis Putus-putus -->
            <p
              class="text-stone-500 dark:text-stone-400 text-[11px] md:text-xs font-mono border-b-2 border-dashed border-stone-200 dark:border-stone-800 inline-block pb-0.5 mb-3 max-w-full truncate align-middle self-center md:self-start"
            >
              {{ user?.email }}
            </p>

            <!-- Deskripsi Bio -->
            <p class="text-stone-600 dark:text-stone-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
              {{ user?.bio || "Filmmaker dan kontributor di PF Space." }}
            </p>
          </div>

          <!-- Panel Statistik Sebelah Kanan (Brutal Stats Grid) -->
          <!-- 1. Untuk Kreator & Admin (4 Stat Cards 2x2 Grid) -->
          <div v-if="isCreator || roleName === 'admin'" class="grid grid-cols-2 gap-2 shrink-0 w-full md:w-64 mt-4 md:mt-0">
            <!-- Total Karya (Kiri Atas) -->
            <div
              class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <div class="w-7 h-7 rounded bg-brand-teal/10 dark:bg-brand-teal/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                <FilmIcon class="w-3.5 h-3.5 text-brand-teal" />
              </div>
              <div class="min-w-0">
                <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                  {{ summary.totalFilms || 0 }}
                </div>
                <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                  Total Karya
                </div>
              </div>
            </div>

            <!-- Kontribusi (Kanan Atas - Sebelah Kanan Total Karya) -->
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
                  {{ summary.totalVotes || 0 }}
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
                  {{ summary.totalComments || 0 }}
                </div>
                <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                  Diskusi
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Untuk Penikmat Karya / User Biasa (Hanya Disimpan & Kontribusi - Susunan Atas Bawah) -->
          <div v-else class="flex flex-col gap-2 shrink-0 w-full md:w-48 mt-4 md:mt-0">
            <!-- Karya Disimpan (Atas) -->
            <div
              class="bg-white dark:bg-stone-850 border-2 border-black dark:border-stone-700 p-2 flex items-center gap-2 shadow-brutal-xs transition-colors hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <div class="w-7 h-7 rounded bg-brand-teal/10 dark:bg-brand-teal/20 border-2 border-black dark:border-stone-600 flex items-center justify-center shrink-0">
                <Bookmark class="w-3.5 h-3.5 text-brand-teal" />
              </div>
              <div class="min-w-0">
                <div class="text-sm md:text-base font-heading font-black text-stone-900 dark:text-stone-100 leading-none mb-0.5">
                  {{ savedFilms.length || 0 }}
                </div>
                <div class="text-[7px] font-black uppercase tracking-wider text-stone-400 leading-none">
                  Disimpan
                </div>
              </div>
            </div>

            <!-- Kontribusi Kru (Bawah) -->
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
          </div>
        </div>

        <!-- Garis Putus-putus Lebar Penuh (Gambar 1) -->
        <div class="border-t border-dashed border-stone-300 dark:border-stone-700 my-4 w-full"></div>

        <!-- Layout Bawah: Metadata Lokasi di Kiri & Tombol Aksi di Kanan (Rapi Sejajar Ujung ke Ujung) -->
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

          <!-- Sisi Kanan: Tombol Sosmed & Share (Besar Proporsional, Rapi, & Bayangan Brutalis 3D) -->
          <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
            
            <!-- Instagram -->
            <a
              v-if="user?.instagram"
              :href="`https://instagram.com/${user.instagram}`"
              target="_blank"
              class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
              title="Instagram"
            >
              <Instagram class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
            </a>

            <!-- LinkedIn -->
            <a
              v-if="user?.linkedin"
              :href="user.linkedin"
              target="_blank"
              class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
              title="LinkedIn"
            >
              <Linkedin class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
            </a>

            <!-- Website -->
            <a
              v-if="user?.website"
              :href="user.website"
              target="_blank"
              class="w-10 h-10 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)]"
              title="Website"
            >
              <Globe class="w-5 h-5 text-stone-900 dark:text-stone-100 hover:text-inherit" />
            </a>

            <!-- Tombol Salin Link (Warna Kontras Orange/Kuning Muda, Shadow Brutalis, Teks Hitam Kontras Tinggi, Tetap Orange saat Hover) -->
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
      <!-- BAR TOMBOL NAVIGASI TAB (Gambar 1) -->
      <!-- ======================================================= -->
      <div class="flex flex-wrap gap-3 mb-8">
        <button
          @click="activeTab = 'dashboard'"
          :class="[
            'px-5 py-3 font-heading font-black uppercase tracking-widest text-xs md:text-sm border-2 border-black dark:border-stone-100 transition-all shadow-brutal-xs flex items-center gap-2 cursor-pointer',
            activeTab === 'dashboard'
              ? 'bg-brand-teal text-white translate-x-[1px] translate-y-[1px] shadow-none'
              : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700',
          ]"
        >
          <LayoutDashboard class="w-4 h-4" />
          Ringkasan
        </button>
        <button
          @click="activeTab = 'settings'"
          :class="[
            'px-5 py-3 font-heading font-black uppercase tracking-widest text-xs md:text-sm border-2 border-black dark:border-stone-100 transition-all shadow-brutal-xs flex items-center gap-2 cursor-pointer',
            activeTab === 'settings'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 translate-x-[1px] translate-y-[1px] shadow-none font-bold'
              : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700',
          ]"
        >
          <Settings class="w-4 h-4" />
          Pengaturan
        </button>
      </div>

      <!-- ======================================================= -->
      <!-- TAMPILAN TAB 1: OVERVIEW / RINGKASAN (Tata Letak Split) -->
      <!-- ======================================================= -->
      <div v-if="activeTab === 'dashboard'" class="animate-fade-in">
        
        <!-- Tata Letak Split (Tampil Untuk Semua Peran dengan Konten Adaptif) -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          <!-- KOLOM KIRI (SIDEBAR - 1/4 Lebar) -->
          <div class="lg:col-span-1 space-y-6">
            
            <!-- Box Koleksi Lencana (Hanya untuk Kreator/Admin) -->
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
                  Belum memiliki lencana. Terus unggah karya terbaikmu untuk mendapatkan penghargaan khusus!
                </p>
              </div>
            </div>

            <!-- Box Kontribusi Saya Landscape (Berada di Bawah Lencana untuk Kreator/Admin, dan Langsung untuk User) -->
            <div
              class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 shadow-brutal"
            >
              <div class="flex items-center justify-between gap-2 mb-4">
                <h3 class="font-heading font-black uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2 text-stone-900 dark:text-stone-100">
                  <Award class="w-4 h-4 text-brand-orange" /> Kontribusi Saya
                </h3>
                
                <!-- Tombol Akses Filter Kontribusi di Atas Sebelah Kanan Header -->
                <button
                  v-if="contributions.length > 0"
                  @click="showcaseFilter = 'contributions'"
                  class="bg-stone-100 dark:bg-stone-800 hover:bg-brand-orange hover:text-stone-900 text-stone-700 dark:text-stone-200 border border-black dark:border-stone-700 text-[9px] font-heading font-black uppercase px-2 py-0.5 shadow-brutal-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  title="Lihat Selengkapnya di Tampilan Utama"
                >
                  <span>LIHAT SEMUA</span>
                </button>
              </div>

              <div v-if="contributionsLoading" class="py-6 flex justify-center items-center">
                <Loader2 class="w-6 h-6 animate-spin text-stone-400" />
              </div>

              <!-- Empty State dalam Sidebar -->
              <div v-else-if="contributions.length === 0" class="text-center py-6 px-4 border border-dashed border-stone-300 dark:border-stone-750 bg-stone-50 dark:bg-stone-850/40">
                <p class="text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-normal">
                  Belum ada kontribusi karya film dari kreator lain.
                </p>
              </div>

              <!-- Landscape Contributions List (Maksimal 5 Baris Terbaru, Tanpa Hover Hijau Semua) -->
              <div v-else class="space-y-3">
                <div 
                  v-for="film in contributions.slice(0, 5)" 
                  :key="film.film_id || film.id"
                  @click="router.push('/archive/' + (film.slug || film.id))"
                  class="bg-stone-50 dark:bg-stone-850 border border-black dark:border-stone-800 p-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] flex gap-3 group hover:translate-y-[-1px] transition-all duration-200 cursor-pointer"
                >
                  <!-- Left: small portrait poster with NO POSTER AVAILABLE fallback -->
                  <div class="w-14 shrink-0 aspect-[3/4] bg-stone-900 border border-black overflow-hidden relative">
                    <img 
                      v-if="film.gambar_poster && !film.posterError" 
                      :src="film.gambar_poster" 
                      @error="film.posterError = true"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-900 p-1 select-none text-center">
                      <FilmIcon class="w-4 h-4 mb-0.5 text-stone-500" />
                      <span class="text-[6px] font-mono font-black leading-tight tracking-tighter uppercase text-stone-400">NO POSTER AVAILABLE</span>
                    </div>
                  </div>

                  <!-- Right: Details -->
                  <div class="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <!-- Judul Film Dibuat Lebih Besar & Dominan -->
                      <h4 
                        class="font-heading font-black text-sm md:text-base text-stone-900 dark:text-stone-100 uppercase tracking-tight line-clamp-1 group-hover:text-brand-orange dark:group-hover:text-brand-orange transition-colors leading-tight mb-1"
                      >
                        {{ film.judul }}
                      </h4>
                      <!-- Info Foto Profil & Nama Pembuat Film (Tanpa "Oleh:", Clickable) -->
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

                    <!-- Role Badge (Matching Category/DIPUBLIKASI Teal Green style) -->
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

                <!-- Tombol Lihat Semua Kontribusi Di Panel Utama Jika Lebih Dari 5 -->
                <button
                  v-if="contributions.length > 5"
                  @click="showcaseFilter = 'contributions'"
                  class="w-full mt-2 py-2 border border-dashed border-stone-400 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-[10px] font-heading font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Lihat Selengkapnya</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

          </div>

          <!-- KOLOM KANAN (DASHBOARD UTAMA - 3/4 Lebar) -->
          <div class="lg:col-span-3 space-y-6">
            
            <!-- Loading State Saat Ambil Data Dari Server -->
            <LoadingState v-if="dashboardLoading || savedLoading" text="Memuat data..." class="py-12" />

            <div v-else class="space-y-6 animate-fade-in">

              <!-- Panel Showcase Karya (Gabungan Grid Toggle & Progress Load More) -->
              <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-5 md:p-6 shadow-brutal">
                
                <div
                  class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b-2 border-dashed border-stone-300 dark:border-stone-700"
                >
                  <div>
                    <h2
                      class="text-base md:text-lg font-heading font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2"
                    >
                      <component 
                        :is="showcaseFilter === 'contributions' ? Award : (isCreator ? FilmIcon : Bookmark)" 
                        :class="['w-5 h-5', showcaseFilter === 'contributions' ? 'text-brand-orange' : 'text-brand-teal']" 
                      /> 
                      <template v-if="showcaseFilter === 'contributions'">
                        Kontribusi Saya
                      </template>
                      <template v-else-if="isCreator">
                        Showcase Karya Saya
                      </template>
                      <template v-else>
                        Showcase Karya (Disimpan)
                      </template>
                    </h2>
                    <p class="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                      <template v-if="showcaseFilter === 'contributions'">
                        Daftar karya film SMK di mana Anda terlibat dalam proses produksi.
                      </template>
                      <template v-else-if="isCreator">
                        Daftar karya film yang telah Anda publikasikan di platform ini.
                      </template>
                      <template v-else>
                        Daftar karya film favorit yang Anda simpan di koleksi Anda.
                      </template>
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                    
                    <!-- Tombol Filter Konten (Tampil Untuk Semua Role: User, Kreator & Admin) -->
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
                        <component :is="isCreator ? FilmIcon : Bookmark" class="w-3.5 h-3.5" />
                        <span>{{ isCreator ? 'Karya Saya' : 'Disimpan' }}</span>
                      </button>
                      <button
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

                    <!-- Selector Grid (Tampilan 3 Kolom & 5 Kolom) -->
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

                    <!-- Tombol Kelola Semua Ke Dashboard Karya (HANYA Tampil Saat Showcase Karya Disimpan / Kreator) -->
                    <button
                      v-if="showcaseFilter === 'main'"
                      @click="router.push(isCreator ? '/my-archive' : '/collections')"
                      class="h-9 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 px-4 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-heading font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-stone-900 dark:text-stone-100"
                    >
                      <Settings class="w-3.5 h-3.5 shrink-0" />
                      <span>Kelola Semua</span>
                    </button>
                  </div>
                </div>

                <!-- STATE JIKA KARYA/FILM KOSONG -->
                <div
                  v-if="activeShowcaseFilms.length === 0"
                  class="col-span-full flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-850 text-center animate-fade-in"
                >
                  <div class="w-16 h-16 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-700 flex items-center justify-center shadow-brutal-xs mb-4">
                    <component :is="showcaseFilter === 'contributions' ? Award : (isCreator ? FilmIcon : Bookmark)" class="w-8 h-8 text-stone-400 dark:text-stone-500 shrink-0" />
                  </div>
                  <h4 class="font-heading font-black text-sm uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-1">
                    <template v-if="showcaseFilter === 'contributions'">
                      Belum Ada Kontribusi Karya
                    </template>
                    <template v-else-if="isCreator">
                      Belum Ada Karya yang Diupload
                    </template>
                    <template v-else>
                      Belum Ada Karya yang Disimpan
                    </template>
                  </h4>
                  <p class="text-xs text-stone-500 dark:text-stone-400 max-w-md leading-relaxed mb-5">
                    <template v-if="showcaseFilter === 'contributions'">
                      Anda belum memiliki kontribusi dalam karya film oleh kreator lain.
                    </template>
                    <template v-else-if="isCreator">
                      Anda belum mempublikasikan karya film apa pun saat ini. Mulailah mengunggah film pertama Anda sekarang!
                    </template>
                    <template v-else>
                      Anda belum menyimpan karya film favorit Anda. Temukan film karya siswa SMK yang menarik di halaman utama dan klik tombol Simpan!
                    </template>
                  </p>
                  <button
                    v-if="showcaseFilter !== 'contributions'"
                    @click="router.push(isCreator && showcaseFilter === 'main' ? '/upload' : '/')"
                    class="bg-brand-teal text-white border-2 border-black dark:border-stone-100 py-2.5 px-6 font-heading font-black text-xs uppercase tracking-widest shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal transition-all cursor-pointer flex items-center gap-2"
                    style="color: #ffffff !important;"
                  >
                    <component :is="isCreator && showcaseFilter === 'main' ? Upload : FilmIcon" class="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
                    <span class="text-white font-black tracking-wider">{{ isCreator && showcaseFilter === 'main' ? "Upload Karya Pertama" : "Jelajahi Film" }}</span>
                  </button>
                </div>

                <!-- Grid Card Karya -->
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
                    :showStatus="isCreator && showcaseFilter === 'main'"
                    :customBadge="showcaseFilter === 'contributions' && film.contribution_roles ? film.contribution_roles.join(', ') : ''"
                    :showStats="true"
                    :stackedBadge="gridCols === 5"
                    @click="router.push('/archive/' + (film.slug || film.id))"
                    class="cursor-pointer h-full border-2 border-black dark:border-stone-100 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white dark:bg-stone-900"
                  />
                </div>

                <!-- TOMBOL PROGRESS LAZY LOAD -->
                <div v-if="visibleFilmsCount < activeShowcaseFilms.length" class="flex justify-center mt-8 pt-4 border-t border-dashed border-stone-200 dark:border-stone-800">
                  <button
                    @click="loadMoreFilms"
                    class="group bg-white dark:bg-stone-800 hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal border-2 border-black dark:border-stone-100 px-6 py-2.5 font-heading font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-stone-900 dark:text-stone-100 flex items-center gap-2"
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



      <div v-else-if="activeTab === 'settings'" class="animate-fade-in">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          <!-- Kolom Utama: Edit Info Profil -->
          <div class="lg:col-span-2 h-full">
            <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-6 shadow-brutal h-full flex flex-col">
              <h3 class="font-heading font-black uppercase text-base tracking-wider mb-6 pb-2 border-b-2 border-black dark:border-stone-700 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <User class="w-5 h-5 text-brand-teal" /> Informasi Profil
              </h3>

              <form @submit.prevent="saveProfile" class="flex flex-col justify-between flex-grow mt-2">
                <div class="space-y-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      v-model="editName"
                      type="text"
                      required
                      placeholder="Nama Lengkap"
                      class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                    />
                  </div>

                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Biografi Singkat
                    </label>
                    <textarea
                      v-model="editBio"
                      rows="3"
                      placeholder="Tuliskan biografi singkat tentang Anda..."
                      class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                    ></textarea>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        Lokasi / Domisili
                      </label>
                      <input
                        v-model="editLocation"
                        type="text"
                        placeholder="e.g. Kediri, Indonesia"
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        Situs Web / Link Portfolio
                      </label>
                      <input
                        v-model="editWebsite"
                        type="url"
                        placeholder="e.g. https://pfspace.com"
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        Username Instagram
                      </label>
                      <div class="relative flex items-center">
                        <span class="absolute left-3 text-stone-400 text-xs font-mono">@</span>
                        <input
                          v-model="editInstagram"
                          type="text"
                          placeholder="username"
                          class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 pl-7 pr-2.5 py-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                        Link LinkedIn
                      </label>
                      <input
                        v-model="editLinkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t border-dashed border-stone-300 dark:border-stone-700 flex justify-end mt-6">
                  <button
                    type="submit"
                    :disabled="savingProfile"
                    class="bg-brand-teal text-white hover:bg-teal-700 border-2 border-black dark:border-stone-100 py-2.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                  >
                    <Loader2 v-if="savingProfile" class="w-4 h-4 animate-spin" />
                    <Save v-else class="w-4 h-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Kolom Samping: Update Password -->
          <div class="lg:col-span-1 h-full">
            <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-6 shadow-brutal h-full flex flex-col">
              <h3 class="font-heading font-black uppercase text-base tracking-wider mb-6 pb-2 border-b-2 border-black dark:border-stone-700 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Key class="w-4 h-4 text-brand-orange" /> Keamanan Akun
              </h3>

              <form @submit.prevent="changePassword" class="flex flex-col justify-between flex-grow mt-2">
                <div class="space-y-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Kata Sandi Lama
                    </label>
                    <div class="relative flex items-center">
                      <input
                        v-model="currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        required
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 pr-10 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                      <button
                        type="button"
                        @click="showCurrentPassword = !showCurrentPassword"
                        class="absolute right-3 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      >
                        <Eye v-if="!showCurrentPassword" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div class="relative flex items-center">
                      <input
                        v-model="newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        required
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 pr-10 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                      <button
                        type="button"
                        @click="showNewPassword = !showNewPassword"
                        class="absolute right-3 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      >
                        <Eye v-if="!showNewPassword" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                      Konfirmasi Sandi Baru
                    </label>
                    <div class="relative flex items-center">
                      <input
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        required
                        class="w-full border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-850 pr-10 p-2.5 text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-brutal-xs"
                      />
                      <button
                        type="button"
                        @click="showConfirmPassword = !showConfirmPassword"
                        class="absolute right-3 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      >
                        <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t border-dashed border-stone-300 dark:border-stone-700 flex justify-end mt-6">
                  <button
                    type="submit"
                    :disabled="savingPassword"
                    class="bg-brand-red hover:bg-red-700 text-white border-2 border-black dark:border-stone-100 py-2.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                  >
                    <Loader2 v-if="savingPassword" class="w-4 h-4 animate-spin" />
                    <Key v-else class="w-4 h-4" />
                    Perbarui Sandi
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Modal Kelola Foto Profil (Brutal Styling Terpadu - Inline Cropping) -->
    <div
      v-if="showPhotoModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        class="bg-white dark:bg-stone-900 border-4 border-black dark:border-stone-100 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.15)] w-full max-w-md overflow-hidden flex flex-col transition-all duration-300 max-h-[90vh]"
      >
        <!-- Header Modal -->
        <div
          class="p-4 border-b-4 border-black dark:border-stone-100 flex justify-between items-center bg-stone-100 dark:bg-stone-850"
        >
          <h3
            class="font-heading font-black text-xs uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-2"
          >
            <Camera class="w-4 h-4 text-brand-orange" />
            <span v-if="cropImageSource">Potong Foto Profil</span>
            <span v-else>Kelola Foto Profil</span>
          </h3>
          <button
            @click="cropImageSource ? cancelCrop() : (showPhotoModal = false)"
            class="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors border-2 border-transparent hover:border-black dark:hover:border-stone-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body Modal -->
        <div class="p-6 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
          
          <!-- STATE 2: CROPPER INTERFACE INLINE -->
          <template v-if="cropImageSource">
            <!-- Viewport Gambar untuk Crop inline (overflow-visible to show corner handles) -->
            <div class="w-full h-80 bg-stone-950 dark:bg-stone-950 relative flex items-center justify-center p-2 border-2 border-black dark:border-stone-750 shadow-brutal-xs">
              <img
                ref="cropperImgRef"
                :src="cropImageSource"
                class="max-w-full max-h-full block mx-auto"
                alt="Crop Source"
                @load="initCropper"
              />
            </div>

            <div class="space-y-1">
              <h4 class="font-heading font-black text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Sesuaikan Potongan Gambar
              </h4>
              <p class="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                Geser dan atur ukuran kotak untuk menentukan area foto profil terbaik Anda.
              </p>
            </div>

            <!-- Crop Action Buttons inline -->
            <div class="w-full flex gap-3 pt-2">
              <button
                @click="cancelCrop"
                class="flex-1 border-2 border-black dark:border-stone-100 font-heading font-black uppercase bg-white dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer py-2.5 text-xs text-center"
              >
                Batal
              </button>
              <button
                @click="confirmCrop"
                class="flex-1 border-2 border-black dark:border-stone-100 font-heading font-black uppercase bg-brand-teal text-white hover:bg-teal-700 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer py-2.5 text-xs text-center"
              >
                <Check class="w-4 h-4" />
                Terapkan
              </button>
            </div>
          </template>

          <!-- STATE 1: VIEW/MANAGE PHOTO -->
          <template v-else>
            <!-- Frame Foto Profil (Diperbesar sesuai permintaan agar terlihat jelas) -->
            <div
              class="w-48 h-48 border-4 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-850 overflow-hidden relative flex items-center justify-center shadow-brutal transition-all duration-300 hover:rotate-1"
            >
              <img
                v-if="profileImageUrl && !imageError"
                :src="profileImageUrl"
                :alt="user?.name"
                class="w-full h-full object-cover"
                @error="imageError = true"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <User class="w-24 h-24 stroke-[1.25]" />
              </div>
            </div>

            <div class="space-y-1">
              <h4 class="font-heading font-black text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">
                {{ user?.name || "User" }}
              </h4>
              <p class="text-xs font-medium text-stone-500 dark:text-stone-400 max-w-xs">
                Ubah atau hapus foto profil Anda untuk mengubah tampilan di platform.
              </p>
            </div>

            <!-- Tindakan (Buttons) -->
            <div class="w-full space-y-3 pt-2">
              <!-- Loader saat proses update -->
              <div v-if="isUpdatingPhoto" class="flex flex-col items-center justify-center py-4 space-y-2">
                <Loader2 class="w-8 h-8 text-brand-teal animate-spin" />
                <span class="text-[10px] font-heading font-black uppercase text-stone-500 tracking-wider">Memproses...</span>
              </div>

              <template v-else>
                <!-- Pilih Foto Baru -->
                <button
                  @click="triggerFileInput"
                  class="w-full border-2 border-black dark:border-stone-100 bg-brand-teal text-white hover:bg-teal-700 py-3 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-center"
                >
                  <Upload class="w-4 h-4" />
                  Unggah Foto Baru
                </button>

                <!-- Hapus Foto Profil (Hanya tampil jika user memiliki kustom foto) -->
                <button
                  v-if="user?.image"
                  @click="deleteProfilePhoto"
                  class="w-full border-2 border-black dark:border-stone-100 bg-brand-red text-white hover:bg-red-700 py-3 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-center"
                >
                  <Trash2 class="w-4 h-4" />
                  Hapus Foto Profil
                </button>

                <!-- Tutup -->
                <button
                  @click="showPhotoModal = false"
                  class="w-full border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 py-3 px-4 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_rgba(255,255,255,1)] transition-all cursor-pointer text-center"
                >
                  <X class="w-4 h-4" />
                  Tutup
                </button>
              </template>
            </div>
          </template>

        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
/* Keyframe fade-in utility */
.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Sembunyikan handle tengah di border agar hanya sudut yang bisa ditarik */
:deep(.cropper-point.point-e),
:deep(.cropper-point.point-w),
:deep(.cropper-point.point-s),
:deep(.cropper-point.point-n) {
  display: none !important;
}

:deep(.cropper-line) {
  pointer-events: none !important;
}

/* Perbesar dan percantik titik sudut (corner handles) */
:deep(.cropper-point.point-ne),
:deep(.cropper-point.point-nw),
:deep(.cropper-point.point-se),
:deep(.cropper-point.point-sw) {
  width: 18px !important;
  height: 18px !important;
  background-color: #265c5c !important; /* brand-teal */
  border: 2px solid white !important;
  border-radius: 50% !important;
  opacity: 1 !important;
  box-shadow: 0px 0px 0px 1px black, 2px 2px 0px 0px black !important;
}

/* Penyesuaian posisi agar pas di tengah sudut */
:deep(.cropper-point.point-ne) {
  top: -9px !important;
  right: -9px !important;
}
:deep(.cropper-point.point-nw) {
  top: -9px !important;
  left: -9px !important;
}
:deep(.cropper-point.point-se) {
  bottom: -9px !important;
  right: -9px !important;
}
:deep(.cropper-point.point-sw) {
  bottom: -9px !important;
  left: -9px !important;
}

/* Percantik garis crop box */
:deep(.cropper-view-box) {
  outline: 2px solid white !important;
  box-shadow: 0 0 0 2px black !important;
  border-radius: 0 !important;
}
</style>
