<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuPortal } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4,
  align: 'end'
})
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      :side-offset="props.sideOffset"
      :align="props.align"
      :class="cn(
        'z-50 min-w-[180px] overflow-hidden bg-white border-2 border-black shadow-brutal p-1',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        props.class
      )"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
