<script setup>
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle, RefreshCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps({
  name: {
    type: String,
    default: 'Komponen'
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error(`[ErrorBoundary: ${props.name}]`, err, info)
  error.value = err
  // Returning false prevents the error from propagating to parent boundaries
  return false
})

const retry = () => {
  error.value = null
}

const isDev = import.meta.env.DEV
</script>

<template>
  <div v-if="error" :class="[
    'error-boundary border-2 border-black bg-white shadow-brutal p-6 flex flex-col items-center text-center gap-4',
    inline ? 'm-2' : 'my-8'
  ]">
    <div class="p-3 bg-red-100 border-2 border-black rounded-full text-red-600">
      <AlertTriangle class="w-8 h-8" />
    </div>
    
    <div>
      <h3 class="font-display font-black uppercase text-lg tracking-tight">Ups! Ada Masalah</h3>
      <p class="text-sm text-stone-500 font-body mt-1">
        Terjadi kesalahan saat memuat {{ name }}.
      </p>
    </div>

    <div v-if="isDev" class="w-full text-left p-2 bg-stone-50 border border-stone-200 rounded font-mono text-[10px] overflow-auto max-h-32 text-red-500">
      {{ error.message }}
    </div>

    <Button @click="retry" variant="outline" size="sm" class="gap-2 border-2 border-black hover:bg-stone-100">
      <RefreshCcw class="w-4 h-4" />
      Muat Ulang Komponen
    </Button>
  </div>
  <slot v-else></slot>
</template>

<style scoped>
.error-boundary {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
