<script setup>
import { useRouter } from 'vue-router'
import ArchiveCard from '@/components/ArchiveCard.vue'
import { Film } from 'lucide-vue-next'

defineProps({
  relatedFilms: { type: Array, default: () => [] },
})

const router = useRouter()
</script>

<template>
  <div
    v-if="relatedFilms.length > 0"
    class="my-12 animate-fade-in-up"
    style="animation-delay: 500ms; opacity: 0; animation-fill-mode: forwards"
  >
    <h2
      class="text-2xl font-black font-display text-stone-900 dark:text-stone-100 mb-6 uppercase tracking-wider flex items-center gap-2"
    >
      <Film class="w-6 h-6 text-brand-orange" />
      Karya Serupa
    </h2>
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <ArchiveCard
        v-for="related in relatedFilms"
        :key="related.film_id"
        :archive="related"
        variant="portrait"
        content-class="p-3"
        class="cursor-pointer"
        @click="router.push(`/archive/${related.slug}`)"
      >
        <template #content>
          <h3 class="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-1 mb-0.5 leading-tight">
            {{ related.judul }}
          </h3>
          <p class="text-[11px] text-stone-500 dark:text-stone-400 mb-0 flex items-center gap-1 truncate">
            <span class="truncate">{{ related.creator?.name }}</span>
          </p>
        </template>
      </ArchiveCard>
    </div>
  </div>
</template>
