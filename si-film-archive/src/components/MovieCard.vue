<script setup>
import { Star } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

defineProps({
  image: { type: String, default: 'https://placehold.co/252x380' },
  rating: { type: Number, default: null },
  title: { type: String, default: '' }
})
</script>

<template>
  <Card class="group relative overflow-hidden cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all duration-200">
    <img 
      :src="image" 
      :alt="title || 'Movie poster'"
      class="w-full aspect-[2/3] object-cover"
    />
    <Badge 
      v-if="rating" 
      variant="secondary"
      class="absolute top-2 right-2"
    >
      <Star class="w-3 h-3 mr-1 fill-current" />
      {{ rating }}
    </Badge>
  </Card>
</template>
