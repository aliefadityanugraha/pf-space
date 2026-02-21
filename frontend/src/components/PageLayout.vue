<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

defineProps({
  lightNavbar: {
    type: Boolean,
    default: false
  },
  maxWidth: {
    type: String,
    default: '6xl', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  },
  padTop: {
    type: String,
    default: '28' // Tailwind spacing value
  },
  padBottom: {
    type: String,
    default: '16'
  },
  showToast: {
    type: Boolean,
    default: true
  }
})

// Expose toast for parent components
const { toast, showToast: triggerToast } = useToast()

defineExpose({
  toast,
  showToast: triggerToast
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar :light-title="lightNavbar" />
    
    <Toast 
      v-if="showToast" 
      v-bind="toast" 
      @close="toast.show = false" 
    />
    
    <main :class="[
      `max-w-${maxWidth} mx-auto w-full px-4 md:px-8`,
      `pt-${padTop}`,
      `pb-${padBottom}`
    ]">
      <slot></slot>
    </main>
    
    <Footer />
  </div>
</template>
