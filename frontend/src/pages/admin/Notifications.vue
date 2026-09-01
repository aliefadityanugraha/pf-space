<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Bell } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

</script>

<template>
  <div class="p-4 md:p-8">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">Notifikasi</Badge>
    </nav>

    <!-- Header -->
    <PageHeader 
      title="Pusat Notifikasi" 
      description="Pantau semua pemberitahuan sistem dan aktivitas pengguna."
      :icon="Bell"
      icon-color="bg-brand-orange"
    />

    <div class="mt-20 flex flex-col items-center justify-center text-center text-stone-500 dark:text-stone-400">
      <div class="w-20 h-20 bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 shadow-brutal mb-6 flex items-center justify-center text-stone-900 dark:text-stone-100">
        <Bell class="w-10 h-10" />
      </div>
      <h2 class="text-2xl font-display font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-2">Segera Hadir</h2>
      <p class="font-body text-stone-600 dark:text-stone-300 max-w-md">Fitur Notifikasi Admin sedang dalam tahap pengembangan. Silakan kembali lagi nanti.</p>
    </div>
  </div>
</template>

