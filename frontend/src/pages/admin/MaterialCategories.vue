<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FolderKanban, Plus, Pencil, Trash2, Loader2, Save, X, 
  AlertTriangle, Search, BookOpen, FileText, Video, Film, Star, MonitorPlay, Layers,
  ChevronUp, ChevronDown, ArrowUpDown, Sparkles, BookMarked, RefreshCw
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()

// Data states
const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const reorderingId = ref(null)
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editingCategory = ref(null)
const formData = ref({
  nama_kategori: '',
  slug: '',
  deskripsi: '',
  icon: 'BookOpen',
  urutan: 1
})
const formError = ref('')

// Confirm delete state
const showConfirm = ref(false)
const categoryToDelete = ref(null)

// Icon Options with metadata
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

// Lock body scroll on modals
const updateBodyScroll = () => {
  if (showModal.value || showConfirm.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Fetch categories
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/material-categories')
    if (res.success) {
      categories.value = res.data || []
    } else if (Array.isArray(res)) {
      categories.value = res
    } else if (res?.data && Array.isArray(res.data)) {
      categories.value = res.data
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Failed to fetch material categories:', err)
    showToast('Gagal memuat daftar kategori materi', 'error')
  } finally {
    loading.value = false
  }
}

// Sorted categories (always by urutan asc, then category_id asc)
const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => {
    const uA = Number(a.urutan) || 0
    const uB = Number(b.urutan) || 0
    return uA - uB || a.category_id - b.category_id
  })
})

// Filtered categories by search query
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return sortedCategories.value
  const q = searchQuery.value.toLowerCase().trim()
  return sortedCategories.value.filter(cat => 
    cat.nama_kategori?.toLowerCase().includes(q) ||
    cat.slug?.toLowerCase().includes(q) ||
    cat.deskripsi?.toLowerCase().includes(q)
  )
})

// Statistics computed
const totalMaterials = computed(() => {
  return categories.value.reduce((sum, cat) => sum + (Number(cat.material_count) || 0), 0)
})

const topCategory = computed(() => {
  return sortedCategories.value.length > 0 ? sortedCategories.value[0].nama_kategori : '-'
})

// Check position helpers
const isFirstCategory = (cat) => {
  return sortedCategories.value.length > 0 && sortedCategories.value[0].category_id === cat.category_id
}

const isLastCategory = (cat) => {
  const len = sortedCategories.value.length
  return len > 0 && sortedCategories.value[len - 1].category_id === cat.category_id
}

// Navigate to Material Manager filtered by category
const viewCategoryMaterials = (category) => {
  router.push({
    path: '/admin/materials',
    query: { category_id: category.category_id }
  })
}

// Move category order up or down (in the action column)
const moveCategory = async (cat, direction) => {
  if (reorderingId.value) return
  
  const list = sortedCategories.value
  const currentIndex = list.findIndex(c => c.category_id === cat.category_id)
  if (currentIndex === -1) return
  
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= list.length) return
  
  const targetCat = list[targetIndex]
  
  let currentUrutan = Number(cat.urutan) || (currentIndex + 1)
  let targetUrutan = Number(targetCat.urutan) || (targetIndex + 1)
  
  // If both have same urutan value, normalize first
  if (currentUrutan === targetUrutan) {
    currentUrutan = currentIndex + 1
    targetUrutan = targetIndex + 1
  }
  
  reorderingId.value = cat.category_id
  try {
    await Promise.all([
      api.put(`/api/material-categories/${cat.category_id}`, { urutan: targetUrutan }),
      api.put(`/api/material-categories/${targetCat.category_id}`, { urutan: currentUrutan })
    ])
    showToast(`Posisi kategori "${cat.nama_kategori}" berhasil diubah (#${targetUrutan})`, 'success')
    await fetchCategories()
  } catch (err) {
    console.error('Failed to reorder category:', err)
    showToast('Gagal mengubah urutan kategori', 'error')
  } finally {
    reorderingId.value = null
  }
}

// Open modal for create/edit
const openModal = (category = null) => {
  editingCategory.value = category
  formError.value = ''
  if (category) {
    formData.value = {
      nama_kategori: category.nama_kategori,
      slug: category.slug,
      deskripsi: category.deskripsi || '',
      icon: category.icon || 'BookOpen',
      urutan: Number(category.urutan) || 1
    }
  } else {
    const maxUrutan = categories.value.reduce((max, c) => Math.max(max, Number(c.urutan) || 0), 0)
    formData.value = {
      nama_kategori: '',
      slug: '',
      deskripsi: '',
      icon: 'BookOpen',
      urutan: maxUrutan + 1
    }
  }
  showModal.value = true
  updateBodyScroll()
}

// Close modal
const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
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
    const payload = {
      ...formData.value,
      nama_kategori: formData.value.nama_kategori.trim(),
      urutan: parseInt(formData.value.urutan, 10) || 1
    }

    if (editingCategory.value) {
      await api.put(`/api/material-categories/${editingCategory.value.category_id}`, payload)
      showToast('Kategori materi berhasil diperbarui', 'success')
    } else {
      await api.post('/api/material-categories', payload)
      showToast('Kategori materi baru berhasil ditambahkan', 'success')
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
    await api.delete(`/api/material-categories/${categoryToDelete.value.category_id}`)
    showToast('Kategori materi berhasil dihapus', 'success')
    closeConfirm()
    await fetchCategories()
  } catch (err) {
    console.error('Delete category error:', err)
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
  <div class="p-4 md:p-8 space-y-6 text-stone-900 dark:text-stone-100 max-w-7xl mx-auto">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">
        Kategori Materi
      </Badge>
    </nav>

    <!-- Page Header with Main Action -->
    <PageHeader 
      title="Kelola Kategori Materi" 
      description="Atur susunan urutan, ikon, dan pengelompokan modul materi pembelajaran untuk kurikulum perfilman."
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

    <!-- Professional Summary Stat Cards (Styled matching Archives.vue KPI cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <!-- Card 1: Total Categories -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-3.5 shadow-brutal-xs flex items-center gap-3">
        <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs shrink-0">
          <FolderKanban class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">
            Total Kategori
          </div>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="text-sm md:text-base font-black font-mono leading-none text-stone-900 dark:text-stone-100">{{ categories.length }}</span>
            <span class="text-[10px] text-stone-500 font-mono">kategori</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Total Linked Materials -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-3.5 shadow-brutal-xs flex items-center gap-3">
        <div class="w-9 h-9 bg-yellow-400 text-stone-950 border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs shrink-0">
          <BookMarked class="w-4 h-4 stroke-[2.5]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">
            Total Modul Materi
          </div>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="text-sm md:text-base font-black font-mono leading-none text-yellow-600 dark:text-yellow-400">{{ totalMaterials }}</span>
            <span class="text-[10px] text-stone-500 font-mono">modul</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Priority #1 Category -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 p-3.5 shadow-brutal-xs flex items-center gap-3">
        <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs shrink-0">
          <Sparkles class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] md:text-xs font-mono uppercase text-stone-500 dark:text-stone-400 leading-tight">
            Urutan Utama (#1)
          </div>
          <div class="text-xs md:text-sm font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5" :title="topCategory">
            {{ topCategory }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Table Card -->
    <Card class="border-2 border-black dark:border-stone-100 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
      <!-- Toolbar Header -->
      <CardHeader class="py-3.5 px-4 md:px-6 bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- Title & Count (Matching Archives.vue) -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs shrink-0">
              <ArrowUpDown class="w-4 h-4 stroke-[2.5]" />
            </div>
            <div class="flex items-center gap-2.5">
              <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Struktur & Urutan Tampilan Kategori
              </CardTitle>
              <span class="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-mono font-black bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs">
                {{ filteredCategories.length }}
              </span>
            </div>
          </div>

          <!-- Compact Search Bar & Refresh (Identical to Archives.vue) -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <div class="relative w-full sm:w-72">
              <Search class="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                v-model="searchQuery" 
                placeholder="Cari kategori atau slug..." 
                class="pl-9 pr-8 text-xs h-9 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
              />
              <button 
                v-if="searchQuery" 
                @click="searchQuery = ''" 
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              @click="fetchCategories"
              :disabled="loading"
              class="h-9 px-3 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border-2 border-black dark:border-stone-100 text-stone-700 dark:text-stone-200 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-brutal-xs"
              title="Refresh Data"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 class="w-8 h-8 animate-spin text-brand-teal dark:text-teal-400" />
          <p class="text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-300 font-bold animate-pulse">
            Memuat Data Kategori...
          </p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCategories.length === 0" class="text-center py-14 px-4">
          <div class="w-12 h-12 mx-auto mb-3 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-100 flex items-center justify-center text-stone-400">
            <FolderKanban class="w-6 h-6 text-brand-teal dark:text-teal-400" />
          </div>
          <p class="font-bold text-sm text-stone-800 dark:text-stone-200">
            {{ searchQuery ? 'Kategori materi tidak ditemukan' : 'Belum ada kategori materi' }}
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            {{ searchQuery ? `Tidak ditemukan kategori dengan kata kunci "${searchQuery}".` : 'Tambahkan kategori baru untuk menyusun modul pembelajaran.' }}
          </p>
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="mt-3 px-3 py-1.5 text-xs font-bold text-brand-teal dark:text-teal-400 hover:underline font-mono inline-flex items-center gap-1 cursor-pointer"
          >
            <X class="w-3 h-3" /> Hapus Pencarian
          </button>
        </div>

        <!-- Professional Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[760px]">
            <!-- Table Header -->
            <thead>
              <tr class="bg-stone-200/80 dark:bg-stone-800/80 border-b-2 border-black dark:border-stone-100 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                <th class="py-3 px-4 w-20 text-center">Urutan</th>
                <th class="py-3 px-4 w-64">Nama Kategori &amp; Slug</th>
                <th class="py-3 px-4">Deskripsi</th>
                <th class="py-3 px-4 w-32 text-center">Materi Terkait</th>
                <th class="py-3 px-4 w-44 text-right">Aksi</th>
              </tr>
            </thead>

            <!-- Table Rows (Clean Teal Theme matching Archives) -->
            <tbody class="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900 text-xs">
              <tr 
                v-for="cat in filteredCategories" 
                :key="cat.category_id" 
                class="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                :class="{ 'opacity-60 pointer-events-none': reorderingId === cat.category_id }"
              >
                <!-- 1. Urutan Badge -->
                <td class="py-3.5 px-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-[32px] h-7 px-2 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-100 font-mono font-black text-xs text-stone-900 dark:text-stone-100 shadow-brutal-xs">
                    #{{ cat.urutan }}
                  </span>
                </td>

                <!-- 2. Nama Kategori, Icon & Slug (Solid Teal Icon matching Archives) -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-brand-teal text-white border-2 border-black dark:border-stone-100 flex items-center justify-center shadow-brutal-xs flex-shrink-0">
                      <component :is="getIconComponent(cat.icon)" class="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-xs md:text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-brand-teal transition-colors">
                        {{ cat.nama_kategori }}
                      </div>
                      <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate">
                        /{{ cat.slug }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- 3. Deskripsi -->
                <td class="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                  <p class="line-clamp-2 leading-relaxed max-w-md" :title="cat.deskripsi || '-'">
                    {{ cat.deskripsi || '-' }}
                  </p>
                </td>

                <!-- 4. Materi Terkait -->
                <td class="py-3.5 px-4 text-center">
                  <button 
                    type="button"
                    @click="viewCategoryMaterials(cat)"
                    class="font-mono text-xs font-bold px-2.5 py-1 border-2 transition-all cursor-pointer shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] inline-flex items-center gap-1.5"
                    :class="(cat.material_count || 0) > 0 
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-black dark:border-stone-300 hover:bg-amber-200 dark:hover:bg-amber-900' 
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'"
                    :title="`Buka materi pembelajaran untuk kategori ${cat.nama_kategori}`"
                  >
                    <BookOpen class="w-3 h-3" />
                    <span>{{ cat.material_count || 0 }} Materi</span>
                  </button>
                </td>

                <!-- 5. Aksi: Move Up, Move Down, Edit, Delete (Grouped cleanly) -->
                <td class="py-3.5 px-4 text-right">
                  <div class="inline-flex items-center gap-1">
                    <!-- Move Up Button -->
                    <button 
                      type="button"
                      @click="moveCategory(cat, 'up')"
                      :disabled="isFirstCategory(cat) || reorderingId !== null"
                      class="p-1.5 bg-white dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-stone-700 dark:text-stone-200 hover:text-brand-teal dark:hover:text-teal-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Geser Urutan ke Atas (Prioritas Naik)"
                    >
                      <ChevronUp class="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    <!-- Move Down Button -->
                    <button 
                      type="button"
                      @click="moveCategory(cat, 'down')"
                      :disabled="isLastCategory(cat) || reorderingId !== null"
                      class="p-1.5 bg-white dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-stone-700 dark:text-stone-200 hover:text-brand-teal dark:hover:text-teal-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Geser Urutan ke Bawah (Prioritas Turun)"
                    >
                      <ChevronDown class="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    <!-- Edit Button -->
                    <button 
                      type="button"
                      @click="openModal(cat)"
                      class="p-1.5 bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer ml-1"
                      title="Edit Detail Kategori"
                    >
                      <Pencil class="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>

                    <!-- Delete Button -->
                    <button 
                      type="button"
                      @click="confirmDelete(cat)"
                      class="p-1.5 bg-white dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 class="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
            <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
              <FolderKanban class="w-3.5 h-3.5" />
            </div>
            <h2 class="font-bold text-sm md:text-base text-stone-900 dark:text-stone-100">
              {{ editingCategory ? 'Edit Kategori Materi' : 'Tambah Kategori Materi' }}
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
              placeholder="Contoh: Produksi & Sinematografi" 
              class="text-xs h-9 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 rounded-none focus:ring-0 focus:border-brand-teal"
              autofocus
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-800 dark:text-stone-200">
                Ikon Kategori
              </label>
              <select 
                v-model="formData.icon"
                class="w-full h-9 px-2.5 border-2 border-black dark:border-stone-200 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-brand-teal"
              >
                <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-800 dark:text-stone-200">
                Urutan Tampilan
              </label>
              <Input 
                v-model.number="formData.urutan" 
                type="number" 
                min="1" 
                class="text-xs h-9 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 rounded-none focus:ring-0 focus:border-brand-orange"
              />
              <p class="text-[10px] text-stone-500 dark:text-stone-400 mt-1 font-sans leading-tight">
                Nomor urutan (1, 2, 3...) untuk posisi tab &amp; grup materi publik.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-800 dark:text-stone-200">
              Deskripsi Singkat
            </label>
            <textarea 
              v-model="formData.deskripsi" 
              rows="3" 
              placeholder="Jelaskan ringkasan materi dalam kategori ini..." 
              class="w-full p-2.5 border-2 border-black dark:border-stone-200 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-0 focus:border-brand-orange resize-none"
            ></textarea>
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
              class="flex-1 py-2 text-xs font-black bg-brand-yellow hover:bg-amber-400 active:bg-amber-500 text-stone-950 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              :disabled="saving"
            >
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin text-stone-950" />
              <Save v-else class="w-3.5 h-3.5 stroke-[2] text-stone-950" />
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
              Hapus Kategori Materi
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
              class="flex-1 py-2 text-xs font-bold bg-brand-red hover:bg-red-600 active:bg-red-700 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              @click="executeDelete"
              :disabled="deleting"
            >
              <Loader2 v-if="deleting" class="w-3.5 h-3.5 animate-spin text-white" />
              <Trash2 v-else class="w-3.5 h-3.5 stroke-[2] text-white" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
