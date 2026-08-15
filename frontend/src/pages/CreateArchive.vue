<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import Footer from "@/components/Footer.vue";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-vue-next";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/composables/useToast";
import { useFilmForm } from "@/composables/useFilmForm";
import ArchiveUploadForm from "@/components/ArchiveUploadForm.vue";
import { useHead } from "@unhead/vue";

useHead({
  title: "Upload Karya Baru - PF Space",
});

const router = useRouter();
const { showToast } = useToast();
const { loading: localLoading, error: formError, submitFilm } = useFilmForm();

const handleSubmit = async (formData) => {
  await submitFilm(formData);
};

const handleCancel = () => {
  router.push({ name: "MyArchive" });
};

const handleError = (message) => {
  showToast(message, "error");
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
    <Navbar />

    <main class="w-full max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-16">
      <!-- Breadcrumb -->
      <nav
        class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-4"
      >
        <router-link to="/" class="text-brand-teal hover:underline"
          >Beranda</router-link
        >
        <span class="text-stone-400">/</span>
        <router-link to="/my-archive" class="text-stone-600 dark:text-stone-300 hover:underline"
          >Karya Saya</router-link
        >
        <span class="text-stone-400">/</span>
        <Badge
          variant="outline"
          class="bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
          >Upload</Badge
        >
      </nav>

      <!-- Header -->
      <PageHeader
        title="Upload Film Baru"
        description="Film akan direview oleh admin sebelum dipublikasi di PF Space."
        icon-color="bg-brand-red"
      >
        <template #actions>
          <Button
            variant="outline"
            size="sm"
            @click="handleCancel"
            class="hidden md:flex gap-2 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none"
          >
            <ArrowLeft class="w-4 h-4" /> Kembali
          </Button>
        </template>
      </PageHeader>

      <!-- Error Message -->
      <div
        v-if="formError"
        class="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-medium"
      >
        {{ formError }}
      </div>

      <div
        class="mb-6 p-4 bg-stone-50 dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 shadow-brutal-xs flex gap-3"
      >
        <div class="mt-1 shrink-0">
          <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Panduan kualitas dan kurasi PF Space
          </p>
          <ul class="list-disc pl-5 text-sm text-stone-700 dark:text-stone-300 space-y-1">
            <li>
              Pastikan resolusi video minimal 720p dengan audio yang jelas dan
              seimbang.
            </li>
            <li>
              Hindari konten yang mengandung ujaran kebencian, SARA, atau
              pelanggaran etika kampus.
            </li>
            <li>
              Gunakan poster dan judul yang relevan dengan isi film dan mudah
              dipahami.
            </li>
            <li>
              Pastikan Anda memiliki hak tayang dan distribusi daring untuk
              seluruh materi di dalam film.
            </li>
            <li>
              Lengkapi sinopsis, tahun produksi, dan data kru utama agar proses
              kurasi lebih cepat.
            </li>
          </ul>
        </div>
      </div>

      <ArchiveUploadForm
        :loading="localLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @error="handleError"
      />
    </main>

    <Footer />
  </div>
</template>
