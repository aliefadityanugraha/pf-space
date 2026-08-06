<script setup>
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<template>
  <div class="max-w-3xl mx-auto" role="status" aria-label="Memuat postingan">
    <Skeleton class="h-4 w-32 mb-6" />
    <Skeleton class="aspect-video w-full mb-8" />
    <Skeleton class="h-10 w-3/4 mx-auto mb-4" />
    <Skeleton class="h-10 w-1/2 mx-auto mb-6" />
    <Skeleton class="h-4 w-full mb-2" />
    <Skeleton class="h-4 w-full mb-2" />
    <Skeleton class="h-4 w-2/3" />
  </div>
</template>
