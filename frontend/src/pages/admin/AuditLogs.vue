<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'
import { 
  ClipboardList, User, Shield, Film, FileText, 
  Search, RefreshCcw, Loader2, ChevronLeft, ChevronRight, Clock, Globe,
  Download, Filter, X, ExternalLink, CheckCircle2, ShieldCheck,
  AlertTriangle, Trash2, Edit3, Eye, Layers, Video, Flag, Sparkles, Sliders
} from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()
const loading = ref(true)
const logs = ref([])
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })

// Filter states
const searchQuery = ref('')
const selectedAction = ref('')
const selectedTargetType = ref('')
const selectedLogDetail = ref(null)

const actionOptions = [
  { value: '', label: 'Semua Tipe Aksi' },
  { value: 'UPDATE_ROLE', label: 'Hak Akses: UPDATE ROLE' },
  { value: 'APPROVE_FILM', label: 'Kurasi Film: APPROVE' },
  { value: 'REJECT_FILM', label: 'Kurasi Film: REJECT' },
  { value: 'DELETE_FILM', label: 'Karya: DELETE FILM' },
  { value: 'CREATE_CATEGORY', label: 'Kategori Film: TAMBAH' },
  { value: 'UPDATE_CATEGORY', label: 'Kategori Film: UBAH' },
  { value: 'DELETE_CATEGORY', label: 'Kategori Film: HAPUS' },
  { value: 'CREATE_MATERIAL', label: 'Modul Materi: TAMBAH' },
  { value: 'UPDATE_MATERIAL', label: 'Modul Materi: UBAH' },
  { value: 'DELETE_MATERIAL', label: 'Modul Materi: HAPUS' },
  { value: 'TOGGLE_MATERIAL_STATUS', label: 'Modul Materi: TOGGLE STATUS' },
  { value: 'CREATE_MATERIAL_CATEGORY', label: 'Kategori Modul: TAMBAH' },
  { value: 'UPDATE_MATERIAL_CATEGORY', label: 'Kategori Modul: UBAH' },
  { value: 'DELETE_MATERIAL_CATEGORY', label: 'Kategori Modul: HAPUS' },
  { value: 'RESOLVE_REPORT', label: 'Moderasi: LAPORAN SELESAI' },
  { value: 'REJECT_REPORT', label: 'Moderasi: LAPORAN DITOLAK' },
  { value: 'BATCH_RETRANSCODE', label: 'Worker: BATCH TRANSCODE' },
  { value: 'DELETE_PRODUCTION_POST', label: 'Feed Produksi: HAPUS POST' },
  { value: 'ARCHIVE_PRODUCTION_POST', label: 'Feed Produksi: ARSIP POST' }
]

const targetOptions = [
  { value: '', label: 'Semua Target' },
  { value: 'film', label: 'Film / Karya' },
  { value: 'user', label: 'User / Akun' },
  { value: 'category', label: 'Kategori' },
  { value: 'material', label: 'Materi Modul' },
  { value: 'report', label: 'Laporan Masalah' },
  { value: 'post', label: 'Feed Produksi' },
  { value: 'system', label: 'Sistem Server' }
]

const fetchLogs = async (page = 1) => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    })
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim())
    if (selectedAction.value) params.append('action', selectedAction.value)
    if (selectedTargetType.value) params.append('target_type', selectedTargetType.value)

    const response = await api.get(`/api/admin/logs?${params.toString()}`)
    if (response?.success) {
      logs.value = response.data || []
      if (response.pagination) {
        pagination.value = {
          page: response.pagination.page || page,
          totalPages: response.pagination.totalPages || 1,
          total: response.pagination.total || logs.value.length,
          limit: response.pagination.limit || 20
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    showToast('Gagal memuat riwayat log audit', 'error')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedAction.value = ''
  selectedTargetType.value = ''
  fetchLogs(1)
}

const getActionMeta = (action) => {
  switch (action) {
    case 'DELETE_FILM':
    case 'DELETE_CATEGORY':
    case 'DELETE_MATERIAL':
    case 'DELETE_MATERIAL_CATEGORY':
    case 'DELETE_PRODUCTION_POST':
      return {
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700',
        icon: Trash2,
        label: action.replace(/_/g, ' ')
      }
    case 'UPDATE_ROLE':
      return {
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-400 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700',
        icon: ShieldCheck,
        label: 'UPDATE ROLE'
      }
    case 'APPROVE_FILM':
      return {
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700',
        icon: CheckCircle2,
        label: 'APPROVE FILM'
      }
    case 'REJECT_FILM':
    case 'REJECT_REPORT':
      return {
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700',
        icon: AlertTriangle,
        label: action.replace(/_/g, ' ')
      }
    case 'CREATE_CATEGORY':
    case 'CREATE_MATERIAL':
    case 'CREATE_MATERIAL_CATEGORY':
      return {
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-400 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700',
        icon: Layers,
        label: action.replace(/_/g, ' ')
      }
    case 'UPDATE_CATEGORY':
    case 'UPDATE_MATERIAL':
    case 'UPDATE_MATERIAL_CATEGORY':
    case 'TOGGLE_MATERIAL_STATUS':
      return {
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-700',
        icon: Edit3,
        label: action.replace(/_/g, ' ')
      }
    case 'RESOLVE_REPORT':
      return {
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-400 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700',
        icon: Flag,
        label: 'RESOLVE REPORT'
      }
    case 'BATCH_RETRANSCODE':
      return {
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700',
        icon: Video,
        label: 'BATCH TRANSCODE'
      }
    default:
      return {
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
        icon: ClipboardList,
        label: action ? action.replace(/_/g, ' ') : 'AKTIVITAS'
      }
  }
}

const getTargetIcon = (type) => {
  switch (type) {
    case 'film': return Film
    case 'user': return User
    case 'category': return Layers
    case 'material': return FileText
    case 'report': return Flag
    case 'post': return FileText
    default: return ClipboardList
  }
}

const parseDetails = (details) => {
  if (!details) return null
  try {
    return typeof details === 'string' ? JSON.parse(details) : details
  } catch {
    return details
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAvatarInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// Export logs as CSV
const exportLogsCSV = () => {
  if (logs.value.length === 0) {
    showToast('Tidak ada data log untuk diekspor', 'info')
    return
  }

  const headers = ['ID', 'Waktu', 'Admin', 'IP Address', 'Aksi', 'Target Type', 'Target ID', 'Details']
  const rows = logs.value.map(l => [
    l.id || '',
    l.created_at ? new Date(l.created_at).toISOString() : '',
    `"${(l.user?.name || 'Sistem').replace(/"/g, '""')}"`,
    l.ip_address || '',
    l.action || '',
    l.target_type || '',
    l.target_id || '',
    `"${String(l.details || '').replace(/"/g, '""')}"`
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `pfspace_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('File CSV log audit berhasil diunduh', 'success')
}

onMounted(() => {
  fetchLogs(1)
})
</script>

<template>
  <div class="p-4 md:p-8 space-y-6 text-stone-900 dark:text-stone-100 max-w-7xl w-full mx-auto">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">
        Log Audit
      </Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader 
      title="Log Audit &amp; Riwayat Aktivitas" 
      description="Pantau seluruh jejak aktivitas administratif, perubahan hak akses, kurasi karya, dan operasi sistem secara kronologis."
      icon-color="bg-purple-600"
    >
      <template #actions>
        <!-- Export CSV Button -->
        <button
          type="button"
          @click="exportLogsCSV"
          :disabled="loading || logs.length === 0"
          class="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-50"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Ekspor CSV</span>
        </button>

        <!-- Refresh Button -->
        <button 
          type="button"
          @click="fetchLogs(pagination.page)" 
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <RefreshCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>Muat Ulang</span>
        </button>
      </template>
    </PageHeader>

    <!-- Section 1: Executive KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- KPI 1: Total Logs Recorded -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
        <div class="w-10 h-10 bg-purple-500/15 dark:bg-purple-400/20 border-2 border-purple-500 dark:border-purple-400 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-brutal-xs shrink-0">
          <ClipboardList class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Aktivitas
          </div>
          <div class="text-xl font-display font-black text-stone-900 dark:text-stone-100 leading-tight">
            {{ pagination.total || logs.length }}
          </div>
          <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            Catatan Tersimpan
          </div>
        </div>
      </div>

      <!-- KPI 2: Current Filter State -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
        <div class="w-10 h-10 bg-sky-500/15 dark:bg-sky-400/20 border-2 border-sky-500 dark:border-sky-400 flex items-center justify-center text-sky-600 dark:text-sky-300 shadow-brutal-xs shrink-0">
          <Filter class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Filter Operasi
          </div>
          <div class="text-xs font-bold text-stone-900 dark:text-stone-100 truncate" :title="selectedAction || 'Semua Aksi'">
            {{ selectedAction || 'Semua Aksi' }}
          </div>
          <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            Target: {{ selectedTargetType ? selectedTargetType.toUpperCase() : 'SEMUA' }}
          </div>
        </div>
      </div>

      <!-- KPI 3: Pagination Position -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-500/15 dark:bg-amber-400/20 border-2 border-amber-500 dark:border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-brutal-xs shrink-0">
          <Clock class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Halaman Aktif
          </div>
          <div class="text-xl font-display font-black text-stone-900 dark:text-stone-100 leading-tight">
            {{ pagination.page }} <span class="text-xs font-normal font-mono text-stone-500">/ {{ pagination.totalPages }}</span>
          </div>
          <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            20 Catatan / Halaman
          </div>
        </div>
      </div>

      <!-- KPI 4: Security Integrity Tag -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-500/15 dark:bg-emerald-400/20 border-2 border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-brutal-xs shrink-0">
          <ShieldCheck class="w-5 h-5 stroke-[2.2]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Integritas Log
          </div>
          <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            Append-Only Secure
          </div>
          <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
            Audit Trail Terproteksi
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Search & Filter Toolbar -->
    <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 p-4">
      <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <!-- Filter Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          <!-- Search input (Matching Archives.vue) -->
          <div class="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search class="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari rincian, IP, target ID..."
              @keyup.enter="fetchLogs(1)"
              class="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs pl-9 pr-8 h-9 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1 focus:outline-none"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''; fetchLogs(1)"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Hapus Pencarian"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Action filter dropdown -->
          <select
            v-model="selectedAction"
            @change="fetchLogs(1)"
            class="bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs px-3 h-9 border-2 border-black dark:border-stone-100 shadow-brutal-xs focus:outline-none font-mono font-bold cursor-pointer max-w-xs focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
          >
            <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <!-- Target type filter dropdown -->
          <select
            v-model="selectedTargetType"
            @change="fetchLogs(1)"
            class="bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs px-3 h-9 border-2 border-black dark:border-stone-100 shadow-brutal-xs focus:outline-none font-mono font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
          >
            <option v-for="opt in targetOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Toolbar Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="fetchLogs(1)"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold uppercase text-xs cursor-pointer"
          >
            <Filter class="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </button>
          <button
            v-if="searchQuery || selectedAction || selectedTargetType"
            type="button"
            @click="resetFilters"
            class="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-bold text-xs cursor-pointer"
            title="Reset Semua Filter"
          >
            <X class="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </Card>

    <!-- Section 3: Audit Logs Table Card (No Horizontal Scrollbar, Compact & Perfectly Fitted) -->
    <Card class="border-2 border-black dark:border-stone-200 shadow-brutal overflow-hidden bg-white dark:bg-stone-900">
      <CardHeader class="bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200 py-3.5 px-4 md:px-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-purple-500/20 border border-purple-600 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ClipboardList class="w-3.5 h-3.5" />
            </div>
            <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Daftar Riwayat Log Audit
            </CardTitle>
          </div>
          <span class="text-xs font-mono font-bold text-stone-600 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 border border-stone-300 dark:border-stone-700">
            {{ pagination.total || logs.length }} Total Aktivitas
          </span>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <!-- Loading State -->
        <div v-if="loading && logs.length === 0" class="py-20 text-center">
          <Loader2 class="w-8 h-8 animate-spin text-brand-teal mx-auto mb-3" />
          <p class="font-mono text-stone-500 uppercase tracking-widest text-xs font-bold animate-pulse">
            Memuat Riwayat Log Audit...
          </p>
        </div>

        <!-- Empty State -->
        <div v-else-if="logs.length === 0" class="py-20 px-4 text-center text-stone-500 dark:text-stone-400">
          <ClipboardList class="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <p class="font-bold text-sm text-stone-800 dark:text-stone-200 uppercase tracking-wider">
            Tidak Ada Log Aktivitas
          </p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            Tidak ada catatan log audit yang cocok dengan filter atau pencarian saat ini.
          </p>
          <button
            v-if="searchQuery || selectedAction || selectedTargetType"
            @click="resetFilters"
            class="mt-3 px-3 py-1 bg-brand-teal text-white font-bold text-xs border border-black cursor-pointer shadow-brutal-xs"
          >
            Reset Filter
          </button>
        </div>

        <!-- Table View: Full width table-fixed without horizontal scrolling -->
        <div v-else class="w-full">
          <table class="w-full table-fixed text-left border-collapse">
            <thead class="bg-stone-200/80 dark:bg-stone-800/80 border-b-2 border-black dark:border-stone-200 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              <tr>
                <th class="py-3 px-3 sm:px-4 border-r border-stone-300 dark:border-stone-700 w-[17%]">Waktu</th>
                <th class="py-3 px-3 sm:px-4 border-r border-stone-300 dark:border-stone-700 w-[21%]">Pelaksana</th>
                <th class="py-3 px-3 sm:px-4 border-r border-stone-300 dark:border-stone-700 w-[18%]">Aksi / Operasi</th>
                <th class="py-3 px-3 sm:px-4 border-r border-stone-300 dark:border-stone-700 w-[15%]">Target</th>
                <th class="py-3 px-3 sm:px-4 border-r border-stone-300 dark:border-stone-700 w-[24%]">Rincian</th>
                <th class="py-3 px-2 text-center w-[5%]">Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900 text-xs">
              <tr 
                v-for="log in logs" 
                :key="log.id" 
                class="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors group"
              >
                <!-- 1. Timestamp (Compact) -->
                <td class="py-2.5 px-3 sm:px-4 border-r border-stone-200 dark:border-stone-800 font-mono text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300">
                  <div class="flex items-center gap-1 truncate">
                    <Clock class="w-3 h-3 text-stone-400 shrink-0" />
                    <span class="truncate">{{ formatDate(log.created_at) }}</span>
                  </div>
                </td>

                <!-- 2. Admin / User with link to profile -->
                <td class="py-2.5 px-3 sm:px-4 border-r border-stone-200 dark:border-stone-800">
                  <a
                    v-if="log.user"
                    :href="`/p/${log.user.id}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 group/user cursor-pointer max-w-full overflow-hidden"
                    :title="`Buka profil ${log.user.name} di tab baru`"
                  >
                    <div class="w-6 h-6 bg-stone-100 dark:bg-stone-800 border border-black dark:border-stone-200 flex items-center justify-center text-[9px] font-bold overflow-hidden text-stone-900 dark:text-stone-100 shrink-0 group-hover/user:border-brand-teal transition-colors">
                      <img
                        v-if="log.user.image"
                        :src="assetUrl(log.user.image)"
                        :alt="log.user.name"
                        referrerpolicy="no-referrer"
                        class="w-full h-full object-cover"
                      />
                      <span v-else>{{ getAvatarInitials(log.user.name) }}</span>
                    </div>
                    <div class="min-w-0 flex-1 truncate">
                      <div class="font-bold text-[11px] text-stone-900 dark:text-stone-100 truncate group-hover/user:text-brand-teal transition-colors flex items-center gap-0.5">
                        <span class="truncate">{{ log.user.name }}</span>
                        <ExternalLink class="w-2.5 h-2.5 text-stone-400 group-hover/user:text-brand-teal shrink-0" />
                      </div>
                      <div class="text-[9px] font-mono text-stone-400 truncate flex items-center gap-0.5">
                        <span>{{ log.ip_address || '127.0.0.1' }}</span>
                      </div>
                    </div>
                  </a>
                  <!-- System fallback -->
                  <div v-else class="flex items-center gap-1.5 truncate">
                    <div class="w-5 h-5 bg-stone-200 dark:bg-stone-800 border border-black dark:border-stone-200 flex items-center justify-center text-[8px] font-bold shrink-0">
                      SYS
                    </div>
                    <div class="min-w-0 truncate">
                      <span class="font-bold text-[11px] text-stone-700 dark:text-stone-300 truncate block">Sistem</span>
                      <span class="text-[9px] font-mono text-stone-400 truncate block">{{ log.ip_address || 'Internal' }}</span>
                    </div>
                  </div>
                </td>

                <!-- 3. Action Badge -->
                <td class="py-2.5 px-3 sm:px-4 border-r border-stone-200 dark:border-stone-800">
                  <span
                    class="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase font-mono border inline-flex items-center gap-1 max-w-full truncate shadow-brutal-xs"
                    :class="getActionMeta(log.action).badgeClass"
                  >
                    <component :is="getActionMeta(log.action).icon" class="w-2.5 h-2.5 shrink-0" />
                    <span class="truncate">{{ getActionMeta(log.action).label }}</span>
                  </span>
                </td>

                <!-- 4. Target Entity -->
                <td class="py-2.5 px-3 sm:px-4 border-r border-stone-200 dark:border-stone-800">
                  <div class="flex items-center gap-1 text-[11px] truncate">
                    <component :is="getTargetIcon(log.target_type)" class="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                    <span class="font-bold uppercase text-[10px] text-stone-800 dark:text-stone-200 truncate">{{ log.target_type }}</span>
                    <span 
                      v-if="log.target_id"
                      class="px-1 py-0.2 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[9px] text-stone-600 dark:text-stone-300 truncate max-w-[50px]"
                      :title="log.target_id"
                    >
                      #{{ log.target_id }}
                    </span>
                  </div>
                </td>

                <!-- 5. Detail Snippet -->
                <td class="py-2.5 px-3 sm:px-4 border-r border-stone-200 dark:border-stone-800">
                  <div 
                    class="text-[10px] font-mono text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 p-1 border border-stone-200 dark:border-stone-700 truncate cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-brand-teal transition-colors"
                    @click="selectedLogDetail = log"
                    :title="log.details || '-'"
                  >
                    {{ log.details || '-' }}
                  </div>
                </td>

                <!-- 6. Inspect Action Button -->
                <td class="py-2.5 px-1 text-center">
                  <button
                    type="button"
                    class="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 cursor-pointer shadow-brutal-xs hover:border-brand-teal"
                    @click="selectedLogDetail = log"
                    title="Inspeksi Rincian Log"
                  >
                    <Eye class="w-3 h-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 4: Pagination Footer -->
        <div v-if="pagination.totalPages > 1" class="p-3.5 bg-stone-50 dark:bg-stone-800/80 border-t-2 border-black dark:border-stone-200 flex items-center justify-between text-xs font-mono">
          <span class="text-stone-500 dark:text-stone-400 text-[11px]">
            Halaman <strong>{{ pagination.page }}</strong> dari <strong>{{ pagination.totalPages }}</strong> (Total {{ pagination.total }} aktivitas)
          </span>
          <div class="flex items-center gap-2">
            <button 
              type="button"
              :disabled="pagination.page <= 1 || loading"
              @click="fetchLogs(pagination.page - 1)"
              class="px-2.5 py-1 border-2 border-black dark:border-stone-200 bg-white dark:bg-stone-800 font-bold shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 text-[11px]"
            >
              <ChevronLeft class="w-3.5 h-3.5" /> Prev
            </button>
            <button 
              type="button"
              :disabled="pagination.page >= pagination.totalPages || loading"
              @click="fetchLogs(pagination.page + 1)"
              class="px-2.5 py-1 border-2 border-black dark:border-stone-200 bg-white dark:bg-stone-800 font-bold shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1 text-[11px]"
            >
              Next <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Modal Detail Inspeksi Log -->
    <div
      v-if="selectedLogDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="selectedLogDetail = null"
    >
      <div class="max-w-lg w-full border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 overflow-hidden">
        <!-- Modal Header -->
        <div class="bg-stone-100 dark:bg-stone-800 border-b-2 border-black dark:border-stone-200 py-3 px-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Shield class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 class="text-xs font-bold uppercase tracking-wider">
              Detail Log Audit #{{ selectedLogDetail.id }}
            </h3>
          </div>
          <button 
            type="button"
            @click="selectedLogDetail = null" 
            class="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5 space-y-4 text-xs font-mono">
          <div class="grid grid-cols-2 gap-3 text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 p-3 border border-stone-200 dark:border-stone-700">
            <div>
              <span class="text-stone-400 block text-[10px] uppercase font-bold">Pelaksana</span>
              <strong class="text-stone-900 dark:text-stone-100">{{ selectedLogDetail.user?.name || 'Sistem' }}</strong>
            </div>
            <div>
              <span class="text-stone-400 block text-[10px] uppercase font-bold">Alamat IP</span>
              <strong>{{ selectedLogDetail.ip_address || '127.0.0.1' }}</strong>
            </div>
            <div>
              <span class="text-stone-400 block text-[10px] uppercase font-bold">Aksi / Operasi</span>
              <strong class="text-brand-teal">{{ selectedLogDetail.action }}</strong>
            </div>
            <div>
              <span class="text-stone-400 block text-[10px] uppercase font-bold">Target</span>
              <strong>{{ selectedLogDetail.target_type }} ({{ selectedLogDetail.target_id || '-' }})</strong>
            </div>
            <div class="col-span-2 pt-1 border-t border-stone-200 dark:border-stone-700">
              <span class="text-stone-400 block text-[10px] uppercase font-bold">Waktu Eksekusi</span>
              <span>{{ formatDate(selectedLogDetail.created_at) }}</span>
            </div>
          </div>

          <!-- Details / Payload -->
          <div>
            <span class="text-stone-500 font-bold block mb-1 uppercase text-[10px]">Detail Catatan / Payload:</span>
            <pre class="bg-stone-900 text-teal-300 p-3 border-2 border-stone-800 text-[11px] overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">{{
              typeof parseDetails(selectedLogDetail.details) === 'object'
                ? JSON.stringify(parseDetails(selectedLogDetail.details), null, 2)
                : selectedLogDetail.details || 'Tidak ada detail tambahan'
            }}</pre>
          </div>

          <!-- Modal Footer -->
          <div class="pt-2 text-right">
            <button
              type="button"
              class="px-4 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 shadow-brutal-xs font-bold text-xs uppercase cursor-pointer"
              @click="selectedLogDetail = null"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-brutal {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal-xs {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
}
</style>
