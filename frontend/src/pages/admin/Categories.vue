<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader.vue'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Pencil, Trash2, Loader2, FolderOpen, X, Save, 
  AlertTriangle, Search, Film, ExternalLink
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()

// Data states
const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editingCategory = ref(null)
const formData = ref({ nama_kategori: '', deskripsi: '' })
const formError = ref('')

// Confirm delete dialog state
const showConfirm = ref(false)
const categoryToDelete = ref(null)

// Lock body scroll on modals
const updateBodyScroll = () => {
  if (showModal.value || showConfirm.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Fetch categories with film counts
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/categories/with-count')
    if (Array.isArray(res)) {
      categories.value = res
    } else if (res?.data && Array.isArray(res.data)) {
      categories.value = res.data
    } else if (res?.success && Array.isArray(res.data)) {
      categories.value = res.data
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    showToast('Gagal memuat kategori', 'error')
  } finally {
    loading.value = false
  }
}

// Filtered categories by search query
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const q = searchQuery.value.toLowerCase().trim()
  return categories.value.filter(cat => 
    cat.nama_kategori?.toLowerCase().includes(q) ||
    cat.deskripsi?.toLowerCase().includes(q)
  )
})

// Navigate to Archives filtered by this category
const viewCategoryArchives = (category) => {
  router.push({
    path: '/admin/archives',
    query: { category_id: category.category_id }
  })
}

// Open modal for create/edit
const openModal = (category = null) => {
  editingCategory.value = category
  formData.value = category 
    ? { nama_kategori: category.nama_kategori, deskripsi: category.deskripsi || '' }
    : { nama_kategori: '', deskripsi: '' }
  formError.value = ''
  showModal.value = true
  updateBodyScroll()
}

// Close modal
const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
  formData.value = { nama_kategori: '', deskripsi: '' }
  formError.value = ''
  updateBodyScroll()
}

// Save category
const saveCategory = async () => {
  if (!formData.value.nama_kategori.trim()) {
    formError.value = 'Nama kategori wajib diisi'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    if (editingCategory.value) {
      await api.put(`/api/categories/${editingCategory.value.category_id}`, formData.value)
      showToast('Kategori berhasil diperbarui', 'success')
    } else {
      await api.post('/api/categories', formData.value)
      showToast('Kategori berhasil ditambahkan', 'success')
    }
    closeModal()
    await fetchCategories()
  } catch (err) {
    formError.value = err.message || 'Gagal menyimpan kategori'
  } finally {
    saving.value = false
  }
}

// Open delete confirmation
const confirmDelete = (category) => {
  categoryToDelete.value = category
  showConfirm.value = true
  updateBodyScroll()
}

// Close delete confirmation
const closeConfirm = () => {
  showConfirm.value = false
  categoryToDelete.value = null
  updateBodyScroll()
}

// Execute delete
const executeDelete = async () => {
  if (!categoryToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/api/categories/${categoryToDelete.value.category_id}`)
    showToast(`Kategori "${categoryToDelete.value.nama_kategori}" berhasil dihapus`, 'success')
    closeConfirm()
    await fetchCategories()
  } catch (err) {
    showToast(err.message || 'Gagal menghapus kategori', 'error')
  } finally {
    deleting.value = false
  }
}

// Keyboard shortcuts
const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    if (showModal.value) closeModal()
    if (showConfirm.value) closeConfirm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  fetchCategories()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 text-stone-900 dark:text-stone-100">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">
        Kategori Film
      </Badge>
    </nav>

    <!-- Page Header with Main Action -->
    <PageHeader 
      title="Kelola Kategori" 
      description="Kelola kategori karya untuk mengorganisir arsip film siswa."
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <button 
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold bg-brand-teal hover:bg-teal-600 active:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          @click="openModal()"
        >
          <Plus class="w-4 h-4 stroke-[2.5] text-white" />
          Tambah Kategori
        </button>
      </template>
    </PageHeader>

    <!-- Main Categories Table Card -->
    <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
      <!-- Toolbar Header -->
      <CardHeader class="py-3 px-4 md:px-6 bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- Title & Icon (Styled like Archives.vue) -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs shrink-0">
              <FolderOpen class="w-4 h-4 stroke-[2.5]" />
            </div>
            <div class="flex items-center gap-2.5">
              <CardTitle class="text-sm md:text-base font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Daftar Kategori
              </CardTitle>
              <span class="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-mono font-black bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs">
                {{ categories.length }}
              </span>
            </div>
          </div>

          <!-- Compact Search Bar (Identical to Archives.vue) -->
          <div class="relative w-full sm:w-72">
            <Search class="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              v-model="searchQuery" 
              placeholder="Cari kategori..." 
              class="pl-9 pr-8 text-xs h-9 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
            />
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-brand-teal dark:text-teal-400" />
          <p class="text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-300 font-bold animate-pulse">
            Memuat Kategori...
          </p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCategories.length === 0" class="text-center py-14 px-4">
          <div class="w-12 h-12 mx-auto mb-3 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-200 flex items-center justify-center text-stone-400 dark:text-stone-500">
            <FolderOpen class="w-6 h-6 text-brand-teal dark:text-teal-400" />
          </div>
          <p class="font-bold text-sm text-stone-800 dark:text-stone-200">
            {{ searchQuery ? 'Kategori tidak ditemukan' : 'Belum ada kategori' }}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            {{ searchQuery ? `Tidak ditemukan kategori yang sesuai dengan "${searchQuery}".` : 'Tambahkan kategori baru untuk mengelompokkan arsip karya film.' }}
          </p>
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="mt-3 px-3 py-1.5 text-xs font-bold text-brand-teal dark:text-teal-400 hover:underline font-mono inline-flex items-center gap-1"
          >
            <X class="w-3 h-3" /> Hapus Pencarian
          </button>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <!-- Table Head -->
          <div class="grid grid-cols-12 gap-3 px-4 md:px-6 py-2.5 bg-stone-200/70 dark:bg-stone-800/60 border-b-2 border-black dark:border-stone-200 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            <div class="col-span-4 md:col-span-4">Nama Kategori</div>
            <div class="col-span-5 md:col-span-5">Deskripsi</div>
            <div class="col-span-3 md:col-span-1 text-center">Karya</div>
            <div class="col-span-12 md:col-span-2 text-right">Aksi</div>
          </div>

          <!-- Table Body Rows (Clean Teal Theme matching Archives) -->
          <div 
            v-for="category in filteredCategories" 
            :key="category.category_id"
            class="grid grid-cols-12 gap-3 px-4 md:px-6 py-3.5 items-center border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <!-- Nama Kategori with Clean Teal Icon -->
            <div class="col-span-4 md:col-span-4 flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs flex-shrink-0">
                <Film class="w-3.5 h-3.5" />
              </div>
              <span class="font-bold text-xs md:text-sm text-stone-900 dark:text-stone-100 truncate">
                {{ category.nama_kategori }}
              </span>
            </div>

            <!-- Deskripsi -->
            <div class="col-span-5 md:col-span-5 text-xs text-stone-600 dark:text-stone-300">
              <p class="line-clamp-2" :title="category.deskripsi || '-'">
                {{ category.deskripsi || '-' }}
              </p>
            </div>

            <!-- Jumlah Karya -->
            <div class="col-span-3 md:col-span-1 flex justify-center">
              <button 
                type="button"
                @click="viewCategoryArchives(category)"
                class="font-mono text-xs font-bold px-2.5 py-0.5 border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px]"
                :class="(category.film_count || 0) > 0 
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-black dark:border-stone-300 hover:bg-amber-200 dark:hover:bg-amber-900' 
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'"
                :title="`Buka arsip film untuk kategori ${category.nama_kategori}`"
              >
                {{ category.film_count || 0 }}
              </button>
            </div>

            <!-- Aksi Buttons -->
            <div class="col-span-12 md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0">
              <!-- Edit Button -->
              <button 
                type="button"
                @click="openModal(category)"
                class="p-1.5 bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                title="Edit Kategori"
              >
                <Pencil class="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              <!-- Delete Button -->
              <button 
                type="button"
                @click="confirmDelete(category)"
                class="p-1.5 bg-white dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                title="Hapus Kategori"
              >
                <Trash2 class="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create / Edit Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div 
        class="absolute inset-0 bg-black/60 backdrop-blur-xs" 
        @click="closeModal"
      ></div>

      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-md mx-auto text-stone-900 dark:text-stone-100 z-10">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b-2 border-black dark:border-stone-200 bg-stone-100 dark:bg-stone-800">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-amber-500/20 border border-brand-orange flex items-center justify-center text-brand-orange dark:text-amber-300">
              <FolderOpen class="w-3.5 h-3.5" />
            </div>
            <h2 class="font-bold text-sm md:text-base text-stone-900 dark:text-stone-100">
              {{ editingCategory ? 'Edit Kategori' : 'Tambah Kategori' }}
            </h2>
          </div>
          <button 
            type="button"
            @click="closeModal" 
            class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="saveCategory" class="p-5 space-y-4">
          <div 
            v-if="formError" 
            class="p-2.5 bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-red-600 dark:text-red-400 text-xs font-bold"
          >
            {{ formError }}
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-800 dark:text-stone-200">
              Nama Kategori <span class="text-brand-red">*</span>
            </label>
            <Input 
              v-model="formData.nama_kategori" 
              placeholder="Contoh: Film Pendek, Dokumenter..." 
              class="text-xs h-9 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 rounded-none focus:ring-0 focus:border-brand-orange"
              autofocus
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-800 dark:text-stone-200">
              Deskripsi
            </label>
            <Input 
              v-model="formData.deskripsi" 
              placeholder="Deskripsi singkat kategori" 
              class="text-xs h-9 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 rounded-none focus:ring-0 focus:border-brand-orange"
            />
          </div>

          <div class="flex items-center gap-2.5 pt-2">
            <button 
              type="button" 
              class="flex-1 py-2 text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-200 cursor-pointer"
              @click="closeModal"
            >
              Batal
            </button>
            <button 
              type="submit" 
              class="flex-1 py-2 text-xs font-bold bg-brand-teal hover:bg-teal-600 active:bg-teal-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              :disabled="saving"
            >
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin text-white" />
              <Save v-else class="w-3.5 h-3.5 stroke-[2] text-white" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div 
      v-if="showConfirm" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div 
        class="absolute inset-0 bg-black/60 backdrop-blur-xs" 
        @click="closeConfirm"
      ></div>

      <div class="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal w-full max-w-sm mx-auto text-stone-900 dark:text-stone-100 z-10">
        <div class="flex items-center justify-between px-5 py-3.5 border-b-2 border-black dark:border-stone-200 bg-red-50 dark:bg-red-950/70">
          <div class="flex items-center gap-2.5">
            <AlertTriangle class="w-4 h-4 text-brand-red flex-shrink-0" />
            <h2 class="font-bold text-sm md:text-base text-red-800 dark:text-red-200">
              Hapus Kategori
            </h2>
          </div>
          <button 
            type="button"
            @click="closeConfirm" 
            class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-900 dark:text-red-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <p class="text-xs md:text-sm text-stone-600 dark:text-stone-300">
            Apakah Anda yakin ingin menghapus kategori <span class="font-bold text-stone-900 dark:text-stone-100">"{{ categoryToDelete?.nama_kategori }}"</span>?
          </p>

          <div 
            v-if="categoryToDelete && (categoryToDelete.film_count || 0) > 0"
            class="p-2.5 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-500 text-amber-900 dark:text-amber-200 text-xs"
          >
            Kategori ini memiliki <strong>{{ categoryToDelete.film_count }} karya</strong> terhubung.
          </div>

          <div class="flex items-center gap-2.5 pt-1">
            <button 
              type="button" 
              class="flex-1 py-2 text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-200 cursor-pointer"
              @click="closeConfirm"
              :disabled="deleting"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="flex-1 py-2 text-xs font-bold bg-brand-red hover:bg-red-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              @click="executeDelete"
              :disabled="deleting"
            >
              <Loader2 v-if="deleting" class="w-3.5 h-3.5 animate-spin text-white" />
              <Trash2 v-else class="w-3.5 h-3.5 text-white" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
