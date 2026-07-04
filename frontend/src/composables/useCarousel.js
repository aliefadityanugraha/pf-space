import { ref, onMounted, onUnmounted, unref, watch } from 'vue'

export function useCarousel(itemsRef, interval = 5000) {
  const activeIndex = ref(0)
  const direction = ref('right')
  let timer = null

  const getItems = () => unref(itemsRef)

  const nextSlide = () => {
    const items = getItems()
    if (!items || items.length === 0) return
    direction.value = 'right'
    activeIndex.value = (activeIndex.value + 1) % items.length
  }

  const prevSlide = () => {
    const items = getItems()
    if (!items || items.length === 0) return
    direction.value = 'left'
    activeIndex.value = (activeIndex.value - 1 + items.length) % items.length
  }

  const goToSlide = (index) => {
    direction.value = index > activeIndex.value ? 'right' : 'left'
    activeIndex.value = index
    resetTimer()
  }

  const startTimer = () => {
    stopTimer()
    const items = getItems()
    if (items && items.length > 1) {
      timer = setInterval(nextSlide, interval)
    }
  }

  const stopTimer = () => {
    if (timer) clearInterval(timer)
  }

  const resetTimer = () => {
    stopTimer()
    startTimer()
  }

  // Watch for changes in items to manage timer
  watch(itemsRef, (newItems) => {
    const count = newItems ? newItems.length : 0
    
    if (count > 1) startTimer()
    else stopTimer()
    
    // Reset index if out of bounds
    if (activeIndex.value >= count && count > 0) {
      activeIndex.value = 0
    }
  }, { deep: true })

  onMounted(() => {
    const items = getItems()
    if (items && items.length > 1) {
      startTimer()
    }
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    activeIndex,
    direction,
    nextSlide,
    prevSlide,
    goToSlide,
    startTimer,
    stopTimer,
    resetTimer
  }
}
