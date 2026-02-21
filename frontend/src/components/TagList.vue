<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  tags: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="flex flex-wrap gap-2 mt-4">
    <Badge 
      v-for="tag in tags" 
      :key="tag"
      variant="outline"
      class="bg-white"
    >
      #{{ tag }}
    </Badge>
  </div>
</template>
