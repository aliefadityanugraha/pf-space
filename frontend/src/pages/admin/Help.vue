<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import PageHeader from '@/components/PageHeader.vue'
import { HelpCircle } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const sidebarCollapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-14' : 'ml-56']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <router-link to="/" class="text-brand-teal hover:underline">Beranda</router-link>
        <span class="text-stone-400">/</span>
        <router-link to="/admin" class="text-stone-600 hover:underline">Administrasi</router-link>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Bantuan</Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Bantuan & Dukungan" 
        description="Panduan dan pusat bantuan untuk administrator sistem."
        :icon="HelpCircle"
        icon-color="bg-teal-500"
      />

      <div class="mt-20 flex flex-col items-center justify-center text-center text-stone-500">
        <div class="w-20 h-20 bg-white border-2 border-black shadow-brutal mb-6 flex items-center justify-center">
          <HelpCircle class="w-10 h-10 text-stone-900" />
        </div>
        <h2 class="text-2xl font-display font-bold text-stone-900 uppercase tracking-wide mb-2">Segera Hadir</h2>
        <p class="font-body text-stone-600 max-w-md">Halaman Bantuan sedang dalam tahap pengembangan. Silakan kembali lagi nanti.</p>
      </div>
    </main>
  </div>
</template>

