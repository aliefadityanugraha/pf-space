<script setup>
import { Film, Instagram, Github, Mail, Globe, Heart } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-brand-cream border-t-4 border-black pt-10 md:pt-16 pb-6 md:pb-8 mt-auto">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-16">
        <!-- Brand Section -->
        <div class="space-y-4 md:space-y-6">
          <div class="flex items-center gap-2">
            <img src="/logo-perfilman.png" alt="Perfilman" class="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span class="text-xl md:text-2xl font-display font-black text-black tracking-tight">PF Space</span>
          </div>
          <p class="text-stone-600 text-[10px] md:text-sm leading-relaxed max-w-xs">
            Arsip digital karya siswa SMK untuk apresiasi, dokumentasi, dan pembelajaran kreatif yang berkelanjutan.
          </p>
          <div class="flex items-center gap-3">
            <a href="https://instagram.com/pfspace.id" target="_blank" class="w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center shadow-brutal-xs md:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <Instagram class="w-4 h-4 md:w-5 md:h-5 text-black" />
            </a>
            <a href="mailto:pfspace.id@gmail.com" class="w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center shadow-brutal-xs md:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <Mail class="w-4 h-4 md:w-5 md:h-5 text-black" />
            </a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 md:block md:space-y-0">
          <!-- Links: Platform -->
          <div>
            <h4 class="font-display font-bold text-black uppercase tracking-widest text-[11px] md:text-sm mb-4 md:mb-6 pb-2 border-b-2 border-black inline-block">Platform</h4>
            <ul class="space-y-2 md:space-y-4">
              <li>
                <router-link to="/about" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Tentang Kami</router-link>
              </li>
              <li>
                <router-link to="/materi" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Materi Belajar</router-link>
              </li>
              <li>
                <router-link to="/changelog" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Catatan Perubahan</router-link>
              </li>
              <li>
                <router-link to="/contact" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Hubungi Kami</router-link>
              </li>
            </ul>
          </div>

          <!-- Links: Legal -->
          <div class="md:mt-12">
            <h4 class="font-display font-bold text-black uppercase tracking-widest text-[11px] md:text-sm mb-4 md:mb-6 pb-2 border-b-2 border-black inline-block">Kebijakan</h4>
            <ul class="space-y-2 md:space-y-4">
              <li>
                <router-link to="/privacy" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Privasi</router-link>
              </li>
              <li>
                <router-link to="/terms" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Syarat</router-link>
              </li>
              <li>
                <router-link to="/guidelines" class="text-stone-600 hover:text-brand-teal font-bold transition-colors text-xs md:text-sm">Pedoman</router-link>
              </li>
            </ul>
          </div>
        </div>

        <!-- Partners Area -->
        <div>
          <h4 class="font-display font-bold text-black uppercase tracking-widest text-[10px] md:text-xs mb-4">Didukung Oleh</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 md:w-10 md:h-10">
                <img src="/Logo-Udinus-Official-02-1-1024x1024.png" class="w-full h-full object-contain" />
              </div>
              <span class="text-[9px] md:text-[10px] font-bold text-stone-700 leading-tight uppercase">PKM-PM UDINUS 2026</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 md:w-10 md:h-10">
                <img src="/logo-smkn-ngasem.png" class="w-full h-full object-contain" />
              </div>
              <span class="text-[9px] md:text-[10px] font-bold text-stone-700 leading-tight uppercase">SMK Negeri 1 Ngasem</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-6 md:pt-8 border-t-2 border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p class="text-[9px] md:text-xs font-bold text-stone-500 uppercase tracking-tighter">
          &copy; 2026 PF SPACE. DIBUAT DENGAN 
          <Heart class="w-2.5 h-2.5 md:w-3 md:h-3 inline text-brand-red fill-brand-red mx-0.5" /> 
          OLEH TIM PKM-PM UDINUS
        </p>
        <div class="flex items-center gap-1 text-[8px] md:text-[10px] font-mono text-stone-400">
          <span>BUILD v1.2.4</span>
          <span class="mx-0.5 md:mx-1">•</span>
          <span>STABLE RELEASE</span>
        </div>
      </div>
    </div>
  </footer>
</template>
