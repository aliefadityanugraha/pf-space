<script setup>
import { AlertTriangle, RefreshCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  message: {
    type: String,
    default: 'Gagal memuat feed produksi. Silakan coba lagi.'
  }
})

const emit = defineEmits(['retry'])
</script>

<template>
  <div class="bg-white border-2 border-black shadow-brutal p-8 md:p-12 text-center">
    <div
      class="w-16 h-16 md:w-20 md:h-20 bg-brand-red border-2 border-black shadow-brutal-sm flex items-center justify-center mx-auto mb-5 rotate-3"
    >
      <AlertTriangle class="w-8 h-8 md:w-10 md:h-10 text-white" />
    </div>

    <h3 class="font-heading text-2xl md:text-3xl uppercase tracking-wide text-stone-900 mb-2">
      Ups, Ada Kendala
    </h3>
    <p class="font-body text-stone-500 text-sm md:text-base max-w-md mx-auto mb-6">
      {{ message }}
    </p>

    <Button
      @click="emit('retry')"
      class="bg-brand-teal text-white border-2 border-black shadow-brutal gap-2"
    >
      <RefreshCcw class="w-4 h-4" />
      Muat Ulang
    </Button>
  </div>
</template>
