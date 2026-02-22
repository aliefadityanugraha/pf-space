import { ref, readonly } from 'vue'

const isLoading = ref(false)
const progress = ref(0)
let interval = null

export function useLoading() {
  const start = () => {
    isLoading.value = true
    progress.value = 10
    
    if (interval) clearInterval(interval)
    
    interval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 5
      }
    }, 200)
  }

  const finish = () => {
    progress.value = 100
    setTimeout(() => {
      isLoading.value = false
      setTimeout(() => {
        progress.value = 0
      }, 200)
    }, 200)
    if (interval) clearInterval(interval)
  }

  return {
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    start,
    finish
  }
}
