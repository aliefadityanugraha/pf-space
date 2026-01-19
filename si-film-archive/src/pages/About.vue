<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Film, Users, Archive, Award } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Tentang PF Space - Visi & Misi',
  meta: [
    { name: 'description', content: 'Pelajari lebih lanjut tentang PF Space, platform kearsipan film digital yang didedikasikan untuk mahasiswa.' }
  ]
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />
    <main class="pt-28 pb-16">
      <div class="max-w-4xl mx-auto px-4 md:px-8">
        <h1 class="text-4xl md:text-5xl font-display font-semibold text-slate-900 mb-6">Tentang PF Space</h1>
        
        <p class="text-lg font-body text-slate-600 mb-12 leading-relaxed">
          PF Space adalah platform digital yang didedikasikan untuk mengarsipkan dan menampilkan karya film mahasiswa. 
          Kami percaya pada kekuatan sinema untuk bercerita, menginspirasi perubahan, dan menghubungkan komunitas.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Film class="w-8 h-8 text-brand-red mb-2" />
              <CardTitle>Arsip Film</CardTitle>
              <CardDescription>Akses ratusan karya film mahasiswa dari berbagai genre dan tahun.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users class="w-8 h-8 text-brand-teal mb-2" />
              <CardTitle>Komunitas</CardTitle>
              <CardDescription>Terhubung dengan sesama penikmat film dan para pembuatnya.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Archive class="w-8 h-8 text-brand-orange mb-2" />
              <CardTitle>Pelestarian</CardTitle>
              <CardDescription>Mengarsipkan karya sinema secara digital untuk generasi mendatang.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award class="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle>Apresiasi</CardTitle>
              <CardDescription>Kurasi dan penayangan rutin untuk menyoroti karya mahasiswa terbaik.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>
