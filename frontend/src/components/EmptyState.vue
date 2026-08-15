<script setup>
import { Film } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  icon: {
    type: [Object, Function],
    default: () => Film
  },
  title: {
    type: String,
    default: 'Tidak ada data'
  },
  description: {
    type: String,
    default: ''
  },
  actionLabel: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default', // 'default' | 'dashed'
    validator: (v) => ['default', 'dashed'].includes(v)
  }
})

const emit = defineEmits(['action'])
</script>

<template>
  <div 
    :class="[
      'text-center py-12 md:py-20',
      variant === 'dashed' 
        ? 'bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700' 
        : ''
    ]"
  >
    <div class="max-w-md mx-auto px-4">
      <component 
        :is="icon" 
        class="w-16 h-16 mx-auto mb-4 text-stone-300 dark:text-stone-600 animate-float" 
      />
      <h3 class="text-xl md:text-2xl font-display font-bold text-stone-800 dark:text-stone-100 mb-2">
        {{ title }}
      </h3>
      <p v-if="description" class="text-stone-500 dark:text-stone-400 font-body mb-6">
        {{ description }}
      </p>
      <slot name="action">
        <Button 
          v-if="actionLabel" 
          @click="emit('action')" 
          size="lg" 
          class="gap-2 shadow-brutal"
        >
          <slot name="action-icon"></slot>
          {{ actionLabel }}
        </Button>
      </slot>
    </div>
  </div>
</template>
