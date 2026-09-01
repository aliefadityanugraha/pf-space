<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  page: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    default: 0
  },
  limit: {
    type: Number,
    default: 10
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'sm', // 'sm' | 'md'
    validator: (v) => ['sm', 'md'].includes(v)
  }
})

const emit = defineEmits(['update:page', 'change'])

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= props.totalPages) {
    emit('update:page', newPage)
    emit('change', newPage)
  }
}

// Compute visible page numbers with smart ellipsis for larger pages
const visiblePages = computed(() => {
  const current = props.page
  const total = props.totalPages
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, '...', current - 1, current, current + 1, '...', total]
})
</script>

<template>
  <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-5 py-3.5 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal">
    <!-- Info label -->
    <div v-if="showInfo" class="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 text-center sm:text-left">
      Halaman <span class="text-brand-teal dark:text-teal-400 font-black">{{ page }}</span> dari <span class="font-black">{{ totalPages }}</span>
      <span v-if="total > 0" class="text-stone-500 dark:text-stone-400 font-normal"> (Total {{ total }} data)</span>
    </div>
    
    <!-- Controls (Previous, Numbers, Next) -->
    <div class="flex items-center gap-1.5 flex-wrap justify-center">
      <!-- Previous Button -->
      <button 
        type="button"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Halaman Sebelumnya"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Sebelumnya</span>
      </button>

      <!-- Page Numbers -->
      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span 
          v-if="p === '...'" 
          class="px-2 py-1 text-xs font-mono font-bold text-stone-400 select-none"
        >
          ...
        </span>
        <button
          v-else
          type="button"
          @click="changePage(p)"
          class="w-8 h-8 flex items-center justify-center text-xs font-mono font-black border-2 transition-all cursor-pointer shadow-brutal-xs"
          :class="page === p
            ? 'bg-brand-teal text-white border-black dark:border-stone-100 shadow-none ring-2 ring-brand-teal'
            : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-black dark:border-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700'"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next Button -->
      <button 
        type="button"
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Halaman Berikutnya"
      >
        <span class="hidden sm:inline">Berikutnya</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

