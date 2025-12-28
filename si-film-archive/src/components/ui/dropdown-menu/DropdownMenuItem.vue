<script setup lang="ts">
import { DropdownMenuItem } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  disabled?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuItem
    :disabled="props.disabled"
    :class="cn(
      'relative flex cursor-pointer select-none items-center px-3 py-2 font-body text-sm outline-none transition-colors',
      'hover:bg-stone-100 focus:bg-stone-100',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class
    )"
  >
    <slot />
  </DropdownMenuItem>
</template>
