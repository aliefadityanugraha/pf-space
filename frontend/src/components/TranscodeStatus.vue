<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { Loader2, RefreshCw, XCircle, CheckCircle2, AlertTriangle, Film } from 'lucide-vue-next'

const props = defineProps({
  filmId: { type: [Number, String], required: true },
  transcodeStatus: { type: String, default: 'none' },
  transcodeProgress: { type: Number, default: 0 },
  canManage: { type: Boolean, default: true },
  pollIntervalMs: { type: Number, default: 3000 },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['status-updated', 'cancelled', 'retried'])

const { isAdmin } = useAuth()

const currentStatus = ref(props.transcodeStatus)
const currentProgress = ref(props.transcodeProgress)
const isCancelling = ref(false)
const isRetrying = ref(false)

let pollTimer = null

// Monotonic Progress Guarantee
const updateProgressMonotonically = (newProgress) => {
  if (typeof newProgress === 'number') {
    currentProgress.value = Math.max(currentProgress.value, Math.min(100, Math.floor(newProgress)))
  }
}

// Watch props for external updates
watch(
  () => props.transcodeStatus,
  (newStatus) => {
    currentStatus.value = newStatus
    checkPollingNeeds()
  },
)

watch(
  () => props.transcodeProgress,
  (newProgress) => {
    updateProgressMonotonically(newProgress)
  },
)

const isPollingActive = computed(() => {
  return currentStatus.value === 'pending' || currentStatus.value === 'processing'
})

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const pollFilmStatus = async () => {
  if (!props.filmId) return
  try {
    const res = await api.get(`/api/films/${props.filmId}`)
    const filmData = res.data?.data || res.data || {}
    
    if (filmData.transcode_status) {
      currentStatus.value = filmData.transcode_status
      updateProgressMonotonically(filmData.transcode_progress)
      
      emit('status-updated', {
        status: filmData.transcode_status,
        progress: currentProgress.value,
        hlsManifestUrl: filmData.hls_manifest_url,
      })

      if (filmData.transcode_status === 'completed' || filmData.transcode_status === 'failed') {
        stopPolling()
      }
    }
  } catch (err) {
    console.warn('[TranscodeStatus] Status poll error:', err.message)
  }
}

const startPolling = () => {
  stopPolling()
  pollFilmStatus()
  pollTimer = setInterval(pollFilmStatus, props.pollIntervalMs)
}

const checkPollingNeeds = () => {
  if (isPollingActive.value) {
    if (!pollTimer) startPolling()
  } else {
    stopPolling()
  }
}

// Cancellation Action
const handleCancel = async () => {
  if (isCancelling.value || !props.filmId) return
  isCancelling.value = true
  try {
    await api.post(`/api/films/${props.filmId}/transcode/cancel`)
    currentStatus.value = 'failed'
    currentProgress.value = 0
    stopPolling()
    emit('cancelled', { filmId: props.filmId })
  } catch (err) {
    console.error('[TranscodeStatus] Cancel error:', err.message)
  } finally {
    isCancelling.value = false
  }
}

// Retry / Retranscode Action
const handleRetry = async () => {
  if (isRetrying.value || !props.filmId) return
  isRetrying.value = true
  try {
    await api.post(`/api/films/${props.filmId}/retranscode`)
    currentStatus.value = 'pending'
    currentProgress.value = 0
    emit('retried', { filmId: props.filmId })
    startPolling()
  } catch (err) {
    console.error('[TranscodeStatus] Retry error:', err.message)
  } finally {
    isRetrying.value = false
  }
}

onMounted(() => {
  checkPollingNeeds()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <!-- Compact Inline Badge View (used in DetailActionBar) -->
  <div
    v-if="compact"
    class="transcode-status-card inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#292524]/60 border border-[#fafaf9]/10 text-stone-200 text-xs shrink-0 transition-all h-8 md:h-9"
  >
    <div class="flex items-center gap-1.5 font-medium">
      <!-- Pending -->
      <template v-if="currentStatus === 'pending'">
        <Loader2 class="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
        <span class="text-amber-400 text-[10px] md:text-xs">Antrean...</span>
      </template>

      <!-- Processing -->
      <template v-else-if="currentStatus === 'processing'">
        <div class="relative flex items-center justify-center shrink-0 w-4 h-4">
          <svg class="w-4 h-4 -rotate-90 text-sky-400" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none" class="opacity-20" />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="3"
              fill="none"
              stroke-dasharray="56.548"
              :stroke-dashoffset="56.548 * (1 - currentProgress / 100)"
              stroke-linecap="round"
              class="transition-all duration-300 ease-out"
            />
          </svg>
        </div>
        <span class="text-sky-400 text-[10px] md:text-xs font-mono">Transcoding... ({{ currentProgress }}%)</span>
      </template>

      <!-- Completed -->
      <template v-else-if="currentStatus === 'completed'">
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span class="text-emerald-400 text-[10px] md:text-xs">✓ HLS Siap</span>
      </template>

      <!-- Failed -->
      <template v-else-if="currentStatus === 'failed'">
        <AlertTriangle class="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span class="text-rose-400 text-[10px] md:text-xs">⚠ Gagal</span>
      </template>

      <!-- None / Default -->
      <template v-else>
        <Film class="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span class="text-stone-400 text-[10px] md:text-xs">MP4</span>
      </template>
    </div>

    <!-- Action Buttons for Compact Mode -->
    <div v-if="canManage" class="flex items-center gap-1">
      <button
        v-if="(currentStatus === 'processing' || currentStatus === 'pending') && isAdmin"
        @click="handleCancel"
        :disabled="isCancelling"
        class="px-1.5 py-0.5 text-[10px] rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
      >
        <Loader2 v-if="isCancelling" class="w-3 h-3 animate-spin" />
        <XCircle v-else class="w-3 h-3" />
        <span>Batalkan</span>
      </button>

      <button
        v-if="currentStatus === 'failed'"
        @click="handleRetry"
        :disabled="isRetrying"
        class="px-1.5 py-0.5 text-[10px] rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
      >
        <Loader2 v-if="isRetrying" class="w-3 h-3 animate-spin" />
        <RefreshCw v-else class="w-3 h-3" />
        <span>Coba Lagi</span>
      </button>
    </div>
  </div>

  <!-- Standard Card View -->
  <div v-else class="transcode-status-card rounded-lg p-3 bg-stone-900 border border-stone-800 text-stone-200 text-sm">
    <!-- Status Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 font-medium">
        <!-- Pending -->
        <template v-if="currentStatus === 'pending'">
          <Loader2 class="w-4 h-4 text-amber-400 animate-spin" />
          <span class="text-amber-400">Menunggu Antrean Transcoding...</span>
        </template>

        <!-- Processing -->
        <template v-else-if="currentStatus === 'processing'">
          <Loader2 class="w-4 h-4 text-sky-400 animate-spin" />
          <span class="text-sky-400">Transcoding Video... ({{ currentProgress }}%)</span>
        </template>

        <!-- Completed -->
        <template v-else-if="currentStatus === 'completed'">
          <CheckCircle2 class="w-4 h-4 text-emerald-400" />
          <span class="text-emerald-400">✓ Video HLS Siap Diputar</span>
        </template>

        <!-- Failed -->
        <template v-else-if="currentStatus === 'failed'">
          <AlertTriangle class="w-4 h-4 text-rose-400" />
          <span class="text-rose-400">⚠ Transcoding Gagal</span>
        </template>

        <!-- None / Default -->
        <template v-else>
          <Film class="w-4 h-4 text-stone-400" />
          <span class="text-stone-400">Format MP4 Standar</span>
        </template>
      </div>

      <!-- Action Buttons -->
      <div v-if="canManage" class="flex items-center gap-2">
        <!-- Cancel button for active jobs (Admin only) -->
        <button
          v-if="(currentStatus === 'processing' || currentStatus === 'pending') && isAdmin"
          @click="handleCancel"
          :disabled="isCancelling"
          class="px-2.5 py-1 text-xs rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <Loader2 v-if="isCancelling" class="w-3 h-3 animate-spin" />
          <XCircle v-else class="w-3 h-3" />
          <span>{{ isCancelling ? 'Membatalkan...' : 'Batalkan' }}</span>
        </button>

        <!-- Retry button for failed jobs -->
        <button
          v-if="currentStatus === 'failed'"
          @click="handleRetry"
          :disabled="isRetrying"
          class="px-2.5 py-1 text-xs rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Loader2 v-if="isRetrying" class="w-3 h-3 animate-spin" />
          <RefreshCw v-else class="w-3 h-3" />
          <span>{{ isRetrying ? 'Memulai Ulang...' : 'Coba Transcode Lagi' }}</span>
        </button>
      </div>
    </div>

    <!-- Progress Bar (Visible during processing or pending) -->
    <div v-if="currentStatus === 'processing' || currentStatus === 'pending'" class="mt-2.5 w-full">
      <div class="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
        <div
          class="bg-gradient-to-r from-amber-500 to-sky-400 h-full transition-all duration-300 ease-out"
          :style="{ width: `${currentProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
