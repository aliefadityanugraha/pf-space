<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal transition-colors', props.class)">
    <slot />
  </div>
</template>
