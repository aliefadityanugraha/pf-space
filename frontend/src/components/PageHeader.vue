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
  icon: {
    type: Object, // Component
    default: null
  },
  iconColor: {
    type: String,
    default: 'bg-brand-orange'
  },
  className: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div :class="cn('flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6', className)">
    <div class="flex-1">
      <div class="flex items-center gap-3 mb-2">
        <div 
          v-if="icon" 
          :class="cn(
            'w-10 h-10 border-2 border-black flex items-center justify-center shadow-brutal-sm',
            iconColor
          )"
        >
          <component :is="icon" class="w-6 h-6 text-white" />
        </div>
        <h1 class="text-2xl md:text-4xl font-display font-bold text-stone-900 leading-tight">{{ title }}</h1>
      </div>
      <p v-if="description" class="text-stone-500 font-body max-w-2xl text-sm md:text-base">
        {{ description }}
      </p>
      <slot name="extra"></slot>
    </div>
    
    <div v-if="$slots.actions" class="flex-shrink-0">
      <slot name="actions"></slot>
    </div>
  </div>
</template>
