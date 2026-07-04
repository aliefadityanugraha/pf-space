<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Apresiasi Karya Terbaik' },
  subtitle: { type: String, default: 'Dukung karya favoritmu dan lihat tren apresiasi minggu ini.' },
  buttonText: { type: String, default: 'Beri Apresiasi' },
  to: { type: String, default: '/voting' },
  color: { type: String, default: 'red' }
})

const router = useRouter()

const bgClass = computed(() => {
  return props.color === 'teal' ? 'bg-brand-teal' : 'bg-brand-red'
})
</script>

<template>
  <div class="w-full bg-brand-teal border-y-4 border-stone-900 py-8 md:py-12 relative overflow-hidden">
    <!-- Star Deco -->
    <div class="absolute top-2 left-2 md:top-6 md:left-8 rotate-[-15deg] opacity-50">
       <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M12 2L15 9L22 9L16 14L18 21L12 17L6 21L8 14L2 9L9 9L12 2Z" fill="#ffecb3"/></svg>
    </div>
    <div class="absolute bottom-2 right-2 md:bottom-6 md:right-8 rotate-[25deg] opacity-50">
       <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M12 2L15 9L22 9L16 14L18 21L12 17L6 21L8 14L2 9L9 9L12 2Z" fill="#fca5a5"/></svg>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
      <div class="bg-white border-2 border-stone-900 shadow-[6px_6px_0_rgba(28,25,23,1)] md:shadow-[8px_8px_0_rgba(28,25,23,1)] p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
        
        <div class="text-center md:text-left flex-1">
          <h2 class="text-2xl md:text-4xl font-heading font-black text-stone-900 uppercase tracking-tight leading-none mb-2">PILIH <span class="text-brand-red">KARYA</span><br/>FAVORITMU</h2>
          <p class="text-xs md:text-sm font-mono font-bold text-stone-600 max-w-xl border-l-4 border-yellow-400 pl-3">Dukung karya favoritmu dan lihat tren apresiasi minggu ini. Suaramu menentukan siapa yang duduk di takhta.</p>
        </div>
        
        <div class="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
          <Button 
            @click="router.push('/trending')"
            class="w-full md:w-auto bg-yellow-400 text-stone-900 hover:bg-yellow-300 gap-2 shadow-[4px_4px_0_rgba(28,25,23,1)] border-2 border-stone-900 h-10 md:h-12 px-6 text-xs md:text-sm font-black uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(28,25,23,1)] transition-all rounded-none"
          >
            Beri Apresiasi
            <ArrowRight class="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

      </div>
    </div>
  </div>
</template>
