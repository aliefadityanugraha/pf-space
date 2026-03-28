<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Database, Activity, RefreshCw, Cpu, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-vue-next'
import { api } from '@/lib/api'

const loading = ref(true)
const statusData = ref(null)
const error = ref(null)
const refreshInterval = ref(null)

const fetchStatus = async () => {
  try {
    const res = await api.get('/api/health')
    statusData.value = res
    error.value = null
  } catch (err) {
    console.error('Failed to fetch status:', err)
    error.value = err.message || 'Gagal menghubungi server'
    statusData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
  // Refresh every 30 seconds
  refreshInterval.value = setInterval(fetchStatus, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Formatting helpers
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  
  if (d > 0) return `${d}h ${h}j ${m}m`
  if (h > 0) return `${h}j ${m}m ${s}d`
  return `${m}m ${s}d`
}

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const getStatusColor = (status) => {
  if (status === 'connected') return 'bg-teal-500'
  if (status === 'error' || status === 'disconnected') return 'bg-brand-red'
  return 'bg-amber-400'
}
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto py-6 px-4 md:px-0 mt-6 mb-12">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-400 border-2 border-black shadow-brutal-sm flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform">
            <Activity class="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-display font-black text-stone-900 tracking-tight uppercase leading-none">
              Status Sistem
            </h1>
            <p class="text-stone-500 font-medium font-body text-sm mt-1">
              Pantauan *real-time* infrastruktur peladen kami.
            </p>
          </div>
        </div>

        <button 
          @click="() => { loading = true; fetchStatus() }"
          :disabled="loading"
          class="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border-2 border-black font-body font-bold hover:bg-stone-100 disabled:opacity-50 transition-colors shadow-[2px_2px_0_0_#000]"
        >
          <RefreshCw :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
          {{ loading ? 'Memperbarui...' : 'Perbarui Status' }}
        </button>
      </div>

      <!-- Critical Error Banner -->
      <div v-if="error" class="mb-6 p-4 bg-brand-red/10 border-2 border-brand-red flex items-start gap-3">
        <AlertTriangle class="w-6 h-6 text-brand-red shrink-0" />
        <div>
          <h3 class="font-display font-black text-brand-red text-lg uppercase tracking-wider mb-1">Terjadi Gangguan Fatal</h3>
          <p class="font-body text-sm text-stone-900">Kami gagal menghubungi peladen/server utama kami (Error: {{ error }}). Layanan mungkin tidak tersedia sementara waktu.</p>
        </div>
      </div>

      <div v-else-if="statusData" class="space-y-5">
        
        <!-- Global Operation Status -->
        <div class="bg-teal-500 border-2 border-black p-4 md:p-5 flex items-center justify-between flex-wrap gap-4 shadow-[4px_4px_0_0_#000] transform -rotate-1 relative z-10 hover:rotate-0 transition-transform mb-8">
          <div class="flex items-center gap-3 text-white">
             <CheckCircle class="w-7 h-7 md:w-8 md:h-8" />
             <div>
               <h2 class="font-display font-black text-lg md:text-xl uppercase tracking-widest drop-shadow-md">All Systems Operational</h2>
               <p class="font-bold text-xs opacity-90 mt-0.5">Terakhir diperbarui: {{ formatDate(statusData.timestamp) }}</p>
             </div>
          </div>
        </div>

        <!-- Metric Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">

          <!-- Core Server Uptime -->
          <Card class="border-2 border-black rounded-none shadow-[3px_3px_0_0_#000] overflow-hidden group">
            <div class="bg-stone-100 p-3 border-b-2 border-black flex items-center justify-between">
               <div class="flex items-center gap-2">
                 <Server class="w-4 h-4 text-stone-600" />
                 <h3 class="font-display font-black text-sm uppercase tracking-wider">Fastify API</h3>
               </div>
               <Badge class="bg-teal-500 hover:bg-teal-500/90 py-0 text-white shadow-none rounded-none border border-black uppercase text-[9px] tracking-widest px-1.5 h-4 flex items-center">
                 Online
               </Badge>
            </div>
            <div class="p-4 bg-white relative h-[100px] flex flex-col justify-center">
               <div class="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <p class="text-stone-500 font-bold mb-1 text-xs uppercase z-10 relative">Server Uptime</p>
               <h4 class="font-display font-black text-2xl md:text-3xl text-stone-900 relative z-10">{{ formatUptime(statusData.uptime) }}</h4>
            </div>
          </Card>

          <!-- Database Status -->
          <Card class="border-2 border-black rounded-none shadow-[3px_3px_0_0_#000] overflow-hidden group">
            <div class="bg-stone-100 p-3 border-b-2 border-black flex items-center justify-between">
               <div class="flex items-center gap-2">
                 <Database class="w-4 h-4 text-stone-600" />
                 <h3 class="font-display font-black text-sm uppercase tracking-wider">MySQL DB</h3>
               </div>
               <Badge :class="['text-white py-0 shadow-none rounded-none border border-black uppercase text-[9px] tracking-widest px-1.5 h-4 flex items-center', getStatusColor(statusData.database.status)]">
                 {{ statusData.database.status === 'connected' ? 'Connected' : 'Error' }}
               </Badge>
            </div>
            <div class="p-4 bg-white relative h-[100px] flex flex-col justify-center">
               <div class="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <p class="text-stone-500 font-bold mb-1 text-xs uppercase z-10 relative">Latensi (Ping)</p>
               <div class="flex items-baseline gap-1.5 relative z-10">
                 <h4 class="font-display font-black text-2xl md:text-3xl" :class="statusData.database.ping_ms > 100 ? 'text-amber-500' : 'text-stone-900'">
                    {{ statusData.database.ping_ms }}
                 </h4>
                 <span class="font-bold text-stone-500 text-sm">ms</span>
               </div>
               <p v-if="statusData.database.ping_ms > 100" class="text-[10px] text-brand-red font-bold mt-1 absolute bottom-2">Koneksi melambat</p>
            </div>
          </Card>

          <!-- Memory Usage -->
          <Card class="border-2 border-black rounded-none shadow-[3px_3px_0_0_#000] overflow-hidden group lg:col-span-1 md:col-span-2">
            <div class="bg-stone-100 p-3 border-b-2 border-black flex items-center justify-between">
               <div class="flex items-center gap-2">
                 <Cpu class="w-4 h-4 text-stone-600" />
                 <h3 class="font-display font-black text-sm uppercase tracking-wider">Memori</h3>
               </div>
               <Badge :class="[
                 'text-white py-0 shadow-none rounded-none border border-black uppercase text-[9px] tracking-widest px-1.5 h-4 flex items-center',
                 statusData.memory.usage_percent > 85 ? 'bg-brand-red hover:bg-brand-red' : statusData.memory.usage_percent > 70 ? 'bg-amber-500 hover:bg-amber-500' : 'bg-teal-500 hover:bg-teal-500'
               ]">
                 {{ statusData.memory.usage_percent > 85 ? 'Warning' : 'Normal' }}
               </Badge>
            </div>
            <div class="p-4 bg-white relative h-[100px] flex flex-col justify-center">
               <div class="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <p class="text-stone-500 font-bold mb-2 text-xs uppercase z-10 relative">Beban RAM ({{ statusData.memory.usage_percent }}%)</p>
               
               <!-- Progress Bar -->
               <div class="w-full bg-stone-200 border-2 border-black h-3 mb-2 relative z-10">
                  <div 
                    class="h-full transition-all duration-1000 border-r-2 border-black"
                    :class="statusData.memory.usage_percent > 85 ? 'bg-brand-red' : statusData.memory.usage_percent > 70 ? 'bg-amber-400' : 'bg-teal-400'"
                    :style="{ width: `${statusData.memory.usage_percent}%` }"
                  ></div>
               </div>
               
               <p class="text-[10px] font-bold font-body text-stone-900 border border-stone-300 px-1 py-0.5 inline-block bg-stone-50 w-max z-10 relative">
                 {{ statusData.memory.used_mb }} MB / {{ statusData.memory.total_mb }} MB
               </p>
            </div>
          </Card>

        </div>
      </div>

    </div>
  </PageLayout>
</template>
