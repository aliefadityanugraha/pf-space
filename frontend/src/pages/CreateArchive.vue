<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import PageLayout from "@/components/PageLayout.vue";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, AlertTriangle, CheckCircle2, 
  Film, Image as ImageIcon, ShieldCheck, FileText, ChevronDown, ChevronUp 
} from "lucide-vue-next";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/composables/useToast";
import { useFilmForm } from "@/composables/useFilmForm";
import ArchiveUploadForm from "@/components/ArchiveUploadForm.vue";
import { useHead } from "@unhead/vue";

useHead({
  title: "Upload Karya Baru - PF Space",
  meta: [
    {
      name: "description",
      content: "Upload karya film baru Anda ke arsip PF Space untuk direview dan dipublikasikan.",
    },
  ],
});

const router = useRouter();
const { showToast } = useToast();
const { loading: localLoading, error: formError, submitFilm } = useFilmForm();
const showPanduan = ref(true);

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
  <PageLayout>
    <main class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <!-- Breadcrumbs Navigation (Matching MyArchive) -->
      <nav
        class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-2 md:pt-6"
      >
        <router-link to="/" class="text-brand-teal hover:underline font-bold">
          BERANDA
        </router-link>
        <span class="text-stone-400">/</span>
        <router-link
          to="/my-archive"
          class="text-brand-teal hover:underline font-bold"
        >
          KARYA SAYA
        </router-link>
        <span class="text-stone-400">/</span>
        <Badge
          variant="outline"
          class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold uppercase tracking-wider"
        >
          UPLOAD FILM
        </Badge>
      </nav>

      <!-- Page Header -->
      <PageHeader
        title="Upload Film Baru"
        description="Lengkapi data karya, file video utama, dan poster film untuk proses kurasi kurator PF Space."
        icon-color="bg-brand-red"
      >
        <template #actions>
          <Button
            variant="outline"
            size="sm"
            @click="handleCancel"
            class="hidden md:flex items-center gap-2 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none font-bold uppercase tracking-wider text-xs px-4 h-10 cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4 stroke-[2.5]" /> Kembali
          </Button>
        </template>
      </PageHeader>

      <!-- Error Message -->
      <div
        v-if="formError"
        class="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-500 text-red-600 dark:text-red-300 font-medium shadow-brutal-xs"
      >
        {{ formError }}
      </div>

      <!-- Info Panduan Kurasi (Compact & High-Contrast Neo-Brutalist Callout) -->
      <div
        class="mb-6 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs overflow-hidden transition-all"
      >
        <!-- Panduan Header -->
        <div 
          class="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-amber-100/90 dark:bg-stone-850 border-b-2 border-black dark:border-stone-700"
          @click="showPanduan = !showPanduan"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-7 h-7 bg-amber-400 border-2 border-black text-stone-950 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]"
            >
              <AlertTriangle class="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 truncate">
                <span>Panduan Kualitas & Standar Kurasi PF Space</span>
                <span class="text-[9px] font-mono uppercase bg-red-600 text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_#000] font-bold hidden sm:inline-block">
                  Penting
                </span>
              </h3>
              <p class="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 truncate">
                Pastikan karya memenuhi kriteria kurasi agar proses verifikasi dan penayangan berjalan cepat.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            class="text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white p-1 shrink-0 cursor-pointer"
            :title="showPanduan ? 'Sembunyikan Panduan' : 'Buka Panduan'"
          >
            <ChevronUp v-if="showPanduan" class="w-4 h-4 stroke-[2.5]" />
            <ChevronDown v-else class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Panduan Content Grid -->
        <div v-show="showPanduan" class="p-3 sm:p-4 bg-stone-50/50 dark:bg-stone-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <!-- Card 1: Video -->
          <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
            <div class="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-bold text-xs font-mono uppercase">
              <Film class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>1. Format Video</span>
            </div>
            <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
              Resolusi minimal <strong>720p / 1080p</strong> format <strong>MP4/WebM</strong> audio jernih dan stabil.
            </p>
          </div>

          <!-- Card 2: Poster & Banner -->
          <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
            <div class="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs font-mono uppercase">
              <ImageIcon class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>2. Visual Poster</span>
            </div>
            <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
              Poster wajib rasio <strong>2:3 vertikal</strong> (JPG/PNG). Banner landscape opsional rasio <strong>16:9</strong>.
            </p>
          </div>

          <!-- Card 3: Hak Cipta -->
          <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
            <div class="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono uppercase">
              <ShieldCheck class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>3. Hak Cipta & Etika</span>
            </div>
            <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
              Bebas dari hak cipta ilegal, konten SARA, ujaran kebencian, atau pelanggaran etika sekolah.
            </p>
          </div>

          <!-- Card 4: Dokumen & Kru -->
          <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
            <div class="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs font-mono uppercase">
              <FileText class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>4. Data Kru & Naskah</span>
            </div>
            <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
              Cantumkan sinopsis & kru. Lampirkan berkas naskah/storyboard PDF untuk penilaian akademik.
            </p>
          </div>
        </div>
      </div>

      <!-- Upload Form Component -->
      <ArchiveUploadForm
        :loading="localLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @error="handleError"
      />
    </main>
  </PageLayout>
</template>
