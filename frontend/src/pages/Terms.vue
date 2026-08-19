<script setup>
import PageLayout from "@/components/PageLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ShieldCheck } from "lucide-vue-next";
import { useHead } from "@unhead/vue";

useHead({
  title: "Syarat & Ketentuan - PF Space",
  meta: [
    {
      name: "description",
      content:
        "Syarat dan ketentuan komprehensif untuk penggunaan platform PF Space.",
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
          >Syarat & Ketentuan</Badge
        >
      </nav>

      <PageHeader
        title="Syarat Layanan"
        description="Syarat dan ketentuan komprehensif untuk penggunaan platform PF Space."
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
            <ShieldCheck class="w-6 h-6 md:w-8 md:h-8 text-brand-teal" />
            <p class="text-[10px] md:text-sm text-stone-500 dark:text-stone-400 font-medium font-mono">
              Terakhir diperbarui: 31 Desember 2024
            </p>
          </div>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 flex items-center gap-2 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              <FileText class="w-4 h-4 md:w-5 md:h-5 text-brand-teal" />
              1. Penggunaan Layanan
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Dengan menggunakan PF Space, Anda setuju untuk mematuhi semua
              kebijakan dan hukum yang berlaku. Anda bertanggung jawab atas
              konten yang Anda unggah dan aktivitas yang Anda lakukan di
              platform.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              2. Konten yang Diunggah
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Anda harus memiliki hak untuk mengunggah konten yang Anda
              kirimkan. Konten yang melanggar hak cipta, mengandung kekerasan,
              kebencian, atau hal yang tidak pantas dapat dihapus tanpa
              pemberitahuan.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              3. Pembatasan Tanggung Jawab
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Platform disediakan apa adanya. Kami tidak bertanggung jawab atas
              kerugian yang timbul dari penggunaan layanan, termasuk kerusakan
              data atau kegagalan akses.
            </p>
          </section>

          <section>
            <h3
              class="text-base md:text-xl font-display font-bold mb-2 md:mb-3 tracking-tight text-stone-900 dark:text-stone-100 uppercase"
            >
              4. Perubahan Ketentuan
            </h3>
            <p class="text-sm md:text-base leading-relaxed text-stone-600 dark:text-stone-300">
              Kami dapat memperbarui syarat dan ketentuan dari waktu ke waktu.
              Perubahan akan berlaku setelah dipublikasikan di halaman ini.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
