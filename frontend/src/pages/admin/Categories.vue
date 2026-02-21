<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Pencil, Trash2, Loader2, FolderOpen, X, Save, AlertTriangle, CheckCircle, XCircle
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const sidebarCollapsed = ref(false)
const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Modal state
const showModal = ref(false)
const editingCategory = ref(null)
const formData = ref({ nama_kategori: '', deskripsi: '' })
const formError = ref('')

// Confirm dialog state
const showConfirm = ref(false)
const confirmData = ref({ title: '', message: '', onConfirm: null })

// Toast/Alert state
const { toast, showToast } = useToast()

// Show confirm dialog
const showConfirmDialog = (title, message) => {
  return new Promise((resolve) => {
    confirmData.value = { title, message, onConfirm: () => resolve(true) }
    showConfirm.value = true
    // Handle cancel
    const unwatch = () => {
      if (!showConfirm.value) resolve(false)
    }
    setTimeout(unwatch, 100)
  })
}

// Close confirm dialog
const closeConfirm = (confirmed = false) => {
  if (confirmed && confirmData.value.onConfirm) {
    confirmData.value.onConfirm()
  }
  showConfirm.value = false
}

// Fetch categories
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/categories/with-count')
    categories.value = res.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    showToast('error', 'Gagal memuat kategori')
  } finally {
    loading.value = false
  }
}

// Open modal for create/edit
const openModal = (category = null) => {
  editingCategory.value = category
  formData.value = category 
    ? { nama_kategori: category.nama_kategori, deskripsi: category.deskripsi || '' }
    : { nama_kategori: '', deskripsi: '' }
  formError.value = ''
  showModal.value = true
}

// Close modal
const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
  formData.value = { nama_kategori: '', deskripsi: '' }
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
      showToast('success', 'Kategori berhasil diperbarui')
    } else {
      await api.post('/api/categories', formData.value)
      showToast('success', 'Kategori berhasil ditambahkan')
    }
    closeModal()
    await fetchCategories()
  } catch (err) {
    formError.value = err.message || 'Gagal menyimpan kategori'
  } finally {
    saving.value = false
  }
}

// Delete category
const categoryToDelete = ref(null)

const confirmDelete = (category) => {
  categoryToDelete.value = category
  confirmData.value = {
    title: 'Hapus Kategori',
    message: `Apakah Anda yakin ingin menghapus kategori "${category.nama_kategori}"?`
  }
  showConfirm.value = true
}

const executeDelete = async () => {
  if (!categoryToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/api/categories/${categoryToDelete.value.category_id}`)
    showToast('success', 'Kategori berhasil dihapus')
    await fetchCategories()
  } catch (err) {
    showToast('error', err.message || 'Gagal menghapus kategori')
  } finally {
    deleting.value = false
    showConfirm.value = false
    categoryToDelete.value = null
  }
}

onMounted(fetchCategories)
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Home</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administration</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Categories</Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Manage Categories" 
        description="Kelola kategori Karya untuk mengorganisir arsip."
        :icon="FolderOpen"
        icon-color="bg-teal-500"
      >
        <template #actions>
          <Button @click="openModal()" class="gap-2">
            <Plus class="w-4 h-4" />
            Tambah Kategori
          </Button>
        </template>
      </PageHeader>

      <!-- Categories Table -->
      <Card>
        <CardHeader class="bg-teal-50 border-b-2 border-stone-800">
          <div class="flex items-center gap-3">
            <FolderOpen class="w-5 h-5" />
            <CardTitle class="text-lg font-bold uppercase">Daftar Kategori</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
            <p class="text-stone-500 font-mono uppercase tracking-widest animate-pulse">Memuat Categories...</p>
          </div>

          <!-- Empty -->
          <div v-else-if="categories.length === 0" class="text-center py-12 text-stone-400">
            <FolderOpen class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada kategori</p>
          </div>

          <!-- Table -->
          <template v-else>
            <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-lime-50 border-b-2 border-stone-800 text-xs font-bold uppercase tracking-wider">
              <div class="col-span-4">Nama Kategori</div>
              <div class="col-span-5">Deskripsi</div>
              <div class="col-span-1 text-center">Karyas</div>
              <div class="col-span-2 text-right">Aksi</div>
            </div>
            <div 
              v-for="category in categories" 
              :key="category.category_id" 
              class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 hover:bg-stone-50"
            >
              <div class="md:col-span-4">
                <span class="font-bold text-stone-900">{{ category.nama_kategori }}</span>
              </div>
              <div class="md:col-span-5 text-sm text-stone-600">
                {{ category.deskripsi || '-' }}
              </div>
              <div class="md:col-span-1 text-center">
                <Badge variant="secondary">{{ category.film_count || 0 }}</Badge>
              </div>
              <div class="md:col-span-2 flex gap-2 md:justify-end">
                <Button variant="outline" size="sm" @click="openModal(category)">
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" class="text-red-600 hover:bg-red-50" @click="confirmDelete(category)">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </template>
        </CardContent>
      </Card>
    </main>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-md mx-4">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100">
          <h2 class="font-bold text-lg">{{ editingCategory ? 'Edit Kategori' : 'Tambah Kategori' }}</h2>
          <button @click="closeModal" class="p-1 hover:bg-stone-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="saveCategory" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {{ formError }}
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Nama Kategori *</label>
            <Input v-model="formData.nama_kategori" placeholder="Contoh: Documentary" />
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Deskripsi</label>
            <Input v-model="formData.deskripsi" placeholder="Deskripsi singkat kategori" />
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
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showConfirm = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 px-6 py-4 border-b-2 border-black bg-red-50">
          <AlertTriangle class="w-5 h-5 text-red-600" />
          <h2 class="font-bold text-lg text-red-800">{{ confirmData.title }}</h2>
        </div>
        <div class="p-6">
          <p class="text-stone-600 mb-6">{{ confirmData.message }}</p>
          <div class="flex gap-3">
            <Button type="button" variant="outline" class="flex-1" @click="showConfirm = false" :disabled="deleting">
              Batal
            </Button>
            <Button type="button" class="flex-1 gap-2 bg-red-600 hover:bg-red-700" @click="executeDelete" :disabled="deleting">
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
              Hapus
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  </div>
</template>

