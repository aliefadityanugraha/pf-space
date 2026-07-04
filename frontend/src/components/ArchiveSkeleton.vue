<script setup>
import { computed } from 'vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const props = defineProps({
  variant: {
    type: String,
    default: 'portrait'
  },
  className: {
    type: String,
    default: ''
  }
})

const aspectClass = computed(() => {
  return props.variant === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'
})
</script>

<template>
  <Card :class="cn('overflow-hidden bg-white border-2 border-black shadow-brutal', className)">
    <Skeleton :class="cn(aspectClass, 'w-full border-b-2 border-black')" />
    <CardContent class="p-4 space-y-2">
      <Skeleton class="h-5 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
    </CardContent>
  </Card>
</template>
