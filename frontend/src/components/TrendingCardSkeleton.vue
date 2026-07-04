<script setup>
import { Card } from '@/components/ui/card'
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<template>
  <Card class="overflow-hidden bg-white border-2 border-black shadow-brutal">
    <div class="flex gap-4 p-4">
      <Skeleton class="flex-shrink-0 w-10 h-10 border-2 border-black" />
      <Skeleton class="w-16 h-24 flex-shrink-0 border-2 border-black" />
      <div class="flex-1 space-y-3 py-1">
        <Skeleton class="h-5 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
        <div class="flex gap-2">
          <Skeleton class="h-6 w-20" />
          <Skeleton class="h-6 w-16" />
        </div>
      </div>
    </div>
  </Card>
</template>
