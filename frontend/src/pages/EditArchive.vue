<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "@/lib/api";
import PageLayout from "@/components/PageLayout.vue";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, AlertTriangle, Loader2,
  Film, Image as ImageIcon, ShieldCheck, FileText, ChevronDown, ChevronUp 
} from "lucide-vue-next";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/composables/useToast";
import { useFilmForm } from "@/composables/useFilmForm";
import ArchiveUploadForm from "@/components/ArchiveUploadForm.vue";
import { useHead } from "@unhead/vue";

useHead({
  title: "Edit Karya - PF Space",
  meta: [
    {
      name: "description",
      content: "Edit informasi dan materi karya arsip Anda di PF Space.",
    },
  ],
});

const router = useRouter();
const route = useRoute();
const filmSlug = route.params.slug;

const loading = ref(true);
const originalStatus = ref("");
const filmId = ref(null);
const initialData = ref(null);
const showPanduan = ref(true);

const { showToast } = useToast();
const { loading: saving, error: formError, submitFilm } = useFilmForm();

// Fetch film data by slug
const fetchFilm = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/api/films/${filmSlug}`);
    const film = res.data;

    filmId.value = film.film_id;
    originalStatus.value = film.status;

    initialData.value = {
      judul: film.judul || "",
      category_id: film.category_id || "",
      sinopsis: film.sinopsis || "",
      tahun_karya: film.tahun_karya || new Date().getFullYear(),
      link_video_utama: film.link_video_utama || "",
      link_trailer: film.link_trailer || "",
      link_bts: film.link_bts || "",
      gambar_poster: film.gambar_poster || "",
      banner_url: film.banner_url || "",
      deskripsi_lengkap: film.deskripsi_lengkap || "",
      file_naskah: film.file_naskah || "",
      file_storyboard: film.file_storyboard || "",
      file_rab: film.file_rab || "",
      crew:
        film.crew && film.crew.length > 0
          ? film.crew
          : [{ jabatan: "", anggota: [""] }],
    };
  } catch (err) {
    showToast("Gagal memuat data karya", "error");
    router.push("/my-archive");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (formData) => {
  let msg = "Karya berhasil diperbarui!";
  if (originalStatus.value === "published") {
    msg = 'Karya diupdate! Status berubah ke "Menunggu Review".';
  }
  await submitFilm(formData, filmId.value, msg);
};

const handleCancel = () => {
  router.push("/my-archive");
};

const handleError = (message) => {
  showToast(message, "error");
};

onMounted(() => {
  fetchFilm();
});
</script>

<template>
  <PageLayout>
    <main class="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <!-- Breadcrumb -->
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
          EDIT KARYA
        </Badge>
      </nav>

      <!-- Header -->
      <PageHeader
        title="Edit Karya"
        description="Perubahan pada karya yang sudah dipublikasi memerlukan review ulang oleh kurator."
        icon-color="bg-brand-red"
      >
        <template #actions>
          <Button
            variant="outline"
            size="sm"
            @click="handleCancel"
            class="hidden md:flex items-center gap-2 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none font-bold uppercase tracking-wider text-xs px-4 h-10 cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4 stroke-[2.5]" /> Batal
          </Button>
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
      </div>

      <template v-else>
        <!-- Warning Alert if published or rejected -->
        <div
          v-if="originalStatus === 'published' || originalStatus === 'rejected'"
          class="mb-6 p-4 bg-amber-500/10 dark:bg-amber-950/30 border-2 border-black dark:border-stone-100 shadow-brutal-xs flex items-start gap-3"
        >
          <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="font-bold text-stone-900 dark:text-stone-100 text-sm">Perhatian Status Karya</p>
            <p class="text-xs text-stone-700 dark:text-stone-300 mt-0.5 leading-relaxed">
              Karya ini saat ini berstatus {{ originalStatus === "published" ? "dipublikasikan" : "ditolak" }}.
              Jika Anda menyimpan perubahan, status akan diperbarui menjadi "Menunggu Review" hingga disetujui kembali oleh kurator.
            </p>
          </div>
        </div>

        <!-- Info Box Panduan Kurasi (Compact & High-Contrast Neo-Brutalist Callout) -->
        <div
          class="mb-6 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal-xs overflow-hidden transition-all"
        >
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
                  <span>Panduan Kurasi Saat Merevisi Karya</span>
                </h3>
                <p class="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 truncate">
                  Pastikan seluruh poin revisi telah diperbaiki sesuai catatan kurator sebelum submit kembali.
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

          <div v-show="showPanduan" class="p-3 sm:p-4 bg-stone-50/50 dark:bg-stone-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
              <div class="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-bold text-xs font-mono uppercase">
                <Film class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>1. File Video Aktif</span>
              </div>
              <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                Pastikan file video utama dan trailer dapat diputar lancar tanpa kendala format.
              </p>
            </div>

            <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
              <div class="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs font-mono uppercase">
                <ImageIcon class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>2. Poster & Banner</span>
              </div>
              <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                Gunakan poster yang tajam, tidak blur, dan merepresentasikan pesan karya secara akurat.
              </p>
            </div>

            <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
              <div class="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono uppercase">
                <ShieldCheck class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>3. Orisinalitas</span>
              </div>
              <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                Pastikan materi revisi tidak melanggar hak kekayaan intelektual pihak lain.
              </p>
            </div>

            <div class="p-3 bg-white dark:bg-stone-800/80 border-2 border-black dark:border-stone-700 shadow-brutal-xs space-y-1">
              <div class="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs font-mono uppercase">
                <FileText class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>4. Data Sinopsis & Kru</span>
              </div>
              <p class="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                Perbarui deskripsi sinopsis, tahun karya, atau anggota tim bila ada perubahan.
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="formError"
          class="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-500 text-red-600 dark:text-red-300 font-medium shadow-brutal-xs"
        >
          {{ formError }}
        </div>

        <ArchiveUploadForm
          :initialData="initialData"
          :isEdit="true"
          :loading="saving"
          @submit="handleSubmit"
          @cancel="handleCancel"
          @error="handleError"
        />
      </template>
    </main>
  </PageLayout>
</template>
