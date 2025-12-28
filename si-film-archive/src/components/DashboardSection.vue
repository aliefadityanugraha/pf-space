<script setup>
defineProps({
  title: { type: String, required: true },
  linkText: { type: String, default: '' },
  linkHref: { type: String, default: '#' },
  darkMode: { type: Boolean, default: false }
})
</script>

<template>
  <section class="mb-12">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
      <h2 
        class="text-2xl font-bold font-display"
        :class="darkMode ? 'text-white' : 'text-stone-900'"
      >
        {{ title }}
      </h2>
      <a 
        v-if="linkText" 
        :href="linkHref"
        class="text-sm font-bold font-body text-red-700 hover:text-red-800 transition-colors"
      >
        {{ linkText }}
      </a>
      <slot name="header-right" />
    </div>

    <!-- Content -->
    <slot />
  </section>
</template>
