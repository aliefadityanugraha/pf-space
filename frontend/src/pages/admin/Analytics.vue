<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import { BarChart3 } from 'lucide-vue-next'

const sidebarCollapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3] font-body flex">
    <AdminSidebar :collapsed="sidebarCollapsed" @update:collapsed="sidebarCollapsed = $event" />
    
    <main 
      :class="[
        'flex-1 transition-all duration-300 flex flex-col min-h-screen',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      ]"
    >
      <header class="bg-white border-b-2 border-stone-900 p-4 sticky top-0 z-30">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-display font-bold uppercase tracking-wider">Analytics</h1>
        </div>
      </header>

      <div class="p-4 md:p-8 flex-1 flex flex-col items-center justify-center text-center text-stone-500">
        <div class="w-20 h-20 bg-white border-2 border-stone-900 shadow-brutal mb-6 flex items-center justify-center rounded-none">
          <BarChart3 class="w-10 h-10 text-stone-900" />
        </div>
        <h2 class="text-2xl font-display font-bold text-stone-900 uppercase tracking-wide mb-2">Segera Hadir</h2>
        <p class="font-body text-stone-600 max-w-md">Fitur Analitik sedang dalam tahap pengembangan. Silakan kembali lagi nanti.</p>
      </div>
    </main>
  </div>
</template>

