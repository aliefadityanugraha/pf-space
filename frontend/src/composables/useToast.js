import { ref } from 'vue'

export function useToast() {
  const toast = ref({ show: false, type: 'success', message: '' })

  const showToast = (arg1, arg2) => {
    let type = 'success'
    let message = ''

    const isType = (value) => value === 'success' || value === 'error'

    if (typeof arg2 !== 'undefined') {
      if (isType(arg1)) {
        type = arg1
        message = arg2
      } else if (isType(arg2)) {
        type = arg2
        message = arg1
      } else {
        message = arg1
      }
    } else {
      if (isType(arg1)) {
        type = arg1
      } else {
        message = arg1
      }
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
