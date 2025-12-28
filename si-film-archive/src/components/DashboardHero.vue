<script setup>
import { Play, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

defineProps({
  title: { type: String, default: 'Metropolis (1927)' },
  category: { type: String, default: 'German Expressionism' },
  badge: { type: String, default: 'Featured Restoration' },
  description: { type: String, default: '' },
  dueDate: { type: String, default: '' },
  backgroundImage: { type: String, default: 'https://placehold.co/1028x480' }
})
</script>

<template>
  <div class="relative rounded-xl overflow-hidden shadow-lg">
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img :src="backgroundImage" alt="Featured film" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/60 to-stone-900/20"></div>
    </div>

    <!-- Due Date Badge -->
    <div v-if="dueDate" class="absolute top-4 right-4 px-3 py-1 bg-black/60 border border-white/10 backdrop-blur-sm">
      <span class="text-xs font-body uppercase tracking-wider text-stone-400">Due: {{ dueDate }}</span>
    </div>

    <!-- Content -->
    <div class="relative z-10 p-8 md:p-12 min-h-[400px] flex flex-col justify-end">
      <!-- Tags -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <Badge variant="destructive">
          {{ badge }}
        </Badge>
        <span class="text-white/80 text-xs font-body">{{ category }}</span>
      </div>

      <!-- Title -->
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-4">{{ title }}</h2>

      <!-- Description -->
      <p v-if="description" class="text-lg font-body text-white/90 mb-6 max-w-xl leading-relaxed">
        {{ description }}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3">
        <Button variant="destructive" size="lg">
          <Play class="w-5 h-5 mr-2 fill-white" />
          Resume Playback
        </Button>
        <Button variant="outline" size="lg" class="bg-white/10 text-white border-white/20 hover:bg-white/20">
          <Plus class="w-5 h-5 mr-2" />
          Add to List
        </Button>
      </div>
    </div>
  </div>
</template>
