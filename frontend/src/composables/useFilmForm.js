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
      showToast(error.value, 'error')
      return false
    }
    if (!formData.category_id) {
      error.value = 'Kategori wajib dipilih'
      showToast(error.value, 'error')
      return false
    }

    loading.value = true
    try {
      // Clean crew data
      // Clean crew data - ensure crew is an array before processing
      const crewData = Array.isArray(formData.crew) ? formData.crew : [];
      
      const cleanCrew = crewData
        .filter(c => c && typeof c === 'object' && c.jabatan && typeof c.jabatan === 'string' && c.jabatan.trim())
        .map(c => ({
          jabatan: c.jabatan.trim(),
          anggota: Array.isArray(c.anggota) 
            ? c.anggota.filter(a => a && typeof a === 'string' && a.trim()) 
            : []
        }))

      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        tahun_karya: parseInt(formData.tahun_karya),
        crew: cleanCrew.length > 0 ? cleanCrew : null
      }

      if (filmId) {
        // Update
        await api.put(`/api/films/${filmId}`, payload)
        showToast(customSuccessMessage || 'Film berhasil diperbarui!')
      } else {
        // Create
        await api.post('/api/films', payload)
        showToast(customSuccessMessage || 'Film berhasil disubmit! Menunggu review admin.')
      }
      
      setTimeout(() => {
        router.push({ name: 'MyArchive' })
      }, 1500)
      
      return true
    } catch (err) {
      // Better error mapping for nested validation
      if (err.data && Array.isArray(err.data.details) && err.data.details.length > 0) {
        error.value = err.data.details[0].message
      } else {
        error.value = err.message || 'Gagal menyimpan film'
      }
      showToast(error.value, 'error')
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
