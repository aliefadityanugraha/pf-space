<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "@/lib/api";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";
import { assetUrl } from "@/lib/format";
import { useHead } from "@unhead/vue";

import Navbar from "@/components/Navbar.vue";
import Footer from "@/components/Footer.vue";
import { Loader2 } from "lucide-vue-next";

// Sub-components (extracted from this file)
import DetailVideoSection from "@/components/detail/DetailVideoSection.vue";
import DetailActionBar from "@/components/detail/DetailActionBar.vue";
import DetailContent from "@/components/detail/DetailContent.vue";
import DetailSidebar from "@/components/detail/DetailSidebar.vue";
import DetailRelatedFilms from "@/components/detail/DetailRelatedFilms.vue";

const route = useRoute();
const router = useRouter();
const filmSlug = computed(() => route.params.slug || route.params.id);

// ─── Core data ──────────────────────────────────────────
const film = ref(null);
const loading = ref(true);

// ─── Navbar Scroll state ──────────────────────────────────
const videoSectionRef = ref(null);
const isLightTitle = ref(true);

const handleScroll = () => {
  if (videoSectionRef.value) {
    const sectionHeight = videoSectionRef.value.$el?.offsetHeight || videoSectionRef.value.offsetHeight || 500;
    // Switch to dark text/white bg when scrolled past video section
    isLightTitle.value = window.scrollY < sectionHeight - 80;
  } else {
    // Fallback if ref not yet attached
    isLightTitle.value = window.scrollY < 400;
  }
};

// ─── SEO ────────────────────────────────────────────────
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

// ─── Auth ───────────────────────────────────────────────
const { user, isLoggedIn, isAdmin, isModerator } = useAuth();
const { showToast } = useToast();
const canModerate = computed(() => isAdmin.value || isModerator.value);

// ─── Video state ────────────────────────────────────────
const activeVideoUrl = ref(null);
const activeVideoType = ref("film");

const switchVideo = (item) => {
  activeVideoUrl.value = item.url;
  activeVideoType.value = item.type;
};

// ─── Film ID (after fetch) ──────────────────────────────
const filmId = computed(() => film.value?.film_id);

// ─── Vote state ─────────────────────────────────────────
const voteData = ref({ vote_count: 0, has_voted: false });
const voting = ref(false);

const fetchVoteData = async () => {
  if (!filmId.value) return;
  try {
    const res = await api.get(`/api/votes/${filmId.value}`);
    const d = res.data || {};
    voteData.value = {
      vote_count: d.vote_count ?? 0,
      has_voted:
        typeof d.has_voted !== "undefined" ? !!d.has_voted : !!d.voted,
    };
  } catch (err) {
    console.error("Failed to fetch votes:", err);
  }
};

const toggleVote = async () => {
  if (!isLoggedIn.value) {
    router.push("/auth/login");
    return;
  }
  if (!filmId.value) return;

  voting.value = true;
  try {
    const res = await api.post(`/api/votes/${filmId.value}/toggle`, {});
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

// ─── Collection state ───────────────────────────────────
const collectionState = ref({ isInCollection: false, processing: false });
const isInCollection = computed(() => collectionState.value.isInCollection);
const processingCollection = computed(() => collectionState.value.processing);

const fetchCollectionStatus = async () => {
  if (!filmId.value || !isLoggedIn.value) return;
  try {
    const res = await api.get(`/api/collections/${filmId.value}/status`);
    collectionState.value.isInCollection =
      res.data?.is_in_collection || false;
  } catch (err) {
    console.error("Failed to fetch collection status:", err);
  }
};

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
    showToast(
      inCollection ? "Ditambahkan ke koleksi" : "Dihapus dari koleksi",
    );
  } catch (err) {
    collectionState.value.isInCollection = previous;
    showToast(err.message || "Gagal mengubah koleksi", "error");
  } finally {
    collectionState.value.processing = false;
  }
};

// ─── Share ──────────────────────────────────────────────
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

// ─── Comments ───────────────────────────────────────────
const comments = ref([]);
const loadingComments = ref(false);
const newComment = ref("");
const submittingComment = ref(false);

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
  if (!confirm("Hapus komentar ini? Semua balasan juga akan terhapus."))
    return;

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

// ─── Learning Assets ────────────────────────────────────
const hasLearningAssets = computed(
  () =>
    film.value?.file_naskah ||
    film.value?.file_storyboard ||
    film.value?.file_rab,
);

// ─── Parsed description sections ────────────────────────
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
        sections.push({ title: currentTitle, content: container.innerHTML });
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

// ─── Related Films ──────────────────────────────────────
const relatedFilms = ref([]);
const loadingRelated = ref(false);

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

// ─── Fetch film detail ──────────────────────────────────
const fetchFilm = async () => {
  if (!filmSlug.value) {
    router.push("/");
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/api/films/${filmSlug.value}`);
    const f = res.data || {};
    f.gambar_poster = assetUrl(f.gambar_poster);
    f.link_video_utama = assetUrl(f.link_video_utama);
    f.link_trailer = assetUrl(f.link_trailer);
    f.link_bts = assetUrl(f.link_bts);
    f.file_naskah = assetUrl(f.file_naskah);
    f.file_storyboard = assetUrl(f.file_storyboard);
    f.file_rab = assetUrl(f.file_rab);
    film.value = f;

    // Initialize active video
    activeVideoUrl.value = film.value?.link_video_utama || null;
    activeVideoType.value = "film";

    // Fetch dependent data
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

const incrementViews = async () => {
  if (!filmSlug.value) return;
  try {
    await api.post(`/api/films/${filmSlug.value}/views`);
  } catch (err) {
    if (err?.status === 429) return;
    console.warn("Increment views skipped:", err?.message || err);
  }
};

// ─── Lifecycle ──────────────────────────────────────────
onMounted(() => {
  fetchFilm();
  incrementViews();
  window.addEventListener("scroll", handleScroll);
  handleScroll();
});

watch(filmSlug, (newSlug) => {
  if (newSlug) {
    fetchFilm();
    incrementViews();
    window.scrollTo(0, 0);
    handleScroll();
  }
});

// Re-calculate scroll threshold once film is loaded and DOM rendered
watch(film, (newFilm) => {
  if (newFilm) {
    setTimeout(handleScroll, 200);
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-brand-cream">
    <Navbar :light-title="isLightTitle" />

    <!-- Loading -->
    <div
      v-if="loading"
      class="min-h-screen flex items-center justify-center pt-14"
    >
      <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
    </div>

    <template v-else-if="film">
      <!-- SECTION 1: VIDEO + SIDEBAR -->
      <DetailVideoSection
        ref="videoSectionRef"
        :film="film"
        :activeVideoUrl="activeVideoUrl"
        :activeVideoType="activeVideoType"
        @switch-video="switchVideo"
      >
        <template #action-bar>
          <DetailActionBar
            :film="film"
            :voteData="voteData"
            :voting="voting"
            :isInCollection="isInCollection"
            :processingCollection="processingCollection"
            :hasLearningAssets="hasLearningAssets"
            @toggle-vote="toggleVote"
            @toggle-collection="handleToggleCollection"
            @share="handleShare"
            @share-to="shareTo"
          />
        </template>
      </DetailVideoSection>

      <!-- SECTION 2: DETAIL CONTENT -->
      <main class="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <!-- Left Column: Main Content -->
          <DetailContent
            :film="film"
            :parsedSections="parsedSections"
            :comments="comments"
            :loadingComments="loadingComments"
            :newComment="newComment"
            :submittingComment="submittingComment"
            :isLoggedIn="isLoggedIn"
            :user="user"
            :canModerate="canModerate"
            :totalCommentCount="totalCommentCount"
            @update:newComment="newComment = $event"
            @submit-comment="submitComment"
            @delete-comment="deleteComment"
          />

          <!-- Right Column: Sidebar -->
          <DetailSidebar :film="film" />
        </div>

        <!-- Related Films -->
        <DetailRelatedFilms :relatedFilms="relatedFilms" />
      </main>
    </template>

    <Footer />
  </div>
</template>
