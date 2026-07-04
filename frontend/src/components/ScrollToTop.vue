<script setup>
import { computed } from 'vue'
import { ArrowUp } from 'lucide-vue-next'
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()
const isVisible = computed(() => y.value > 400)

// Premium Easing Function (Ease In Out Cubic)
const easeInOutCubic = (t) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const scrollToTop = () => {
  const startPosition = window.pageYOffset || document.documentElement.scrollTop
  const duration = 800 // Durasi scroll (milidetik)
  let startTime = null

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    
    // Kalkulasi jarak menggunakan fungsi Easing
    const ease = easeInOutCubic(progress)
    window.scrollTo(0, startPosition * (1 - ease))
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}
</script>

<template>
  <transition name="fade">
    <button
      v-show="isVisible"
      @click="scrollToTop"
      class="fixed bottom-24 right-6 z-[90] p-3 bg-brand-teal text-white border-2 border-stone-900 shadow-brutal flex items-center justify-center hover:bg-teal-600 transition-all hover:-translate-y-1 hover:shadow-brutal-lg focus:outline-none cursor-pointer"
      title="Kembali ke Atas"
    >
      <ArrowUp class="w-6 h-6 stroke-[3]" />
    </button>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
