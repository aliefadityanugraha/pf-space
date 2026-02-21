import { ref } from 'vue'

// Singleton state — shared across ALL components that call useToast().
// This ensures a single Toast rendered in App.vue works globally.
const toast = ref({ show: false, type: 'success', message: '' })

export function useToast() {
  /**
   * Show a toast notification.
   * @param {string} message - The message to display.
   * @param {'success'|'error'} [type='success'] - The toast type.
   */
  const showToast = (message, type = 'success') => {
    toast.value = { show: true, type, message }
    setTimeout(() => {
      toast.value.show = false
    }, 3000)
  }

  return {
    toast,
    showToast
  }
}
