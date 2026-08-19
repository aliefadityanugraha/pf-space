<script setup>
import PageLayout from "@/components/PageLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Kebijakan Privasi - PF Space",
  meta: [
    {
      name: "description",
      content:
        "Bagaimana kami mengelola dan melindungi data pribadi Anda di platform PF Space.",
    },
  ],
});
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <!-- Breadcrumb -->
      <nav
        class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-2 md:pt-8"
      >
        <router-link to="/" class="text-brand-teal hover:underline"
          >Beranda</router-link
        >
        <span class="text-stone-400">/</span>
        <Badge
          variant="outline"
          class="bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700 font-bold"
          >Kebijakan Privasi</Badge
        >
      </nav>

      <PageHeader
        title="Kebijakan Privasi"
        description="Bagaimana kami mengelola dan melindungi data pribadi Anda di platform PF Space."
        icon-color="bg-brand-teal"
      />

      <Card
        class="mt-6 md:mt-8 border-2 border-stone-900 dark:border-stone-700 shadow-brutal bg-card text-card-foreground mx-0.5 md:mx-0"
      >
        <CardContent
          class="p-5 md:p-8 space-y-5 md:space-y-6 text-stone-900 dark:text-stone-100 font-body"
        >
          <div
            class="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-dashed border-stone-300 dark:border-stone-700"
          >
            <Shield class="w-6 h-6 md:w-8 md:h-8 text-brand-teal" />
            <p class="text-[10px] md:text-sm text-stone-500 dark:text-stone-400 font-medium font-mono">
              Terakhir diperbarui: 31 Desember 2024
            </p>
          </div>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              <Eye class="w-4 h-4 md:w-5 md:h-5 text-brand-teal" />
              1. Informasi yang Kami Kumpulkan
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Kami mengumpulkan informasi yang Anda berikan secara langsung
              kepada kami, seperti saat Anda membuat akun, mengunggah konten,
              atau berkomunikasi dengan kami. Jenis informasi ini mungkin
              termasuk nama, alamat email, dan konten yang Anda unggah.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              <Lock class="w-4 h-4 md:w-5 md:h-5 text-brand-teal" />
              2. Penggunaan Informasi
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Kami menggunakan informasi yang kami kumpulkan untuk menyediakan,
              memelihara, dan meningkatkan layanan kami. Ini termasuk memproses
              unggahan film Anda, memfasilitasi diskusi, dan mengirimkan
              pemberitahuan terkait akun Anda.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              3. Berbagi Informasi
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Kami tidak menjual data pribadi Anda kepada pihak ketiga. Kami
              hanya membagikan informasi jika diperlukan untuk mematuhi hukum,
              melindungi hak kami, atau dengan persetujuan Anda. Film yang Anda
              unggah secara publik akan dapat diakses oleh pengguna lain sesuai
              dengan pengaturan privasi yang Anda pilih.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              4. Keamanan Data
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Kami mengambil langkah-langkah yang wajar untuk melindungi
              informasi Anda dari akses, penggunaan, atau pengungkapan yang
              tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi
              melalui internet yang 100% aman.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              5. Hak Anda
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus
              informasi pribadi Anda. Anda dapat melakukan ini melalui
              pengaturan profil Anda atau dengan menghubungi kami.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
