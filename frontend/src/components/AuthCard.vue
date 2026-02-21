<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Film } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  title: {
    type: String,
    default: 'PF Space'
  },
  subtitle: {
    type: String,
    default: 'Educational Film Repository'
  },
  className: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3] flex flex-col items-center justify-center px-4 py-12">
    <!-- Auth Card -->
    <Card :class="cn('w-full max-w-md bg-stone-800 border-stone-700 shadow-2xl overflow-hidden', className)">
      <!-- Red accent bar -->
      <div class="h-2 bg-brand-red"></div>
      
      <CardContent class="p-8 md:p-12">
        <!-- Logo & Header -->
        <div class="text-center mb-10">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-brand-red/20 flex items-center justify-center">
              <Film class="w-8 h-8 text-brand-red" />
            </div>
          </div>
          <h1 class="text-3xl font-display font-bold text-white mb-2">{{ title }}</h1>
          <p class="text-stone-400 font-body border-t border-stone-700 pt-2 mt-2">
            {{ subtitle }}
          </p>
        </div>

        <!-- Content -->
        <slot></slot>

        <!-- Footer Links (Register/Login toggle) -->
        <div v-if="$slots.footer" class="mt-8 pt-6 border-t border-stone-700 text-center">
          <slot name="footer"></slot>
        </div>
      </CardContent>
    </Card>

    <!-- Page Footer -->
    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © {{ new Date().getFullYear() }} PF Space Repository. All rights reserved.
    </p>
  </div>
</template>
