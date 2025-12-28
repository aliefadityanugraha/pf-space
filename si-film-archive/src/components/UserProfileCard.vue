<script setup>
import { Card } from '@/components/ui/card'

defineProps({
  name: { type: String, default: 'User' },
  avatar1: { type: String, default: 'https://placehold.co/40x40' },
  avatar2: { type: String, default: 'https://placehold.co/40x40' }
})
</script>

<template>
  <Card class="bg-stone-800 p-4">
    <div class="flex items-center gap-3">
      <!-- Stacked Avatars -->
      <div class="relative">
        <img 
          :src="avatar1" 
          alt="User avatar"
          class="w-10 h-10 rounded-full border-2 border-stone-700"
        />
        <img 
          :src="avatar2" 
          alt="User avatar"
          class="w-10 h-10 rounded-full border-2 border-stone-700 absolute left-6 top-0"
        />
      </div>
      
      <!-- Info -->
      <div class="ml-4">
        <p class="text-sm font-body text-stone-400">Welcome back,</p>
        <h4 class="text-lg font-display font-semibold text-white">{{ name }}</h4>
      </div>
    </div>
  </Card>
</template>
