<script setup>
import PageLayout from '@/components/PageLayout.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Eye } from 'lucide-vue-next'
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeader 
        title="Kebijakan Privasi" 
        subtitle="Bagaimana kami mengelola dan melindungi data Anda."
        :light-text="false"
      />

      <Card class="mt-6 md:mt-8 border-2 border-black shadow-brutal mx-0.5 md:mx-0">
        <CardContent class="p-5 md:p-8 space-y-5 md:space-y-6 text-stone-800 font-body">
          <div class="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-dashed border-stone-200">
            <Shield class="w-6 h-6 md:w-8 md:h-8 text-brand-teal" />
            <p class="text-[10px] md:text-sm text-stone-500 font-medium">Terakhir diperbarui: 31 Desember 2024</p>
          </div>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight">
              <Eye class="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
              1. Informasi yang Kami Kumpulkan
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti saat Anda membuat akun, mengunggah konten, atau berkomunikasi dengan kami. Jenis informasi ini mungkin termasuk nama, alamat email, dan konten yang Anda unggah.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight">
              <Lock class="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
              2. Penggunaan Informasi
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Kami menggunakan informasi yang kami kumpulkan untuk menyediakan, memelihara, dan meningkatkan layanan kami. Ini termasuk memproses unggahan film Anda, memfasilitasi diskusi, dan mengirimkan pemberitahuan terkait akun Anda.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">3. Berbagi Informasi</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Kami tidak menjual data pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi jika diperlukan untuk mematuhi hukum, melindungi hak kami, atau dengan persetujuan Anda. Film yang Anda unggah secara publik akan dapat diakses oleh pengguna lain sesuai dengan pengaturan privasi yang Anda pilih.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">4. Keamanan Data</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Kami mengambil langkah-langkah yang wajar untuk melindungi informasi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi melalui internet yang 100% aman.
            </p>
          </section>

          <section>
            <h3 class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight">5. Hak Anda</h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600">
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Anda dapat melakukan ini melalui pengaturan profil Anda atau dengan menghubungi kami.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
