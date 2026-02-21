<script setup>
import PageLayout from '@/components/PageLayout.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Instagram, Globe } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({ 
  title: 'Kontak Kami - PF Space',
  meta: [
    { name: 'description', content: 'Hubungi tim PF Space untuk pertanyaan, saran, atau kolaborasi.' }
  ]
})
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader 
        title="Hubungi Kami" 
        subtitle="Punya pertanyaan atau ingin berkolaborasi? Kami siap membantu."
        :light-text="false"
        class="mb-6 md:mb-10"
      />

      <div class="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
        <!-- Contact Methods -->
        <div class="space-y-4 md:space-y-6">
          <Card class="border-2 border-black shadow-brutal hover:translate-x-[1px] md:hover:translate-x-[2px] hover:translate-y-[1px] md:hover:translate-y-[2px] hover:shadow-brutal-sm transition-all bg-white">
            <CardContent class="p-4 md:p-6 flex items-start gap-3 md:gap-4 font-body">
              <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-teal/10 border-2 border-black flex items-center justify-center shrink-0">
                <Mail class="w-5 h-5 md:w-6 md:h-6 text-brand-teal" />
              </div>
              <div class="min-w-0">
                <h3 class="font-display font-bold text-base md:text-lg mb-0.5 md:mb-1">Email</h3>
                <p class="text-xs md:text-sm text-stone-600 mb-1.5 md:mb-2 leading-relaxed">Untuk pertanyaan umum dan dukungan teknis.</p>
                <a href="mailto:pfspace.id@gmail.com" class="text-brand-teal font-bold hover:underline text-xs md:text-sm break-all">pfspace.id@gmail.com</a>
              </div>
            </CardContent>
          </Card>

          <Card class="border-2 border-black shadow-brutal hover:translate-x-[1px] md:hover:translate-x-[2px] hover:translate-y-[1px] md:hover:translate-y-[2px] hover:shadow-brutal-sm transition-all bg-white">
            <CardContent class="p-4 md:p-6 flex items-start gap-3 md:gap-4 font-body">
              <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-orange/10 border-2 border-black flex items-center justify-center shrink-0">
                <Instagram class="w-5 h-5 md:w-6 md:h-6 text-brand-orange" />
              </div>
              <div class="min-w-0">
                <h3 class="font-display font-bold text-base md:text-lg mb-0.5 md:mb-1">Media Sosial</h3>
                <p class="text-xs md:text-sm text-stone-600 mb-1.5 md:mb-2 leading-relaxed">Ikuti kami untuk update terbaru.</p>
                <a href="https://instagram.com/pfspace.id" target="_blank" class="text-brand-orange font-bold hover:underline text-xs md:text-sm">@pfspace.id</a>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Location/Info -->
        <Card class="border-2 border-black shadow-brutal bg-white h-full">
          <CardContent class="p-5 md:p-8 flex flex-col h-full font-body">
            <div class="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-6">
              <Globe class="w-6 h-6 md:w-8 md:h-8 text-stone-400" />
              <h3 class="text-xl md:text-2xl font-display font-bold uppercase tracking-tight">Lokasi Kami</h3>
            </div>
            
            <p class="text-[13px] md:text-base text-stone-600 leading-relaxed mb-6">
              PF Space diinisiasi oleh mahasiswa Universitas Dian Nuswantoro melalui program PKM-PM, bermitra dengan SMKN Ngasem Kediri dalam upaya pelestarian karya kreatif siswa.
            </p>
            
            <div class="mt-auto space-y-3 md:space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-dashed border-stone-200 pb-2">
                <div class="font-bold text-stone-900 w-full sm:w-32 shrink-0 text-[10px] md:text-sm uppercase tracking-wider">Lembaga</div>
                <div class="text-stone-600 text-xs md:text-sm">Universitas Dian Nuswantoro</div>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-dashed border-stone-200 pb-2">
                <div class="font-bold text-stone-900 w-full sm:w-32 shrink-0 text-[10px] md:text-sm uppercase tracking-wider">Mitra</div>
                <div class="text-stone-600 text-xs md:text-sm">SMKN Ngasem Kediri</div>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                <div class="font-bold text-stone-900 w-full sm:w-32 shrink-0 text-[10px] md:text-sm uppercase tracking-wider">Respon</div>
                <div class="text-stone-600 text-xs md:text-sm">1-2 Hari Kerja</div>
              </div>
            </div>
            
            <div class="mt-8 md:mt-10 p-3 md:p-4 bg-stone-50 border-2 border-dashed border-stone-300 text-center italic text-stone-500 text-[10px] md:text-sm">
              "Hubungi kami untuk kolaborasi atau bantuan teknis terkait pengarsipan film."
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </PageLayout>
</template>
