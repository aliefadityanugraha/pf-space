<script setup>
defineProps({
  title: { type: String, required: true },
  year: { type: String, default: '' },
  genre: { type: String, default: '' },
  image: { type: String, default: 'https://placehold.co/240x360' }
})
</script>

<template>
  <div class="group cursor-pointer">
    <!-- Poster -->
    <div class="relative rounded-lg overflow-hidden shadow-md mb-3">
      <img 
        :src="image" 
        :alt="title"
        class="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>

    <!-- Info -->
    <h4 class="text-base font-bold font-body text-white group-hover:text-red-400 transition-colors">
      {{ title }}
    </h4>
    <p class="text-xs font-body text-stone-400">{{ year }} • {{ genre }}</p>
  </div>
</template>
