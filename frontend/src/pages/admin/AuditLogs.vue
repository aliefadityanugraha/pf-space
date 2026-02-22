<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  ClipboardList, User, Shield, Film, FileText, 
  Search, RefreshCcw, Loader2, ChevronLeft, ChevronRight, Clock, Globe
} from 'lucide-vue-next'

const loading = ref(true)
const logs = ref([])
const pagination = ref({ page: 1, totalPages: 1 })

const fetchLogs = async (page = 1) => {
  loading.value = true
  try {
    const response = await api.get(`/api/admin/logs?page=${page}`)
    if (response?.success) {
      logs.value = response.data
      pagination.value = response.pagination
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
  } finally {
    loading.value = false
  }
}

const getActionBadge = (action) => {
  switch (action) {
    case 'DELETE_FILM': return 'bg-red-100 text-red-700 border-red-200'
    case 'UPDATE_ROLE': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'APPROVE_FILM': return 'bg-green-100 text-green-700 border-green-200'
    case 'REJECT_FILM': return 'bg-amber-100 text-amber-700 border-amber-200'
    default: return 'bg-stone-100 text-stone-700 border-stone-200'
  }
}

const getTargetIcon = (type) => {
  switch (type) {
    case 'film': return Film
    case 'user': return User
    case 'category': return FileText
    default: return ClipboardList
  }
}

const parseDetails = (details) => {
  try {
    return typeof details === 'string' ? JSON.parse(details) : details
  } catch {
    return details
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="p-4 md:p-8">
    <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
      <router-link to="/admin" class="text-brand-teal hover:underline">Administrasi</router-link>
      <span class="text-stone-400">/</span>
      <Badge variant="outline" class="bg-purple-100 text-purple-700 border-purple-300">Log Audit</Badge>
    </nav>

    <PageHeader 
      title="Log Audit Admin" 
      description="Pantau riwayat aksi penting yang dilakukan oleh administrator."
      :icon="Shield"
      icon-color="bg-purple-600"
    >
      <template #actions>
        <Button variant="outline" class="gap-2" @click="fetchLogs(1)" :disabled="loading">
          <RefreshCcw :class="['w-4 h-4', loading ? 'animate-spin' : '']" />
          Refresh
        </Button>
      </template>
    </PageHeader>

    <Card class="border-2 border-stone-800 shadow-brutal overflow-hidden">
      <CardHeader class="bg-stone-50 border-b-2 border-stone-800 py-4">
        <div class="flex items-center justify-between">
          <CardTitle class="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ClipboardList class="w-4 h-4" />
            Daftar Aktivitas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="loading && logs.length === 0" class="p-12 text-center">
          <Loader2 class="w-12 h-12 animate-spin text-brand-teal mx-auto mb-4" />
          <p class="font-mono text-stone-500 uppercase tracking-widest">Memuat Log...</p>
        </div>

        <div v-else-if="logs.length === 0" class="p-12 text-center text-stone-500">
          Belum ada log aktivitas yang tercatat.
        </div>

        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-lime-50 border-b-2 border-stone-800 text-[10px] uppercase font-black tracking-tighter">
                <tr>
                  <th class="px-6 py-3 border-r border-stone-800">Waktu</th>
                  <th class="px-6 py-3 border-r border-stone-800">Admin</th>
                  <th class="px-6 py-3 border-r border-stone-800">Aksi</th>
                  <th class="px-6 py-3 border-r border-stone-800">Target</th>
                  <th class="px-6 py-3">Rincian</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200">
                <tr v-for="log in logs" :key="log.id" class="hover:bg-stone-50 transition-colors group">
                  <td class="px-6 py-4 whitespace-nowrap border-r border-stone-100">
                    <div class="flex items-center gap-2 text-xs font-mono">
                      <Clock class="w-3 h-3 text-stone-400" />
                      {{ formatDate(log.created_at) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 border-r border-stone-100">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 bg-stone-200 border border-stone-800 flex items-center justify-center text-[10px] font-bold">
                        {{ log.user?.name?.charAt(0) || '?' }}
                      </div>
                      <div>
                        <p class="text-[13px] font-bold truncate max-w-[120px]">{{ log.user?.name || 'Sistem' }}</p>
                        <p class="text-[10px] text-stone-500 font-mono">{{ log.ip_address || '0.0.0.0' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 border-r border-stone-100">
                    <Badge :class="getActionBadge(log.action)" variant="outline" class="text-[10px] font-bold uppercase py-0.5">
                      {{ log.action.replace('_', ' ') }}
                    </Badge>
                  </td>
                  <td class="px-6 py-4 border-r border-stone-100">
                    <div class="flex items-center gap-2 text-[13px]">
                      <component :is="getTargetIcon(log.target_type)" class="w-3.5 h-3.5 text-stone-400" />
                      <span class="font-medium uppercase text-[11px] text-stone-500">{{ log.target_type }}</span>
                      <span class="text-stone-300">#</span>
                      <span class="font-mono text-stone-400 text-[10px]">{{ log.target_id?.substring(0, 8) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-[11px] bg-stone-100 p-2 border border-stone-200 rounded font-mono text-stone-600 max-w-md overflow-hidden">
                      {{ log.details }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="p-4 bg-stone-50 border-t-2 border-stone-800 flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase text-stone-500">
              Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
            </span>
            <div class="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                :disabled="pagination.page === 1 || loading"
                @click="fetchLogs(pagination.page - 1)"
                class="h-8 border-2 border-stone-800 shadow-brutal-xs"
              >
                <ChevronLeft class="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                :disabled="pagination.page === pagination.totalPages || loading"
                @click="fetchLogs(pagination.page + 1)"
                class="h-8 border-2 border-stone-800 shadow-brutal-xs"
              >
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>
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
