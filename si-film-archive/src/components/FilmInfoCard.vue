<script setup>
import { Badge } from '@/components/ui/badge'

defineProps({
  title: { type: String, required: true },
  year: { type: String, default: '2024' },
  duration: { type: String, default: '1h 45m' },
  genres: { type: Array, default: () => ['Drama', 'Education', 'Archival'] },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="bg-white shadow-brutal border-2 border-stone-800 p-6">
    <!-- Tags -->
    <div class="flex flex-wrap gap-2 mb-4">
      <Badge variant="default" class="bg-stone-800">
        Release: {{ year }}
      </Badge>
      <Badge variant="outline">
        {{ duration }}
      </Badge>
    </div>

    <!-- Title -->
    <h3 class="text-3xl md:text-4xl font-display font-semibold text-stone-800 mb-3">
      {{ title }}
    </h3>

    <!-- Genres -->
    <div class="flex flex-wrap items-center gap-2 text-sm font-body text-stone-800 mb-4">
      <template v-for="(genre, index) in genres" :key="genre">
        <span>{{ genre }}</span>
        <span v-if="index < genres.length - 1" class="text-stone-400">//</span>
      </template>
    </div>

    <!-- Description -->
    <p v-if="description" class="text-base font-body text-neutral-500 leading-relaxed">
      {{ description }}
    </p>
  </div>
</template>
