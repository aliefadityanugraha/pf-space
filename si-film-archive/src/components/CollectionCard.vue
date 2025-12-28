<script setup>
import { Plus } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

defineProps({
  title: { type: String, default: '' },
  image: { type: String, default: '' },
  isCreateNew: { type: Boolean, default: false }
})
</script>

<template>
  <!-- Create New Collection -->
  <Card 
    v-if="isCreateNew"
    class="flex flex-col items-center justify-center h-52 bg-stone-800 border-2 border-dashed border-stone-600 cursor-pointer hover:border-stone-500 hover:bg-stone-700 transition-colors"
  >
    <Button variant="ghost" size="icon" class="w-12 h-12 bg-stone-700 rounded-full mb-3">
      <Plus class="w-6 h-6 text-white" />
    </Button>
    <span class="text-sm font-bold font-body text-white">Create New Collection</span>
  </Card>

  <!-- Collection Card -->
  <Card 
    v-else
    class="relative h-52 overflow-hidden cursor-pointer group"
  >
    <img 
      v-if="image" 
      :src="image" 
      :alt="title"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    <div class="absolute bottom-4 left-4 right-4">
      <h4 class="text-lg font-display font-semibold text-white">{{ title }}</h4>
    </div>
  </Card>
</template>
