<script setup>
import { Heart } from 'lucide-vue-next'

defineProps({
  title: { type: String, required: true },
  director: { type: String, required: true },
  votes: { type: String, default: '0' }
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <h3 class="text-lg font-display text-slate-900">{{ title }}</h3>
    <p class="text-sm font-body font-medium uppercase tracking-wide text-slate-500">
      Dir. {{ director }}
    </p>
    <div class="flex items-center gap-1 mt-1">
      <Heart class="w-4 h-4 text-red-500 fill-red-500" />
      <span class="text-sm font-bold font-body text-red-500">{{ votes }} Votes</span>
    </div>
  </div>
</template>
