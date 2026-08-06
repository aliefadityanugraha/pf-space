<script setup>
import Skeleton from '@/components/ui/Skeleton.vue'
</script>

<template>
  <div class="bg-white border-2 border-black shadow-brutal overflow-hidden">
    <Skeleton className="aspect-[16/9] w-full border-b-2 border-black" />

    <div class="p-5 md:p-6 space-y-3">
      <div class="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24 ml-auto" />
      </div>

      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />

      <div class="flex gap-1.5 pt-2">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>

      <div class="flex items-center justify-between border-t-2 border-stone-100 pt-4">
        <div class="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  </div>
</template>
