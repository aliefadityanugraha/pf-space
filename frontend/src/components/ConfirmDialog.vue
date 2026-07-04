<script setup>
import { AlertTriangle, Loader2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Konfirmasi'
  },
  message: {
    type: String,
    default: 'Apakah Anda yakin?'
  },
  confirmLabel: {
    type: String,
    default: 'Konfirmasi'
  },
  cancelLabel: {
    type: String,
    default: 'Batal'
  },
  variant: {
    type: String,
    default: 'danger', // 'danger' | 'warning' | 'info'
    validator: (v) => ['danger', 'warning', 'info'].includes(v)
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

const variantStyles = {
  danger: {
    header: 'bg-red-50',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    confirmBtn: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    header: 'bg-amber-50',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700'
  },
  info: {
    header: 'bg-blue-50',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700'
  }
}

const close = () => {
  emit('update:show', false)
  emit('cancel')
}

const confirm = () => {
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close"></div>
        
        <!-- Dialog -->
        <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-sm">
          <!-- Header -->
          <div :class="['flex items-center gap-3 px-6 py-4 border-b-2 border-black', variantStyles[variant].header]">
            <component 
              :is="icon || AlertTriangle" 
              :class="['w-5 h-5', variantStyles[variant].iconColor]" 
            />
            <h2 :class="['font-bold text-lg flex-1', variantStyles[variant].titleColor]">
              {{ title }}
            </h2>
            <button @click="close" class="p-1 hover:opacity-70 rounded">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6">
            <p class="text-stone-600 mb-6">
              <slot>{{ message }}</slot>
            </p>
            
            <!-- Actions -->
            <div class="flex gap-3">
              <Button 
                variant="outline" 
                class="flex-1" 
                @click="close" 
                :disabled="loading"
              >
                {{ cancelLabel }}
              </Button>
              <Button 
                :class="['flex-1 gap-2', variantStyles[variant].confirmBtn]" 
                @click="confirm" 
                :disabled="loading"
              >
                <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                <slot name="confirm-icon" v-else></slot>
                {{ confirmLabel }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
