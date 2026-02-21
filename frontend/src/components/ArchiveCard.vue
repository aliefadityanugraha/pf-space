<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Film, Play } from 'lucide-vue-next'
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
  }
})



const aspectClass = computed(() => {
  if (props.aspectRatio) return props.aspectRatio
  return props.variant === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'
})

const displayImage = computed(() => {
  return props.imageSrc || props.archive?.gambar_poster || props.archive?.image
})

const imageSrc = computed(() => assetUrl(displayImage.value))

const displayTitle = computed(() => {
  return props.title || props.archive?.judul || props.archive?.title
})

const displaySubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (props.archive?.creator?.name) return props.archive.creator.name
  if (props.archive?.category?.nama_kategori) return props.archive.category.nama_kategori
  return ''
})
</script>

<template>
  <Card 
    :class="cn(
      'overflow-hidden group bg-white border-2 border-black shadow-brutal transition-all',
      'hover:shadow-brutal-sm', 
      className
    )"
  >
    <!-- Image Section -->
    <div :class="[aspectClass, 'bg-stone-200 relative overflow-hidden border-b-2 border-black']">
      <img 
        v-if="imageSrc" 
        :src="imageSrc" 
        :alt="displayTitle"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <Film class="w-12 h-12 text-stone-400" />
      </div>

      <!-- Overlays/Badges Slot -->
      <slot name="overlay"></slot>
      
      <!-- Hover Overlay (Play) -->
      <div v-if="showPlayOverlay" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Play class="w-12 h-12 text-white" />
      </div>
    </div>

    <!-- Content Section -->
    <CardContent :class="cn('p-3 md:p-4', contentClass)">
      <slot name="content">
        <h3 class="font-bold text-sm md:text-base text-stone-900 line-clamp-1 mb-1">{{ displayTitle }}</h3>
        <p v-if="displaySubtitle" class="text-[10px] md:text-xs text-stone-500 mb-1 flex items-center gap-1 z-10 relative">
          <slot name="subtitle-icon"></slot>
          <router-link 
            v-if="archive?.creator?.id && displaySubtitle === archive.creator.name"
            :to="`/creator/${archive.creator.id}`"
            class="hover:text-brand-teal hover:underline"
            @click.stop
          >
            {{ displaySubtitle }}
          </router-link>
          <span v-else>{{ displaySubtitle }}</span>
        </p>
        <slot name="extra-content"></slot>
      </slot>
      
      <!-- Footer/Actions Slot -->
      <div v-if="$slots.actions" class="mt-4 pt-4 border-t-2 border-stone-100 flex gap-2">
        <slot name="actions"></slot>
      </div>
    </CardContent>
  </Card>
</template>
