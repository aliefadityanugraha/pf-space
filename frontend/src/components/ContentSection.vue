<script setup>
defineProps({
  title: { type: String, required: true },
  color: { type: String, default: 'red' } // red, teal
})

const colorClasses = {
  red: 'bg-red-500',
  teal: 'bg-teal-600'
}
</script>

<template>
  <div class="mb-12">
    <!-- Header -->
    <div class="flex items-start gap-3 mb-4">
      <div class="w-1.5 h-8 rounded-sm mt-1" :class="colorClasses[color] || colorClasses.red"></div>
      <h2 class="text-2xl md:text-3xl font-display font-semibold text-stone-800">{{ title }}</h2>
    </div>
    
    <!-- Content Slot -->
    <div class="text-lg font-body text-stone-700 leading-8">
      <slot />
    </div>
  </div>
</template>
