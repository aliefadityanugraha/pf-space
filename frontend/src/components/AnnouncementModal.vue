<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { X, Megaphone, ArrowRight } from 'lucide-vue-next'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

const isOpen = ref(false)
const config = ref(null)
const router = useRouter()

const fetchAnnouncement = async () => {
  try {
    const res = await api.get('/api/settings/public')
    const settings = res.data
    const announcement = settings.find(s => s.key === 'announcement_modal')
    
    if (announcement && announcement.value && announcement.value.is_active) {
      config.value = announcement.value
      
      // Check if user has already seen this specific version
      const storageKey = `announcement_seen_${JSON.stringify(announcement.value)}`
      const hasSeen = localStorage.getItem(storageKey)
      
      if (!hasSeen) {
        isOpen.value = true
      }
    }
  } catch (err) {
    console.error('Failed to fetch announcement:', err)
  }
}

const close = () => {
  isOpen.value = false
  if (config.value) {
    const storageKey = `announcement_seen_${JSON.stringify(config.value)}`
    localStorage.setItem(storageKey, 'true')
  }
}

const handleAction = () => {
  if (config.value && config.value.button_url) {
    if (config.value.button_url.startsWith('http')) {
      window.open(config.value.button_url, '_blank')
    } else {
      router.push(config.value.button_url)
    }
  }
  close()
}

onMounted(() => {
  // Delay a bit to not overwhelm user immediately
  setTimeout(fetchAnnouncement, 1500)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="isOpen && config" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-md bg-brand-cream border-4 border-black shadow-brutal overflow-hidden">
        <!-- Accent Bar -->
        <div class="h-3 bg-gradient-to-r from-brand-red via-brand-orange to-brand-teal w-full border-b-2 border-black"></div>
        
        <div class="p-5 md:p-6">
          <!-- Close Button -->
          <button 
            @click="close"
            class="absolute top-5 right-5 p-1 border-2 border-transparent hover:border-black hover:bg-white transition-all"
          >
            <X class="w-5 h-5" />
          </button>
          
          <!-- Icon & Header -->
          <div class="flex items-center gap-4 mb-6">
            <div class="p-2 bg-brand-orange border-2 border-black shadow-brutal-sm">
              <Megaphone class="w-6 h-6 text-white" />
            </div>
            <h2 class="text-xl md:text-2xl font-display font-bold uppercase tracking-tight text-stone-900 leading-none">
              {{ config.title }}
            </h2>
          </div>
          
          <!-- Message Body -->
          <div class="prose prose-stone mb-8">
            <p class="text-stone-700 font-body text-sm md:text-base leading-relaxed whitespace-pre-line">
              {{ config.content }}
            </p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <Button 
              v-if="config.button_text"
              @click="handleAction"
              class="flex-1 bg-brand-red text-white border-2 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-bold uppercase h-10 md:h-12 py-0 text-sm md:text-base"
            >
              {{ config.button_text }}
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              @click="close"
              variant="outline"
              class="flex-1 border-2 border-black font-bold uppercase h-10 md:h-12 py-0 text-sm md:text-base hover:bg-stone-200"
            >
              Mungkin Nanti
            </Button>
          </div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute -bottom-6 -right-6 opacity-5 pointer-events-none">
          <Megaphone class="w-28 h-28" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.shadow-brutal {
  box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal-sm {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
</style>
