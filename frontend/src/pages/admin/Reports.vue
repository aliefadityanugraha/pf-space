<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { FileText } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

</script>

<template>
  <div class="p-4 md:p-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/" class="text-brand-teal hover:underline">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Laporan</Badge>
    </nav>

    <!-- Header -->
    <PageHeader 
      title="Laporan & Statistik" 
      description="Analisis data performa platform dan laporan aktivitas."
      :icon="FileText"
      icon-color="bg-brand-red"
    />

    <div class="mt-20 flex flex-col items-center justify-center text-center text-stone-500">
      <div class="w-20 h-20 bg-white border-2 border-black shadow-brutal mb-6 flex items-center justify-center">
        <FileText class="w-10 h-10 text-stone-900" />
      </div>
      <h2 class="text-2xl font-display font-bold text-stone-900 uppercase tracking-wide mb-2">Segera Hadir</h2>
      <p class="font-body text-stone-600 max-w-md">Fitur Laporan sedang dalam tahap pengembangan. Silakan kembali lagi nanti.</p>
    </div>
  </div>
</template>

