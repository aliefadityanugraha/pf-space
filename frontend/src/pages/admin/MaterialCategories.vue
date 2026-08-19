<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  FolderKanban, Plus, Pencil, Trash2, Loader2, Save, X, 
  AlertTriangle, BookOpen, FileText, Video, Film, Star, MonitorPlay, Layers
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()
const loading = ref(true)
const categories = ref([])
const showModal = ref(false)
const editingCategory = ref(null)
const saving = ref(false)
const formError = ref('')

const showConfirm = ref(false)
const categoryToDelete = ref(null)
const deleting = ref(false)

const formData = ref({
  nama_kategori: '',
  slug: '',
  deskripsi: '',
  icon: 'BookOpen',
  urutan: 0
})

const iconOptions = [
  { label: 'Buku / Teori', value: 'BookOpen', icon: BookOpen },
  { label: 'Dokumen / Naskah', value: 'FileText', icon: FileText },
  { label: 'Kamera / Produksi', value: 'Video', icon: Video },
  { label: 'Penyuntingan / Film', value: 'Film', icon: Film },
  { label: 'Apresiasi / Rating', value: 'Star', icon: Star },
  { label: 'Sistem / Tampilan', value: 'MonitorPlay', icon: MonitorPlay },
  { label: 'Lapisan / Umum', value: 'Layers', icon: Layers }
]

const getIconComponent = (iconName) => {
  const found = iconOptions.find(i => i.value === iconName)
  return found ? found.icon : FolderKanban
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/material-categories')
    if (res.success) {
      categories.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch material categories:', err)
    showToast('Gagal memuat daftar kategori materi', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = (category = null) => {
  editingCategory.value = category
  formError.value = ''
  if (category) {
    formData.value = {
      nama_kategori: category.nama_kategori,
      slug: category.slug,
      deskripsi: category.deskripsi || '',
      icon: category.icon || 'BookOpen',
      urutan: category.urutan || 0
    }
  } else {
    formData.value = {
      nama_kategori: '',
      slug: '',
      deskripsi: '',
      icon: 'BookOpen',
      urutan: (categories.value.length + 1)
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
  formError.value = ''
}

const saveCategory = async () => {
  if (!formData.value.nama_kategori.trim()) {
    formError.value = 'Nama kategori wajib diisi'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    if (editingCategory.value) {
      await api.put(`/api/material-categories/${editingCategory.value.category_id}`, formData.value)
      showToast('Kategori materi berhasil diperbarui')
    } else {
      await api.post('/api/material-categories', formData.value)
      showToast('Kategori materi baru berhasil ditambahkan')
    }
    closeModal()
    await fetchCategories()
  } catch (err) {
    console.error('Save material category error:', err)
    formError.value = err.message || 'Gagal menyimpan kategori materi'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category) => {
  categoryToDelete.value = category
  showConfirm.value = true
}

const executeDelete = async () => {
  if (!categoryToDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/api/material-categories/${categoryToDelete.value.category_id}`)
    showToast('Kategori materi berhasil dihapus')
    showConfirm.value = false
    categoryToDelete.value = null
    await fetchCategories()
  } catch (err) {
    console.error('Delete category error:', err)
    showToast(err.message || 'Gagal menghapus kategori', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="p-4 md:p-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/admin" class="text-brand-teal hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800">
        Kategori Materi
      </Badge>
    </nav>

    <!-- Header -->
    <PageHeader 
      title="Kelola Kategori Materi" 
      description="Atur kategori custom untuk pengelompokan dan pemfilteran modul materi pembelajaran."
      :icon="FolderKanban"
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <Button class="gap-2 shadow-brutal hover:shadow-none transition-all" @click="openModal()">
          <Plus class="w-4 h-4" />
          Tambah Kategori
        </Button>
      </template>
    </PageHeader>

    <!-- Categories Table -->
    <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card">
      <CardHeader class="bg-teal-50 dark:bg-teal-950/60 border-b-2 border-stone-800 dark:border-stone-100">
        <div class="flex items-center gap-3">
          <FolderKanban class="w-5 h-5 text-brand-teal dark:text-teal-300" />
          <CardTitle class="text-lg font-bold uppercase text-stone-900 dark:text-stone-100">Daftar Kategori Materi Custom</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-brand-teal" />
          <p class="ml-3 text-stone-500 font-mono uppercase tracking-widest animate-pulse">Memuat Kategori Materi...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="categories.length === 0" class="text-center py-12 text-stone-400">
          <FolderKanban class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Belum ada kategori materi</p>
        </div>

        <!-- Table -->
        <template v-else>
          <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-100 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            <div class="col-span-1 text-center">Urutan</div>
            <div class="col-span-4">Nama Kategori & Slug</div>
            <div class="col-span-4">Deskripsi</div>
            <div class="col-span-1 text-center">Materi</div>
            <div class="col-span-2 text-right">Aksi</div>
          </div>
          <div 
            v-for="cat in categories" 
            :key="cat.category_id" 
            class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
          >
            <!-- Urutan -->
            <div class="md:col-span-1 flex items-center justify-center">
              <span class="w-7 h-7 bg-stone-200 dark:bg-stone-700 border border-stone-800 dark:border-stone-200 rounded font-mono font-bold text-xs flex items-center justify-center text-stone-900 dark:text-stone-100">
                #{{ cat.urutan }}
              </span>
            </div>

            <!-- Nama & Icon -->
            <div class="md:col-span-4 flex items-center gap-3">
              <div class="w-9 h-9 bg-brand-teal/10 dark:bg-teal-950/80 border-2 border-stone-800 dark:border-stone-200 flex items-center justify-center text-brand-teal dark:text-teal-300 shrink-0">
                <component :is="getIconComponent(cat.icon)" class="w-5 h-5" />
              </div>
              <div>
                <span class="font-bold text-stone-900 dark:text-stone-100 block text-sm">{{ cat.nama_kategori }}</span>
                <span class="text-xs text-stone-500 font-mono">/{{ cat.slug }}</span>
              </div>
            </div>

            <!-- Deskripsi -->
            <div class="md:col-span-4 text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
              {{ cat.deskripsi || '-' }}
            </div>

            <!-- Jumlah Materi -->
            <div class="md:col-span-1 text-center">
              <Badge variant="secondary" class="font-mono font-bold bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                {{ cat.material_count || 0 }} Materi
              </Badge>
            </div>

            <!-- Aksi -->
            <div class="md:col-span-2 flex gap-2 md:justify-end">
              <Button variant="outline" size="sm" @click="openModal(cat)" title="Edit Kategori">
                <Pencil class="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" class="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60" @click="confirmDelete(cat)" title="Hapus Kategori">
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-md mx-4 text-stone-900 dark:text-stone-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800">
          <h2 class="font-bold text-lg font-display uppercase tracking-tight">
            {{ editingCategory ? 'Edit Kategori Materi' : 'Tambah Kategori Materi' }}
          </h2>
          <button @click="closeModal" class="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="saveCategory" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/60 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
            {{ formError }}
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Nama Kategori *</label>
            <Input v-model="formData.nama_kategori" placeholder="Contoh: Produksi & Sinematografi" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Deskripsi Singkat</label>
            <textarea 
              v-model="formData.deskripsi" 
              rows="3" 
              placeholder="Jelaskan ringkasan materi dalam kategori ini..." 
              class="w-full p-2.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
            ></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Ikon Kategori</label>
              <select 
                v-model="formData.icon"
                class="w-full p-2 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none"
              >
                <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest mb-1.5">Urutan Tampilan</label>
              <Input v-model="formData.urutan" type="number" min="0" />
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <Button type="button" variant="outline" class="flex-1" @click="closeModal">Batal</Button>
            <Button type="submit" class="flex-1 gap-2" :disabled="saving">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showConfirm = false"></div>
      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-sm mx-4 text-stone-900 dark:text-stone-100 overflow-hidden animate-in fade-in duration-200">
        <div class="flex items-center gap-3 px-6 py-4 border-b-2 border-black dark:border-stone-100 bg-red-50 dark:bg-red-950/60">
          <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 class="font-bold text-lg text-red-800 dark:text-red-300">Hapus Kategori Materi</h2>
        </div>
        <div class="p-6">
          <p class="text-stone-600 dark:text-stone-300 mb-6 text-sm">
            Apakah Anda yakin ingin menghapus kategori <strong>"{{ categoryToDelete?.nama_kategori }}"</strong>?
          </p>
          <div class="flex gap-3">
            <Button type="button" variant="outline" class="flex-1" @click="showConfirm = false" :disabled="deleting">
              Batal
            </Button>
            <Button type="button" class="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white" @click="executeDelete" :disabled="deleting">
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
              Hapus
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
