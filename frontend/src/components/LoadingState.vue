<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  text: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  color: {
    type: String,
    default: 'stone' // 'stone' | 'teal' | 'orange' | 'red'
  }
})

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
}

const colorClasses = {
  stone: 'text-stone-400',
  teal: 'text-brand-teal',
  orange: 'text-brand-orange',
  red: 'text-brand-red'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20">
    <Loader2 
      :class="[
        'animate-spin mb-4',
        sizeClasses[size],
        colorClasses[color]
      ]" 
    />
    <p v-if="text" class="text-stone-500 font-mono text-sm animate-pulse uppercase tracking-wide">
      {{ text }}
    </p>
  </div>
</template>
