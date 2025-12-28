<script setup>
import { Check } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

defineProps({
  title: { type: String, required: true },
  image: { type: String, default: 'https://placehold.co/238x158' },
  progress: { type: Number, default: 0 }, // 0-100
  remaining: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  completedDate: { type: String, default: '' }
})
</script>

<template>
  <div class="group cursor-pointer">
    <!-- Thumbnail -->
    <div class="relative bg-stone-800 overflow-hidden shadow-md border-2 border-stone-800 mb-3">
      <img :src="image" :alt="title" class="w-full aspect-video object-cover" />
      
      <!-- Completed Badge -->
      <Badge v-if="completed" variant="default" class="absolute top-2 right-2 bg-black/60 border-0">
        <Check class="w-3 h-3 mr-1" />
        Watched
      </Badge>

      <!-- Progress Bar -->
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-stone-700">
        <div 
          class="h-full bg-brand-red transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Info -->
    <h4 class="text-lg font-display font-semibold text-stone-900 group-hover:text-brand-red transition-colors">
      {{ title }}
    </h4>
    <p v-if="remaining && !completed" class="text-sm font-body text-stone-400 flex items-center gap-1">
      <span class="w-2 h-2 bg-brand-red rounded-full"></span>
      {{ remaining }} remaining
    </p>
    <p v-if="completed && completedDate" class="text-sm font-body text-stone-400">
      Completed on {{ completedDate }}
    </p>
  </div>
</template>
