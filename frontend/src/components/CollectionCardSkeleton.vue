<script setup>
import { Card, CardContent } from '@/components/ui/card'
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<template>
  <Card class="bg-white border-2 border-black shadow-brutal">
    <CardContent class="p-0">
      <Skeleton class="aspect-video w-full border-b-2 border-black" />
      <div class="p-5 space-y-4">
        <div class="flex justify-between items-start gap-2">
          <Skeleton class="h-6 w-3/4" />
          <Skeleton class="h-4 w-10" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-10 flex-1" />
          <Skeleton class="h-10 w-10" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
