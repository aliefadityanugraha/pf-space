<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-4xl mx-auto px-4 md:px-8 py-12 pt-25">
      <SectionHeader 
        title="Syarat Layanan PF Space" 
        subtitle="Syarat dan ketentuan penggunaan platform."
        :light-text="false"
      />

      <Card class="mt-8 border-2 border-black shadow-brutal">
        <CardContent class="p-6 md:p-8 space-y-6 text-stone-800">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-stone-200">
            <ShieldCheck class="w-8 h-8 text-brand-teal" />
            <p class="text-sm text-stone-500">Terakhir diperbarui: 31 Desember 2024</p>
          </div>

          <section>
            <h3 class="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <FileText class="w-5 h-5 text-stone-400" />
              1. Penggunaan Layanan
            </h3>
            <p class="leading-relaxed">
              Dengan menggunakan PF Space, Anda setuju untuk mematuhi semua kebijakan dan hukum yang berlaku. Anda bertanggung jawab atas konten yang Anda unggah dan aktivitas yang Anda lakukan di platform.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">2. Konten yang Diunggah</h3>
            <p class="leading-relaxed">
              Anda harus memiliki hak untuk mengunggah konten yang Anda kirimkan. Konten yang melanggar hak cipta, mengandung kekerasan, kebencian, atau hal yang tidak pantas dapat dihapus tanpa pemberitahuan.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">3. Pembatasan Tanggung Jawab</h3>
            <p class="leading-relaxed">
              Platform disediakan apa adanya. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan, termasuk kerusakan data atau kegagalan akses.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">4. Perubahan Ketentuan</h3>
            <p class="leading-relaxed">
              Kami dapat memperbarui syarat dan ketentuan dari waktu ke waktu. Perubahan akan berlaku setelah dipublikasikan di halaman ini.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>

    <Footer />
  </div>
</template>
