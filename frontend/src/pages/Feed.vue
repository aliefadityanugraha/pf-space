<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Newspaper, Rss, Loader2, PenLine } from "lucide-vue-next";
import { useIntersectionObserver } from "@vueuse/core";
import { useHead } from "@unhead/vue";
import PageLayout from "@/components/PageLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import { Button } from "@/components/ui/button";
import FeedCard from "@/components/production-feed/FeedCard.vue";
import FeedCardSkeleton from "@/components/production-feed/FeedCardSkeleton.vue";
import FeedErrorState from "@/components/production-feed/FeedErrorState.vue";
import { useProductionFeed } from "@/modules/production-feed/useProductionFeed";
import { useAuth } from "@/composables/useAuth";

useHead({
  title: "Feed Produksi - PF Space",
  meta: [
    {
      name: "description",
      content:
        "Ikuti perkembangan produksi film dari para kreator di PF Space.",
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "PF Space" },
    { property: "og:title", content: "Feed Produksi - PF Space" },
    {
      property: "og:description",
      content:
        "Ikuti perkembangan produksi film dari para kreator di PF Space.",
    },
    { name: "twitter:card", content: "summary" },
  ],
});

const { isCreator } = useAuth();

const {
  posts,
  isLoading,
  isLoadingMore,
  isError,
  error,
  hasMore,
  fetchFeed,
  loadMore,
  retry,
  restoreCache,
} = useProductionFeed({ limit: 10 });

const errorMessage = computed(
  () =>
    error.value?.message || "Gagal memuat feed produksi. Silakan coba lagi.",
);

const sentinel = ref(null);
const { stop } = useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (
      entry.isIntersecting &&
      hasMore.value &&
      !isLoading.value &&
      !isLoadingMore.value
    ) {
      loadMore();
    }
  },
  { rootMargin: "200px" },
);

onMounted(() => {
  restoreCache();
  fetchFeed();
});

onUnmounted(() => stop());
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-10 mb-16">
      <PageHeader
        title="Feed Produksi"
        description="Ikuti perkembangan terbaru dari para kreator — progress, behind the scenes, casting, hingga wrap."
      >
        <template #extra>
          <div class="mt-3 flex items-center gap-3">
            <span
              class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400"
            >
              <Rss class="w-3.5 h-3.5" />
              Semua Postingan
            </span>
            <router-link v-if="isCreator" to="/feed/create">
              <Button
                class="bg-brand-orange text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-9 px-3 text-xs gap-1.5"
              >
                <PenLine class="w-3.5 h-3.5" />
                Buat Post
              </Button>
            </router-link>
          </div>
        </template>
      </PageHeader>

      <!-- Initial loading -->
      <div
        v-if="isLoading && posts.length === 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
      >
        <FeedCardSkeleton v-for="n in 6" :key="n" />
      </div>

      <!-- Initial error -->
      <div v-else-if="isError && posts.length === 0" class="max-w-3xl mx-auto">
        <FeedErrorState :message="errorMessage" @retry="retry" />
      </div>

      <!-- Empty -->
      <EmptyState
        v-else-if="posts.length === 0"
        :icon="Newspaper"
        title="Belum Ada Postingan"
        description="Feed produksi masih kosong. Nantikan update pertama dari para kreator."
        variant="dashed"
      />

      <!-- Feed list (gallery grid) -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
      >
        <FeedCard v-for="post in posts" :key="post.postId" :post="post" />

        <!-- Infinite scroll sentinel -->
        <div
          ref="sentinel"
          class="flex items-center justify-center py-6 min-h-16 col-span-full"
        >
          <Loader2
            v-if="isLoadingMore"
            class="w-6 h-6 animate-spin text-brand-teal"
          />
          <p
            v-else-if="!hasMore"
            class="font-body text-xs uppercase tracking-widest text-stone-400 text-center"
          >
            — Akhir Feed —
          </p>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
