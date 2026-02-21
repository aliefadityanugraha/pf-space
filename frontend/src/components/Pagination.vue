<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

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
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-8">
    <Button 
      variant="outline" 
      :size="size"
      :disabled="page <= 1"
      @click="changePage(page - 1)"
      class="border-2 border-stone-300"
    >
      <ChevronLeft class="w-4 h-4" />
      <span class="hidden sm:inline ml-1">Sebelumnya</span>
    </Button>
    
    <span v-if="showInfo" class="text-sm text-stone-600 font-body">
      Halaman <span class="font-bold">{{ page }}</span> dari <span class="font-bold">{{ totalPages }}</span>
    </span>
    
    <Button 
      variant="outline" 
      :size="size"
      :disabled="page >= totalPages"
      @click="changePage(page + 1)"
      class="border-2 border-stone-300"
    >
      <span class="hidden sm:inline mr-1">Berikutnya</span>
      <ChevronRight class="w-4 h-4" />
    </Button>
  </div>
</template>
