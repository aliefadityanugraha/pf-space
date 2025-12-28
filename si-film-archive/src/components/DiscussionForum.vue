<script setup>
import { MessageCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

defineProps({
  commentCount: { type: Number, default: 0 }
})
</script>

<template>
  <Card class="shadow-brutal-lg p-6 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-amber-400 rounded-full border border-stone-800"></div>
        <h3 class="text-xl md:text-2xl font-display font-semibold text-stone-800">Discussion Forum</h3>
      </div>
      <Badge variant="outline" class="bg-stone-100">
        {{ commentCount }} Comments
      </Badge>
    </div>

    <!-- Comment Input -->
    <div class="flex gap-4 mb-6">
      <div class="w-12 h-12 bg-stone-200 rounded-full flex-shrink-0 overflow-hidden">
        <img src="https://placehold.co/48x48" alt="User avatar" class="w-full h-full object-cover" />
      </div>
      <div class="flex-1">
        <textarea 
          placeholder="Share your thoughts about this film..."
          class="w-full p-4 bg-stone-50 border-2 border-stone-200 text-base font-body text-stone-800 placeholder:text-stone-400 resize-none focus:outline-none focus:border-stone-400"
          rows="3"
        ></textarea>
        <div class="flex justify-end mt-3">
          <Button variant="destructive">
            Post Comment
          </Button>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div class="space-y-6">
      <slot />
      
      <!-- Empty state if no comments -->
      <div v-if="!$slots.default" class="text-center py-8">
        <MessageCircle class="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <p class="text-stone-500 font-body">No comments yet. Be the first to share your thoughts!</p>
      </div>
    </div>
  </Card>
</template>
