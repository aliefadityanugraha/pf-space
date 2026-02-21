<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <h3 :class="cn('font-heading text-2xl tracking-wide', props.class)">
    <slot />
  </h3>
</template>
