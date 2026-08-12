<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import {
  ArrowLeft,
  Film,
  Clock,
  Calendar,
  Pin,
  Link2,
  MessageCircle,
  PenLine,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-vue-next";
import PageLayout from "@/components/PageLayout.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/LazyImage.vue";
import FeedErrorState from "@/components/production-feed/FeedErrorState.vue";
import FeedPostDetailSkeleton from "@/components/production-feed/FeedPostDetailSkeleton.vue";
import FeedPostMedia from "@/components/production-feed/FeedPostMedia.vue";
import FeedPostComments from "@/components/production-feed/FeedPostComments.vue";
import RelatedFeed from "@/components/production-feed/RelatedFeed.vue";
import { fetchPostDetail, deleteFeedPost } from "@/modules/production-feed/api";
import { mapPostDetail, stripHtml } from "@/modules/production-feed";
import { TIPE_OPTIONS } from "@/modules/production-feed/editor";
import { assetUrl, formatDate } from "@/lib/format";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";

const route = useRoute();
const router = useRouter();
const { user, isLoggedIn, isModerator, isAdmin } = useAuth();
const { showToast } = useToast();

const post = ref(null);
const isLoading = ref(false);
const isError = ref(false);
const errorMessage = ref("");
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

const isOwner = computed(
  () =>
    !!user.value?.id &&
    !!post.value?.creator?.id &&
    user.value.id === post.value.creator.id,
);
const canEditOrDelete = computed(
  () => isOwner.value || isModerator.value || isAdmin.value,
);

const handleDelete = async () => {
  if (!post.value?.postId) return;
  isDeleting.value = true;
  try {
    await deleteFeedPost(post.value.postId);
    showToast("Postingan berhasil dihapus", "success");
    router.push("/feed");
  } catch (err) {
    showToast(err?.message || "Gagal menghapus postingan", "error");
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
  }
};

const loadPost = async (slug) => {
  isLoading.value = true;
  isError.value = false;
  errorMessage.value = "";
  try {
    const raw = await fetchPostDetail(slug);
    if (!raw) throw new Error("Post tidak ditemukan");
    post.value = mapPostDetail(raw);
  } catch (err) {
    isError.value = true;
    errorMessage.value =
      err?.message || "Gagal memuat postingan. Silakan coba lagi.";
  } finally {
    isLoading.value = false;
  }
};

const tipeLabel = computed(() => {
  if (!post.value?.tipe) return "";
  return TIPE_OPTIONS.find((o) => o.value === post.value.tipe)?.label || "";
});

const dateLabel = computed(() => {
  const date = post.value?.publishedAt || post.value?.createdAt;
  return date ? formatDate(date) : "";
});

const readingTime = computed(() => {
  const words = stripHtml(post.value?.isiKonten)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
});

const coverSrc = computed(() =>
  post.value?.cover ? assetUrl(post.value.cover) : "",
);

const canModerate = computed(() => isModerator.value || isAdmin.value);

const siteUrl = computed(() =>
  typeof window !== "undefined"
    ? window.location.origin
    : "https://pfspace.my.id",
);
const canonical = computed(() => `${siteUrl.value}/feed/${route.params.slug}`);

const ogImage = computed(() => {
  if (!post.value?.cover) return "";
  const src = assetUrl(post.value.cover);
  return /^https?:\/\//i.test(src) ? src : `${siteUrl.value}${src}`;
});

useHead(() => {
  const title = post.value
    ? `${post.value.judul} - Feed Produksi - PF Space`
    : "Detail Post - PF Space";
  const description = post.value
    ? stripHtml(post.value.isiKonten).slice(0, 160)
    : "Detail postingan produksi di PF Space.";
  const image = ogImage.value;
  return {
    title,
    link: [{ rel: "canonical", href: canonical.value }],
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "PF Space" },
      { property: "og:url", content: canonical.value },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      ...(image ? [{ property: "og:image", content: image }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image ? [{ name: "twitter:image", content: image }] : []),
    ],
  };
});

const shareUrl = computed(() => {
  if (typeof window === "undefined") return canonical.value;
  return window.location.href;
});

const handleShare = async () => {
  const fallbackCopy = () => {
    const ta = document.createElement("textarea");
    ta.value = shareUrl.value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (ok) {
      showToast("Tautan disalin ke clipboard");
      return true;
    }
    return false;
  };

  try {
    await navigator.clipboard.writeText(shareUrl.value);
    showToast("Tautan disalin ke clipboard");
  } catch (err) {
    const copied = fallbackCopy();
    if (copied) return;
    if (navigator.share) {
      await navigator
        .share({
          title: post.value?.judul || "PF Space",
          text: `Lihat update produksi ${post.value?.judul} di PF Space`,
          url: shareUrl.value,
        })
        .catch(() => {});
    } else {
      showToast("Gagal menyalin tautan", "error");
    }
  }
};

const shareTo = (platform) => {
  const url = encodeURIComponent(shareUrl.value);
  const text = encodeURIComponent(
    `Lihat update produksi ${post.value?.judul} di PF Space`,
  );
  const urls = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
  if (urls[platform]) {
    window.open(urls[platform], "_blank", "noopener,noreferrer");
  }
};

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) loadPost(slug);
  },
);

onMounted(() => {
  loadPost(route.params.slug);
});
</script>

<template>
  <PageLayout>
    <article class="max-w-5xl mx-auto px-4 md:px-8 mt-4 md:mt-8 mb-20">
      <!-- Back link -->
      <router-link
        to="/feed"
        class="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-brand-teal transition-colors mb-6"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        Feed Produksi
      </router-link>

      <!-- Loading -->
      <FeedPostDetailSkeleton v-if="isLoading && !post" />

      <!-- Error -->
      <div v-else-if="isError" class="max-w-3xl mx-auto">
        <FeedErrorState
          :message="errorMessage"
          @retry="loadPost(route.params.slug)"
        />
      </div>

      <template v-else-if="post">
        <!-- Hero cover -->
        <div
          class="relative aspect-[16/9] w-full overflow-hidden border-2 border-black shadow-brutal-md bg-stone-200"
        >
          <LazyImage
            :src="coverSrc"
            :alt="post.judul"
            immediate
            wrapper-class="w-full h-full"
            img-class="w-full h-full object-cover"
          >
            <template #fallback>
              <div
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal to-stone-800"
              >
                <Film class="w-16 h-16 md:w-24 md:h-24 text-brand-orange" />
              </div>
            </template>
          </LazyImage>
          <div
            v-if="post.isPinned"
            class="absolute top-3 left-3 z-10 -rotate-2 bg-brand-red text-white border-2 border-black shadow-brutal-xs px-3 py-1 flex items-center gap-1.5"
          >
            <Pin class="w-3.5 h-3.5" />
            <span class="font-heading text-[11px] tracking-widest uppercase"
              >Disematkan</span
            >
          </div>
        </div>

        <!-- Header -->
        <header class="max-w-3xl mx-auto mt-8 md:mt-10 text-center">
          <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
            <Badge
              v-if="post.category"
              variant="secondary"
              class="uppercase tracking-wide"
            >
              {{ post.category.namaKategori }}
            </Badge>
            <Badge
              v-if="tipeLabel"
              variant="outline"
              class="text-[10px] uppercase tracking-wide"
            >
              {{ tipeLabel }}
            </Badge>
            <router-link
              v-if="post.filmId"
              to="/archive"
              class="inline-flex items-center gap-1.5 bg-white text-stone-900 border-2 border-black shadow-brutal-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            >
              <Film class="w-3.5 h-3.5 text-brand-teal" />
              Terkait Film
            </router-link>
          </div>

          <h1
            class="font-display text-3xl md:text-5xl font-bold text-stone-900 leading-tight tracking-tight"
          >
            {{ post.judul }}
          </h1>

          <!-- Byline -->
          <div class="flex items-center justify-center gap-3 mt-6 md:mt-8">
            <router-link
              v-if="post.creator?.id"
              :to="`/p/${post.creator.id}`"
              class="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-black shadow-brutal-xs overflow-hidden bg-brand-orange flex items-center justify-center flex-shrink-0"
            >
              <img
                v-if="post.creator.image"
                :src="assetUrl(post.creator.image)"
                :alt="post.creator.name"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
              <span
                v-else
                class="font-display font-black text-stone-900 text-sm md:text-base"
              >
                {{ post.creator.name?.charAt(0) || "C" }}
              </span>
            </router-link>
            <div class="text-left">
              <router-link
                v-if="post.creator?.id"
                :to="`/p/${post.creator.id}`"
                class="block font-body font-bold text-stone-900 text-sm md:text-base hover:text-brand-teal transition-colors"
              >
                {{ post.creator.name || "Creator" }}
              </router-link>
              <p
                class="flex items-center gap-2 text-[11px] md:text-xs text-stone-500 font-body mt-0.5"
              >
                <span class="inline-flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  {{ dateLabel }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ readingTime }} menit baca
                </span>
              </p>
            </div>

            <!-- Owner / Moderator actions -->
            <div v-if="canEditOrDelete" class="ml-auto flex items-center gap-2">
              <router-link
                :to="`/feed/${post.postId}/edit`"
                class="inline-flex items-center gap-1.5 border-2 border-black bg-brand-teal text-white font-body text-xs font-bold uppercase tracking-wide px-3 py-1.5 shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <PenLine class="w-3.5 h-3.5" />
                Edit
              </router-link>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border-2 border-black bg-brand-red text-white font-body text-xs font-bold uppercase tracking-wide px-3 py-1.5 shadow-brutal-xs hover:bg-red-700 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                @click="showDeleteConfirm = true"
              >
                <Trash2 class="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        </header>

        <!-- Article body -->
        <div
          v-if="post.isiKonten"
          class="feed-prose max-w-2xl mx-auto mt-8 md:mt-12"
          v-html="post.isiKonten"
        ></div>

        <!-- Media (gallery / video / pdf) -->
        <div class="max-w-3xl mx-auto mt-10 md:mt-12">
          <FeedPostMedia
            :media="post.media"
            :cover="post.cover"
            :title="post.judul"
          />
        </div>

        <!-- Tags -->
        <div
          v-if="post.tags.length"
          class="max-w-2xl mx-auto mt-10 flex flex-wrap gap-2"
        >
          <router-link
            v-for="tag in post.tags"
            :key="tag"
            :to="`/feed?search=${encodeURIComponent(tag)}`"
            class="px-2.5 py-1 text-[11px] font-body font-bold text-brand-teal bg-white border-2 border-black shadow-brutal-xs hover:bg-brand-teal hover:text-white transition-colors"
          >
            #{{ tag }}
          </router-link>
        </div>

        <!-- Share -->
        <div class="max-w-2xl mx-auto mt-10 flex flex-wrap items-center gap-3">
          <span
            class="font-body text-xs font-bold uppercase tracking-widest text-stone-400"
            >Bagikan:</span
          >
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border-2 border-black bg-white text-stone-900 shadow-brutal-xs px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-brand-teal hover:text-white transition-all"
            @click="handleShare"
          >
            <Link2 class="w-3.5 h-3.5" />
            Salin Tautan
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border-2 border-black bg-[#25D366] text-white shadow-brutal-xs px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:brightness-95 transition-all"
            title="Bagikan ke WhatsApp"
            aria-label="Bagikan ke WhatsApp"
            @click="shareTo('whatsapp')"
          >
            <MessageCircle class="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border-2 border-black bg-stone-900 text-white shadow-brutal-xs px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-stone-700 transition-all"
            title="Bagikan ke X"
            aria-label="Bagikan ke X"
            @click="shareTo('twitter')"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-3.5 h-3.5 fill-current"
              aria-hidden="true"
            >
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              ></path>
            </svg>
            X
          </button>
        </div>

        <!-- Divider -->
        <div
          class="max-w-3xl mx-auto mt-12 md:mt-16 border-t-2 border-black/10"
        ></div>

        <!-- Comments -->
        <div class="max-w-3xl mx-auto mt-10 md:mt-12">
          <FeedPostComments
            :post-id="post.postId"
            :post-owner-id="post.creator?.id || null"
            :is-logged-in="isLoggedIn"
            :user="user"
            :can-moderate="canModerate"
          />
        </div>

        <!-- Related feed -->
        <RelatedFeed :post="post" />
      </template>
    </article>
  </PageLayout>

  <!-- Delete post confirm modal (at root level for proper rendering) -->
  <Teleport to="body">
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="showDeleteConfirm = false"
      ></div>
      <div
        class="relative w-full max-w-md bg-white border-2 border-black shadow-brutal animate-in fade-in zoom-in duration-200"
      >
        <div class="p-6">
          <div class="flex items-start gap-3 mb-4">
            <div
              class="w-11 h-11 shrink-0 bg-red-100 border-2 border-black flex items-center justify-center"
            >
              <Trash2 class="w-6 h-6 text-brand-red" />
            </div>
            <div>
              <h3 class="font-display text-xl font-bold mb-1 text-stone-900">
                Hapus Postingan
              </h3>
              <p class="text-sm text-stone-600">
                Apakah Anda yakin ingin menghapus postingan
                <strong>"{{ post?.judul }}"</strong>? Tindakan ini tidak dapat
                dibatalkan.
              </p>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              class="flex-1 border-2 border-black"
              @click="showDeleteConfirm = false"
              :disabled="isDeleting"
            >
              Batal
            </Button>
            <Button
              type="button"
              class="flex-1 bg-brand-red text-white border-2 border-black shadow-brutal hover:bg-red-700"
              @click="handleDelete"
              :disabled="isDeleting"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 mr-2 animate-spin" />
              <Trash2 v-else class="w-4 h-4 mr-2" />
              {{ isDeleting ? "Menghapus..." : "Ya, Hapus" }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.feed-prose {
  font-family: var(--font-body);
  color: var(--color-stone-700, #44403c);
  font-size: 1.0625rem;
  line-height: 1.85;
  font-weight: 400;
}

.feed-prose :deep(p) {
  margin: 0 0 1.5rem;
}

.feed-prose :deep(h1),
.feed-prose :deep(h2),
.feed-prose :deep(h3),
.feed-prose :deep(h4) {
  font-family: var(--font-display);
  color: var(--color-stone-900, #1c1917);
  font-weight: 700;
  line-height: 1.3;
  margin: 2.25rem 0 1rem;
  letter-spacing: -0.01em;
}

.feed-prose :deep(h1) {
  font-size: 1.875rem;
}

.feed-prose :deep(h2) {
  font-size: 1.625rem;
}

.feed-prose :deep(h3) {
  font-size: 1.375rem;
}

.feed-prose :deep(h4) {
  font-size: 1.125rem;
}

.feed-prose :deep(ul),
.feed-prose :deep(ol) {
  margin: 0 0 1.5rem;
  padding-left: 1.5rem;
}

.feed-prose :deep(ul) {
  list-style: disc;
}

.feed-prose :deep(ol) {
  list-style: decimal;
}

.feed-prose :deep(li) {
  margin-bottom: 0.5rem;
}

.feed-prose :deep(a) {
  color: var(--color-brand-teal, #265c5c);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.feed-prose :deep(strong) {
  color: var(--color-stone-900, #1c1917);
  font-weight: 700;
}

.feed-prose :deep(em) {
  font-style: italic;
}

.feed-prose :deep(blockquote) {
  border-left: 4px solid var(--color-brand-orange, #fdba74);
  padding: 0.25rem 0 0.25rem 1.25rem;
  margin: 0 0 1.5rem;
  font-style: italic;
  color: var(--color-stone-600, #57534e);
}

.feed-prose :deep(img) {
  max-width: 100%;
  height: auto;
  border: 2px solid var(--color-stone-900, #1c1917);
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
  margin: 1.5rem 0;
}

.feed-prose :deep(figure) {
  margin: 1.5rem 0;
}

.feed-prose :deep(figcaption) {
  font-size: 0.8125rem;
  color: var(--color-stone-500, #78716c);
  text-align: center;
  margin-top: 0.5rem;
}

.feed-prose :deep(pre) {
  background: var(--color-stone-900, #1c1917);
  color: #f5f5f4;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
}

.feed-prose :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.875em;
  background: var(--color-stone-100, #f5f5f4);
  padding: 0.15em 0.35em;
}

.feed-prose :deep(pre code) {
  background: transparent;
  padding: 0;
}

.feed-prose :deep(hr) {
  border: 0;
  border-top: 2px solid var(--color-stone-200, #e7e5e4);
  margin: 2.5rem 0;
}
</style>
