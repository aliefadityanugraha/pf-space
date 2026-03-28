<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { WifiOff, ServerCrash, RefreshCw } from 'lucide-vue-next'

const isOffline = ref(false)
const isApiDown = ref(false)

const handleOffline = () => {
  isOffline.value = true
}

const handleOnline = () => {
  isOffline.value = false
  // Attempt to refresh if they just came online
  if (!isApiDown.value) {
    window.location.reload()
  }
}

const handleApiDown = () => {
  isApiDown.value = true
}

const handleRetry = () => {
  window.location.reload()
}

onMounted(() => {
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  window.addEventListener('api:down', handleApiDown)
  
  if (!navigator.onLine) {
    isOffline.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('api:down', handleApiDown)
})
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="isOffline || isApiDown" 
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-cream/95 backdrop-blur-sm p-6"
    >
      <div 
        class="bg-white border-4 border-stone-900 shadow-brutal-xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden"
      >
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-[0.03] bg-[url('/grain.png')] bg-repeat pointer-events-none"></div>

        <div class="relative z-10 flex flex-col items-center">
          <div class="w-24 h-24 bg-brand-red border-4 border-stone-900 shadow-brutal flex items-center justify-center mb-8 rotate-3">
            <WifiOff v-if="isOffline" class="w-12 h-12 text-white" />
            <ServerCrash v-else class="w-12 h-12 text-white" />
          </div>

          <h2 class="text-2xl md:text-3xl font-display font-black text-stone-900 uppercase tracking-wide mb-3">
            {{ isOffline ? 'Koneksi Terputus' : 'Sistem Utama Tumbang' }}
          </h2>
          
          <p class="text-stone-600 font-body font-bold mb-8">
            {{ isOffline 
              ? 'Tampaknya Anda sedang offline. Silakan periksa koneksi internet Anda untuk kembali menjelajah.' 
              : 'Gagal terhubung ke server utama PF Space. Tim kami mungkin sedang melakukan pemeliharaan.' 
            }}
          </p>

          <button 
            @click="handleRetry"
            class="w-full py-4 bg-brand-teal text-white border-4 border-stone-900 shadow-brutal font-display font-black text-lg uppercase tracking-widest hover:bg-teal-700 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <RefreshCw class="w-5 h-5" />
            Coba Hubungkan Ulang
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, backdrop-filter 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}
</style>
