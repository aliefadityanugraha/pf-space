<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { api } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import PageHeader from "@/components/PageHeader.vue";
import { Button } from "@/components/ui/button";
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
} from "lucide-vue-next";

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
  } finally {
    loadingLogs.value = false;
  }
};

const retryJob = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/retranscode`);
    await fetchStats(true);
  } catch (err) {
    alert("Gagal memulai ulang transcoding: " + err.message);
  }
};

const cancelJob = async (filmId) => {
  try {
    await api.post(`/api/films/${filmId}/transcode/cancel`);
    await fetchStats(true);
  } catch (err) {
    alert("Gagal membatalkan pekerjaan: " + err.message);
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
    alert(res.data?.message || `Berhasil memasukkan ${data.enqueuedCount || 0} video ke dalam antrean transcoding.`);
    await fetchStats(true);
  } catch (err) {
    alert("Gagal memproses batch transcoding: " + (err.response?.data?.message || err.message));
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
    clearInterval(pollTimer)
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
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
    case "processing":
    case "progress":
      return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
    case "pending":
    case "enqueue":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    case "failed":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
    case "retranscode":
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
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
  <div class="p-4 md:p-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/admin" class="text-brand-teal hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 font-bold">
        Worker & Sistem
      </Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader
      title="Monitoring Worker & Sistem"
      description="Pantau status pemrosesan video HLS, antrean worker, penggunaan CPU/RAM, dan log eksekusi secara real-time."
      :icon="Cpu"
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <!-- Transcode Batch Button -->
        <Button
          variant="outline"
          size="sm"
          class="gap-2 bg-brand-teal text-white border-2 border-stone-800 dark:border-stone-100 shadow-brutal-xs hover:bg-brand-teal/90 font-bold text-xs uppercase cursor-pointer"
          @click="batchRetranscodeAll"
          :disabled="batchLoading"
        >
          <RotateCcw :class="['w-4 h-4', batchLoading ? 'animate-spin' : '']" />
          <span>Transcode Semua Video Lama</span>
        </Button>

        <!-- Live status toggle -->
        <Button
          variant="outline"
          size="sm"
          class="gap-2 font-mono border-2 border-stone-800 dark:border-stone-100 shadow-brutal-xs text-xs uppercase font-bold"
          :class="autoRefresh ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300' : ''"
          @click="toggleAutoRefresh"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'"
          ></span>
          <span>{{ autoRefresh ? 'LIVE (5s)' : 'PAUSED' }}</span>
        </Button>

        <!-- Refresh Button -->
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-2 border-stone-800 dark:border-stone-100 shadow-brutal-xs font-bold text-xs uppercase"
          @click="fetchStats(true)"
          :disabled="refreshing"
        >
          <RefreshCcw :class="['w-4 h-4', refreshing ? 'animate-spin' : '']" />
          Refresh
        </Button>
      </template>
    </PageHeader>

    <!-- KPI Cards Grid (Matches StorageManager & AdminDashboard design) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Card 1: Worker Processing Status -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 py-3">
          <CardTitle class="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-stone-900 dark:text-stone-100">
            <span class="flex items-center gap-2">
              <Activity class="w-4 h-4 text-sky-500" />
              Worker Status
            </span>
            <Badge variant="outline" class="bg-sky-100 text-sky-700 border-sky-300 text-[10px]">
              BullMQ Queue
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div class="text-4xl font-black text-stone-900 dark:text-stone-100 mb-1">
            {{ jobCounts.processing }}
          </div>
          <p class="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2">Pekerjaan Aktif Berjalan</p>
          <div class="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-800 font-mono">
            <span>Pending: <strong class="text-amber-600 dark:text-amber-400">{{ jobCounts.pending }}</strong></span>
            <span>Failed: <strong class="text-rose-600 dark:text-rose-400">{{ jobCounts.failed }}</strong></span>
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Memory Usage (RAM) -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 py-3">
          <CardTitle class="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-stone-900 dark:text-stone-100">
            <span class="flex items-center gap-2">
              <HardDrive class="w-4 h-4 text-emerald-500" />
              RAM System
            </span>
            <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ systemStats?.memUsagePct || 0 }}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div class="text-4xl font-black text-stone-900 dark:text-stone-100 mb-1">
            {{ systemStats?.usedMemMB || 0 }} <span class="text-base font-normal text-stone-500">/ {{ systemStats?.totalMemMB || 0 }} MB</span>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded border border-stone-800 dark:border-stone-100 overflow-hidden my-3">
            <div
              class="bg-emerald-500 h-full transition-all duration-500"
              :style="{ width: `${systemStats?.memUsagePct || 0}%` }"
            ></div>
          </div>
          <p class="text-xs text-stone-500 dark:text-stone-400 font-mono">
            Sisa Memori: <strong class="text-stone-800 dark:text-stone-200">{{ systemStats?.freeMemMB || 0 }} MB</strong>
          </p>
        </CardContent>
      </Card>

      <!-- Card 3: Node Process Heap -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 py-3">
          <CardTitle class="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Database class="w-4 h-4 text-purple-500" />
            Heap Node.js
          </CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div class="text-4xl font-black text-stone-900 dark:text-stone-100 mb-1">
            {{ systemStats?.heapUsedMB || 0 }} <span class="text-base font-normal text-stone-500">MB</span>
          </div>
          <p class="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Total Heap: {{ systemStats?.heapTotalMB || 0 }} MB</p>
          <div class="pt-2 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 font-mono">
            RSS: <strong class="text-stone-800 dark:text-stone-200">{{ systemStats?.rssMB || 0 }} MB</strong>
          </div>
        </CardContent>
      </Card>

      <!-- Card 4: System Uptime & CPU Cores -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 py-3">
          <CardTitle class="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Clock class="w-4 h-4 text-amber-500" />
            System Uptime
          </CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div class="text-2xl font-black text-stone-900 dark:text-stone-100 mb-1 truncate">
            {{ formatDuration(systemStats?.uptimeSeconds || 0) }}
          </div>
          <p class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">CPU: {{ systemStats?.cpusCount || 1 }} Core</p>
          <div class="pt-2 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 font-mono truncate">
            Node {{ systemStats?.nodeVersion || 'v18' }} • OS {{ systemStats?.platform }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Neobrutalist Tabs Navigation -->
    <div class="flex border-b-2 border-stone-800 dark:border-stone-100 gap-2 mb-6 overflow-x-auto">
      <button
        @click="selectedTab = 'jobs'"
        class="px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 rounded-t-lg -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'jobs'
            ? 'bg-card border-stone-800 dark:border-stone-100 text-brand-teal border-b-2 border-b-card shadow-brutal-xs font-extrabold'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Layers class="w-4 h-4" />
        <span>Pekerjaan Transcoding</span>
        <Badge
          v-if="jobCounts.processing + jobCounts.pending > 0"
          variant="secondary"
          class="bg-brand-teal text-white border-0 text-[10px] font-mono px-1.5"
        >
          {{ jobCounts.processing + jobCounts.pending }}
        </Badge>
      </button>

      <button
        @click="selectedTab = 'system'"
        class="px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 rounded-t-lg -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'system'
            ? 'bg-card border-stone-800 dark:border-stone-100 text-brand-teal border-b-2 border-b-card shadow-brutal-xs font-extrabold'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Server class="w-4 h-4" />
        <span>Kinerja & Resource</span>
      </button>

      <button
        @click="selectedTab = 'logs'"
        class="px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 rounded-t-lg -mb-[2px] flex items-center gap-2 cursor-pointer"
        :class="
          selectedTab === 'logs'
            ? 'bg-card border-stone-800 dark:border-stone-100 text-brand-teal border-b-2 border-b-card shadow-brutal-xs font-extrabold'
            : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
        "
      >
        <Terminal class="w-4 h-4" />
        <span>Log Auditing Worker</span>
      </button>
    </div>

    <!-- TAB 1: Transcoding Jobs List -->
    <div v-if="selectedTab === 'jobs'" class="space-y-6">
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal overflow-hidden bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 py-4">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Film class="w-4 h-4 text-brand-teal" />
              Daftar Pekerjaan HLS Terbaru ({{ activeJobs.length }})
            </CardTitle>
            <span class="text-xs font-mono uppercase font-bold text-stone-500 dark:text-stone-400">Total Transcoded: {{ jobCounts.completed }} Video</span>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="activeJobs.length === 0" class="p-12 text-center text-stone-500 dark:text-stone-400">
            <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <p class="font-mono text-sm uppercase tracking-wider font-bold">Tidak ada pekerjaan transcoding yang berjalan atau bermasalah saat ini.</p>
          </div>

          <div v-else class="divide-y-2 divide-stone-200 dark:divide-stone-800">
            <div
              v-for="job in activeJobs"
              :key="job.film_id"
              class="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
            >
              <!-- Job Info -->
              <div class="flex items-start gap-4 min-w-0 flex-1">
                <div class="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 border-2 border-stone-800 dark:border-stone-100 flex items-center justify-center shrink-0 shadow-brutal-xs">
                  <Film class="w-5 h-5 text-stone-700 dark:text-stone-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-base font-bold font-display text-stone-900 dark:text-stone-100 truncate">
                      {{ job.judul }}
                    </h4>
                    <Badge variant="outline" class="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-600">
                      ID: {{ job.film_id }}
                    </Badge>
                  </div>
                  <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Pengunggah: <span class="font-bold text-stone-700 dark:text-stone-300">{{ job.creator?.name || 'Anonim' }}</span> • {{ formatRelativeTime(job.updated_at) }}
                  </p>

                  <!-- Progress Bar if Processing -->
                  <div v-if="job.transcode_status === 'processing'" class="mt-3 max-w-md">
                    <div class="flex items-center justify-between text-xs font-mono text-sky-600 dark:text-sky-400 font-bold mb-1">
                      <span>Transcoding HLS...</span>
                      <span>{{ job.transcode_progress || 0 }}%</span>
                    </div>
                    <div class="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded border border-stone-800 dark:border-stone-100 overflow-hidden">
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
                <Badge
                  variant="outline"
                  class="px-3 py-1 font-mono text-xs uppercase font-bold border flex items-center gap-1.5"
                  :class="getOperationBadgeClass(job.transcode_status)"
                >
                  <Loader2 v-if="job.transcode_status === 'processing' || job.transcode_status === 'pending'" class="w-3.5 h-3.5 animate-spin" />
                  <CheckCircle2 v-else-if="job.transcode_status === 'completed'" class="w-3.5 h-3.5" />
                  <AlertTriangle v-else-if="job.transcode_status === 'failed'" class="w-3.5 h-3.5" />
                  <span>{{ job.transcode_status || 'none' }}</span>
                </Badge>

                <!-- Action button for retry or cancel -->
                <Button
                  v-if="job.transcode_status === 'failed'"
                  size="sm"
                  variant="outline"
                  class="gap-1.5 bg-purple-100 text-purple-800 border-purple-400 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-xs font-bold uppercase"
                  @click="retryJob(job.film_id)"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Coba Ulang</span>
                </Button>

                <Button
                  v-else-if="job.transcode_status === 'processing' || job.transcode_status === 'pending'"
                  size="sm"
                  variant="outline"
                  class="gap-1.5 bg-rose-100 text-rose-800 border-rose-400 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 text-xs font-bold uppercase"
                  @click="cancelJob(job.film_id)"
                >
                  <span>Batalkan</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- TAB 2: System Metrics -->
    <div v-if="selectedTab === 'system'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- OS & Hardware Info -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 py-4">
          <CardTitle class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Server class="w-4 h-4 text-brand-teal" />
            Spesifikasi Server & Runtime
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-4 text-xs">
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Platform OS</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold uppercase">{{ systemStats?.platform }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Processor (CPU)</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">{{ systemStats?.cpuModel }} ({{ systemStats?.cpusCount }} Cores)</span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Node.js Version</span>
              <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{{ systemStats?.nodeVersion }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Process Uptime</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">{{ formatDuration(systemStats?.processUptimeSeconds) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-stone-500 font-bold uppercase">Load Average CPU</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">
                {{ systemStats?.loadAvg?.map(n => n.toFixed(2)).join(', ') || 'N/A' }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Transcoder Health & Storage -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 py-4">
          <CardTitle class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Activity class="w-4 h-4 text-sky-500" />
            Status Queue & Output Transcoder
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-4 text-xs">
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">BullMQ / Redis Queue</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE (video-transcoding)
              </span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Total Video HLS Selesai</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">{{ jobCounts.completed }} Video</span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Total Job Gagal (Failed)</span>
              <span class="font-mono text-rose-600 dark:text-rose-400 font-bold">{{ jobCounts.failed }} Video</span>
            </div>
            <div class="flex justify-between py-2 border-b border-stone-200 dark:border-stone-800">
              <span class="text-stone-500 font-bold uppercase">Output Renditions</span>
              <span class="font-mono text-sky-600 dark:text-sky-400 font-bold">720p (2.5Mbps), 360p (800kbps)</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-stone-500 font-bold uppercase">Manifest Playlist Format</span>
              <span class="font-mono text-stone-900 dark:text-stone-100 font-bold">m3u8 (master.m3u8)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- TAB 3: Worker Audit Logs -->
    <div v-if="selectedTab === 'logs'" class="space-y-6">
      <!-- Search & Filters -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground p-4">
        <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <!-- Search Film ID -->
            <div class="relative flex-1 sm:w-56">
              <Search class="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                v-model="searchFilmId"
                type="text"
                placeholder="Cari Film ID..."
                @keyup.enter="fetchLogs"
                class="w-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs pl-9 pr-3 py-2 rounded border-2 border-stone-800 dark:border-stone-100 focus:outline-none font-mono"
              />
            </div>

            <!-- Filter Operation Type -->
            <select
              v-model="filterType"
              @change="fetchLogs"
              class="bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs px-3 py-2 rounded border-2 border-stone-800 dark:border-stone-100 focus:outline-none font-mono font-bold cursor-pointer"
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

          <Button
            size="sm"
            variant="outline"
            class="w-full sm:w-auto gap-2 border-2 border-stone-800 dark:border-stone-100 font-bold uppercase text-xs shadow-brutal-xs"
            @click="fetchLogs"
          >
            <Filter class="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </Button>
        </div>
      </Card>

      <!-- Logs Data Table (Matches AuditLogs design) -->
      <Card class="border-2 border-stone-800 dark:border-stone-100 shadow-brutal overflow-hidden bg-card text-card-foreground">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 py-4">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <ClipboardList class="w-4 h-4" />
              Daftar Log Auditing Worker
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <div v-if="loadingLogs" class="p-12 text-center">
            <Loader2 class="w-12 h-12 animate-spin text-brand-teal mx-auto mb-4" />
            <p class="font-mono text-stone-500 uppercase tracking-widest text-xs">Memuat Log Worker...</p>
          </div>

          <div v-else-if="filteredLogs.length === 0" class="p-12 text-center text-stone-500 dark:text-stone-400">
            Belum ada catatan log auditing worker yang cocok dengan filter.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-stone-100 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 text-[10px] uppercase font-black tracking-tighter text-stone-900 dark:text-stone-100">
                <tr>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Waktu</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Film ID</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Judul Film</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Operasi</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Status Transition</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700 text-center">Progres</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700 text-center">Attempt</th>
                  <th class="px-4 py-3 border-r border-stone-200 dark:border-stone-700">Error / Alasan</th>
                  <th class="px-4 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody class="divide-y border-stone-200 dark:divide-stone-800 text-xs font-mono">
                <tr
                  v-for="log in filteredLogs"
                  :key="log.id"
                  class="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 text-stone-500 whitespace-nowrap">
                    {{ formatDate(log.created_at) }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 font-bold text-brand-teal">
                    #{{ log.film_id }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800 font-body font-bold text-stone-900 dark:text-stone-100 max-w-[180px] truncate">
                    {{ log.film?.judul || 'Unknown Film' }}
                  </td>
                  <td class="px-4 py-3 border-r border-stone-200 dark:border-stone-800">
                    <Badge
                      variant="outline"
                      class="px-2 py-0.5 text-[10px] font-bold uppercase border"
                      :class="getOperationBadgeClass(log.operation_type)"
                    >
                      {{ log.operation_type }}
                    </Badge>
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
                    <Button
                      v-if="log.metadata_json"
                      size="sm"
                      variant="ghost"
                      class="h-7 w-7 p-0"
                      @click="selectedLogMetadata = log"
                      title="Lihat Metadata JSON"
                    >
                      <Info class="w-4 h-4 text-stone-600 dark:text-stone-300" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div v-if="totalPages > 1" class="p-4 border-t-2 border-stone-800 dark:border-stone-100 flex items-center justify-between text-xs font-mono">
            <span class="text-stone-500">Halaman {{ page }} dari {{ totalPages }} (Total {{ totalLogs }} log)</span>
            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                class="h-8 border-2 border-stone-800 dark:border-stone-100 font-bold"
                @click="page--; fetchLogs()"
                :disabled="page <= 1"
              >
                <ChevronLeft class="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="h-8 border-2 border-stone-800 dark:border-stone-100 font-bold"
                @click="page++; fetchLogs()"
                :disabled="page >= totalPages"
              >
                Next <ChevronRight class="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Log Metadata Modal (Neobrutalist modal) -->
    <div
      v-if="selectedLogMetadata"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="selectedLogMetadata = null"
    >
      <Card class="max-w-lg w-full border-2 border-stone-800 dark:border-stone-100 shadow-brutal bg-card text-card-foreground overflow-hidden">
        <CardHeader class="bg-stone-50 dark:bg-stone-800 border-b-2 border-stone-800 dark:border-stone-100 py-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Terminal class="w-4 h-4 text-brand-teal" />
              Detail Log Worker #{{ selectedLogMetadata.id }}
            </CardTitle>
            <button @click="selectedLogMetadata = null" class="text-stone-500 hover:text-stone-900 font-bold">✕</button>
          </div>
        </CardHeader>
        <CardContent class="p-5 space-y-3 text-xs font-mono">
          <div class="space-y-1.5 text-stone-700 dark:text-stone-300">
            <p><strong class="text-stone-500">Film ID:</strong> #{{ selectedLogMetadata.film_id }}</p>
            <p><strong class="text-stone-500">Tipe Operasi:</strong> {{ selectedLogMetadata.operation_type }}</p>
            <p><strong class="text-stone-500">Waktu:</strong> {{ formatDate(selectedLogMetadata.created_at) }}</p>
            <p v-if="selectedLogMetadata.error_message" class="text-rose-600 dark:text-rose-400 font-bold">
              <strong>Error:</strong> {{ selectedLogMetadata.error_message }}
            </p>
          </div>

          <div>
            <span class="text-stone-500 font-bold block mb-1 uppercase">Metadata JSON:</span>
            <pre class="bg-stone-900 text-sky-300 p-3 rounded border-2 border-stone-800 text-[11px] overflow-x-auto max-h-60">{{
              typeof selectedLogMetadata.metadata_json === 'string'
                ? selectedLogMetadata.metadata_json
                : JSON.stringify(selectedLogMetadata.metadata_json, null, 2)
            }}</pre>
          </div>

          <div class="pt-3 text-right">
            <Button
              size="sm"
              variant="outline"
              class="border-2 border-stone-800 dark:border-stone-100 font-bold uppercase"
              @click="selectedLogMetadata = null"
            >
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
