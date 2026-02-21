<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useFilmForm } from '@/composables/useFilmForm'
import ArchiveUploadForm from '@/components/ArchiveUploadForm.vue'

const router = useRouter()
const route = useRoute()
const filmSlug = route.params.slug

const loading = ref(true)
const originalStatus = ref('')
const filmId = ref(null)
const initialData = ref(null)

const { showToast } = useToast()
const { loading: saving, error: formError, submitFilm } = useFilmForm()

// Fetch film data by slug
const fetchFilm = async () => {
  loading.value = true
  try {
    const res = await api.get(`/api/films/${filmSlug}`)
    const film = res.data
    
    filmId.value = film.film_id
    originalStatus.value = film.status
    
    initialData.value = {
      judul: film.judul || '',
      category_id: film.category_id || '',
      sinopsis: film.sinopsis || '',
      tahun_karya: film.tahun_karya || new Date().getFullYear(),
      link_video_utama: film.link_video_utama || '',
      link_trailer: film.link_trailer || '',
      link_bts: film.link_bts || '',
      gambar_poster: film.gambar_poster || '',
      banner_url: film.banner_url || '',
      deskripsi_lengkap: film.deskripsi_lengkap || '',
      file_naskah: film.file_naskah || '',
      file_storyboard: film.file_storyboard || '',
      file_rab: film.file_rab || '',
      crew: film.crew && film.crew.length > 0 
        ? film.crew 
        : [{ jabatan: '', anggota: [''] }]
    }
    
  } catch (err) {
    showToast('Gagal memuat data karya', 'error')
    router.push('/my-archive')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  let msg = 'Karya berhasil diperbarui!'
  if (originalStatus.value === 'published') {
    msg = 'Karya diupdate! Status berubah ke "Menunggu Review".'
  }
  await submitFilm(formData, filmId.value, msg)
}

const handleCancel = () => {
  router.push('/my-archive')
}

const handleError = (message) => {
    showToast(message, 'error')
}

onMounted(() => {
  fetchFilm()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-brand-cream">
    <Navbar />

    <main class="w-full max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" @click="handleCancel">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <div>
          <h1 class="text-3xl md:text-4xl font-display text-stone-900">Edit Karya</h1>
          <p class="text-stone-500">Perubahan pada karya yang sudah dipublikasi akan memerlukan review ulang.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
      </div>

      <template v-else>
        <div v-if="originalStatus === 'published' || originalStatus === 'rejected'" class="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="font-bold text-yellow-800">Perhatian</p>
            <p class="text-sm text-yellow-700">
              Karya ini sudah {{ originalStatus === 'published' ? 'dipublikasi' : 'ditolak' }}. 
              Jika kamu menyimpan perubahan, status akan berubah menjadi "Menunggu Review" dan karya tidak akan tampil di beranda sampai disetujui kembali.
            </p>
          </div>
        </div>

        <div class="mb-6 p-4 bg-stone-50 border-2 border-stone-300 rounded-lg flex gap-3">
          <div class="mt-1 shrink-0">
            <AlertTriangle class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-stone-900 mb-2">Panduan kurasi saat merevisi karya</p>
            <ul class="list-disc pl-5 text-sm text-stone-700 space-y-1">
              <li>Perbaiki catatan penolakan admin terkait audio, visual, atau durasi bila ada.</li>
              <li>Pastikan link video utama dan trailer masih aktif dan dapat diputar tanpa batasan.</li>
              <li>Perbarui sinopsis, tahun produksi, dan data kru jika terjadi perubahan signifikan.</li>
              <li>Gunakan poster yang jelas, tidak blur, dan merepresentasikan tema karya.</li>
              <li>Pastikan seluruh materi tidak melanggar hak cipta dan etika kampus.</li>
            </ul>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="formError" class="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600">
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

    <Footer />
  </div>
</template>
