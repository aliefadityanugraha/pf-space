<script setup>
import PageLayout from '@/components/PageLayout.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({ 
  title: 'Pedoman Komunitas - PF Space',
  meta: [
    { name: 'description', content: 'Panduan dan etika berinteraksi serta mengunggah karya di platform PF Space.' }
  ]
})
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader 
        title="Pedoman Komunitas" 
        subtitle="Panduan etika untuk menciptakan lingkungan belajar yang inspiratif dan aman."
        :light-text="false"
      />

      <div class="mt-6 md:mt-8 space-y-6 md:space-y-8 mb-16 font-body">
        <!-- Introduction -->
        <Card class="border-2 border-black shadow-brutal bg-white overflow-hidden">
          <div class="h-2 bg-brand-teal"></div>
          <CardContent class="p-5 md:p-8">
            <div class="flex items-start gap-3 md:gap-4">
              <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-teal/10 border-2 border-black flex items-center justify-center shrink-0">
                <BookOpen class="w-5 h-5 md:w-6 md:h-6 text-brand-teal" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg md:text-xl font-display font-bold mb-2 uppercase tracking-tight">Selamat Datang di PF Space</h3>
                <p class="text-sm md:text-base text-stone-600 leading-relaxed">
                  PF Space adalah wadah kolaboratif. Kami mengharapkan semua pengguna untuk saling menghargai, memberikan apresiasi yang membangun, dan menjaga kualitas konten sebagai bahan pembelajaran bagi siswa SMK di seluruh Indonesia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <!-- Do's -->
          <Card class="border-2 border-black shadow-brutal bg-white h-full">
            <CardContent class="p-5 md:p-8 flex flex-col h-full">
              <div class="flex items-center gap-3 mb-4 md:mb-6">
                <CheckCircle2 class="w-6 h-6 md:w-8 md:h-8 text-brand-teal" />
                <h3 class="text-lg md:text-xl font-display font-bold uppercase tracking-tight">Apa yang Harus Dilakukan</h3>
              </div>
              
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Berikan kritik dan saran yang konstruktif untuk karya siswa.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Cantumkan kredit yang jujur untuk semua kru yang terlibat dalam film.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Gunakan bahasa yang sopan dan profesional dalam diskusi.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Bagikan aset pembelajaran yang benar-benar bermanfaat secara edukatif.</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <!-- Don'ts -->
          <Card class="border-2 border-black shadow-brutal bg-white h-full">
            <CardContent class="p-5 md:p-8 flex flex-col h-full">
              <div class="flex items-center gap-3 mb-4 md:mb-6">
                <AlertCircle class="w-6 h-6 md:w-8 md:h-8 text-brand-red" />
                <h3 class="text-lg md:text-xl font-display font-bold uppercase tracking-tight">Apa yang Dilarang</h3>
              </div>
              
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Mengunggah konten yang mengandung SARA, pornografi, atau kekerasan ekstrem.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Melakukan perundungan (bullying) atau pelecehan terhadap kreator lain.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Melakukan spamming di kolom komentar atau profil pengguna.</p>
                </li>
                <li class="flex items-start gap-3">
                  <div class="mt-1 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0"></div>
                  <p class="text-sm md:text-base text-stone-700">Mengklaim karya orang lain sebagai karya sendiri (plagiarisme).</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <!-- Moderation Info -->
        <div class="p-4 md:p-6 bg-stone-100 border-2 border-black flex gap-3 md:gap-4 items-start">
          <Info class="w-5 h-5 md:w-6 md:h-6 text-stone-900 shrink-0 mt-0.5" />
          <div class="text-xs md:text-sm text-stone-700">
            <span class="font-bold uppercase tracking-wider block mb-1">Moderasi Konten</span>
            Tim moderator kami berhak menghapus konten atau menangguhkan akun yang melanggar pedoman ini demi menjaga kenyamanan lingkungan belajar bersama.
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
