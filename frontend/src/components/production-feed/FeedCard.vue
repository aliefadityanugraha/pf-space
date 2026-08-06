<script setup>
import { computed } from 'vue'
import { Pin, Film, MessageCircle, Calendar, User as UserIcon, PenLine } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { assetUrl, formatDate } from '@/lib/format'
import { useAuth } from '@/composables/useAuth'
import LazyImage from '@/components/LazyImage.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const imageSrc = computed(() => assetUrl(props.post.cover))

const dateLabel = computed(() => {
  const date = props.post.publishedAt || props.post.createdAt
  return date ? formatDate(date) : ''
})

const previewText = computed(() => {
  const text = String(props.post.isiKonten || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text
})

const TIPE_LABELS = {
  progress: 'Progress',
  behind_the_scenes: 'BTS',
  casting: 'Casting',
  announcement: 'Pengumuman',
  wrap: 'Wrap'
}

const tipeLabel = computed(() => TIPE_LABELS[props.post.tipe] || '')

const { user } = useAuth()
const isOwner = computed(
  () => !!user.value && !!props.post.creator?.id && user.value.id === props.post.creator.id
)
</script>

<template>
  <Card
    :class="cn(
      'overflow-hidden bg-white border-2 border-black shadow-brutal transition-all hover:shadow-brutal-md',
      post.isPinned ? 'border-brand-orange' : ''
    )"
  >
    <!-- Cover -->
    <div class="relative bg-stone-200 border-b-2 border-black overflow-hidden">
      <div class="aspect-[16/9] w-full">
        <LazyImage
          :src="imageSrc"
          :alt="post.judul"
          wrapper-class="w-full h-full"
          img-class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>

      <!-- Pinned badge (distinct treatment for pinned posts) -->
      <div
        v-if="post.isPinned"
        class="absolute top-3 left-3 z-10 -rotate-2 bg-brand-red text-white border-2 border-black shadow-brutal-xs px-3 py-1 flex items-center gap-1.5"
      >
        <Pin class="w-3.5 h-3.5" />
        <span class="font-heading text-[11px] tracking-widest uppercase">Disematkan</span>
      </div>

      <!-- Film badge -->
      <div
        v-if="post.filmId"
        class="absolute bottom-3 left-3 z-10 bg-white text-stone-900 border-2 border-black shadow-brutal-xs px-2.5 py-1 flex items-center gap-1.5"
      >
        <Film class="w-3.5 h-3.5 text-brand-teal" />
        <span class="font-body text-[11px] font-bold uppercase tracking-wide">Terkait Film</span>
      </div>
    </div>

    <!-- Body -->
    <CardContent class="p-5 md:p-6">
      <!-- Meta row: category + type + date -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <Badge v-if="post.category" variant="secondary" class="uppercase tracking-wide">
          {{ post.category.namaKategori }}
        </Badge>
        <Badge v-if="tipeLabel" variant="outline" class="text-[10px] uppercase tracking-wide">
          {{ tipeLabel }}
        </Badge>
        <span
          v-if="dateLabel"
          class="ml-auto flex items-center gap-1.5 text-xs text-stone-500 font-body"
        >
          <Calendar class="w-3.5 h-3.5" />
          {{ dateLabel }}
        </span>
      </div>

      <router-link
        :to="`/feed/${props.post.slug || props.post.postId}`"
        class="block group/title"
      >
        <h3 class="font-display text-xl md:text-2xl font-bold text-stone-900 leading-snug mb-2 group-hover/title:text-brand-teal transition-colors">
          {{ post.judul }}
        </h3>
      </router-link>

      <p
        v-if="previewText"
        class="text-sm md:text-[15px] text-stone-600 font-body leading-relaxed line-clamp-3 mb-4"
      >
        {{ previewText }}
      </p>

      <!-- Tags -->
      <div v-if="post.tags.length" class="flex flex-wrap gap-1.5 mb-4">
        <Badge v-for="tag in post.tags" :key="tag" variant="outline" class="text-[11px] bg-white">
          #{{ tag }}
        </Badge>
      </div>

      <!-- Footer: creator + comment count -->
      <div class="flex items-center justify-between gap-3 border-t-2 border-stone-100 pt-4">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="w-8 h-8 md:w-9 md:h-9 border-2 border-black shadow-brutal-xs overflow-hidden bg-brand-teal flex-shrink-0 flex items-center justify-center"
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
          <span class="font-body text-sm font-bold text-stone-900 truncate">
            {{ post.creator?.name || 'Creator' }}
          </span>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <router-link
            v-if="isOwner"
            :to="`/feed/${props.post.postId}/edit`"
            class="inline-flex items-center gap-1.5 border-2 border-black bg-brand-teal text-white font-body text-xs font-bold uppercase tracking-wide px-2.5 py-1 shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm transition-all"
          >
            <PenLine class="w-3.5 h-3.5" />
            Edit
          </router-link>

          <div v-if="post.commentCount !== null" data-testid="comment-count" class="flex items-center gap-1.5 text-stone-600 shrink-0">
            <MessageCircle class="w-4 h-4" />
            <span class="font-body text-sm font-semibold">{{ post.commentCount }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
