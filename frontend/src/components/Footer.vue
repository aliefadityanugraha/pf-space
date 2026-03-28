<script setup>
import { Film, Instagram, Github, Mail, Globe, Heart } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-stone-900 text-white border-t-0 pt-10 md:pt-16 pb-6 md:pb-8 mt-auto">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-5 md:mb-10">
        <!-- Brand Section -->
        <div class="space-y-4 md:space-y-6">
          <div class="flex items-center gap-2">
            <img src="/logo-perfilman.png" alt="Perfilman" class="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span class="text-xl md:text-2xl font-display font-black text-inherit tracking-tight">PF Space</span>
          </div>
          <p class="text-inherit opacity-70 text-[10px] md:text-sm leading-relaxed max-w-xs font-medium">
            Arsip digital karya siswa SMK untuk apresiasi, dokumentasi, dan pembelajaran kreatif yang berkelanjutan.
          </p>
          <div class="flex items-center gap-3">
            <a href="https://instagram.com/pfspace.id" target="_blank" class="w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(28,25,23,1)] md:shadow-[4px_4px_0_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              <Instagram class="w-4 h-4 md:w-5 md:h-5 text-black" />
            </a>
            <a href="mailto:pfspace.id@gmail.com" class="w-8 h-8 md:w-10 md:h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(28,25,23,1)] md:shadow-[4px_4px_0_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              <Mail class="w-4 h-4 md:w-5 md:h-5 text-black" />
            </a>
          </div>
        </div>

        <div>
          <div class="grid grid-cols-2 gap-2 md:block md:space-y-0">
            <!-- Links: Platform -->
            <div>
              <h4 class="font-display font-bold text-inherit uppercase tracking-widest text-[11px] md:text-sm mb-2 md:mb-6 border-b-2 border-current inline-block pb-1">Platform</h4>
              <ul class="space-y-2">
                <li>
                  <router-link to="/about" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Tentang Kami</router-link>
                </li>
                <li>
                  <router-link to="/materi" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Materi Belajar</router-link>
                </li>
                <li>
                  <router-link to="/changelog" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Catatan Perubahan</router-link>
                </li>
                <li>
                  <router-link to="/contact" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Hubungi Kami</router-link>
                </li>
                <li>
                  <router-link to="/status" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Status Peladen</router-link>
                </li>
              </ul>
            </div>

            <!-- Links: Legal -->
            <div class="md:mt-10">
              <h4 class="font-display font-bold text-inherit uppercase tracking-widest text-[11px] md:text-sm mb-2 md:mb-6 border-b-2 border-current inline-block pb-1">Kebijakan</h4>
              <ul class="space-y-2">
                <li>
                  <router-link to="/privacy" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Privasi</router-link>
                </li>
                <li>
                  <router-link to="/terms" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Syarat Penggunaan</router-link>
                </li>
                <li>
                  <router-link to="/guidelines" class="text-inherit opacity-80 hover:opacity-100 hover:text-brand-teal font-medium transition-colors text-xs md:text-sm">Pedoman Komunitas</router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Partners Area -->
        <div>
          <h4 class="font-display font-bold text-inherit uppercase tracking-widest text-[10px] md:text-xs mb-4">Didukung Oleh</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 md:w-10 md:h-10 bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0">
                <img src="/Logo-Udinus-Official-02-1-1024x1024.png" class="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <span class="text-[9px] md:text-[10px] font-bold text-inherit opacity-80 leading-tight uppercase">PKM-PM UDINUS 2026</span>
            </div>
            <div class="flex items-center gap-3 mt-2">
              <div class="w-8 h-8 md:w-10 md:h-10 bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0">
                <img src="/logo-smkn-ngasem.png" class="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <span class="text-[9px] md:text-[10px] font-bold text-inherit opacity-80 leading-tight uppercase">SMK Negeri 1 Ngasem</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-6 md:pt-8 border-t border-current opacity-60 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p class="text-[9px] md:text-xs font-bold font-mono text-inherit uppercase tracking-tighter">
          &copy; 2026 PF SPACE. DIBUAT DENGAN 
          <Heart class="w-2.5 h-2.5 md:w-3 md:h-3 inline text-brand-red fill-current mx-0.5" /> 
          OLEH TIM PKM-PM UDINUS
        </p>
        <div class="flex items-center gap-1 text-[8px] md:text-[10px] font-mono text-inherit opacity-70">
          <span>BUILD v1.2.4</span>
          <span class="mx-0.5 md:mx-1">•</span>
          <span>STABLE RELEASE</span>
        </div>
      </div>
    </div>
  </footer>
</template>
