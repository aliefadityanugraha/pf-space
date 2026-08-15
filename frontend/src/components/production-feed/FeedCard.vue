<script setup>
import { ref, computed } from "vue";
import {
  Pin,
  Film,
  MessageCircle,
  Calendar,
  User as UserIcon,
  PenLine,
  Rss,
  Sparkles,
  ArrowUpRight,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { assetUrl, formatDate } from "@/lib/format";
import { useAuth } from "@/composables/useAuth";
import LazyImage from "@/components/LazyImage.vue";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const imageSrc = computed(() =>
  props.post.cover ? assetUrl(props.post.cover) : ""
);

const dateLabel = computed(() => {
  const date = props.post.publishedAt || props.post.createdAt;
  return date ? formatDate(date) : "";
});

const previewText = computed(() => {
  const text = String(props.post.isiKonten || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
});

const TIPE_LABELS = {
  progress: "Progress Produksi",
  behind_the_scenes: "BTS / Dibalik Layar",
  casting: "Info Casting",
  announcement: "Pengumuman",
  wrap: "Wrap Produksi",
};

const tipeLabel = computed(() => TIPE_LABELS[props.post.tipe] || "");

const { user } = useAuth();
const isOwner = computed(
  () =>
    !!user.value &&
    !!props.post.creator?.id &&
    user.value.id === props.post.creator.id
);
</script>

<template>
  <Card
    :class="
      cn(
        'group h-full flex flex-col justify-between overflow-hidden bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300',
        post.isPinned ? 'border-brand-orange dark:border-brand-orange ring-2 ring-brand-orange/40' : ''
      )
    "
  >
    <div>
      <!-- Cover Header -->
      <div
        class="relative bg-stone-100 dark:bg-stone-800 border-b-2 border-black dark:border-stone-100 overflow-hidden"
      >
        <!-- If cover exists -->
        <div v-if="props.post.cover" class="aspect-[16/9] w-full overflow-hidden">
          <LazyImage
            :src="imageSrc"
            :alt="post.judul"
            wrapper-class="w-full h-full"
            img-class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <!-- Stylized Neobrutalist Placeholder cover if no media -->
        <div
          v-else
          class="aspect-[16/9] w-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 p-6 flex flex-col items-center justify-center relative overflow-hidden group/noimg"
        >
          <!-- Background Decorative Grid -->
          <div
            class="absolute inset-0 opacity-10 pointer-events-none"
            style="
              background-image: radial-gradient(#ffffff 1px, transparent 1px);
              background-size: 12px 12px;
            "
          ></div>

          <div
            class="w-12 h-12 rounded-full bg-brand-teal/20 border-2 border-brand-teal flex items-center justify-center text-brand-teal mb-2 group-hover/noimg:scale-110 transition-transform"
          >
            <Rss class="w-6 h-6" />
          </div>
          <span
            class="font-mono text-[10px] uppercase font-bold tracking-widest text-stone-400"
          >
            Catatan Produksi
          </span>
        </div>

        <!-- Pinned badge -->
        <div
          v-if="post.isPinned"
          class="absolute top-3 left-3 z-10 -rotate-2 bg-brand-red text-white border-2 border-black shadow-brutal-xs px-2.5 py-0.5 flex items-center gap-1.5"
        >
          <Pin class="w-3.5 h-3.5 fill-current" />
          <span class="font-heading text-[10px] font-bold tracking-widest uppercase"
            >Disematkan</span
          >
        </div>

        <!-- Film Connection badge -->
        <div
          v-if="post.filmId"
          class="absolute bottom-3 left-3 z-10 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs px-2.5 py-0.5 flex items-center gap-1.5"
        >
          <Film class="w-3.5 h-3.5 text-brand-teal" />
          <span class="font-body text-[10px] font-bold uppercase tracking-wider"
            >Terkait Film</span
          >
        </div>
      </div>

      <!-- Body -->
      <CardContent class="p-4 sm:p-5 flex-1">
        <!-- Meta row: category + type + date -->
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            v-if="post.category"
            class="bg-brand-teal text-white border border-black text-[10px] uppercase font-bold tracking-wider"
          >
            {{ post.category.namaKategori }}
          </Badge>
          <Badge
            v-if="tipeLabel"
            variant="outline"
            class="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600"
          >
            {{ tipeLabel }}
          </Badge>
          <span
            v-if="dateLabel"
            class="ml-auto flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono font-semibold"
          >
            <Calendar class="w-3 h-3" />
            {{ dateLabel }}
          </span>
        </div>

        <!-- Title -->
        <router-link
          :to="`/feed/${props.post.slug || props.post.postId}`"
          class="block group/title mb-2"
        >
          <h3
            class="font-display text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug group-hover/title:text-brand-teal transition-colors line-clamp-2"
          >
            {{ post.judul }}
          </h3>
        </router-link>

        <!-- Preview Text -->
        <p
          v-if="previewText"
          class="text-xs md:text-sm text-stone-600 dark:text-stone-300 font-body leading-relaxed line-clamp-3 mb-4"
        >
          {{ previewText }}
        </p>

        <!-- Tags -->
        <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-1 mb-4">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="text-[10px] font-mono font-semibold px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700"
          >
            #{{ tag }}
          </span>
        </div>
      </CardContent>
    </div>

    <!-- Footer: Creator Info & Comments (Pinned to bottom) -->
    <div class="px-4 sm:px-5 pb-4">
      <div
        class="flex items-center justify-between gap-3 border-t-2 border-stone-100 dark:border-stone-800 pt-3"
      >
        <!-- Author Avatar & Name -->
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="w-7 h-7 md:w-8 md:h-8 border-2 border-black dark:border-stone-100 shadow-brutal-xs overflow-hidden bg-brand-teal shrink-0 flex items-center justify-center rounded-full"
          >
            <img
              v-if="post.creator?.image"
              :src="assetUrl(post.creator.image)"
              :alt="post.creator.name"
              loading="lazy"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover"
            />
            <UserIcon v-else class="w-4 h-4 text-white" />
          </div>
          <span
            class="font-body text-xs font-bold text-stone-900 dark:text-stone-100 truncate"
          >
            {{ post.creator?.name || "Kreator PF Space" }}
          </span>
        </div>

        <!-- Right Action / Comment count -->
        <div class="flex items-center gap-2 shrink-0">
          <router-link
            v-if="isOwner"
            :to="`/feed/${props.post.postId}/edit`"
            class="inline-flex items-center gap-1 border-2 border-black bg-brand-teal text-white font-body text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <PenLine class="w-3 h-3" />
            Edit
          </router-link>

          <router-link
            :to="`/feed/${props.post.slug || props.post.postId}`"
            class="flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-brand-teal dark:hover:text-brand-teal transition-colors text-xs font-semibold px-2 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
          >
            <MessageCircle class="w-3.5 h-3.5" />
            <span>{{ post.commentCount || 0 }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </Card>
</template>
