<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  showArrows: { type: Boolean, default: true },
  lightText: { type: Boolean, default: false }
})

defineEmits(['prev', 'next'])
</script>

<template>
  <div class="flex items-start justify-between mb-6">
    <div class="flex items-start gap-3">
      <div class="w-3 h-8 bg-brand-teal mt-1"></div>
      <div>
        <h2 
          class="text-lg md:text-3xl font-display font-semibold"
          :class="lightText ? 'text-stone-200' : 'text-slate-900'"
        >
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-xs md:text-sm font-body font-medium text-slate-600 mt-1">
          {{ subtitle }}
        </p>
      </div>
    </div>
    <!-- <div v-if="showArrows" class="flex gap-2">
      <Button 
        variant="outline"
        size="icon"
        @click="$emit('prev')"
        class="bg-white"
      >
        <ChevronLeft class="w-5 h-5 text-slate-900" />
      </Button>
      <Button 
        variant="outline"
        size="icon"
        @click="$emit('next')"
        class="bg-white"
      >
        <ChevronRight class="w-5 h-5 text-slate-900" />
      </Button>
    </div> -->
  </div>
</template>
