<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Film } from 'lucide-vue-next'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  immediate: { type: Boolean, default: false },
  wrapperClass: { type: String, default: '' },
  imgClass: { type: String, default: 'w-full h-full object-cover' },
  referrerpolicy: { type: String, default: 'no-referrer' },
  sizes: { type: String, default: '' },
  srcset: { type: String, default: '' }
})

const emit = defineEmits(['error'])

const el = ref(null)
const inView = ref(false)
const failed = ref(false)
let observer = null

const shouldLoad = computed(
  () => !!props.src && !failed.value && (props.immediate || inView.value)
)

onMounted(() => {
  if (!props.src || props.immediate || typeof IntersectionObserver === 'undefined') {
    inView.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true
        observer?.disconnect()
      }
    },
    { rootMargin: '250px' }
  )
  if (el.value) observer.observe(el.value)
})

onUnmounted(() => observer?.disconnect())

const handleError = () => {
  failed.value = true
  emit('error')
}
</script>

<template>
  <div ref="el" :class="['relative overflow-hidden bg-stone-200', wrapperClass]">
    <div v-if="src && !failed && !shouldLoad" class="skeleton-shimmer" aria-hidden="true"></div>

    <img
      v-if="shouldLoad"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :srcset="srcset"
      :referrerpolicy="referrerpolicy"
      decoding="async"
      loading="lazy"
      class="absolute inset-0"
      :class="imgClass"
      @error="handleError"
    />

    <div
      v-else-if="failed || !src"
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-teal to-stone-800"
    >
      <slot name="fallback">
        <Film class="w-10 h-10 text-brand-orange" />
      </slot>
    </div>
  </div>
</template>
