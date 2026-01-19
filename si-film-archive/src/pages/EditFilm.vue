<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import FilmForm from '@/components/FilmForm.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const filmSlug = route.params.slug

const loading = ref(true)
const saving = ref(false)
const originalStatus = ref('')
const filmId = ref(null)
const initialData = ref(null)

const formError = ref('')
const { toast, showToast } = useToast()

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
    
    // Pass category object if needed for mapping, but we extract ID in form
    // Actually we just need to ensure category_id is set.
    // The FilmForm watcher handles merging.
    
  } catch (err) {
    showToast('error', 'Gagal memuat data film')
    router.push('/my-films')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (formData) => {
  formError.value = ''
  
  if (!formData.judul.trim()) {
    formError.value = 'Judul film wajib diisi'
    showToast('error', formError.value)
    return
  }
  if (!formData.category_id) {
    formError.value = 'Kategori wajib dipilih'
    showToast('error', formError.value)
    return
  }
  if (!filmId.value) {
    formError.value = 'Film tidak ditemukan'
    showToast('error', formError.value)
    return
  }

  saving.value = true
  try {
    const cleanCrew = formData.crew
      .filter(c => c.jabatan.trim())
      .map(c => ({
        jabatan: c.jabatan.trim(),
        anggota: c.anggota.filter(a => a.trim())
      }))

    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id),
      tahun_karya: parseInt(formData.tahun_karya),
      crew: cleanCrew.length > 0 ? cleanCrew : null
    }

    await api.put(`/api/films/${filmId.value}`, payload)
    
    if (originalStatus.value === 'published') {
      showToast('success', 'Film diupdate! Status berubah ke "Menunggu Review".')
    } else {
      showToast('success', 'Film berhasil diupdate!')
    }
    
    setTimeout(() => {
      router.push('/my-films')
    }, 1500)
  } catch (err) {
    formError.value = err.message || 'Gagal menyimpan film'
    showToast('error', formError.value)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  router.push('/my-films')
}

const handleError = (message) => {
    showToast('error', message)
}

onMounted(() => {
  fetchFilm()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-16">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" @click="handleCancel">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <div>
          <h1 class="text-3xl md:text-4xl font-display text-stone-900">Edit Film</h1>
          <p class="text-stone-500">Perubahan pada film yang sudah dipublikasi akan memerlukan review ulang.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
      </div>

      <template v-else>
        <div v-if="originalStatus === 'published' || originalStatus === 'rejected'" class="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-yellow-800">Perhatian</p>
            <p class="text-sm text-yellow-700">
              Film ini sudah {{ originalStatus === 'published' ? 'dipublikasi' : 'ditolak' }}. 
              Jika kamu menyimpan perubahan, status akan berubah menjadi "Menunggu Review" dan film tidak akan tampil di beranda sampai disetujui kembali.
            </p>
          </div>
        </div>

        <div class="mb-6 p-4 bg-stone-50 border-2 border-stone-300 rounded-lg flex gap-3">
          <div class="mt-1">
            <AlertTriangle class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p class="font-semibold text-stone-900 mb-2">Panduan kurasi saat merevisi film</p>
            <ul class="list-disc pl-5 text-sm text-stone-700 space-y-1">
              <li>Perbaiki catatan penolakan admin terkait audio, visual, atau durasi bila ada.</li>
              <li>Pastikan link video utama dan trailer masih aktif dan dapat diputar tanpa batasan.</li>
              <li>Perbarui sinopsis, tahun produksi, dan data kru jika terjadi perubahan signifikan.</li>
              <li>Gunakan poster yang jelas, tidak blur, dan merepresentasikan tema film.</li>
              <li>Pastikan seluruh materi tidak melanggar hak cipta dan etika kampus.</li>
            </ul>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="formError" class="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600">
          {{ formError }}
        </div>

        <FilmForm 
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

    <!-- Toast -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  </div>
</template>
