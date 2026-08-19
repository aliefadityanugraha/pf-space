import { ref } from 'vue'

// Singleton state — shared across ALL components that call useToast().
// This ensures a single Toast rendered in App.vue works globally.
const toast = ref({ show: false, type: 'success', message: '' })

export function useToast() {
  /**
   * Show a toast notification.
   * Accepts both (message, type) and (type, message) signatures safely.
   * @param {string} arg1 - The message or toast type.
   * @param {string} [arg2='success'] - The toast type or message.
   */
  const showToast = (arg1, arg2 = 'success') => {
    let message = arg1
    let type = arg2

    // Auto-detect if arg1 is the toast type ('success' | 'error' | 'warning' | 'info')
    if (['success', 'error', 'warning', 'info'].includes(arg1)) {
      type = arg1
      message = arg2
    } else if (!['success', 'error', 'warning', 'info'].includes(arg2)) {
      type = 'success'
    }

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
