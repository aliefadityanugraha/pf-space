<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import FilmForm from '@/components/FilmForm.vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Upload Karya Baru - PF Space'
})

const router = useRouter()
const loading = ref(false)
const formError = ref('')
const { toast, showToast } = useToast()

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

  loading.value = true
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

    await api.post('/api/films', payload)
    showToast('success', 'Film berhasil disubmit! Menunggu review admin.')
    
    setTimeout(() => {
      router.push('/my-films')
    }, 1500)
  } catch (err) {
    formError.value = err.message || 'Gagal menyimpan film'
    showToast('error', formError.value)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/my-films')
}

const handleError = (message) => {
    showToast('error', message)
}
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
          <h1 class="text-3xl md:text-4xl font-display text-stone-900">Upload Film Baru</h1>
          <p class="text-stone-500">Film akan direview oleh admin sebelum dipublikasi.</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="formError" class="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600">
        {{ formError }}
      </div>

      <div class="mb-6 p-4 bg-stone-50 border-2 border-stone-300 rounded-lg flex gap-3">
        <div class="mt-1">
          <AlertTriangle class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p class="font-semibold text-stone-900 mb-2">Panduan kualitas dan kurasi PF Space</p>
          <ul class="list-disc pl-5 text-sm text-stone-700 space-y-1">
            <li>Pastikan resolusi video minimal 720p dengan audio yang jelas dan seimbang.</li>
            <li>Hindari konten yang mengandung ujaran kebencian, SARA, atau pelanggaran etika kampus.</li>
            <li>Gunakan poster dan judul yang relevan dengan isi film dan mudah dipahami.</li>
            <li>Pastikan Anda memiliki hak tayang dan distribusi daring untuk seluruh materi di dalam film.</li>
            <li>Lengkapi sinopsis, tahun produksi, dan data kru utama agar proses kurasi lebih cepat.</li>
          </ul>
        </div>
      </div>

      <FilmForm 
        :loading="loading" 
        @submit="handleSubmit" 
        @cancel="handleCancel"
        @error="handleError"
      />
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
