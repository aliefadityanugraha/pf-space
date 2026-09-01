<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import {
  LayoutDashboard, Upload, FileDown, ListChecks, FileEdit, Users, Grid3X3,
  Flag, TrendingUp, Film, Clock, ChevronRight, Loader2, Shield,
  HardDrive, Flame, Heart, ArrowUpRight, FolderKanban, Megaphone,
  Power, Edit3, Check, X, Sparkles
} from 'lucide-vue-next'

const router = useRouter()
const { showToast } = useToast()
const loading = ref(true)

// Primary KPI stats
const stats = ref([
  { id: 'films', label: 'Total Karya', value: '0', change: '0', changeType: 'positive', icon: Film, path: '/admin/archives' },
  { id: 'users', label: 'User Aktif', value: '0', change: '0', changeType: 'positive', icon: Users, path: '/admin/rbac' },
  { id: 'pending', label: 'Karya Menunggu', value: '0', change: '0', changeType: 'neutral', icon: Clock, path: '/admin/archives?status=pending', isPending: true },
  { id: 'reports', label: 'Laporan Pending', value: '0', change: '0', changeType: 'neutral', icon: Flag, path: '/admin/reports?status=pending', isWarning: true },
  { id: 'votes', label: 'Total Apresiasi', value: '0', change: '0', changeType: 'positive', icon: Heart, path: '/trending' },
  { id: 'storage', label: 'Penyimpanan Media', value: '0 B', change: '0 Berkas', changeType: 'neutral', icon: HardDrive, path: '/admin/storage' }
])

// Quick Shortcuts Grid
const quickAccessList = [
  { title: 'Kurasi Karya', desc: 'Review & moderasi karya baru', icon: Clock, path: '/admin/archives?status=pending', color: 'bg-amber-500 text-white' },
  { title: 'Laporan Konten', desc: 'Kelola laporan & pelanggaran', icon: Flag, path: '/admin/reports', color: 'bg-red-500 text-white' },
  { title: 'Role & User (RBAC)', desc: 'Atur hak akses & akun user', icon: Shield, path: '/admin/rbac', color: 'bg-brand-teal text-white' },
  { title: 'Storage Manager', desc: 'Kapasitas & pembersihan berkas', icon: HardDrive, path: '/admin/storage', color: 'bg-brand-orange text-stone-900' },
  { title: 'Trending Manager', desc: 'Kelola karya sorotan utama', icon: Flame, path: '/admin/trending', color: 'bg-brand-red text-white' },
  { title: 'Kategori Karya', desc: 'Kelola kategori & relasi', icon: Grid3X3, path: '/admin/categories', color: 'bg-stone-800 text-white' },
]

const tasks = ref([])
const recentActivities = ref([])

// System Announcement Banner State
const announcementConfig = ref({
  is_active: false,
  title: 'Open Submission Festival Film 2026 Dibuka!',
  content: 'Unggah karyamu ke arsip utama untuk mendapatkan apresiasi dan feedback dari komunitas.',
  button_text: 'Upload Karya Sekarang',
  button_url: '/upload'
})
const loadingAnnouncement = ref(false)
const savingAnnouncement = ref(false)
const showAnnouncementModal = ref(false)

const fetchAnnouncementSetting = async () => {
  loadingAnnouncement.value = true
  try {
    const res = await api.get('/api/settings/announcement_modal').catch(() => null)
    if (res?.data?.value) {
      announcementConfig.value = { ...announcementConfig.value, ...res.data.value }
    }
  } catch (err) {
    console.error('Failed to fetch announcement setting:', err)
  } finally {
    loadingAnnouncement.value = false
  }
}

const toggleAnnouncementStatus = async () => {
  announcementConfig.value.is_active = !announcementConfig.value.is_active
  await saveAnnouncement()
}

const saveAnnouncement = async () => {
  savingAnnouncement.value = true
  try {
    await api.post('/api/settings/announcement_modal', {
      value: announcementConfig.value,
      is_public: true,
      description: 'System global modal announcement'
    })
    showToast(
      announcementConfig.value.is_active 
        ? 'Pengumuman Sistem Berhasil Diaktifkan!' 
        : 'Pengumuman Sistem Dinonaktifkan'
    )
    showAnnouncementModal.value = false
  } catch (err) {
    console.error('Failed to save announcement setting:', err)
    showToast('Gagal menyimpan pengumuman sistem', 'error')
  } finally {
    savingAnnouncement.value = false
  }
}

const fetchDashboardStats = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/admin/stats')
    if (response?.success) {
      const data = response.data

      // Total Karya
      stats.value[0].value = (data.totalFilms || 0).toLocaleString()
      stats.value[0].change = '+' + (data.newFilms || 0)

      // User Aktif
      stats.value[1].value = (data.totalUsers || 0).toLocaleString()
      stats.value[1].change = '+' + (data.newUsers || 0)

      // Karya Menunggu
      stats.value[2].value = (data.pendingFilms || 0).toString()

      // Laporan Pending
      stats.value[3].value = (data.pendingReports || 0).toString()

      // Total Apresiasi / Votes
      stats.value[4].value = (data.totalVotes || 0).toLocaleString()
      stats.value[4].change = '+' + (data.totalVotes || 0)

      // Storage
      if (data.storageStats) {
        stats.value[5].value = data.storageStats.totalSizeFormatted || '0 B'
        stats.value[5].change = `${data.storageStats.totalCount || 0} Berkas`
      }

      // Update tasks (pending Karya)
      tasks.value = (data.recentPendingFilms || []).map(karya => ({
        id: karya.film_id,
        slug: karya.slug,
        name: 'Review Karya',
        subject: karya.judul,
        subjectNote: `oleh ${karya.creator?.name || 'Anonim'}`,
        status: 'Pending',
        statusColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold',
        icon: FileEdit,
        iconBg: 'bg-amber-100 dark:bg-amber-900',
        iconColor: 'text-amber-900 dark:text-amber-200',
        action: 'Review',
        date: formatDate(karya.created_at)
      }))

      // Update recent activities
      recentActivities.value = (data.recentActivities || []).map(act => ({
        ...act,
        timeFormatted: act.time ? formatDate(act.time, true) : 'Terkini'
      }))
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

const navigateTo = (path) => {
  if (path) router.push(path)
}

onMounted(() => {
  fetchDashboardStats()
  fetchAnnouncementSetting()
})
</script>

<template>
  <div class="p-4 md:p-8">
    <!-- Breadcrumbs Navigation -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/" class="text-brand-teal hover:underline font-bold">Beranda</router-link>
      <span class="text-stone-400">/</span>
      <router-link to="/admin" class="text-stone-600 dark:text-stone-300 hover:underline font-bold">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 font-bold">Dashboard</Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader 
      title="Ikhtisar Sistem" 
      description="Monitor statistik sistem, kesehatan platform, moderasi karya, dan pengumuman global."
      :icon="LayoutDashboard"
      icon-color="bg-amber-500"
    >
      <template #actions>
        <Button 
          variant="outline" 
          class="gap-2 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold uppercase text-xs"
          @click="navigateTo('/upload')"
        >
          <Upload class="w-4 h-4" />
          Upload Cepat
        </Button>
        <Button 
          variant="outline" 
          class="gap-2 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold uppercase text-xs"
          @click="navigateTo('/admin/reports')"
        >
          <Flag class="w-4 h-4" />
          Laporan Konten
        </Button>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 animate-spin text-brand-teal mb-4" />
      <p class="text-stone-500 font-mono uppercase tracking-widest animate-pulse">Memuat Data Dashboard…</p>
    </div>

    <template v-else>
      <!-- ── KPI Stat Cards (6 Columns) ─────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card 
          v-for="stat in stats" 
          :key="stat.id"
          class="cursor-pointer hover:shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-100 group"
          @click="navigateTo(stat.path)"
        >
          <CardContent class="p-4 flex flex-col justify-between h-full">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b-2 border-border pb-0.5">
                  {{ stat.label }}
                </span>
                <component :is="stat.icon" class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div class="text-2xl md:text-3xl font-black text-foreground mt-2 font-display">
                {{ stat.value }}
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 pt-2 border-t border-border text-[10px]">
              <span 
                v-if="stat.isWarning && parseInt(stat.value) > 0"
                class="font-bold text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800"
              >
                Butuh Tindakan
              </span>
              <span 
                v-else-if="stat.isPending && parseInt(stat.value) > 0"
                class="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
              >
                Perlu Review
              </span>
              <span v-else class="text-muted-foreground font-medium">
                {{ stat.change }}
              </span>
              <ArrowUpRight class="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- ── System Announcement Banner Control Card ────────────────────── -->
      <Card class="mb-8 border-2 border-border shadow-brutal overflow-hidden">
        <div class="h-2 bg-gradient-to-r from-brand-red via-brand-orange to-brand-teal w-full border-b-2 border-border"></div>
        <CardContent class="p-4 md:p-6 bg-card text-card-foreground">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-4 flex-1">
              <div class="w-12 h-12 bg-brand-orange border-2 border-border shadow-brutal-xs flex items-center justify-center shrink-0">
                <Megaphone class="w-6 h-6 text-stone-900" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-display font-bold text-lg text-foreground uppercase tracking-tight">
                    Banner Pengumuman Sistem Global
                  </h3>
                  <Badge 
                    :class="announcementConfig.is_active ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800' : 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'"
                    variant="outline" 
                    class="font-bold uppercase text-[10px]"
                  >
                    {{ announcementConfig.is_active ? '● Aktif Tampil di Web' : '○ Non-Aktif' }}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground font-body max-w-3xl leading-relaxed">
                  <span class="font-bold text-foreground">"{{ announcementConfig.title }}"</span>
                  — {{ announcementConfig.content }}
                </p>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="flex items-center gap-3 shrink-0 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                :class="announcementConfig.is_active ? 'bg-green-50 border-green-500 text-green-700' : 'bg-stone-50 border-stone-400 text-stone-600'"
                class="gap-1.5 border-2 font-bold uppercase text-xs shadow-brutal-xs hover:shadow-none transition-all"
                :disabled="savingAnnouncement"
                @click="toggleAnnouncementStatus"
              >
                <Power class="w-3.5 h-3.5" />
                {{ announcementConfig.is_active ? 'Matikan' : 'Aktifkan' }}
              </Button>

              <Button
                size="sm"
                class="gap-1.5 bg-brand-teal text-white border-2 border-stone-900 shadow-brutal-xs hover:shadow-none transition-all font-bold uppercase text-xs"
                @click="showAnnouncementModal = true"
              >
                <Edit3 class="w-3.5 h-3.5" />
                Edit Pengumuman
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- ── Quick Access Management Grid ───────────────────────────────── -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-lg text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <FolderKanban class="w-5 h-5 text-brand-teal" />
            Pintasan Manajemen Sistem
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div
            v-for="item in quickAccessList"
            :key="item.title"
            class="p-4 bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer group flex flex-col justify-between"
            @click="navigateTo(item.path)"
          >
            <div>
              <div :class="[item.color]" class="w-10 h-10 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs flex items-center justify-center mb-3">
                <component :is="item.icon" class="w-5 h-5" />
              </div>
              <h4 class="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase group-hover:text-brand-teal transition-colors">
                {{ item.title }}
              </h4>
              <p class="text-xs text-stone-500 dark:text-stone-400 font-body mt-1 leading-snug">
                {{ item.desc }}
              </p>
            </div>
            <div class="mt-4 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 uppercase group-hover:text-brand-teal">
              <span>Buka</span>
              <ChevronRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Main Grid: Active Tasks & Recent Activity ──────────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <!-- Active Tasks (Pending Review) -->
        <Card class="xl:col-span-2 border-2 border-stone-900 dark:border-stone-100 shadow-brutal bg-card">
          <CardHeader class="bg-amber-50 dark:bg-amber-950/60 border-b-2 border-stone-900 dark:border-stone-100 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <ListChecks class="w-5 h-5 text-amber-900 dark:text-amber-300" />
                <CardTitle class="text-base font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                  Tugas Kurasi Karya ({{ tasks.length }})
                </CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                class="text-xs font-bold uppercase gap-1 border-2 border-stone-900 shadow-brutal-xs hover:shadow-none transition-all"
                @click="navigateTo('/admin/archives?status=pending')"
              >
                Kelola Semua
                <ChevronRight class="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent class="p-0">
            <div v-if="tasks.length === 0" class="p-8 text-center text-stone-500 font-body text-sm">
              <ListChecks class="w-10 h-10 mx-auto mb-2 text-stone-300" />
              Tidak ada karya pending yang memerlukan review saat ini.
            </div>

            <template v-else>
              <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-100 dark:bg-stone-800 border-b-2 border-stone-900 dark:border-stone-100 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <div class="col-span-4">Karya</div>
                <div class="col-span-4">Kreator & Tanggal</div>
                <div class="col-span-2">Status</div>
                <div class="col-span-2 text-right">Aksi</div>
              </div>

              <div 
                v-for="task in tasks" 
                :key="task.id" 
                class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
              >
                <div class="md:col-span-4 flex items-center gap-3">
                  <div :class="[task.iconBg, task.iconColor]" class="p-2 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs flex-shrink-0">
                    <component :is="task.icon" class="w-4 h-4" />
                  </div>
                  <span class="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">{{ task.subject }}</span>
                </div>
                
                <div class="md:col-span-4 text-xs text-stone-600">
                  <span>{{ task.subjectNote }}</span>
                  <span class="block text-[10px] text-stone-400 font-mono mt-0.5">{{ task.date }}</span>
                </div>

                <div class="md:col-span-2">
                  <Badge :class="task.statusColor" variant="outline" class="text-[10px] font-bold uppercase">
                    {{ task.status }}
                  </Badge>
                </div>

                <div class="md:col-span-2 flex md:justify-end">
                  <Button 
                    size="sm" 
                    class="text-[10px] font-bold uppercase tracking-wider border-2 border-stone-900 shadow-brutal-xs hover:shadow-none transition-all"
                    @click="navigateTo(`/archive/${task.slug}/edit`)"
                  >
                    {{ task.action }}
                  </Button>
                </div>
              </div>
            </template>
          </CardContent>
        </Card>

        <!-- Recent Activities -->
        <Card class="border-2 border-stone-900 shadow-brutal">
          <CardHeader class="bg-stone-50 border-b-2 border-stone-900 py-4">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base font-bold uppercase tracking-wider text-stone-900">
                Aktivitas Terbaru
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                class="text-xs font-bold uppercase gap-1 text-brand-teal hover:underline"
                @click="navigateTo('/admin/audit-logs')"
              >
                Lihat Semua
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent class="p-0">
            <div v-if="recentActivities.length === 0" class="p-8 text-center text-stone-500 font-body text-sm">
              Belum ada aktivitas tercatat.
            </div>

            <div 
              v-for="(activity, index) in recentActivities" 
              :key="index" 
              class="px-5 py-3.5 border-b border-stone-200 last:border-0 hover:bg-stone-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-stone-900 text-white border border-stone-900 flex items-center justify-center text-xs font-bold shrink-0">
                  {{ activity.user.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-stone-800 leading-snug">
                    <span class="font-bold text-stone-900">{{ activity.user }}</span>
                    <span class="text-stone-500"> {{ activity.action }} </span>
                    <span class="font-bold text-stone-900 font-mono">"{{ activity.target }}"</span>
                  </p>
                  <p class="text-[10px] text-stone-400 font-mono mt-1">{{ activity.timeFormatted }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </template>

    <!-- ── Modal Edit Pengumuman Sistem ──────────────────────────────── -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showAnnouncementModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" @click="showAnnouncementModal = false"></div>

        <!-- Modal Dialog -->
        <div class="relative w-full max-w-lg bg-brand-cream dark:bg-stone-900 border-4 border-stone-900 dark:border-stone-100 shadow-brutal overflow-hidden z-10">
          <div class="h-3 bg-gradient-to-r from-brand-red via-brand-orange to-brand-teal w-full border-b-2 border-stone-900 dark:border-stone-100"></div>

          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-brand-orange border-2 border-stone-900 dark:border-stone-100 shadow-brutal-xs">
                  <Megaphone class="w-5 h-5 text-stone-900" />
                </div>
                <h3 class="font-display font-bold text-lg text-stone-900 dark:text-stone-100 uppercase">
                  Edit Pengumuman Sistem
                </h3>
              </div>
              <button 
                type="button"
                @click="showAnnouncementModal = false"
                class="p-1 border-2 border-transparent hover:border-black dark:hover:border-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-900 dark:text-stone-100 cursor-pointer"
                title="Tutup Modal"
              >
                <X class="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <!-- Form -->
            <div class="space-y-4">
              <!-- Switch status -->
              <div class="flex items-center justify-between p-3 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100">
                <span class="text-xs font-bold uppercase text-stone-900 dark:text-stone-100">Status Tampil di Web</span>
                <button
                  type="button"
                  @click="announcementConfig.is_active = !announcementConfig.is_active"
                  :class="announcementConfig.is_active ? 'bg-green-500 text-white' : 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300'"
                  class="px-3 py-1 border-2 border-stone-900 dark:border-stone-100 text-xs font-bold uppercase transition-all shadow-brutal-xs"
                >
                  {{ announcementConfig.is_active ? '● Aktif' : '○ Non-Aktif' }}
                </button>
              </div>

              <!-- Judul -->
              <div>
                <label class="block text-xs font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">Judul Pengumuman</label>
                <input
                  v-model="announcementConfig.title"
                  type="text"
                  placeholder="Misal: Open Submission Festival Film 2026!"
                  class="w-full p-2.5 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100 text-sm font-body text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <!-- Isi Pesan -->
              <div>
                <label class="block text-xs font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">Pesan Pengumuman</label>
                <textarea
                  v-model="announcementConfig.content"
                  rows="3"
                  placeholder="Tulis pesan lengkap pengumuman untuk pengunjung website…"
                  class="w-full p-2.5 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100 text-sm font-body text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                ></textarea>
              </div>

              <!-- Teks Tombol CTA -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">Teks Tombol CTA</label>
                  <input
                    v-model="announcementConfig.button_text"
                    type="text"
                    placeholder="Misal: Upload Karya"
                    class="w-full p-2.5 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100 text-sm font-body text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase text-stone-700 dark:text-stone-300 mb-1">Tautan / URL Tombol</label>
                  <input
                    v-model="announcementConfig.button_url"
                    type="text"
                    placeholder="Misal: /upload"
                    class="w-full p-2.5 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-100 text-sm font-body text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t-2 border-stone-200 dark:border-stone-700">
              <Button
                variant="outline"
                class="border-2 border-stone-900 font-bold uppercase text-xs"
                @click="showAnnouncementModal = false"
              >
                Batal
              </Button>

              <Button
                class="gap-2 bg-brand-teal text-white border-2 border-stone-900 shadow-brutal-xs hover:shadow-none transition-all font-bold uppercase text-xs"
                :disabled="savingAnnouncement"
                @click="saveAnnouncement"
              >
                <Loader2 v-if="savingAnnouncement" class="w-4 h-4 animate-spin" />
                <Check v-else class="w-4 h-4" />
                Simpan Pengumuman
              </Button>
            </div>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>
