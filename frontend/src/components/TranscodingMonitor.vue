<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from '@/lib/api'
import { Activity, Clock, CheckCircle2, AlertTriangle, RefreshCw, XCircle, Film, History, Filter } from 'lucide-vue-next'

const films = ref([])
const queueMetrics = ref({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 })
const selectedFilmId = ref(null)
const filmHistory = ref([])
const historyLoading = ref(false)
const selectedFilter = ref('All')
const loading = ref(true)
const autoRefresh = ref(true)
let pollTimer = null

const filterOptions = ['All', 'processing', 'completed', 'failed', 'cancelled', 'recovery', 'retranscode']

const fetchMonitorData = async () => {
  try {
    const [filmsRes, queueRes] = await Promise.allSettled([
      api.get('/api/films', { params: { limit: 20, sortBy: 'films.updated_at', sortOrder: 'desc' } }),
      api.get('/api/films/transcode/queue'),
    ])

    if (filmsRes.status === 'fulfilled') {
      const list = filmsRes.value.data?.data || filmsRes.value.data || []
      films.value = Array.isArray(list) ? list : []
      if (films.value.length > 0 && !selectedFilmId.value) {
        selectedFilmId.value = films.value[0].film_id
      }
    }

    if (queueRes.status === 'fulfilled') {
      const metrics = queueRes.value.data?.data || queueRes.value.data || {}
      queueMetrics.value = { ...queueMetrics.value, ...metrics }
    }

    if (selectedFilmId.value) {
      fetchFilmHistory(selectedFilmId.value)
    }
  } catch (err) {
    console.warn('[TranscodingMonitor] Failed to fetch monitor data:', err.message)
  } finally {
    loading.value = false
  }
}

const fetchFilmHistory = async (filmId) => {
  if (!filmId) return
  historyLoading.value = true
  try {
    const res = await api.get(`/api/films/${filmId}/transcode/history`)
    const data = res.data?.data || res.data || {}
    filmHistory.value = Array.isArray(data.operations) ? data.operations : []
  } catch (err) {
    console.warn(`[TranscodingMonitor] Failed to fetch history for film ${filmId}:`, err.message)
    filmHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

const selectFilm = (filmId) => {
  selectedFilmId.value = filmId
  fetchFilmHistory(filmId)
}

const filteredHistory = computed(() => {
  if (selectedFilter.value === 'All') return filmHistory.value
  return filmHistory.value.filter((op) => op.operationType === selectedFilter.value.toLowerCase())
})

const activeJobs = computed(() => {
  return films.value.filter((f) => {
    const s = f.transcode_status
    return s === 'processing' || s === 'pending' || s === 'failed'
  })
})

const handleCancel = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/transcode/cancel`)
    fetchMonitorData()
  } catch (err) {
    console.error('[TranscodingMonitor] Cancel failed:', err.message)
  }
}

const handleRetry = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/retranscode`)
    fetchMonitorData()
  } catch (err) {
    console.error('[TranscodingMonitor] Retry failed:', err.message)
  }
}

onMounted(() => {
  fetchMonitorData()
  pollTimer = setInterval(() => {
    if (autoRefresh.value) fetchMonitorData()
  }, 3000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="transcoding-monitor border border-stone-800 rounded-xl bg-stone-950 p-4 font-mono text-stone-200 text-sm shadow-2xl space-y-5">
    <!-- Dashboard Header -->
    <div class="flex items-center justify-between border-b border-stone-800 pb-3">
      <div class="flex items-center gap-2">
        <Activity class="w-5 h-5 text-amber-500 animate-pulse" />
        <h2 class="font-bold text-base tracking-wide text-stone-100 uppercase">
          Transcoding Governance & Operation Monitor
        </h2>
      </div>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer select-none">
          <input type="checkbox" v-model="autoRefresh" class="rounded bg-stone-800 border-stone-700 text-amber-500" />
          <span>Auto-refresh (3s)</span>
        </label>
        <button
          @click="fetchMonitorData"
          class="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          title="Refresh Now"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
        <span class="text-xs text-stone-400 block mb-0.5">Active Jobs</span>
        <span class="text-lg font-bold text-sky-400">{{ queueMetrics.active }}</span>
      </div>
      <div class="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
        <span class="text-xs text-stone-400 block mb-0.5">Waiting</span>
        <span class="text-lg font-bold text-amber-400">{{ queueMetrics.waiting }}</span>
      </div>
      <div class="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
        <span class="text-xs text-stone-400 block mb-0.5">Completed</span>
        <span class="text-lg font-bold text-emerald-400">{{ queueMetrics.completed }}</span>
      </div>
      <div class="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-center">
        <span class="text-xs text-stone-400 block mb-0.5">Failed</span>
        <span class="text-lg font-bold text-rose-400">{{ queueMetrics.failed }}</span>
      </div>
    </div>

    <!-- Active Transcoding List -->
    <div>
      <h3 class="text-xs font-bold uppercase text-stone-400 tracking-wider mb-2">
        Active / Recent Jobs ({{ activeJobs.length }})
      </h3>

      <div v-if="activeJobs.length === 0" class="p-4 rounded-lg bg-stone-900/50 border border-stone-800 text-center text-stone-500 text-xs">
        Tidak ada job transkoding yang sedang aktif saat ini.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="item in activeJobs"
          :key="item.film_id"
          @click="selectFilm(item.film_id)"
          class="p-3 rounded-lg bg-stone-900 border transition-all cursor-pointer flex flex-col gap-2"
          :class="selectedFilmId === item.film_id ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-stone-800 hover:border-stone-700'"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 truncate">
              <Film class="w-4 h-4 text-stone-400 shrink-0" />
              <span class="font-bold text-stone-100 truncate">#{{ item.film_id }} - {{ item.judul }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 text-[11px] rounded font-semibold uppercase tracking-wider"
                :class="{
                  'bg-sky-950 text-sky-400 border border-sky-800': item.transcode_status === 'processing',
                  'bg-amber-950 text-amber-400 border border-amber-800': item.transcode_status === 'pending',
                  'bg-emerald-950 text-emerald-400 border border-emerald-800': item.transcode_status === 'completed',
                  'bg-rose-950 text-rose-400 border border-rose-800': item.transcode_status === 'failed',
                }"
              >
                {{ item.transcode_status }}
              </span>

              <button
                v-if="item.transcode_status === 'processing' || item.transcode_status === 'pending'"
                @click.stop="handleCancel(item.film_id)"
                class="px-2 py-0.5 text-xs rounded bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-800"
              >
                Cancel
              </button>
              <button
                v-if="item.transcode_status === 'failed'"
                @click.stop="handleRetry(item.film_id)"
                class="px-2 py-0.5 text-xs rounded bg-amber-900/40 hover:bg-amber-900 text-amber-300 border border-amber-800"
              >
                Retry
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              class="bg-gradient-to-r from-amber-500 to-sky-400 h-full transition-all duration-300"
              :style="{ width: `${item.transcode_progress || 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Operation Audit History Timeline -->
    <div class="border-t border-stone-800 pt-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-amber-400" />
          <h3 class="font-bold text-xs uppercase tracking-wider text-stone-200">
            Operation Audit Trail (Film #{{ selectedFilmId || 'None' }})
          </h3>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-1 overflow-x-auto">
          <button
            v-for="opt in filterOptions"
            :key="opt"
            @click="selectedFilter = opt"
            class="px-2 py-0.5 text-[10px] rounded transition-colors uppercase font-semibold"
            :class="selectedFilter === opt ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-400 hover:text-stone-200'"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <div v-if="historyLoading" class="p-4 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
        <RefreshCw class="w-3.5 h-3.5 animate-spin" />
        <span>Memuat riwayat audit...</span>
      </div>

      <div v-else-if="filteredHistory.length === 0" class="p-4 rounded-lg bg-stone-900/40 border border-stone-800 text-center text-stone-500 text-xs">
        Belum ada riwayat operasi yang tercatat untuk filter ini.
      </div>

      <div v-else class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        <div
          v-for="op in filteredHistory"
          :key="op.id"
          class="p-2 rounded bg-stone-900/80 border border-stone-800/80 flex items-center justify-between text-xs font-mono"
        >
          <div class="flex items-center gap-2">
            <span class="text-stone-500 text-[10px]">{{ new Date(op.createdAt).toLocaleTimeString() }}</span>
            <span class="font-bold text-amber-400 uppercase text-[11px]">{{ op.operationType }}</span>
            <span v-if="op.previousStatus || op.newStatus" class="text-stone-400 text-[11px]">
              ({{ op.previousStatus || 'none' }} → {{ op.newStatus || 'none' }})
            </span>
          </div>

          <div class="flex items-center gap-3 text-[11px] text-stone-400">
            <span v-if="op.progress > 0">Progress: {{ op.progress }}%</span>
            <span v-if="op.attempt > 1">Attempt: {{ op.attempt }}</span>
            <span v-if="op.reason" class="text-stone-300 italic">"{{ op.reason }}"</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
