<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, Film, Plus, Trash2, Loader2, Send, Save,
  CheckCircle, X
} from 'lucide-vue-next'
import RichTextEditor from '@/components/RichTextEditor.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'error'])

const categories = ref([])
const uploading = ref(false)
const localLoading = ref(false)

// Form data
const form = ref({
  judul: '',
  category_id: '',
  sinopsis: '',
  tahun_karya: new Date().getFullYear(),
  link_video_utama: '',
  link_trailer: '',
  gambar_poster: '',
  banner_url: '',
  deskripsi_lengkap: '',
  file_naskah: '',
  file_storyboard: '',
  file_rab: '',
  crew: [{ jabatan: '', anggota: [''] }]
})

// Initialize form when initialData changes or on mount
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Merge initial data into form
    Object.keys(form.value).forEach(key => {
      if (newData[key] !== undefined && newData[key] !== null) {
        // Handle crew specifically if needed, otherwise direct assignment works for most
        if (key === 'crew' && Array.isArray(newData[key])) {
             if (newData[key].length > 0) {
                form.value.crew = JSON.parse(JSON.stringify(newData[key]))
             } else {
                 form.value.crew = [{ jabatan: '', anggota: [''] }]
             }
        } else {
          form.value[key] = newData[key]
        }
      }
    })
    
    // Ensure category_id is handled correctly (sometimes it might be an object or int)
    if (newData.category?.category_id) {
        form.value.category_id = newData.category.category_id
    }
  }
}, { immediate: true })

const handleFileUpload = async (event, fieldName) => {
  const file = event.target.files[0]
  if (!file) return

  // Validasi ukuran
  const isVideo = file.type.startsWith('video/')
  const limit = isVideo ? 1024 * 1024 * 1024 : 10 * 1024 * 1024 // 1GB for video, 10MB for others

  if (file.size > limit) {
    emit('error', `Ukuran file terlalu besar (maksimal ${isVideo ? '1GB' : '10MB'})`)
    event.target.value = '' 
    return
  }

  // Validasi tipe file jika perlu (misal poster harus gambar)
  if (fieldName === 'gambar_poster' && !file.type.startsWith('image/')) {
    emit('error', 'File harus berupa gambar')
    event.target.value = ''
    return
  }

  if ((fieldName === 'link_video_utama' || fieldName === 'link_trailer') && !file.type.startsWith('video/')) {
    emit('error', 'File harus berupa video (MP4, WebM, etc)')
    event.target.value = ''
    return
  }
  
  if ((fieldName === 'file_naskah' || fieldName === 'file_storyboard' || fieldName === 'file_rab') && file.type !== 'application/pdf') {
     emit('error', 'File harus berupa PDF')
     event.target.value = ''
     return
  }

  const formData = new FormData()
  formData.append('file', file)

  uploading.value = true
  try {
    const res = await api.upload('/api/upload', formData)
    
    if (res.success) {
      form.value[fieldName] = res.data.url
      // We don't show toast here, we let parent handle success or just show visual feedback
    }
  } catch (err) {
    console.error('Upload failed:', err)
    emit('error', 'Gagal mengupload file: ' + (err.message || 'Server error'))
    event.target.value = '' // Reset input pada error
  } finally {
    uploading.value = false
  }
}

// Fetch categories
const fetchCategories = async () => {
  localLoading.value = true
  try {
    const res = await api.get('/api/categories')
    categories.value = res.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    emit('error', 'Gagal mengambil data kategori')
  } finally {
    localLoading.value = false
  }
}

// Crew management
const addCrew = () => {
  form.value.crew.push({ jabatan: '', anggota: [''] })
}

const removeCrew = (index) => {
  form.value.crew.splice(index, 1)
}

const addCrewMember = (crewIndex) => {
  form.value.crew[crewIndex].anggota.push('')
}

const removeCrewMember = (crewIndex, memberIndex) => {
  form.value.crew[crewIndex].anggota.splice(memberIndex, 1)
}

const handleSubmit = () => {
  emit('submit', form.value)
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <!-- Basic Info -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <Film class="w-5 h-5" /> Informasi Dasar
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold mb-2">Judul Film *</label>
            <Input v-model="form.judul" placeholder="Masukkan judul film" />
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Kategori *</label>
            <select 
              v-model="form.category_id"
              class="w-full h-10 px-3 border-2 border-black bg-white text-sm"
            >
              <option value="">Pilih kategori</option>
              <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id">
                {{ cat.nama_kategori }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Tahun Karya</label>
            <Input v-model="form.tahun_karya" type="number" min="1900" :max="new Date().getFullYear()" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold mb-2">Sinopsis</label>
            <textarea 
              v-model="form.sinopsis"
              rows="4"
              placeholder="Ceritakan sinopsis film..."
              class="w-full p-3 border-2 border-black bg-white text-sm resize-none"
            ></textarea>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Links -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <Upload class="w-5 h-5" /> Link Video
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Video Utama (MP4/WebM)</label>
            <div class="space-y-3">
               <div v-if="form.link_video_utama" class="relative w-full bg-stone-100 border border-stone-300 rounded p-3 flex items-center gap-2">
                  <Film class="w-5 h-5 text-stone-500 shrink-0" />
                  <span class="text-xs text-stone-600 truncate flex-1">{{ form.link_video_utama.split('/').pop() }}</span>
                   <button 
                    type="button" 
                    @click="form.link_video_utama = ''"
                    class="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X class="w-4 h-4" />
                  </button>
               </div>
               <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="video/*"
                  @change="(e) => handleFileUpload(e, 'link_video_utama')"
                  class="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-brand-teal file:text-white hover:file:bg-teal-700 cursor-pointer"
                  :disabled="uploading"
                />
               </div>
               <p class="text-xs text-stone-500">Format: MP4, WebM. Max 1GB.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Video Trailer (MP4/WebM)</label>
            <div class="space-y-3">
               <div v-if="form.link_trailer" class="relative w-full bg-stone-100 border border-stone-300 rounded p-3 flex items-center gap-2">
                  <Film class="w-5 h-5 text-stone-500 shrink-0" />
                  <span class="text-xs text-stone-600 truncate flex-1">{{ form.link_trailer.split('/').pop() }}</span>
                   <button 
                    type="button" 
                    @click="form.link_trailer = ''"
                    class="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X class="w-4 h-4" />
                  </button>
               </div>
               <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="video/*"
                  @change="(e) => handleFileUpload(e, 'link_trailer')"
                  class="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-brand-teal file:text-white hover:file:bg-teal-700 cursor-pointer"
                  :disabled="uploading"
                />
               </div>
               <p class="text-xs text-stone-500">Format: MP4, WebM. Max 1GB.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Visual Assets -->
    <Card>
      <CardContent class="p-6 space-y-4">
        <h2 class="text-xl font-bold mb-4">Visual & Dokumen</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold mb-2">Gambar Poster</label>
            <div class="space-y-3">
              <div v-if="form.gambar_poster" class="relative w-40 h-60 bg-stone-100 border border-stone-300 rounded overflow-hidden">
                <img :src="form.gambar_poster" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click="form.gambar_poster = ''"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
              
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  @change="(e) => handleFileUpload(e, 'gambar_poster')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-brand-teal file:text-white
                    hover:file:bg-teal-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <Loader2 v-if="uploading" class="w-5 h-5 animate-spin text-stone-400" />
              </div>
              <p class="text-xs text-stone-500">Format: JPG, PNG. Max 10MB.</p>
            </div>

            <div class="mt-6">
              <label class="block text-sm font-bold mb-2">Gambar Banner (Opsional)</label>
              <div class="space-y-3">
                <div v-if="form.banner_url" class="relative w-full h-32 bg-stone-100 border border-stone-300 rounded overflow-hidden">
                  <img :src="form.banner_url" class="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    @click="form.banner_url = ''"
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                
                <div class="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    @change="(e) => handleFileUpload(e, 'banner_url')"
                    class="block w-full text-sm text-stone-500
                      file:mr-4 file:py-2 file:px-4
                      file:border-0 file:text-sm file:font-semibold
                      file:bg-brand-teal file:text-white
                      hover:file:bg-teal-700
                      cursor-pointer"
                    :disabled="uploading"
                  />
                </div>
                <p class="text-xs text-stone-500">
                  Format: JPG, PNG. Rekomendasi: 1920x1080px (Landscape) untuk Carousel.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2">File Naskah (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_naskah')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_naskah" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_naskah" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_naskah.split('/').pop() }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2">File Storyboard (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_storyboard')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_storyboard" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_storyboard" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_storyboard.split('/').pop() }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2">File RAB (PDF)</label>
              <div class="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".pdf"
                  @change="(e) => handleFileUpload(e, 'file_rab')"
                  class="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-stone-800 file:text-white
                    hover:file:bg-stone-700
                    cursor-pointer"
                  :disabled="uploading"
                />
                <CheckCircle v-if="form.file_rab" class="w-5 h-5 text-green-500" />
              </div>
              <p v-if="form.file_rab" class="text-xs text-green-600 mt-1 truncate">
                File terupload: {{ form.file_rab.split('/').pop() }}
              </p>
            </div>
          </div>

          <div class="md:col-span-2 mt-4">
            <label class="block text-sm font-bold mb-2">Informasi Tambahan (Backstory, Director Statement, dll)</label>
            <RichTextEditor 
              v-model="form.deskripsi_lengkap"
              placeholder="Ceritakan sejarah pembuatan film, statement sutradara, atau info menarik lainnya..."
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Crew -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Crew Film</h2>
          <Button type="button" variant="outline" size="sm" @click="addCrew" class="gap-1">
            <Plus class="w-4 h-4" /> Tambah Jabatan
          </Button>
        </div>

        <div class="space-y-4">
          <div v-for="(crew, crewIdx) in form.crew" :key="crewIdx" class="p-4 bg-stone-100 border border-stone-300">
            <div class="flex items-center gap-2 mb-3">
              <Input 
                v-model="crew.jabatan" 
                placeholder="Jabatan (cth: Sutradara, Penulis)"
                class="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                class="text-red-600"
                @click="removeCrew(crewIdx)"
                v-if="form.crew.length > 1"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <div class="space-y-2 ml-4">
              <div v-for="(member, memberIdx) in crew.anggota" :key="memberIdx" class="flex items-center gap-2">
                <span class="text-xs text-stone-500 w-4">{{ memberIdx + 1 }}.</span>
                <Input 
                  v-model="crew.anggota[memberIdx]" 
                  placeholder="Nama anggota"
                  class="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  @click="removeCrewMember(crewIdx, memberIdx)"
                  v-if="crew.anggota.length > 1"
                >
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                @click="addCrewMember(crewIdx)"
                class="text-xs"
              >
                + Tambah Anggota
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Submit -->
    <div class="flex gap-4 justify-end">
      <Button type="button" variant="outline" @click="$emit('cancel')">
        Batal
      </Button>
      <Button type="submit" :disabled="loading || uploading" class="gap-2">
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Save v-if="isEdit" class="w-4 h-4" />
          <Send v-else class="w-4 h-4" />
        </template>
        {{ isEdit ? 'Simpan Perubahan' : 'Submit untuk Review' }}
      </Button>
    </div>
  </form>
</template>