<script setup>
import { cn } from '@/lib/utils'

defineProps({
  className: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div :class="cn('relative overflow-hidden animate-pulse bg-stone-200 border-2 border-black/5', className)">
    <div class="skeleton-shimmer" aria-hidden="true"></div>
  </div>
</template>
