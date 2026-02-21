<script setup lang="ts">
import { DropdownMenuRoot } from 'radix-vue'

const props = defineProps<{
  defaultOpen?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <DropdownMenuRoot v-bind="props" @update:open="emit('update:open', $event)">
    <slot />
  </DropdownMenuRoot>
</template>
