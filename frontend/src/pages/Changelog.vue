<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import PageLayout from '@/components/PageLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Search, Filter, Calendar, Tag, Link as LinkIcon, Loader2, Copy } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { api } from '@/lib/api'

useHead({ title: 'Catatan Perubahan - PF Space' })

const { showToast } = useToast()
const route = useRoute()

const changelog = ref([])
const loading = ref(false)
const error = ref('')

const query = ref('')
const type = ref('all')

const typeLabels = {
  feature: 'Fitur Baru',
  fix: 'Perbaikan Bug',
  change: 'Perubahan'
}

const typeColor = {
  feature: 'bg-brand-teal/20 text-brand-teal border-brand-teal/30',
  fix: 'bg-brand-red text-white border-black',
  change: 'bg-brand-yellow text-black border-black'
}

const fallbackData = () => ([
  {
    id: 'v1_3_1',
    version: '1.3.1',
    date: '2026-04-02',
    type: 'fix',
    title: 'Optimasi Performa Internal & Keamanan',
    description: 'Peningkatan kecepatan respon sistem, optimasi penggunaan memori pada AI Search, serta penguatan keamanan layanan.',
    items: [
      'Refaktor sistem pencarian (Semantic Search) dengan limitasi memori untuk mencegah server crash (OOM)',
      'Optimasi query database (Recursive CTE) pada sistem komentar, secara signifikan mempercepat respon server',
      'Penerapan Strict Rate-Limiting khusus API Autentikasi untuk mengatasi upaya brute-force',
      'Penguraian check paralel (Gamification) dan urutan native di sistem Vote mempercepat muatan film baru',
      'Minifikasi build frontend (console dan debugger stripped) untuk file bundle yang optimal dan lebih cepat diakses via gawai'
    ]
  },
  {
    id: 'v1_3_0',
    version: '1.3.0',
    date: '2026-03-04',
    type: 'feature',
    title: 'Notifikasi Web & Tampilan Auth Baru',
    description: 'Penambahan fitur notifikasi in-app dan perombakan desain halaman Autentikasi.',
    items: [
      'Sistem notifikasi dalam peramban untuk update profil, penggantian sandi, dan persetujuan film',
      'Desain modern halaman Login, Register, dan Lupa Sandi dengan layout screen-split'
    ]
  },
  {
    id: 'v1_2_2',
    version: '1.2.2',
    date: '2026-03-03',
    type: 'fix',
    title: 'Perbaikan Sistem & Pembaruan UI',
    description: 'Penyelesaian masalah rendering data, database, dan konsistensi user interface.',
    items: [
      'Filter status diperbaiki sehingga materi pembelajaran nonaktif disembunyikan dari halaman publik',
      'Penyelesaian isu API di mana penyimpanan data ke database sering gagal',
      'Penyesuaian shadow dan warna pada dark mode toggle agar sesuai dengan desain brutalism'
    ]
  },
  {
    id: 'v1_2_1',
    version: '1.2.1',
    date: '2026-02-25',
    type: 'change',
    title: 'Refaktor API & Standarisasi Dokumentasi',
    description: 'Transformasi struktur internal backend API dan dokumentasi modul Vue.',
    items: [
      'Implementasi format validasi global menggunakan pustaka Zod dengan format sentralisasi',
      'Integrasi standar JSDoc di berbagai berkas komponen dan utilitas secara menyeluruh'
    ]
  },
  {
    id: 'v1_2_0',
    version: '1.2.0',
    date: '2026-02-19',
    type: 'feature',
    title: 'Mode Studi',
    description: 'Halaman Mode Studi untuk mengakses naskah, storyboard, dan RAB.',
    items: [
      'Normalisasi URL dokumen menggunakan VITE_API_URL',
      'Tombol akses dokumen dari halaman arsip'
    ]
  },
  {
    id: 'v1_1_3',
    version: '1.1.3',
    date: '2026-02-18',
    type: 'fix',
    title: 'Perbaikan Vote & Views',
    description: 'Sinkronisasi endpoint vote dan penanganan rate-limit views.',
    items: [
      'Perbaikan route vote menjadi /api/votes/:filmId',
      'Abaikan error 429 untuk increment views'
    ]
  },
  {
    id: 'v1_1_0',
    version: '1.1.0',
    date: '2026-02-16',
    type: 'change',
    title: 'Standarisasi Aset Media',
    description: 'Normalisasi URL video, poster, dan PDF pada beberapa halaman.',
    items: [
      'ArchiveDetail, StudyMode, dan LearningAsset menyesuaikan URL absolut',
      'Peningkatan konsistensi rendering media'
    ]
  }
])

const fetchChangelog = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/api/changelog')
    if (res && res.success && Array.isArray(res.data)) {
      changelog.value = res.data.map((e, i) => ({
        id: e.id || (e.version ? e.version.replaceAll('.', '_') : `chg_${i}`),
        version: e.version || '',
        date: e.date || '',
        type: e.type || 'change',
        title: e.title || '',
        description: e.description || '',
        items: Array.isArray(e.items) ? e.items : []
      }))
    } else {
      changelog.value = fallbackData()
    }
  } catch {
    changelog.value = fallbackData()
  } finally {
    loading.value = false
    await nextTick()
    const hash = window.location.hash
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return [...changelog.value]
    .filter(e => {
      const typeOk = type.value === 'all' || e.type === type.value
      if (!typeOk) return false
      if (!q) return true
      const inTitle = e.title.toLowerCase().includes(q)
      const inDesc = e.description.toLowerCase().includes(q)
      const inItems = (e.items || []).some(t => String(t).toLowerCase().includes(q))
      return inTitle || inDesc || inItems
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const copyLink = async (id) => {
  const base = window.location.origin + route.fullPath.split('#')[0]
  const url = `${base}#${id}`
  try {
    await navigator.clipboard.writeText(url)
    showToast('Link versi disalin')
  } catch {
    showToast('Gagal menyalin link', 'error')
  }
}

onMounted(fetchChangelog)
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 mb-16">
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4 pt-2 md:pt-8">
        <router-link to="/" class="text-brand-teal hover:underline">Beranda</router-link>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Changelog</Badge>
      </nav>

       <PageHeader 
        title="Catatan Perubahan" 
        description="Rangkuman update, perbaikan, dan perubahan yang terjadi di PF Space."
        icon-color="bg-brand-teal"
        class="mb-6 md:mb-10"
      />

      <div class="mt-8 flex flex-col md:flex-row gap-3 md:gap-4">
        <div class="flex-1 relative">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <Input
            v-model="query"
            placeholder="Cari update…"
            class="pl-9 bg-white border-2 border-slate-900 shadow-brutal-xs md:shadow-brutal h-10 md:h-11 text-sm md:text-base"
          />
        </div>
        <div class="w-full md:w-56 relative">
          <Filter class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" />
          <select v-model="type" class="w-full h-10 pl-9 pr-3 bg-white border-2 border-slate-900 shadow-brutal-xs md:shadow-brutal text-sm">
            <option value="all">Semua Perubahan</option>
            <option value="feature">Fitur Baru</option>
            <option value="fix">Perbaikan Bug</option>
            <option value="change">Perubahan</option>
          </select>
        </div>
      </div>

      <div class="mt-8 space-y-4">
        <div v-if="loading" class="flex items-center justify-center py-16">
          <Loader2 class="w-6 h-6 animate-spin text-stone-600" />
        </div>

        <div v-else-if="filtered.length === 0" class="text-center py-16">
          <History class="w-10 h-10 mx-auto mb-3 text-stone-500" />
          <p class="text-stone-700 font-medium">Belum ada catatan perubahan yang cocok.</p>
        </div>

        <Card
          v-for="entry in filtered"
          :key="entry.id"
          :id="entry.id"
          class="border-2 border-black shadow-brutal bg-white"
        >
          <CardContent class="p-4 md:p-7">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div class="space-y-2 md:space-y-1.5 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" class="bg-stone-900 text-white border-0 text-[10px] md:text-xs">v{{ entry.version || 'N/A' }}</Badge>
                  <Badge :class="['border text-[10px] md:text-xs', typeColor[entry.type] || 'bg-stone-100']">
                    <span class="flex items-center gap-1">
                      <Tag class="w-3 h-3 md:w-3.5 md:h-3.5" />
                      {{ typeLabels[entry.type] || 'Perubahan' }}
                    </span>
                  </Badge>
                  <span class="text-[10px] md:text-sm text-stone-500 flex items-center gap-1">
                    <Calendar class="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {{ new Date(entry.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}
                  </span>
                </div>
                <h3 class="text-lg md:text-xl font-display font-bold text-stone-900 leading-tight">
                  {{ entry.title }}
                </h3>
                <p class="text-sm md:text-base text-stone-700 leading-relaxed md:leading-normal">
                  {{ entry.description }}
                </p>
              </div>
              <Button size="sm" variant="outline" class="w-full md:w-auto border-slate-900 text-stone-800 hover:bg-stone-100 shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all" @click="copyLink(entry.id)">
                <Copy class="w-3.5 h-3.5 mr-1.5" />
                <span class="font-bold text-xs uppercase tracking-wider">Salin Tautan</span>
              </Button>
            </div>

            <ul v-if="entry.items && entry.items.length" class="mt-4 list-disc pl-5 space-y-1.5 text-stone-700 text-xs md:text-sm">
              <li v-for="(it, idx) in entry.items" :key="idx" class="pl-1">
                {{ it }}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </PageLayout>
</template>
