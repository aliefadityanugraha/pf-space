<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('bg-white border-2 border-black shadow-brutal', props.class)">
    <slot />
  </div>
</template>
