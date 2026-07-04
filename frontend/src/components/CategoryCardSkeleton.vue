<script setup>
import { Card, CardContent } from '@/components/ui/card'
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<template>
  <Card class="bg-white border-2 border-black shadow-brutal">
    <CardContent class="p-4 text-center space-y-3">
      <Skeleton class="w-12 h-12 mx-auto rounded-full border-2 border-black" />
      <Skeleton class="h-4 w-2/3 mx-auto" />
      <Skeleton class="h-3 w-1/2 mx-auto" />
    </CardContent>
  </Card>
</template>
