<script setup>
import { Film } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-[#F2EEE3] border-t border-stone-800 py-8 mt-auto">
    <div class="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
      <!-- Left: Logo & Copyright -->
      <div class="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
        <span class="text-lg font-display font-semibold text-stone-800">PF Space</span>
        <span class="hidden md:inline text-stone-400 font-body">|</span>
        <span class="text-xs md:text-sm font-medium font-body text-stone-600 md:text-stone-800 max-w-[250px] md:max-w-none">
          © 2026. Program Kreativitas Mahasiswa - Pengabdian Masyarakat Universitas Dian Nuswantoro.
        </span>
       </div>

      <!-- Right: Links -->
      <div class="flex flex-wrap justify-center items-center gap-4 md:gap-6">
        <router-link to="/privacy" class="text-xs md:text-sm font-bold font-body uppercase tracking-wide text-stone-800 hover:text-brand-red transition-colors">
          Privacy Policy
        </router-link>
        <router-link to="/terms" class="text-xs md:text-sm font-bold font-body uppercase tracking-wide text-stone-800 hover:text-brand-red transition-colors">
          Terms
        </router-link>
        <router-link to="/contact" class="text-xs md:text-sm font-bold font-body uppercase tracking-wide text-stone-800 hover:text-brand-red transition-colors">
          Contact
        </router-link>
      </div>
    </div>
  </footer>
</template>
