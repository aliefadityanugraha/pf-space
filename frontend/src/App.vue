<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useLoading } from '@/composables/useLoading'
import SidebarChat from './components/SidebarChat.vue'
import AnnouncementModal from './components/AnnouncementModal.vue'
import Toast from './components/Toast.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const { init, initialized } = useAuth()
const { toast } = useToast()
const { isLoading, progress } = useLoading()

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
    <!-- Global Progress Bar -->
    <div 
      v-if="isLoading" 
      class="fixed top-0 left-0 right-0 h-1 z-[9999] bg-brand-teal transition-all duration-300 ease-out"
      :style="{ width: `${progress}%` }"
    ></div>

    <ErrorBoundary name="Halaman">
      <router-view />
    </ErrorBoundary>
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

  <Toast :show="toast.show" :type="toast.type" :message="toast.message" @close="toast.show = false" />
</template>

<style>
/* Page Transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* Global styles handled in style.css */
</style>
