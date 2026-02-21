<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Eye } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-25">
      <SectionHeader 
        title="Privacy Policy" 
        subtitle="Bagaimana kami mengelola dan melindungi data Anda."
        :light-text="false"
      />

      <Card class="mt-8 border-2 border-black shadow-brutal">
        <CardContent class="p-6 md:p-8 space-y-6 text-stone-800">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-stone-200">
            <Shield class="w-8 h-8 text-brand-teal" />
            <p class="text-sm text-stone-500">Terakhir diperbarui: 31 Desember 2024</p>
          </div>

          <section>
            <h3 class="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <Eye class="w-5 h-5 text-stone-400" />
              1. Informasi yang Kami Kumpulkan
            </h3>
            <p class="leading-relaxed">
              Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti saat Anda membuat akun, mengunggah konten, atau berkomunikasi dengan kami. Jenis informasi ini mungkin termasuk nama, alamat email, dan konten yang Anda unggah.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3 flex items-center gap-2">
              <Lock class="w-5 h-5 text-stone-400" />
              2. Penggunaan Informasi
            </h3>
            <p class="leading-relaxed">
              Kami menggunakan informasi yang kami kumpulkan untuk menyediakan, memelihara, dan meningkatkan layanan kami. Ini termasuk memproses unggahan film Anda, memfasilitasi diskusi, dan mengirimkan pemberitahuan terkait akun Anda.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">3. Berbagi Informasi</h3>
            <p class="leading-relaxed">
              Kami tidak menjual data pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi jika diperlukan untuk mematuhi hukum, melindungi hak kami, atau dengan persetujuan Anda. Film yang Anda unggah secara publik akan dapat diakses oleh pengguna lain sesuai dengan pengaturan privasi yang Anda pilih.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">4. Keamanan Data</h3>
            <p class="leading-relaxed">
              Kami mengambil langkah-langkah yang wajar untuk melindungi informasi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi melalui internet yang 100% aman.
            </p>
          </section>

          <section>
            <h3 class="text-xl font-display font-bold mb-3">5. Hak Anda</h3>
            <p class="leading-relaxed">
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Anda dapat melakukan ini melalui pengaturan profil Anda atau dengan menghubungi kami.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>

    <Footer />
  </div>
</template>
