import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { useToast } from '@/composables/useToast'

export function useFilmForm() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const loading = ref(false)
  const error = ref('')

  const submitFilm = async (formData, filmId = null, customSuccessMessage = null) => {
    error.value = ''
    
    // Basic validation
    if (!formData.judul?.trim()) {
      error.value = 'Judul film wajib diisi'
      showToast('error', error.value)
      return false
    }
    if (!formData.category_id) {
      error.value = 'Kategori wajib dipilih'
      showToast('error', error.value)
      return false
    }

    loading.value = true
    try {
      // Clean crew data
      const cleanCrew = formData.crew
        ?.filter(c => c.jabatan && c.jabatan.trim())
        .map(c => ({
          jabatan: c.jabatan.trim(),
          anggota: c.anggota.filter(a => a && a.trim())
        })) || []

      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        tahun_karya: parseInt(formData.tahun_karya),
        crew: cleanCrew.length > 0 ? cleanCrew : null
      }

      if (filmId) {
        // Update
        await api.put(`/api/films/${filmId}`, payload)
        showToast('success', customSuccessMessage || 'Film berhasil diperbarui!')
      } else {
        // Create
        await api.post('/api/films', payload)
        showToast('success', customSuccessMessage || 'Film berhasil disubmit! Menunggu review admin.')
      }
      
      setTimeout(() => {
        router.push('/my-films')
      }, 1500)
      
      return true
    } catch (err) {
      error.value = err.message || 'Gagal menyimpan film'
      showToast('error', error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    submitFilm
  }
}
