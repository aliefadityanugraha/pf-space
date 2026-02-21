<script setup>
import PageLayout from '@/components/PageLayout.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader 
        title="Syarat Layanan PF Space" 
        subtitle="Syarat dan ketentuan penggunaan platform."
        :light-text="false"
      />

      <Card class="mt-6 md:mt-8 border-2 border-black shadow-brutal mx-0.5 md:mx-0">
        <CardContent class="p-5 md:p-8 space-y-5 md:space-y-6 text-stone-800 font-body">
          <div class="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-dashed border-stone-200">
            <ShieldCheck class="w-6 h-6 md:w-8 md:h-8 text-brand-teal" />
            <p class="text-[10px] md:text-sm text-stone-500 font-medium">Terakhir diperbarui: 31 Desember 2024</p>
          </div>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight">
              <FileText class="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
              1. Penggunaan Layanan
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Dengan menggunakan PF Space, Anda setuju untuk mematuhi semua kebijakan dan hukum yang berlaku. Anda bertanggung jawab atas konten yang Anda unggah dan aktivitas yang Anda lakukan di platform.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">2. Konten yang Diunggah</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Anda harus memiliki hak untuk mengunggah konten yang Anda kirimkan. Konten yang melanggar hak cipta, mengandung kekerasan, kebencian, atau hal yang tidak pantas dapat dihapus tanpa pemberitahuan.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">3. Pembatasan Tanggung Jawab</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Platform disediakan apa adanya. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan, termasuk kerusakan data atau kegagalan akses.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">4. Perubahan Ketentuan</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Kami dapat memperbarui syarat dan ketentuan dari waktu ke waktu. Perubahan akan berlaku setelah dipublikasikan di halaman ini.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
