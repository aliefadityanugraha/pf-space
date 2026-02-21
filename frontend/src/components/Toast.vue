<script setup>
import { CheckCircle, XCircle, X } from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  type: {
    type: String,
    default: 'success', // 'success' | 'error'
    validator: (value) => ['success', 'error'].includes(value)
  },
  message: String
})

const emit = defineEmits(['close'])
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-x-4 opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-4 opacity-0"
  >
    <div v-if="show" class="fixed top-25 right-5 z-70">
      <div 
        :class="[
          'flex items-center gap-3 px-4 py-3 border-2 border-black shadow-brutal min-w-[300px]',
          type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        ]"
      >
        <div :class="[
          'p-1 text-white border border-black shadow-brutal-sm',
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        ]">
          <CheckCircle v-if="type === 'success'" class="w-4 h-4" />
          <XCircle v-else class="w-4 h-4" />
        </div>
        
        <span class="font-bold flex-1">{{ message }}</span>
        
        <button @click="$emit('close')" class="hover:opacity-70 p-1">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
