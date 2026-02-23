<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import SectionHeader from '@/components/SectionHeader.vue'
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
    <Navbar />
    <main class="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-25">
      <SectionHeader 
        title="Catatan Perubahan" 
        subtitle="Rangkuman update, perbaikan, dan perubahan yang terjadi di PF Space."
        :light-text="false"
      />

      <div class="mt-6 flex flex-col md:flex-row gap-3 md:gap-4">
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
    </main>

    <Footer />
</template>
