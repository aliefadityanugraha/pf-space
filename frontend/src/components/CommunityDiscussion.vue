<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useRouter } from 'vue-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-vue-next'
import { timeAgo } from '@/lib/format'

const router = useRouter()
const discussion = ref(null)
const loading = ref(true)

const fetchDiscussion = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/community/active')
    if (res.success && res.data) {
      discussion.value = res.data
    } else {
      discussion.value = null
    }
  } catch (error) {
    console.error('Failed to fetch community discussion:', error)
    discussion.value = null
  } finally {
    loading.value = false
  }
}

const formatTime = (date) => {
  try {
    return timeAgo(date)
  } catch {
    return 'baru saja'
  }
}

onMounted(() => {
  fetchDiscussion()
})
</script>

<template>
  <section v-if="!loading && discussion" class="pt-6 pb-12 relative">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      
      <!-- CTA/Header for Community -->
      <div class="mb-6 text-center flex flex-col items-center justify-center">
         <h2 class="text-2xl md:text-4xl font-heading font-black uppercase text-stone-900 drop-shadow-[1px_1px_0_rgba(255,255,255,1)]">
           <span class="text-brand-red">Diskusi</span> Komunitas
         </h2>
         <p class="font-mono font-bold text-stone-900 mt-2 text-xs md:text-sm bg-yellow-400 border-2 border-black inline-block px-3 py-1 rotate-1 shadow-[2px_2px_0_rgba(28,25,23,1)]">Tanggapi panel diskusi publik sekarang.</p>
      </div>

      <!-- Main Banner Card -->
      <Card class="border-2 border-black shadow-[6px_6px_0_rgba(28,25,23,1)] md:shadow-[8px_8px_0_rgba(28,25,23,1)] bg-white overflow-visible relative group rounded-none">
        
        <!-- Funky Sticker -->
        <div class="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] z-20 animate-[spin_8s_linear_infinite]">
          <Sparkles class="w-6 h-6 md:w-8 md:h-8 text-black" />
        </div>

        <div class="bg-gradient-to-br from-brand-orange to-brand-red p-5 md:p-8 text-white flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start text-center md:text-left relative z-10 border-b-4 border-brand-teal">
          
          <div class="w-16 h-16 md:w-20 md:h-20 bg-brand-cream border-2 border-black shadow-[3px_3px_0_rgba(28,25,23,1)] flex items-center justify-center flex-shrink-0 -rotate-3 group-hover:rotate-0 transition-transform duration-300">
            <MessageCircle class="w-8 h-8 md:w-10 md:h-10 text-brand-red" />
          </div>
          
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <h3 class="text-xl md:text-2xl font-heading font-black leading-tight mb-2 uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)] tracking-tight">
              {{ discussion.title }}
            </h3>
            <p v-if="discussion.description" class="text-white font-body bg-black/30 p-2.5 border-l-2 border-yellow-400 font-medium text-xs md:text-sm mb-3 line-clamp-2 md:line-clamp-2 leading-snug">
              {{ discussion.description }}
            </p>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1 text-[9px] md:text-[10px] font-bold">
              <span class="bg-black text-white px-3 py-1.5 uppercase tracking-widest border border-transparent shadow-[1px_1px_0_rgba(255,255,255,0.2)]">
                Oleh {{ discussion.creator?.name || 'Admin' }}
              </span>
              <span class="bg-white/10 text-white px-3 py-1.5 border border-white/20 uppercase tracking-widest backdrop-blur-sm">
                {{ formatTime(discussion.created_at) }}
              </span>
            </div>
          </div>
          
          <!-- CTA Action inside -->
          <div class="mt-3 md:mt-0 flex flex-col justify-center h-full self-stretch md:w-auto w-full md:pl-4">
             <Button 
                @click="router.push('/community')"
                size="lg"
                class="bg-yellow-400 text-stone-900 border-2 border-black shadow-[4px_4px_0_rgba(28,25,23,1)] hover:shadow-[1px_1px_0_rgba(28,25,23,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all font-black uppercase tracking-widest text-xs md:text-sm h-12 md:h-14 px-6 md:px-8 rounded-none w-full flex items-center justify-center gap-2 whitespace-nowrap"
             >
                Lihat <br class="hidden md:block"/> Diskusi <ArrowRight class="w-4 h-4 md:w-5 md:h-5"/>
             </Button>
          </div>
        </div>
      </Card>

    </div>
  </section>
</template>
