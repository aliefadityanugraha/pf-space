import { ref, readonly } from 'vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress with custom settings
NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 400 });

// Fallback legacy state variables (in case other components depend on them)
const isLoading = ref(false)
const progress = ref(0)

export function useLoading() {
  const start = () => {
    isLoading.value = true
    progress.value = 10
    NProgress.start()
  }

  const finish = () => {
    progress.value = 100
    NProgress.done()
    setTimeout(() => {
      isLoading.value = false
      progress.value = 0
    }, 300)
  }

  return {
    isLoading: readonly(isLoading),
    progress: readonly(progress),
    start,
    finish
  }
}
