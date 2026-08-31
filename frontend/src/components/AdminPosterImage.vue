<script setup>
import { ref, computed, watch } from 'vue'
import { Film } from 'lucide-vue-next'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: 'w-full h-full object-cover'
  },
  fallbackText: {
    type: String,
    default: 'NO POSTER'
  },
  showFallbackText: {
    type: Boolean,
    default: true
  }
})

const hasError = ref(false)

const computedSrc = computed(() => {
  if (!props.src || hasError.value) return null
  return assetUrl(props.src)
})

watch(() => props.src, () => {
  hasError.value = false
})

const onError = () => {
  hasError.value = true
}
</script>

<template>
  <div :class="['relative overflow-hidden bg-stone-900 border-2 border-black dark:border-stone-100 flex-shrink-0 shadow-brutal-xs select-none flex items-center justify-center', className]">
    <img 
      v-if="computedSrc" 
      :src="computedSrc" 
      :alt="alt || 'Poster Film'"
      @error="onError"
      :class="imageClass"
    />
    <div 
      v-else 
      class="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 p-1 text-center leading-none"
    >
      <Film class="w-5 h-5 mb-1 opacity-70 text-stone-400" />
      <span v-if="showFallbackText" class="text-[8px] font-mono font-bold uppercase tracking-tight text-stone-400 block">
        {{ fallbackText }}
      </span>
    </div>
  </div>
</template>
