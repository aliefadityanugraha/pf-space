<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { api } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import PageHeader from "@/components/PageHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Cpu,
  Server,
  Activity,
  HardDrive,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Loader2,
  Film,
  Database,
  Terminal,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
  ClipboardList,
  Flame,
  X,
  PlayCircle,
  AlertCircle
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const { showToast } = useToast();
const loading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const pollIntervalMs = ref(5000);
let pollTimer = null;

const systemStats = ref(null);
const jobCounts = ref({
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  none: 0,
  total: 0,
});
const activeJobs = ref([]);
const recentLogs = ref([]);

// Filter & Pagination for Log tab
const selectedTab = ref("jobs"); // 'jobs', 'system', 'logs'
const filterType = ref("");
const searchFilmId = ref("");
const page = ref(1);
const limit = ref(15);
const totalLogs = ref(0);
const totalPages = ref(1);
const filteredLogs = ref([]);
const loadingLogs = ref(false);
const selectedLogMetadata = ref(null);

const fetchStats = async (isManual = false) => {
  if (isManual) refreshing.value = true;
  try {
    const res = await api.get("/api/admin/workers/stats");
    const data = res.data?.data || res.data || {};
    systemStats.value = data.systemStats || null;
    jobCounts.value = data.jobCounts || {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      none: 0,
      total: 0,
    };
    activeJobs.value = data.activeJobs || [];
    if (!filterType.value && !searchFilmId.value) {
      recentLogs.value = data.recentLogs || [];
    }
  } catch (err) {
    console.error("[WorkerMonitor] Gagal mengambil stats:", err.message);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const fetchLogs = async () => {
  loadingLogs.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
    };
    if (filterType.value) params.type = filterType.value;
    if (searchFilmId.value) params.film_id = searchFilmId.value;

    const res = await api.get("/api/admin/workers/logs", { params });
    const data = res.data?.data || res.data || [];
    filteredLogs.value = data;
    if (res.data?.pagination) {
      totalLogs.value = res.data.pagination.total;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch (err) {
    console.error("[WorkerMonitor] Gagal mengambil log worker:", err.message);
    showToast("Gagal memuat log worker", "error");
  } finally {
    loadingLogs.value = false;
  }
};

const retryJob = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/retranscode`);
    showToast("Pekerjaan transcoding telah dimasukkan ulang ke antrean", "success");
    await fetchStats(true);
  } catch (err) {
    showToast("Gagal memulai ulang transcoding: " + err.message, "error");
  }
};

const cancelJob = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/transcode/cancel`);
    showToast("Pekerjaan berhasil dibatalkan", "info");
    await fetchStats(true);
  } catch (err) {
    showToast("Gagal membatalkan pekerjaan: " + err.message, "error");
  }
};

const batchLoading = ref(false);

const batchRetranscodeAll = async () => {
  if (!confirm("Apakah Anda yakin ingin memasukkan semua video lama yang belum di-transcode ke dalam antrean HLS?")) {
    return;
  }
  batchLoading.value = true;
  try {
    const res = await api.post("/api/admin/workers/batch-retranscode");
    const data = res.data?.data || res.data || {};
    showToast(res.data?.message || `Berhasil memasukkan ${data.enqueuedCount || 0} video ke dalam antrean transcoding.`, "success");
    await fetchStats(true);
  } catch (err) {
    showToast("Gagal memproses batch transcoding: " + (err.response?.data?.message || err.message), "error");
  } finally {
    batchLoading.value = false;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startPolling();
  } else {
    stopPolling();
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(() => {
    fetchStats();
    if (selectedTab.value === "logs") {
      fetchLogs();
    }
  }, pollIntervalMs.value);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return "0 detik";
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm:ss", { locale: id });
  } catch {
    return dateStr;
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: id });
  } catch {
    return dateStr;
  }
};

const getOperationBadgeClass = (type) => {
  switch (type) {
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
    case "processing":
    case "progress":
      return "bg-sky-100 text-sky-800 border-sky-400 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700";
    case "pending":
    case "enqueue":
      return "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
    case "failed":
      return "bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700";
    case "retranscode":
      return "bg-purple-100 text-purple-800 border-purple-400 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700";
    default:
      return "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700";
  }
};

onMounted(() => {
  fetchStats();
  fetchLogs();
  if (autoRefresh.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
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
        Worker &amp; Sistem
      </Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader
      title="Monitoring Worker & Sistem"
      description="Pantau proses transcode video HLS, status antrean BullMQ, konsumsi CPU & RAM, serta riwayat audit worker secara real-time."
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <!-- Transcode Batch Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-50"
          @click="batchRetranscodeAll"
          :disabled="batchLoading"
        >
          <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': batchLoading }" />
          <span>Batch Transcode HLS</span>
        </button>

        <!-- Live status toggle -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold border-2 border-black dark:border-stone-100 shadow-brutal-xs transition-all cursor-pointer"
          :class="autoRefresh ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'"
          @click="toggleAutoRefresh"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'"
          ></span>
          <span>{{ autoRefresh ? 'LIVE (5s)' : 'PAUSED' }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-50"
          @click="fetchStats(true)"
          :disabled="refreshing"
        >
          <RefreshCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" />
          <span>Refresh</span>
        </button>
      </template>
    </PageHeader>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Worker Status -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-sky-500/20 border border-sky-600 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Activity class="w-4 h-4 stroke-[2.5]" />
            </div>
            <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Worker Antrean
            </span>
          </div>
          <span class="text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 border border-sky-300 dark:border-sky-800">
            BullMQ
          </span>
        </div>

        <div class="my-1">
          <div class="text-3xl font-display font-black text-stone-900 dark:text-stone-100">
            {{ jobCounts.processing }}
          </div>
          <div class="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tight">
            Pekerjaan Sedang Berjalan
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-800 font-mono">
          <span>Pending: <strong class="text-amber-600 dark:text-amber-400">{{ jobCounts.pending }}</strong></span>
          <span>Gagal: <strong class="text-rose-600 dark:text-rose-400">{{ jobCounts.failed }}</strong></span>
        </div>
      </div>

      <!-- Card 2: System RAM -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-emerald-500/20 border border-emerald-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HardDrive class="w-4 h-4 stroke-[2.5]" />
            </div>
            <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              RAM Sistem
            </span>
          </div>
          <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {{ systemStats?.memUsagePct || 0 }}%
          </span>
        </div>

        <div class="my-1">
          <div class="text-2xl font-display font-black text-stone-900 dark:text-stone-100">
            {{ systemStats?.usedMemMB || 0 }} <span class="text-xs font-normal font-mono text-stone-500">/ {{ systemStats?.totalMemMB || 0 }} MB</span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-stone-100 dark:bg-stone-800 h-2 border border-black dark:border-stone-300 overflow-hidden my-2">
            <div
              class="bg-emerald-500 h-full transition-all duration-500"
              :style="{ width: `${systemStats?.memUsagePct || 0}%` }"
            ></div>
          </div>
        </div>

        <div class="text-xs text-stone-500 dark:text-stone-400 font-mono pt-2 border-t border-stone-200 dark:border-stone-800">
          Sisa Memori: <strong class="text-stone-800 dark:text-stone-200">{{ systemStats?.freeMemMB || 0 }} MB</strong>
        </div>
      </div>

      <!-- Card 3: Node Heap -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-purple-500/20 border border-purple-600 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Database class="w-4 h-4 stroke-[2.5]" />
            </div>
            <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Heap Node.js
            </span>
          </div>
          <span class="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 border border-purple-300 dark:border-purple-800">
            V8 Runtime
          </span>
        </div>

        <div class="my-1">
          <div class="text-2xl font-display font-black text-stone-900 dark:text-stone-100">
            {{ systemStats?.heapUsedMB || 0 }} <span class="text-xs font-normal font-mono text-stone-500">MB Used</span>
          </div>
          <p class="text-[11px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
            Total Heap: {{ systemStats?.heapTotalMB || 0 }} MB
          </p>
        </div>

        <div class="text-xs text-stone-600 dark:text-stone-400 font-mono pt-2 border-t border-stone-200 dark:border-stone-800">
          RSS: <strong class="text-stone-800 dark:text-stone-200">{{ systemStats?.rssMB || 0 }} MB</strong>
        </div>
      </div>

      <!-- Card 4: System Uptime -->
      <div class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-200 p-4 shadow-brutal-xs flex flex-col justify-between">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-amber-500/20 border border-amber-600 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock class="w-4 h-4 stroke-[2.5]" />
            </div>
            <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              System Uptime
            </span>
          </div>
          <span class="text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 border border-stone-300 dark:border-stone-700">
            {{ systemStats?.cpusCount || 1 }} Core
          </span>
        </div>

        <div class="my-1">
          <div class="text-xl font-display font-black text-stone-900 dark:text-stone-100 truncate">
            {{ formatDuration(systemStats?.uptimeSeconds || 0) }}
          </div>
          <p class="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            Node {{ systemStats?.nodeVersion || 'v18' }} • {{ systemStats?.platform }}
          </p>
        </div>

        <div class="text-xs text-stone-600 dark:text-stone-400 font-mono pt-2 border-t border-stone-200 dark:border-stone-800 truncate">
          CPU: {{ systemStats?.cpuModel?.substring(0, 20) || 'Virtual CPU' }}
        </div>
      </div>
    </div>

    <!-- Neobrutalist Tabs Navigation -->
    <div class="flex border-b-2 border-black dark:border-stone-200 gap-2 overflow-x-auto">
      <button
        @click="selectedTab = 'jobs'"
        class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'jobs'
            ? 'bg-white dark:bg-stone-900 border-black dark:border-stone-200 text-brand-teal dark:text-teal-300 border-b-2 border-b-white dark:border-b-stone-900 shadow-brutal-xs font-black'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Layers class="w-4 h-4" />
        <span>Pekerjaan Transcoding</span>
        <span
          v-if="jobCounts.processing + jobCounts.pending > 0"
          class="bg-brand-teal text-white text-[10px] font-mono px-1.5 py-0.2 border border-black font-bold"
        >
          {{ jobCounts.processing + jobCounts.pending }}
        </span>
      </button>

      <button
        @click="selectedTab = 'system'"
        class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'system'
            ? 'bg-white dark:bg-stone-900 border-black dark:border-stone-200 text-brand-teal dark:text-teal-300 border-b-2 border-b-white dark:border-b-stone-900 shadow-brutal-xs font-black'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Server class="w-4 h-4" />
        <span>Kinerja &amp; Resource</span>
      </button>

      <button
        @click="selectedTab = 'logs'"
        class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'logs'
            ? 'bg-white dark:bg-stone-900 border-black dark:border-stone-200 text-brand-teal dark:text-teal-300 border-b-2 border-b-white dark:border-b-stone-900 shadow-brutal-xs font-black'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Terminal class="w-4 h-4" />
        <span>Log Auditing Worker</span>
      </button>
    </div>

    <!-- TAB 1: Transcoding Jobs List -->
    <div v-if="selectedTab === 'jobs'" class="space-y-6">
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal overflow-hidden bg-white dark:bg-stone-900">
        <CardHeader class="bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200 py-3.5 px-4 md:px-6">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
                <Film class="w-3.5 h-3.5" />
              </div>
              <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Daftar Pekerjaan Transcoding ({{ activeJobs.length }})
              </CardTitle>
            </div>
            <span class="text-xs font-mono font-bold text-stone-600 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 border border-stone-300 dark:border-stone-700">
              Total Selesai: {{ jobCounts.completed }} Video
            </span>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="activeJobs.length === 0" class="py-16 px-4 text-center text-stone-500 dark:text-stone-400">
            <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p class="font-mono text-sm uppercase tracking-wider font-bold text-stone-800 dark:text-stone-200">
              Tidak Ada Pekerjaan Transcoding yang Berjalan
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              Semua berkas video telah berhasil diproses ke dalam manifest HLS m3u8 atau antrean saat ini sedang kosong.
            </p>
          </div>

          <div v-else class="divide-y-2 divide-stone-200 dark:divide-stone-800">
            <div
              v-for="job in activeJobs"
              :key="job.film_id"
              class="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
            >
              <!-- Job Info -->
              <div class="flex items-start gap-3.5 min-w-0 flex-1">
                <div class="w-11 h-11 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-200 flex items-center justify-center shrink-0 shadow-brutal-xs">
                  <Film class="w-5 h-5 text-stone-700 dark:text-stone-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-sm md:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                      {{ job.judul }}
                    </h4>
                    <span class="font-mono text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 border border-stone-300 dark:border-stone-700">
                      ID: #{{ job.film_id }}
                    </span>
                  </div>
                  <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Pengunggah: <span class="font-bold text-stone-700 dark:text-stone-300">{{ job.creator?.name || 'Anonim' }}</span> • Diperbarui {{ formatRelativeTime(job.updated_at) }}
                  </p>

                  <!-- Progress Bar if Processing -->
                  <div v-if="job.transcode_status === 'processing'" class="mt-2.5 max-w-md">
                    <div class="flex items-center justify-between text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold mb-1">
                      <span>Memproses FFmpeg HLS...</span>
                      <span>{{ job.transcode_progress || 0 }}%</span>
                    </div>
                    <div class="w-full bg-stone-100 dark:bg-stone-800 h-2.5 border border-black dark:border-stone-300 overflow-hidden">
                      <div
                        class="bg-sky-500 h-full transition-all duration-300"
                        :style="{ width: `${job.transcode_progress || 0}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Job Status Badge & Action -->
              <div class="flex items-center gap-3 shrink-0">
                <!-- Status Badge -->
                <span
                  class="px-3 py-1 font-mono text-xs uppercase font-bold border-2 flex items-center gap-1.5 shadow-brutal-xs"
                  :class="getOperationBadgeClass(job.transcode_status)"
                >
                  <Loader2 v-if="job.transcode_status === 'processing' || job.transcode_status === 'pending'" class="w-3.5 h-3.5 animate-spin" />
                  <CheckCircle2 v-else-if="job.transcode_status === 'completed'" class="w-3.5 h-3.5" />
                  <AlertTriangle v-else-if="job.transcode_status === 'failed'" class="w-3.5 h-3.5" />
                  <span>{{ job.transcode_status || 'none' }}</span>
                </span>

                <!-- Action button for retry or cancel -->
                <button
                  v-if="job.transcode_status === 'failed'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs text-xs font-bold uppercase cursor-pointer"
                  @click="retryJob(job.film_id)"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Coba Ulang</span>
                </button>

                <button
                  v-else-if="job.transcode_status === 'processing' || job.transcode_status === 'pending'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs text-xs font-bold uppercase cursor-pointer"
                  @click="cancelJob(job.film_id)"
                >
                  <span>Batalkan</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- TAB 2: System Metrics -->
    <div v-if="selectedTab === 'system'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- OS & Hardware Info -->
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
        <CardHeader class="bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200 py-3.5 px-4 md:px-6">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
              <Server class="w-3.5 h-3.5" />
            </div>
            <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Spesifikasi Server &amp; Runtime
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-5 md:p-6 space-y-3 text-xs">
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Platform OS</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold uppercase">{{ systemStats?.platform }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Processor (CPU)</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold text-right">{{ systemStats?.cpuModel }} ({{ systemStats?.cpusCount }} Cores)</span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Versi Node.js</span>
            <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{{ systemStats?.nodeVersion }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Process Uptime</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">{{ formatDuration(systemStats?.processUptimeSeconds) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Load Average CPU</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">
              {{ systemStats?.loadAvg?.map(n => n.toFixed(2)).join(', ') || 'N/A' }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Transcoder Health & Storage -->
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
        <CardHeader class="bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200 py-3.5 px-4 md:px-6">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-sky-500/20 border border-sky-600 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Activity class="w-3.5 h-3.5" />
            </div>
            <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Status Queue &amp; Output Transcoder
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-5 md:p-6 space-y-3 text-xs">
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">BullMQ / Redis Queue</span>
            <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE (video-transcoding)
            </span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Total Video HLS Selesai</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">{{ jobCounts.completed }} Video</span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Total Job Gagal (Failed)</span>
            <span class="font-mono text-rose-600 dark:text-rose-400 font-bold">{{ jobCounts.failed }} Video</span>
          </div>
          <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Output Renditions</span>
            <span class="font-mono text-sky-600 dark:text-sky-400 font-bold">720p (2.5Mbps), 360p (800kbps)</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-stone-500 dark:text-stone-400 font-bold uppercase">Manifest Format</span>
            <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">m3u8 (master.m3u8)</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- TAB 3: Worker Audit Logs -->
    <div v-if="selectedTab === 'logs'" class="space-y-6">
      <!-- Search & Filters Toolbar -->
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 p-4">
        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div class="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <!-- Search Film ID -->
            <div class="relative flex-1 sm:w-60">
              <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                v-model="searchFilmId"
                type="text"
                placeholder="Cari Film ID..."
                @keyup.enter="fetchLogs"
                class="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs pl-8 pr-3 py-1.5 border-2 border-black dark:border-stone-300 focus:outline-none font-mono"
              />
            </div>

            <!-- Filter Operation Type -->
            <select
              v-model="filterType"
              @change="fetchLogs"
              class="bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs px-3 py-1.5 border-2 border-black dark:border-stone-300 focus:outline-none font-mono font-bold cursor-pointer"
            >
              <option value="">Semua Tipe Operasi</option>
              <option value="enqueue">Enqueue</option>
              <option value="processing">Processing</option>
              <option value="progress">Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="retranscode">Retranscode</option>
            </select>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-bold uppercase text-xs cursor-pointer"
            @click="fetchLogs"
          >
            <Filter class="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </button>
        </div>
      </Card>

      <!-- Logs Data Table -->
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal overflow-hidden bg-white dark:bg-stone-900">
        <CardHeader class="bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200 py-3.5 px-4 md:px-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
                <ClipboardList class="w-3.5 h-3.5" />
              </div>
              <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Riwayat Log Eksekusi Worker
              </CardTitle>
            </div>
            <span class="text-xs font-mono text-stone-500 dark:text-stone-400">
              {{ totalLogs }} Total Catatan
            </span>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <div v-if="loadingLogs" class="py-16 text-center">
            <Loader2 class="w-8 h-8 animate-spin text-brand-teal mx-auto mb-3" />
            <p class="font-mono text-stone-500 uppercase tracking-widest text-xs">Memuat Log Worker...</p>
          </div>

          <div v-else-if="filteredLogs.length === 0" class="py-16 text-center text-stone-500 dark:text-stone-400">
            Belum ada catatan log auditing worker yang cocok dengan filter.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[800px]">
              <thead class="bg-stone-200/80 dark:bg-stone-800/80 border-b-2 border-black dark:border-stone-200 text-[11px] uppercase font-mono font-bold tracking-wider text-stone-800 dark:text-stone-200">
                <tr>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Waktu</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Film ID</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Judul Film</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Operasi</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Transisi Status</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700 text-center">Progres</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700 text-center">Attempt</th>
                  <th class="px-4 py-3 border-r border-stone-300 dark:border-stone-700">Error / Alasan</th>
                  <th class="px-4 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 dark:divide-stone-800 text-xs font-mono bg-white dark:bg-stone-900">
                <tr
                  v-for="log in filteredLogs"
                  :key="log.id"
                  class="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 text-stone-500 whitespace-nowrap text-[11px]">
                    {{ formatDate(log.created_at) }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 font-bold text-brand-teal">
                    #{{ log.film_id }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 font-sans font-bold text-stone-900 dark:text-stone-100 max-w-[180px] truncate">
                    {{ log.film?.judul || 'Unknown Film' }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800">
                    <span
                      class="px-2 py-0.5 text-[10px] font-bold uppercase border"
                      :class="getOperationBadgeClass(log.operation_type)"
                    >
                      {{ log.operation_type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 text-[11px]">
                    <span class="text-stone-400">{{ log.previous_status || 'none' }}</span>
                    <span class="mx-1 text-stone-400">→</span>
                    <span class="font-bold text-stone-800 dark:text-stone-200">{{ log.new_status || 'none' }}</span>
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 text-center font-bold text-sky-600 dark:text-sky-400">
                    {{ log.progress }}%
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 text-center text-amber-600 dark:text-amber-400 font-bold">
                    {{ log.attempt || 1 }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 max-w-[200px] truncate text-stone-500" :title="log.error_message || log.reason">
                    <span v-if="log.error_message" class="text-rose-600 dark:text-rose-400 font-bold">{{ log.error_message }}</span>
                    <span v-else-if="log.reason" class="text-stone-700 dark:text-stone-300">{{ log.reason }}</span>
                    <span v-else class="text-stone-400">-</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      v-if="log.metadata_json"
                      type="button"
                      class="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 cursor-pointer"
                      @click="selectedLogMetadata = log"
                      title="Lihat Metadata JSON"
                    >
                      <Info class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div v-if="totalPages > 1" class="p-4 border-t-2 border-black dark:border-stone-200 flex items-center justify-between text-xs font-mono bg-stone-50 dark:bg-stone-800/50">
            <span class="text-stone-500">Halaman {{ page }} dari {{ totalPages }} (Total {{ totalLogs }} log)</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-3 py-1 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 font-bold shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 cursor-pointer inline-flex items-center"
                @click="page--; fetchLogs()"
                :disabled="page <= 1"
              >
                <ChevronLeft class="w-3.5 h-3.5 mr-1" /> Prev
              </button>
              <button
                type="button"
                class="px-3 py-1 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 font-bold shadow-brutal-xs hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 cursor-pointer inline-flex items-center"
                @click="page++; fetchLogs()"
                :disabled="page >= totalPages"
              >
                Next <ChevronRight class="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Log Metadata Modal -->
    <div
      v-if="selectedLogMetadata"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="selectedLogMetadata = null"
    >
      <div class="max-w-lg w-full border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 overflow-hidden">
        <div class="bg-stone-100 dark:bg-stone-800 border-b-2 border-black dark:border-stone-200 py-3 px-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Terminal class="w-4 h-4 text-brand-teal" />
            <h3 class="text-xs font-bold uppercase tracking-wider">
              Detail Log Worker #{{ selectedLogMetadata.id }}
            </h3>
          </div>
          <button 
            type="button"
            @click="selectedLogMetadata = null" 
            class="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
        <div class="p-5 space-y-3 text-xs font-mono">
          <div class="space-y-1.5 text-stone-700 dark:text-stone-300">
            <p><strong class="text-stone-500">Film ID:</strong> #{{ selectedLogMetadata.film_id }}</p>
            <p><strong class="text-stone-500">Tipe Operasi:</strong> {{ selectedLogMetadata.operation_type }}</p>
            <p><strong class="text-stone-500">Waktu:</strong> {{ formatDate(selectedLogMetadata.created_at) }}</p>
            <p v-if="selectedLogMetadata.error_message" class="text-rose-600 dark:text-rose-400 font-bold">
              <strong>Error:</strong> {{ selectedLogMetadata.error_message }}
            </p>
          </div>

          <div>
            <span class="text-stone-500 font-bold block mb-1 uppercase text-[10px]">Metadata JSON:</span>
            <pre class="bg-stone-900 text-sky-300 p-3 border-2 border-stone-800 text-[11px] overflow-x-auto max-h-60">{{
              typeof selectedLogMetadata.metadata_json === 'string'
                ? selectedLogMetadata.metadata_json
                : JSON.stringify(selectedLogMetadata.metadata_json, null, 2)
            }}</pre>
          </div>

          <div class="pt-3 text-right">
            <button
              type="button"
              class="px-4 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-200 shadow-brutal-xs font-bold text-xs uppercase cursor-pointer"
              @click="selectedLogMetadata = null"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

