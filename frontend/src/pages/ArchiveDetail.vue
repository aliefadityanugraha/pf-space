<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "@/lib/api";
import { useAuth } from "@/composables/useAuth";

import Navbar from "@/components/Navbar.vue";
import Footer from "@/components/Footer.vue";
import ContentSection from "@/components/ContentSection.vue";
import ArchiveCard from "@/components/ArchiveCard.vue";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Film,
  Play,
  User,
  Calendar,
  Loader2,
  Heart,
  MessageCircle,
  FileText,
  Download,
  ExternalLink,
  Send,
  Bookmark,
  Share2,
  Eye,
  Clapperboard,
  Video,
  ArrowLeft,
  ChevronDown,
  GraduationCap,
} from "lucide-vue-next";

import CommentItem from "@/components/CommentItem.vue";
import Toast from "@/components/Toast.vue";
import { useToast } from "@/composables/useToast";
import { formatDate } from "@/lib/format";
import { useHead } from "@unhead/vue";

const route = useRoute();
const router = useRouter();
const filmSlug = computed(() => route.params.slug || route.params.id);

// Data
const film = ref(null);

// SEO Dynamic
useHead({
  title: () =>
    film.value ? `${film.value.judul} - PF Space` : "Memuat Karya...",
  meta: [
    {
      name: "description",
      content: () => film.value?.sinopsis || "Detail arsip karya.",
    },
    { property: "og:title", content: () => film.value?.judul },
    { property: "og:description", content: () => film.value?.sinopsis },
    { property: "og:image", content: () => film.value?.gambar_poster },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});

const { user, isLoggedIn, isAdmin, isModerator } = useAuth();

const loading = ref(true);
const voteData = ref({ vote_count: 0, has_voted: false });
const voting = ref(false);

// Active video for player
const activeVideoUrl = ref(null);
const activeVideoType = ref('film');

// Film ID computed (after film is fetched)
const filmId = computed(() => film.value?.film_id);

// Collection state
const collectionState = ref({
  isInCollection: false,
  processing: false,
});

const isInCollection = computed(() => collectionState.value.isInCollection);
const processingCollection = computed(() => collectionState.value.processing);

// Comments
const comments = ref([]);
const loadingComments = ref(false);
const newComment = ref("");
const submittingComment = ref(false);

// Related Films
const relatedFilms = ref([]);
const loadingRelated = ref(false);

const canModerate = computed(() => isAdmin.value || isModerator.value);

// Toast state
const { toast, showToast } = useToast();

// Scroll to detail section
// const detailSection = ref(null);
// const scrollToDetail = () => {
//   if (detailSection.value) {
//     detailSection.value.scrollIntoView({ behavior: "smooth", block: "start" });
//   }
// };

// Fetch film detail by slug
const fetchFilm = async () => {
  if (!filmSlug.value) {
    router.push("/");
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/api/films/${filmSlug.value}`);
    film.value = res.data;

    // Initialize active video to main film video
    activeVideoUrl.value = film.value?.link_video_utama || null;
    activeVideoType.value = 'film';

    // Now that we have film_id, fetch related data
    fetchVoteData();
    fetchCollectionStatus();
    fetchComments();
    fetchRelatedFilms();
  } catch (err) {
    console.error("Failed to fetch film:", err);
    router.push("/");
  } finally {
    loading.value = false;
  }
};

// Increment views
const incrementViews = async () => {
  if (!filmSlug.value) return;
  try {
    await api.post(`/api/films/${filmSlug.value}/views`);
  } catch (err) {
    console.error("Failed to increment views:", err);
  }
};

// Fetch vote data
const fetchVoteData = async () => {
  if (!filmId.value) return;
  try {
    const res = await api.get(`/api/votes/film/${filmId.value}`);
    voteData.value = res.data;
  } catch (err) {
    console.error("Failed to fetch votes:", err);
  }
};

// Toggle vote
const toggleVote = async () => {
  if (!isLoggedIn.value) {
    router.push("/auth/login");
    return;
  }
  if (!filmId.value) return;

  voting.value = true;
  try {
    const res = await api.post(`/api/votes/film/${filmId.value}/toggle`, {});
    voteData.value = {
      vote_count: res.data.vote_count,
      has_voted: res.data.voted,
    };
  } catch (err) {
    console.error("Failed to vote:", err);
  } finally {
    voting.value = false;
  }
};

// Fetch comments
const fetchComments = async () => {
  if (!filmId.value) return;
  loadingComments.value = true;
  try {
    const res = await api.get(`/api/discussions/film/${filmId.value}`);
    comments.value = res.data || [];
  } catch (err) {
    console.error("Failed to fetch comments:", err);
  } finally {
    loadingComments.value = false;
  }
};

// Fetch related films
const fetchRelatedFilms = async () => {
  if (!filmId.value) return;
  loadingRelated.value = true;
  try {
    const res = await api.get(`/api/films/${filmId.value}/related?limit=6`);
    relatedFilms.value = res.data || [];
  } catch (err) {
    console.error("Failed to fetch related films:", err);
  } finally {
    loadingRelated.value = false;
  }
};

// Fetch collection status
const fetchCollectionStatus = async () => {
  if (!filmId.value || !isLoggedIn.value) return;
  try {
    const res = await api.get(`/api/collections/${filmId.value}/status`);
    collectionState.value.isInCollection = res.data?.is_in_collection || false;
  } catch (err) {
    console.error("Failed to fetch collection status:", err);
  }
};

// Toggle collection
const handleToggleCollection = async () => {
  if (!isLoggedIn.value) {
    router.push("/auth/login");
    return;
  }
  if (!filmId.value) return;

  const previous = collectionState.value.isInCollection;
  collectionState.value.processing = true;
  try {
    const res = await api.post(`/api/collections/${filmId.value}/toggle`, {});
    const data = res.data;
    let inCollection = !previous;

    if (data && typeof data.is_in_collection === "boolean") {
      inCollection = data.is_in_collection;
    }

    collectionState.value.isInCollection = inCollection;
    showToast(inCollection ? "Ditambahkan ke koleksi" : "Dihapus dari koleksi");
  } catch (err) {
    collectionState.value.isInCollection = previous;
    showToast(err.message || "Gagal mengubah koleksi", "error");
  } finally {
    collectionState.value.processing = false;
  }
};

// Share function
const handleShare = async () => {
  const shareData = {
    title: film.value?.judul || "PF Space Archive",
    text: `Lihat karya ${film.value?.judul} di PF Space`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link berhasil disalin!");
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Error sharing:", err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link berhasil disalin!");
      } catch (clipboardErr) {
        showToast("Gagal membagikan", "error");
      }
    }
  }
};

// Share to specific platform
const shareTo = (platform) => {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(
    `Lihat karya ${film.value?.judul} di PF Space`,
  );

  const urls = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };

  if (urls[platform]) {
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  }
};

// Submit comment
const submitComment = async (data = null) => {
  const isReply = !!data && !!data.parent_id;
  const text = isReply ? data.isi_pesan : newComment.value.trim();
  const parentId = isReply ? data.parent_id : null;

  if (!text || !isLoggedIn.value || !filmId.value) return;

  submittingComment.value = !isReply;
  try {
    await api.post(`/api/discussions/film/${filmId.value}`, {
      isi_pesan: text,
      parent_id: parentId,
    });
    if (!isReply) newComment.value = "";
    await fetchComments();
    showToast(isReply ? "Balasan terkirim" : "Komentar terkirim");
  } catch (err) {
    console.error("Failed to submit comment:", err);
    showToast(err.message || "Gagal mengirim komentar", "error");
  } finally {
    submittingComment.value = false;
  }
};

const deleteComment = async (id) => {
  if (!confirm("Hapus komentar ini? Semua balasan juga akan terhapus.")) return;

  try {
    await api.delete(`/api/discussions/${id}`);
    await fetchComments();
    showToast("Komentar berhasil dihapus");
  } catch (err) {
    console.error("Failed to delete comment:", err);
    showToast("Gagal menghapus komentar", "error");
  }
};

const totalCommentCount = computed(() => {
  let count = 0;
  const countRecursive = (list) => {
    count += list.length;
    list.forEach((c) => {
      if (c.replies && c.replies.length > 0) countRecursive(c.replies);
    });
  };
  countRecursive(comments.value);
  return count;
});

// Get YouTube embed URL
const isYoutubeUrl = (url) => {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
};

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
  );
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  }
  return url;
};

const hasLearningAssets = computed(() => {
  return film.value?.file_naskah || film.value?.file_storyboard || film.value?.file_rab;
});

// Parse deskripsi_lengkap into sections based on H2
const parsedSections = computed(() => {
  if (!film.value?.deskripsi_lengkap) return [];

  const content = film.value.deskripsi_lengkap;
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const children = Array.from(doc.body.childNodes);

  const sections = [];
  let currentTitle = "Eksplorasi Karya";
  let currentContentNodes = [];

  const pushSection = () => {
    if (currentContentNodes.length > 0) {
      const container = document.createElement("div");
      currentContentNodes.forEach((node) =>
        container.appendChild(node.cloneNode(true)),
      );

      if (container.innerHTML.trim()) {
        sections.push({
          title: currentTitle,
          content: container.innerHTML,
        });
      }
    }
  };

  children.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === "H2") {
      pushSection();
      currentTitle = node.textContent || "Section";
      currentContentNodes = [];
    } else {
      currentContentNodes.push(node);
    }
  });

  pushSection();

  return sections;
});

// Has video (for current active)
const hasActiveVideo = computed(() => !!activeVideoUrl.value);

// Video playlist computed
const videoPlaylist = computed(() => {
  if (!film.value) return [];
  const list = [];
  if (film.value.link_video_utama) {
    list.push({
      type: 'film',
      label: 'Karya Utama',
      description: film.value.judul,
      url: film.value.link_video_utama,
      icon: 'film'
    });
  }
  if (film.value.link_trailer) {
    list.push({
      type: 'trailer',
      label: 'Trailer',
      description: `Trailer - ${film.value.judul}`,
      url: film.value.link_trailer,
      icon: 'clapperboard'
    });
  }
  if (film.value.link_bts) {
    list.push({
      type: 'bts',
      label: 'Behind The Scenes',
      description: `BTS - ${film.value.judul}`,
      url: film.value.link_bts,
      icon: 'video'
    });
  }
  return list;
});

// Switch active video
const switchVideo = (item) => {
  activeVideoUrl.value = item.url;
  activeVideoType.value = item.type;
};

// Get YouTube thumbnail
const getYoutubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
};

onMounted(() => {
  fetchFilm();
  incrementViews();
});

watch(filmSlug, (newSlug) => {
  if (newSlug) {
    fetchFilm();
    incrementViews();
    window.scrollTo(0, 0);
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <Toast v-bind="toast" @close="toast.show = false" />

    <!-- Loading -->
    <div
      v-if="loading"
      class="min-h-screen flex items-center justify-center pt-14"
    >
      <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
    </div>

    <template v-else-if="film">
      <!-- ==================== -->
      <!-- SECTION 1: VIDEO + SIDEBAR -->
      <!-- ==================== -->
      <section class="pt-20 bg-stone-900 min-h-[calc(100vh-30rem)]">
        <div class="flex flex-col lg:flex-row">
          <!-- Left: Video + Info (8 cols) -->
          <div class="flex-1 flex flex-col">
            <!-- Video Player -->
            <div class="w-full bg-black">
              <div class="aspect-video">
                <!-- YouTube Embed -->
                <iframe
                  v-if="hasActiveVideo && isYoutubeUrl(activeVideoUrl)"
                  :key="'yt-' + activeVideoUrl"
                  :src="getYoutubeEmbedUrl(activeVideoUrl)"
                  class="w-full h-full"
                  frameborder="0"
                  referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowfullscreen
                ></iframe>
                <!-- Direct Video -->
                <video
                  v-else-if="hasActiveVideo"
                  :key="'vid-' + activeVideoUrl"
                  :src="activeVideoUrl"
                  controls
                  class="w-full h-full bg-black"
                ></video>
                <!-- No Video Fallback -->
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-stone-900"
                >
                  <div class="text-center">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-800 flex items-center justify-center">
                      <Film class="w-10 h-10 text-stone-600" />
                    </div>
                    <p class="text-stone-400 text-lg font-display mb-1">Video Belum Tersedia</p>
                    <p class="text-stone-500 text-sm">Karya ini belum memiliki video yang dapat ditonton</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Video Info -->
            <div class="bg-stone-900 p-4 md:p-5 border-t border-white/5">
              <!-- Title & Meta -->
              <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg md:text-xl font-display font-bold text-white mb-1.5 truncate">
                    {{ film.judul }}
                  </h2>
                  <div class="flex flex-wrap items-center gap-3 text-sm text-stone-400">
                    <router-link
                      v-if="film.creator?.id"
                      :to="`/creator/${film.creator.id}`"
                      class="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
                    >
                      <User class="w-3.5 h-3.5" />
                      {{ film.creator?.name || "Unknown" }}
                    </router-link>
                    <span v-else class="flex items-center gap-1.5">
                      <User class="w-3.5 h-3.5" />
                      {{ film.creator?.name || "Unknown" }}
                    </span>
                    <span v-if="film.tahun_karya" class="flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5" />
                      {{ film.tahun_karya }}
                    </span>
                    <Badge
                      v-if="film.category"
                      variant="secondary"
                      class="bg-white/10 text-stone-300 border-0 text-xs"
                    >
                      {{ film.category.nama_kategori }}
                    </Badge>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap items-center gap-2">
                  <Button
                    v-if="hasLearningAssets"
                    variant="outline"
                    size="sm"
                    class="bg-brand-teal/20 text-brand-teal border-brand-teal/30 hover:bg-brand-teal/30 hover:text-brand-teal"
                    @click="router.push(`/archive/${film.slug}/study`)"
                  >
                    <GraduationCap class="w-4 h-4 mr-1.5" />
                    Mode Studi
                  </Button>

                  <Button
                    :variant="voteData.has_voted ? 'default' : 'outline'"
                    size="sm"
                    :class="
                      voteData.has_voted
                        ? 'bg-pink-600 hover:bg-pink-700 border-pink-600 text-white'
                        : 'border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                    "
                    @click="toggleVote"
                    :disabled="voting"
                  >
                    <Loader2 v-if="voting" class="w-4 h-4 mr-1.5 animate-spin" />
                    <Heart
                      v-else
                      :class="['w-4 h-4 mr-1.5', voteData.has_voted ? 'fill-current' : '']"
                    />
                    {{ voteData.vote_count }} Vote
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    class="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    @click="handleToggleCollection"
                    :disabled="processingCollection"
                    :class="isInCollection ? 'border-brand-orange text-brand-orange' : ''"
                  >
                    <Loader2 v-if="processingCollection" class="w-4 h-4 mr-1.5 animate-spin" />
                    <Bookmark
                      v-else
                      :class="['w-4 h-4 mr-1.5', isInCollection ? 'fill-current' : '']"
                    />
                    {{ isInCollection ? "Tersimpan" : "Simpan" }}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    class="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    @click="handleShare"
                  >
                    <Share2 class="w-4 h-4 mr-1.5" />
                    Share
                  </Button>

                  <!-- Social Share -->
                  <Button
                    variant="outline"
                    size="sm"
                    class="bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/30 px-2.5"
                    @click="shareTo('whatsapp')"
                    title="Share to WhatsApp"
                  >
                    <MessageCircle class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="bg-white/10 text-white border-white/20 hover:bg-white/20 px-2.5"
                    @click="shareTo('twitter')"
                    title="Share to X"
                  >
                    <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                  </Button>

                  <!-- Scroll to detail -->
                  <!-- <Button
                    variant="outline"
                    size="sm"
                    class="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    @click="scrollToDetail"
                  >
                    <ChevronDown class="w-4 h-4 mr-1.5" />
                    Detail
                  </Button> -->
                </div>
              </div>


            </div>
          </div>

          <!-- Right: Sidebar - Video Playlist -->
          <div class="w-full lg:w-80 xl:w-96 shrink-0 bg-stone-800/50 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
            <div class="p-4 border-b border-white/10">
              <h3 class="text-white font-bold text-sm uppercase tracking-wider">Video Playlist</h3>
              <p class="text-stone-500 text-xs mt-1">{{ videoPlaylist.length }} video tersedia</p>
            </div>
            
            <div class="flex-1 overflow-y-auto p-3 space-y-2" style="max-height: calc(100vh - 5rem - 5rem);">
              <div
                v-for="(item, idx) in videoPlaylist"
                :key="item.type"
                class="flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 group"
                :class="activeVideoType === item.type 
                  ? 'bg-brand-red/20 border border-brand-red/40' 
                  : 'hover:bg-white/5 border border-transparent'"
                @click="switchVideo(item)"
              >
                <!-- Thumbnail -->
                <div class="w-32 h-[72px] bg-stone-700 flex-shrink-0 overflow-hidden rounded border border-white/10 relative">
                  <img
                    v-if="getYoutubeThumbnail(item.url)"
                    :src="getYoutubeThumbnail(item.url)"
                    :alt="item.label"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-stone-800">
                    <Film v-if="item.icon === 'film'" class="w-6 h-6 text-stone-500" />
                    <Clapperboard v-else-if="item.icon === 'clapperboard'" class="w-6 h-6 text-stone-500" />
                    <Video v-else class="w-6 h-6 text-stone-500" />
                  </div>
                  <!-- Now Playing indicator -->
                  <div 
                    v-if="activeVideoType === item.type" 
                    class="absolute inset-0 flex items-center justify-center bg-black/40"
                  >
                    <div class="flex items-center gap-1">
                      <div class="w-0.5 h-3 bg-brand-red rounded-full animate-pulse"></div>
                      <div class="w-0.5 h-4 bg-brand-red rounded-full animate-pulse" style="animation-delay: 150ms;"></div>
                      <div class="w-0.5 h-2.5 bg-brand-red rounded-full animate-pulse" style="animation-delay: 300ms;"></div>
                    </div>
                  </div>
                  <!-- Play icon overlay -->
                  <div 
                    v-else 
                    class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play class="w-6 h-6 text-white fill-white" />
                  </div>
                  <!-- Number badge -->
                  <div class="absolute top-1 left-1 w-5 h-5 bg-black/70 rounded flex items-center justify-center">
                    <span class="text-white text-[10px] font-bold">{{ idx + 1 }}</span>
                  </div>
                </div>
                <!-- Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span 
                      class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      :class="{
                        'bg-brand-red/20 text-brand-red': item.type === 'film',
                        'bg-brand-teal/20 text-brand-teal': item.type === 'trailer',
                        'bg-brand-orange/20 text-brand-orange': item.type === 'bts'
                      }"
                    >
                      {{ item.label }}
                    </span>
                  </div>
                  <h4 
                    class="text-sm font-medium line-clamp-2 transition-colors"
                    :class="activeVideoType === item.type ? 'text-white' : 'text-white/70 group-hover:text-white'"
                  >
                    {{ item.description }}
                  </h4>
                </div>
              </div>

              <div v-if="videoPlaylist.length === 0" class="text-center py-10">
                <Film class="w-10 h-10 text-stone-600 mx-auto mb-3" />
                <p class="text-stone-500 text-sm">Tidak ada video tersedia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== -->
      <!-- SECTION 3: DETAIL CONTENT -->
      <!-- ==================== -->
      <main ref="detailSection" class="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <!-- Left Column: Main Content -->
          <div
            class="lg:col-span-2 space-y-8 animate-fade-in-up"
            style="
              animation-delay: 200ms;
              opacity: 0;
              animation-fill-mode: forwards;
            "
          >
            <!-- Poster + Synopsis Card -->
            <div
              class="flex flex-col sm:flex-row gap-6"
            >
              <!-- Poster -->
              <div class="w-full max-w-[180px] mx-auto sm:mx-0 shrink-0">
                <div
                  class="aspect-[3/4] bg-stone-800 border-2 border-slate-900 overflow-hidden shadow-brutal-sm"
                >
                  <img
                    v-if="film.gambar_poster"
                    :src="film.gambar_poster"
                    :alt="film.judul"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center"
                  >
                    <Film class="w-12 h-12 text-stone-600" />
                  </div>
                </div>
              </div>
              <!-- Details -->
              <div class="flex-1 min-w-0">
                <h2
                  class="text-2xl md:text-3xl font-display font-bold text-stone-900 mb-3 break-words"
                >
                  {{ film.judul }}
                </h2>
                <div
                  class="flex flex-wrap items-center gap-2 text-sm font-body text-stone-600 mb-4"
                >
                  <User class="w-4 h-4 shrink-0" />
                  <router-link
                    v-if="film.creator?.id"
                    :to="`/creator/${film.creator.id}`"
                    class="hover:text-brand-red hover:underline font-medium truncate"
                  >
                    {{ film.creator?.name || "Unknown" }}
                  </router-link>
                  <span v-else class="truncate">{{ film.creator?.name || "Unknown" }}</span>
                  <Badge variant="default" class="bg-stone-800 shrink-0">
                    {{ film.tahun_karya || "-" }}
                  </Badge>
                  <Badge
                    v-if="film.category"
                    variant="outline"
                    class="bg-white shrink-0"
                  >
                    {{ film.category.nama_kategori }}
                  </Badge>
                </div>
                <h3
                  class="font-semibold text-stone-900 mb-2"
                >
                  Synopsis
                </h3>
                <p class="text-stone-600 break-words">
                  {{ film.sinopsis || "Tidak ada sinopsis." }}
                </p>
              </div>
            </div>

            <!-- Informasi Tambahan (Dynamic Sections from deskripsi_lengkap) -->
            <template v-if="film.deskripsi_lengkap">
              <ContentSection
                v-for="(section, idx) in parsedSections"
                :key="idx"
                :title="section.title"
                color="red"
              >
                <div
                  class="prose prose-sm max-w-none font-body"
                  v-html="section.content"
                ></div>
              </ContentSection>
            </template>

            <!-- Trailer -->
            <!-- <ContentSection
              v-if="film.link_trailer"
              title="Trailer"
              color="teal"
            >
              <div
                class="aspect-video bg-black border-2 border-stone-800 overflow-hidden shadow-brutal-sm"
              >
                <iframe
                  v-if="isYoutubeUrl(film.link_trailer)"
                  :src="getYoutubeEmbedUrl(film.link_trailer)"
                  class="w-full h-full"
                  frameborder="0"
                  referrerpolicy="strict-origin-when-cross-origin"
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
                <video
                  v-else
                  :src="film.link_trailer"
                  controls
                  class="w-full h-full"
                ></video>
              </div>
            </ContentSection> -->

            <!-- Cast & Crew -->
            <ContentSection title="Cast & Crew" color="red">
              <div
                v-if="film.crew && film.crew.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div
                  v-for="(item, idx) in film.crew"
                  :key="idx"
                  class="p-3 bg-stone-100 rounded"
                >
                  <p class="font-bold text-sm text-stone-900">
                    {{ item.jabatan }}
                  </p>
                  <p class="text-sm text-stone-600">
                    {{ item.anggota?.join(", ") }}
                  </p>
                </div>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Director</p>
                  <p class="text-sm text-stone-600">
                    {{ film.creator?.name || "Unknown" }}
                  </p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Producer</p>
                  <p class="text-sm text-stone-600">
                    {{ film.creator?.name || "Unknown" }}
                  </p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">
                    Cinematographer
                  </p>
                  <p class="text-sm text-stone-600">-</p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Editor</p>
                  <p class="text-sm text-stone-600">-</p>
                </div>
              </div>
            </ContentSection>

            <!-- Comments Section -->
            <ContentSection title="Diskusi" color="red">
              <div class="flex items-center gap-2 mb-4">
                <MessageCircle class="w-5 h-5 shrink-0" />
                <span
                  class="text-sm text-stone-500 font-bold font-mono tracking-tight uppercase"
                  >{{ totalCommentCount }} KOMENTAR</span
                >
              </div>

              <!-- Comment Form -->
              <div
                v-if="isLoggedIn"
                class="mb-8 p-3 md:p-4 bg-white border-2 border-stone-800 shadow-brutal-sm"
              >
                <div class="flex gap-3 md:gap-4">
                  <div
                    class="w-10 h-10 bg-brand-orange border-2 border-stone-800 shadow-brutal-xs flex items-center justify-center text-stone-900 font-bold flex-shrink-0"
                  >
                    {{ user?.name?.charAt(0) || "U" }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <textarea
                      v-model="newComment"
                      rows="3"
                      placeholder="Apa pendapatmu tentang karya ini?"
                      class="w-full p-2 md:p-3 border-2 border-stone-800 bg-white text-sm resize-none focus:ring-0 focus:outline-none mb-3 font-body"
                    ></textarea>
                    <div class="flex justify-end">
                      <Button
                        @click="submitComment()"
                        :disabled="submittingComment || !newComment.trim()"
                        class="bg-brand-red hover:bg-red-600 text-white rounded-none border-2 border-stone-800 shadow-brutal-xs active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                      >
                        <Loader2
                          v-if="submittingComment"
                          class="w-4 h-4 mr-2 animate-spin"
                        />
                        <Send v-else class="w-4 h-4 mr-2" />
                        <span class="hidden sm:inline">Kirim Komentar</span>
                        <span class="sm:hidden">Kirim</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="mb-8 p-4 md:p-6 bg-stone-100 border-2 border-dashed border-stone-400 text-center"
              >
                <p class="text-stone-600 mb-4 font-body text-sm md:text-base">
                  Bergabung dalam diskusi untuk memberikan apresiasi atau
                  masukan.
                </p>
                <Button
                  variant="outline"
                  class="border-2 border-stone-800 shadow-brutal-xs text-sm"
                  @click="router.push('/auth/login')"
                  >Login Untuk Berkomentar</Button
                >
              </div>

              <!-- Comments List -->
              <div class="space-y-6">
                <div v-if="loadingComments" class="text-center py-8">
                  <Loader2
                    class="w-8 h-8 animate-spin mx-auto text-stone-400"
                  />
                </div>
                <div
                  v-else-if="comments.length === 0"
                  class="text-center py-8 bg-stone-100 rounded border-2 border-stone-200 border-dashed"
                >
                  <MessageCircle
                    class="w-12 h-12 text-stone-300 mx-auto mb-2"
                  />
                  <p class="text-stone-500 font-body text-sm md:text-base">
                    Belum ada diskusi. Jadilah yang pertama berkomentar!
                  </p>
                </div>
                <div v-else class="space-y-6">
                  <CommentItem
                    v-for="comment in comments"
                    :key="comment.diskusi_id"
                    :comment="comment"
                    :is-logged-in="isLoggedIn"
                    :current-user="user"
                    :can-moderate="canModerate"
                    @reply="submitComment"
                    @delete="deleteComment"
                  />
                </div>
              </div>
            </ContentSection>
          </div>

          <!-- Right Column: Sidebar -->
          <div
            class="lg:col-span-1 space-y-6 animate-fade-in-up"
            style="
              animation-delay: 400ms;
              opacity: 0;
              animation-fill-mode: forwards;
            "
          >
            <!-- Learning Assets -->
            <ContentSection title="Learning Assets" color="teal">
              <div class="space-y-3">
                <router-link
                  v-if="film.file_naskah"
                  :to="{
                    name: 'AssetDetail',
                    params: { filmSlug: film.slug, assetSlug: 'naskah-film' },
                  }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors group"
                >
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <FileText class="w-5 h-5 text-brand-red shrink-0" />
                    <div class="min-w-0 flex-1">
                      <span class="font-medium text-sm block truncate">Naskah Karya</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400 group-hover:text-brand-red transition-colors shrink-0 ml-2" />
                </router-link>
                <router-link
                  v-if="film.file_storyboard"
                  :to="{
                    name: 'AssetDetail',
                    params: { filmSlug: film.slug, assetSlug: 'storyboard' },
                  }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors group"
                >
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <FileText class="w-5 h-5 text-brand-teal shrink-0" />
                    <div class="min-w-0 flex-1">
                      <span class="font-medium text-sm block truncate">Storyboard</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400 group-hover:text-brand-teal transition-colors shrink-0 ml-2" />
                </router-link>
                <router-link
                  v-if="film.file_rab"
                  :to="{
                    name: 'AssetDetail',
                    params: { filmSlug: film.slug, assetSlug: 'rab' },
                  }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors group"
                >
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <FileText class="w-5 h-5 text-brand-orange shrink-0" />
                    <div class="min-w-0 flex-1">
                      <span class="font-medium text-sm block truncate">RAB (Budget)</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400 group-hover:text-brand-orange transition-colors shrink-0 ml-2" />
                </router-link>
                <p
                  v-if="
                    !film.file_naskah && !film.file_storyboard && !film.file_rab
                  "
                  class="text-sm text-stone-400 text-center py-4"
                >
                  Tidak ada dokumen
                </p>
              </div>
            </ContentSection>

            <!-- Film Info Card -->
            <Card>
              <CardContent class="p-4">
                <h3 class="font-bold mb-4 text-base">Informasi Karya</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between gap-4">
                    <span class="text-stone-500 shrink-0">Kategori</span>
                    <span class="font-medium text-right truncate">{{
                      film.category?.nama_kategori || "-"
                    }}</span>
                  </div>
                  <div class="flex justify-between gap-4">
                    <span class="text-stone-500 shrink-0">Tahun</span>
                    <span class="font-medium text-right">{{
                      film.tahun_karya || "-"
                    }}</span>
                  </div>
                  <div class="flex justify-between gap-4">
                    <span class="text-stone-500 shrink-0">Creator</span>
                    <span class="font-medium text-right truncate">{{
                      film.creator?.name || "-"
                    }}</span>
                  </div>
                  <div class="flex justify-between gap-4">
                    <span class="text-stone-500 shrink-0">Dipublikasi</span>
                    <span class="font-medium text-right text-xs md:text-sm">{{
                      formatDate(film.created_at)
                    }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Related Films Section -->
        <div
          v-if="relatedFilms.length > 0"
          class="my-12 animate-fade-in-up"
          style="
            animation-delay: 500ms;
            opacity: 0;
            animation-fill-mode: forwards;
          "
        >
          <h2
            class="text-2xl font-black font-display text-stone-900 mb-6 uppercase tracking-wider flex items-center gap-2"
          >
            <Film class="w-6 h-6 text-brand-orange" />
            Karya Serupa
          </h2>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <ArchiveCard
              v-for="related in relatedFilms"
              :key="related.film_id"
              :archive="related"
              variant="portrait"
              content-class="p-3"
              class="cursor-pointer"
              @click="router.push(`/archive/${related.slug}`)"
            >
              <template #content>
                <h3
                  class="font-bold text-sm text-stone-900 line-clamp-1 mb-0.5"
                >
                  {{ related.judul }}
                </h3>
                <p class="text-xs text-stone-500 mb-0 flex items-center gap-1">
                  {{ related.creator?.name }}
                </p>
              </template>
            </ArchiveCard>
          </div>
        </div>
      </main>
    </template>

    <Footer />
  </div>
</template>
