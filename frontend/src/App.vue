<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import SidebarChat from './components/SidebarChat.vue'
import AnnouncementModal from './components/AnnouncementModal.vue'
import Toast from './components/Toast.vue'

const { init, initialized } = useAuth()
const { toast } = useToast()

// Global error boundary
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('[App Error Boundary]', err, info)
  hasError.value = true
  errorMessage.value = err?.message || 'Terjadi kesalahan yang tidak terduga'
  // Return false to prevent error from propagating further
  return false
})

const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
  window.location.reload()
}

onMounted(() => {
  init()
})
</script>

<template>
  <!-- Error Boundary Fallback -->
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-background p-6">
    <div class="max-w-md w-full text-center space-y-6 p-8 border-3 border-black bg-white shadow-[6px_6px_0px_#000]">
      <div class="text-5xl">⚠️</div>
      <h1 class="text-2xl font-black uppercase">Oops! Terjadi Kesalahan</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <button
        @click="handleRetry"
        class="px-6 py-3 bg-black text-white font-bold uppercase border-3 border-black hover:bg-primary hover:shadow-[4px_4px_0px_#000] transition-all"
      >
        Coba Lagi
      </button>
    </div>
  </div>

  <!-- Normal App -->
  <template v-else-if="initialized">
    <router-view />
    <SidebarChat />
    <AnnouncementModal />
    
    <!-- Global Pattern Overlay -->
    <div 
      class="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03] bg-repeat"
      style="
        background-image: radial-gradient(#000 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>
    

  </template>
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>

  <!-- Global Toast (singleton) -->
  <Toast :show="toast.show" :type="toast.type" :message="toast.message" @close="toast.show = false" />
</template>

<style>
/* Global styles handled in style.css */
</style>
