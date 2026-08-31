<script setup>
import { computed, ref, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Film, Play, User, ThumbsUp, MessageCircle, Clapperboard, Clock, CheckCircle, XCircle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  archive: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'portrait',
    validator: (value) => ['portrait', 'landscape'].includes(value)
  },
  aspectRatio: {
    type: String,
    default: ''
  },
  showPlayOverlay: {
    type: Boolean,
    default: true
  },
  imageSrc: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  },
  contentClass: {
    type: String,
    default: ''
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showStats: {
    type: Boolean,
    default: true
  },
  customBadge: {
    type: String,
    default: ''
  },
  stackedBadge: {
    type: Boolean,
    default: false
  },
  noBorder: {
    type: Boolean,
    default: false
  }
})

const imageError = ref(false)

const aspectClass = computed(() => {
  if (props.aspectRatio) return props.aspectRatio
  return props.variant === 'landscape' ? 'aspect-[16/9]' : 'aspect-[3/4]'
})

const computeImage = () => {
  const raw = props.imageSrc || props.archive?.gambar_poster || props.archive?.poster_url || props.archive?.poster_image || props.archive?.image || props.archive?.thumbnail_url || props.archive?.cover_url
  if (!raw) return ''
  return assetUrl(raw)
}

const currentImageSrc = computed(() => {
  if (imageError.value) return 'fallback'
  return computeImage()
})

watch(
  () => [props.imageSrc, props.archive?.gambar_poster, props.archive?.poster_url, props.archive?.poster_image, props.archive?.image, props.archive?.thumbnail_url, props.archive?.cover_url],
  () => {
    imageError.value = false
  }
)

const handleImageError = () => {
  imageError.value = true
}

const displayTitle = computed(() => {
  return props.title || props.archive?.judul || props.archive?.title
})

const displaySubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (props.archive?.creator?.name) return props.archive.creator.name
  if (props.archive?.category?.nama_kategori) return props.archive.category.nama_kategori
  return ''
})

const statusColors = {
  pending: "bg-amber-400 text-stone-950 border-black dark:border-stone-300 shadow-brutal-xs font-bold",
  published: "bg-brand-teal text-white border-black dark:border-stone-300 shadow-brutal-xs font-bold",
  rejected: "bg-brand-red text-white border-black dark:border-stone-300 shadow-brutal-xs font-bold",
};

const statusLabels = {
  pending: "Menunggu",
  published: "Dipublikasi",
  rejected: "Ditolak",
};

const titleRef = ref(null)
const scrollDist = ref(0)
const isHovered = ref(false)

const handleMouseEnter = () => {
  isHovered.value = true
  if (titleRef.value) {
    const el = titleRef.value
    const parent = el.parentElement
    if (parent) {
      const diff = el.scrollWidth - parent.clientWidth
      if (diff > 0) {
        scrollDist.value = diff
        el.style.setProperty('--scroll-dist', `-${diff}px`)
        const duration = Math.max(1.2, diff / 40)
        el.style.setProperty('--scroll-duration', `${duration}s`)
      } else {
        scrollDist.value = 0
        el.style.setProperty('--scroll-dist', '0px')
      }
    }
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>

<template>
  <Card 
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    :class="cn(
      'overflow-hidden group bg-card text-card-foreground border-2 border-border shadow-brutal transition-all',
      'hover:shadow-brutal-sm', 
      className
    )"
  >
    <!-- Image Section -->
    <div :class="[aspectClass, 'bg-stone-900 relative overflow-hidden border-b-2 border-border']">
      <!-- Fallback pure HTML/CSS dark background placeholder with Film icon and text -->
      <div v-if="!currentImageSrc || currentImageSrc === 'fallback'" class="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 p-4 select-none border border-stone-800">
        <Film class="w-10 h-10 md:w-12 md:h-12 mb-2 stroke-[1.5] text-stone-400" />
        <span class="text-[9px] sm:text-xs font-mono font-black uppercase tracking-widest text-center text-stone-400">NO POSTER AVAILABLE</span>
      </div>

      <!-- Actual Image -->
      <img 
        v-else
        :src="currentImageSrc" 
        :alt="displayTitle"
        @error="handleImageError"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <!-- Hover Overlay (Play) -->
      <div v-if="showPlayOverlay" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <Play class="w-12 h-12 text-white" />
      </div>

      <!-- Overlays/Badges Slot -->
      <slot name="overlay">
        <Badge v-if="archive?.tahun_karya" class="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20">
          {{ archive.tahun_karya }}
        </Badge>
        <Badge v-if="archive?.category?.nama_kategori" class="absolute top-2 right-2 bg-brand-teal text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black shadow-brutal-xs">
          {{ archive.category.nama_kategori }}
        </Badge>
      </slot>
    </div>

    <!-- Content Section -->
    <CardContent :class="cn('p-2.5 sm:p-3 md:p-4', contentClass)">
      <slot name="content">
        <!-- Title -->
        <div class="overflow-hidden w-full relative">
          <h3 
            ref="titleRef"
            class="font-bold text-xs sm:text-sm md:text-base text-foreground mb-0.5 leading-tight uppercase font-display whitespace-nowrap block w-fit"
            :style="{
              transform: isHovered && scrollDist > 0 ? 'translateX(var(--scroll-dist))' : 'translateX(0)',
              transition: isHovered && scrollDist > 0 ? 'transform var(--scroll-duration, 2s) ease-in-out' : 'transform 0.5s ease-out'
            }"
          >
            {{ displayTitle }}
          </h3>
        </div>
        
        <!-- Creator subtext with Avatar fallback -->
        <p v-if="displaySubtitle" class="text-[10px] sm:text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5 z-10 relative min-w-0">
          <slot name="subtitle-icon">
            <img 
              v-if="archive?.creator?.image" 
              :src="assetUrl(archive.creator.image)" 
              class="w-3.5 h-3.5 rounded-full object-cover border border-stone-300 dark:border-stone-600 shrink-0"
            />
            <User v-else class="w-3.5 h-3.5 text-stone-400 shrink-0" />
          </slot>
          <router-link 
            v-if="archive?.creator?.id"
            :to="`/creator/${archive.creator.id}`"
            class="hover:text-brand-teal hover:underline truncate block flex-1 font-medium text-stone-600 dark:text-stone-300 cursor-pointer"
            @click.stop
          >
            {{ displaySubtitle }}
          </router-link>
          <span v-else class="truncate block flex-1 font-medium text-stone-600 dark:text-stone-300">{{ displaySubtitle }}</span>
        </p>

        <!-- Divider & Stats footer -->
        <slot name="extra-content">
          <div v-if="showStats || (showStatus && archive?.status) || customBadge" class="mt-2 pt-2 border-t border-dashed border-stone-300 dark:border-stone-600">
            <template v-if="stackedBadge">
              <!-- Top Row: Likes and Comments count -->
              <div v-if="showStats" class="flex items-center gap-2 mb-1.5">
                <span class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono">
                  <ThumbsUp class="w-3.5 h-3.5 text-brand-red fill-current" />
                  {{ archive?.vote_count || 0 }}
                </span>
                <span class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono">
                  <MessageCircle class="w-3.5 h-3.5 text-brand-orange" />
                  {{ archive?.comment_count || 0 }}
                </span>
              </div>

              <!-- Bottom Row: Custom Role Badge or Status Badge (Spacious & Full Width) -->
              <div v-if="customBadge" class="w-full">
                <Badge
                  class="w-full text-[9px] px-2 py-0.5 rounded-none border border-black dark:border-stone-300 font-bold uppercase tracking-wider bg-brand-teal text-white shadow-brutal-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  style="color: #ffffff !important;"
                >
                  <Clapperboard class="w-2.5 h-2.5 text-white shrink-0" />
                  <span class="truncate font-bold">{{ customBadge }}</span>
                </Badge>
              </div>
              <div v-else-if="showStatus && archive?.status" class="w-full">
                <Badge
                  :class="[
                    'w-full text-[9px] px-2 py-0.5 rounded-none border font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 whitespace-nowrap',
                    statusColors[archive.status] || 'bg-stone-100 text-stone-900 border-black',
                  ]"
                >
                  <Clock v-if="archive.status === 'pending'" class="w-2.5 h-2.5 shrink-0" />
                  <CheckCircle v-else-if="archive.status === 'published'" class="w-2.5 h-2.5 shrink-0 text-white" />
                  <XCircle v-else-if="archive.status === 'rejected'" class="w-2.5 h-2.5 shrink-0 text-white" />
                  <span>{{ statusLabels[archive.status] || archive.status }}</span>
                </Badge>
              </div>
            </template>

            <template v-else>
              <!-- Standard side-by-side (for large poster / 3-column view) -->
              <div class="flex flex-wrap items-center justify-between gap-1.5">
                <!-- Likes and Comments count on the left -->
                <div v-if="showStats" class="flex items-center gap-2 shrink-0">
                  <span class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono">
                    <ThumbsUp class="w-3.5 h-3.5 text-brand-red fill-current" />
                    {{ archive?.vote_count || 0 }}
                  </span>
                  <span class="flex items-center gap-1 text-[10px] sm:text-xs text-stone-700 dark:text-stone-300 font-bold font-mono">
                    <MessageCircle class="w-3.5 h-3.5 text-brand-orange" />
                    {{ archive?.comment_count || 0 }}
                  </span>
                </div>
                <div v-else class="flex-1"></div>

                <!-- Custom Role Badge or Status Badge on the right -->
                <Badge
                  v-if="customBadge"
                  class="text-[9px] px-2 py-0.5 rounded-none border border-black dark:border-stone-300 font-bold uppercase tracking-wider w-fit shrink-0 bg-brand-teal text-white shadow-brutal-xs flex items-center gap-1 min-w-0 whitespace-nowrap"
                  style="color: #ffffff !important;"
                >
                  <Clapperboard class="w-2.5 h-2.5 text-white shrink-0" />
                  <span class="truncate">{{ customBadge }}</span>
                </Badge>
                <Badge
                  v-else-if="showStatus && archive?.status"
                  :class="[
                    'text-[9px] px-2 py-0.5 rounded-none border font-bold uppercase tracking-wider w-fit shrink-0 whitespace-nowrap flex items-center gap-1',
                    statusColors[archive.status] || 'bg-stone-100 text-stone-900 border-black',
                  ]"
                >
                  <Clock v-if="archive.status === 'pending'" class="w-2.5 h-2.5 shrink-0" />
                  <CheckCircle v-else-if="archive.status === 'published'" class="w-2.5 h-2.5 shrink-0 text-white" />
                  <XCircle v-else-if="archive.status === 'rejected'" class="w-2.5 h-2.5 shrink-0 text-white" />
                  <span>{{ statusLabels[archive.status] || archive.status }}</span>
                </Badge>
              </div>
            </template>
          </div>
        </slot>
      </slot>
      
      <!-- Footer/Actions Slot -->
      <div v-if="$slots.actions" class="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t-2 border-border flex gap-1.5 sm:gap-2">
        <slot name="actions"></slot>
      </div>
    </CardContent>
  </Card>
</template>
