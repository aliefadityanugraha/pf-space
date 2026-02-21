<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { useFilmForm } from '@/composables/useFilmForm'
import ArchiveUploadForm from '@/components/ArchiveUploadForm.vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Upload Karya Baru - PF Space'
})

const router = useRouter()
const { showToast } = useToast()
const { loading: localLoading, error: formError, submitFilm } = useFilmForm()

const handleSubmit = async (formData) => {
  await submitFilm(formData)
}

const handleCancel = () => {
  router.push({ name: 'MyArchive' })
}

const handleError = (message) => {
    showToast(message, 'error')
}
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
          <h1 class="text-3xl md:text-4xl font-display text-stone-900">Upload Film Baru</h1>
          <p class="text-stone-500">Film akan direview oleh admin sebelum dipublikasi.</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="formError" class="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600">
        {{ formError }}
      </div>

      <div class="mb-6 p-4 bg-stone-50 border-2 border-stone-300 rounded-lg flex gap-3">
        <div class="mt-1 shrink-0">
          <AlertTriangle class="w-5 h-5 text-amber-600" />
        </div>
        <div class="min-w-0">
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
