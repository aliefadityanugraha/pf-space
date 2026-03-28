<script setup>
import { cn } from '@/lib/utils'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  // We keep these for compatibility, but the bar style is the new standard
  icon: {
    type: Object,
    default: null
  },
  iconColor: {
    type: String,
    default: 'bg-brand-teal'
  },
  className: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div :class="cn('flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8', className)">
    <div class="flex items-start gap-4 flex-1">
      <div :class="cn('w-1 bg-brand-orange rounded-full', iconColor, description ? 'h-16' : 'h-10')"></div>
      <div>
        <h1 class="font-display text-3xl md:text-4xl font-bold text-stone-900 leading-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="text-stone-500 font-body mt-1 max-w-2xl text-sm md:text-base">
          {{ description }}
        </p>
        <slot name="extra"></slot>
      </div>
    </div>
    
    <div v-if="$slots.actions" class="flex items-center gap-3">
      <slot name="actions"></slot>
    </div>
  </div>
</template>
