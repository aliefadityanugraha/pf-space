<script setup>
import { CheckCircle, AlertTriangle, X } from 'lucide-vue-next'

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
    enter-active-class="transform transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.1)]"
    enter-from-class="translate-x-[120%] opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transform transition-all duration-300 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-[120%] opacity-0"
  >
    <div v-if="show" class="fixed top-24 right-4 md:right-8 z-[100] max-w-sm w-full md:w-auto">
      <div 
        class="flex bg-white border-2 border-stone-900 shadow-brutal w-full min-w-[300px] overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
      >
        <!-- Brutalist Icon Block -->
        <div 
          :class="[
            'p-4 flex items-center justify-center border-r-2 border-stone-900 shrink-0 transition-colors',
            type === 'success' ? 'bg-brand-teal text-white' : 'bg-brand-red text-white'
          ]"
        >
          <CheckCircle v-if="type === 'success'" class="w-6 h-6 stroke-[2.5]" />
          <AlertTriangle v-else class="w-6 h-6 stroke-[2.5]" />
        </div>
        
        <!-- Content Area -->
        <div class="px-4 py-3 flex items-start justify-between w-full h-full relative bg-brand-cream/30">
          <div class="flex flex-col flex-1 pr-8 justify-center min-h-[48px]">
             <span class="font-display font-black uppercase text-[10px] tracking-widest mb-1" 
                   :class="type === 'success' ? 'text-teal-700' : 'text-brand-red'">
                {{ type === 'success' ? 'Sistem Terkonfirmasi' : 'Terdapat Isu' }}
             </span>
             <p class="font-body text-sm text-stone-900 font-bold leading-snug">{{ message }}</p>
          </div>
          
          <!-- Close Button -->
          <button 
            @click="$emit('close')" 
            class="shrink-0 p-1 bg-white hover:bg-stone-200 border-2 border-stone-900 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all absolute right-3 top-3"
            aria-label="Tutup"
          >
            <X class="w-3.5 h-3.5 text-stone-900 stroke-[3]" />
          </button>
          
          <!-- Dwindling Progress Bar -->
          <div class="absolute bottom-0 left-0 h-1 bg-stone-900 origin-left animate-toast-progress w-full"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>
