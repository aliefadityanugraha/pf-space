<script setup>
import { Card, CardContent } from '@/components/ui/card'
import { Film } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps({
  title: {
    type: String,
    default: 'PF Space'
  },
  subtitle: {
    type: String,
    default: 'Educational Film Repository'
  },
  className: {
    type: String,
    default: ''
  },
  split: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: '/banner.webp'
  }
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream flex items-center justify-center p-0 md:p-6 lg:p-8">
    <!-- Auth Layout Wrapper -->
    <div :class="cn(
      'w-full max-w-6xl bg-stone-800 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]',
      !split && 'max-w-md flex-col',
      className
    )">
      <!-- Left side: Image/Branding (Only shown if split is true or on desktop) -->
      <div v-if="split" class="hidden md:flex md:w-1/2 relative overflow-hidden bg-brand-red">
        <img 
          :src="image" 
          alt="Auth background" 
          class="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div class="relative z-10 p-12 flex flex-col justify-end h-full">
          <div class="mb-6">
            <div class="w-16 h-16 bg-white flex items-center justify-center mb-6 shadow-brutal">
              <Film class="w-10 h-10 text-brand-red" />
            </div>
            <h1 class="text-5xl font-display font-black text-white leading-tight mb-4 tracking-tighter">
              Si Film <span class="text-brand-red">Archive</span>
            </h1>
            <div class="w-20 h-2 bg-brand-red mb-6"></div>
          </div>
          
          <p class="text-xl text-stone-200 font-body leading-relaxed max-w-md italic">
            "Sistem Informasi Pengarsipan Film untuk mendukung pembelajaran dan apresiasi karya sinematografi."
          </p>
          
          <div class="mt-12 flex items-center gap-4">
            <div class="flex -space-x-3">
              <div v-for="i in 4" :key="i" class="w-10 h-10 rounded-full border-2 border-stone-800 bg-stone-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                U{{ i }}
              </div>
            </div>
            <p class="text-xs text-stone-400 font-medium uppercase tracking-widest">
              Bergabung dengan 100+ kurator film lainnya
            </p>
          </div>
        </div>
      </div>

      <!-- Right side: Form -->
      <div :class="cn('flex-1 flex flex-col', split ? 'md:w-1/2' : 'w-full')">
        <!-- Red accent bar (Only if NOT split) -->
        <div v-if="!split" class="h-2 bg-brand-red"></div>
        
        <div :class="cn('p-8 md:p-12 lg:p-16 flex flex-col justify-center flex-1', !split && 'md:p-12')">
          <!-- Logo & Header (Small version for form side) -->
          <div :class="cn('mb-10', !split && 'text-center')">
            <div v-if="!split" class="flex justify-center mb-4">
              <div class="w-12 h-12 bg-brand-red/20 flex items-center justify-center">
                <Film class="w-8 h-8 text-brand-red" />
              </div>
            </div>
            
            <Badge v-if="split" variant="outline" class="mb-4 text-brand-red border-brand-red font-bold uppercase tracking-widest text-[10px]">Portal Akses</Badge>
            
            <h2 class="text-3xl font-display font-bold text-white mb-2 leading-none tracking-tighter">
              {{ title }}
            </h2>
            <p class="text-stone-400 font-body border-t border-stone-700 pt-3 mt-3 text-sm">
              {{ subtitle }}
            </p>
          </div>

          <!-- Content -->
          <slot></slot>

          <!-- Footer Links -->
          <div v-if="$slots.footer" class="mt-10 pt-8 border-t border-stone-700">
             <slot name="footer"></slot>
          </div>
        </div>
        
        <!-- Bottom Footer (Mobile/Simple view) -->
        <div v-if="!split" class="p-6 text-center border-t border-stone-700/50">
          <p class="text-[10px] text-stone-500 font-body uppercase tracking-widest">
            © {{ new Date().getFullYear() }} SI FILM ARCHIVE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
