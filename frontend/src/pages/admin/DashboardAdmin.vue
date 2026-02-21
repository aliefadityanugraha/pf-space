<script setup>
import { ref, onMounted } from 'vue'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { 
  LayoutDashboard, Upload, FileDown, ListChecks, FileEdit, Users, Grid3X3, 
  Flag, TrendingUp, Film, Eye, Clock, ChevronRight, Loader2
} from 'lucide-vue-next'

const sidebarCollapsed = ref(false)
const loading = ref(true)

const stats = ref([
  { label: 'Total Karya', value: '0', change: '0', changeType: 'positive', icon: Film },
  { label: 'User Aktif', value: '0', change: '0', changeType: 'positive', icon: Users },
  { label: 'Total Kategori', value: '0', change: '0', changeType: 'positive', icon: Grid3X3 },
  { label: 'Karya Menunggu', value: '0', change: '0', changeType: 'negative', icon: Clock },
])

const tasks = ref([])
const recentActivities = ref([])

const fetchDashboardStats = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/admin/stats')
    if (response?.success) {
      const data = response.data
      
      // Update stats
      stats.value[0].value = (data.totalFilms || 0).toString()
      stats.value[0].change = '+' + (data.newFilms || 0)
      
      stats.value[1].value = (data.totalUsers || 0).toString()
      stats.value[1].change = '+' + (data.newUsers || 0)

      stats.value[2].value = (data.totalCategories || 0).toString()
      stats.value[2].change = '+' + (data.newCategories || 0)

      stats.value[3].value = (data.pendingFilms || 0).toString()
      // For pending Karya, change isn't calculated, so we can keep it 0 or hide it
      stats.value[3].change = '0'

      // Update tasks (pending Karya)
      tasks.value = (data.recentPendingFilms || []).map(karya => ({
        id: karya.film_id,
        name: 'Review Karya',
        subject: karya.judul,
        subjectNote: `by ${karya.creator?.name || 'Unknown'}`,
        status: 'Pending',
        statusColor: 'bg-amber-100',
        icon: FileEdit,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-900',
        action: 'Review',
        actionPrimary: true
      }))

      // Update recent activities
      recentActivities.value = data.recentActivities.map(act => ({
        ...act,
        time: act.time ? new Date(act.time).toLocaleDateString() : 'Recently'
      }))
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Home</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administration</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Dashboard</Badge>
      </nav>

      <PageHeader 
        title="System Overview" 
        description="Monitor system statistics, pending tasks, and recent activities."
        :icon="LayoutDashboard"
        icon-color="bg-amber-500"
      >
        <template #actions>
          <Button variant="outline" class="gap-2">
            <Upload class="w-4 h-4" />
            Quick Upload
          </Button>
          <Button variant="outline" class="gap-2">
            <FileDown class="w-4 h-4" />
            Report
          </Button>
        </template>
      </PageHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 class="w-12 h-12 animate-spin text-brand-teal mb-4" />
        <p class="text-stone-500 font-mono uppercase tracking-widest animate-pulse">Memuat Data...</p>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card v-for="stat in stats" :key="stat.label">
            <CardContent class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-stone-600 border-b-2 border-pink-700 pb-1">{{ stat.label }}</span>
              <component :is="stat.icon" class="w-5 h-5 text-stone-400" />
            </div>
            <div class="text-4xl font-bold text-stone-800 mt-4">{{ stat.value }}</div>
            <div class="flex items-center gap-2 mt-2">
              <TrendingUp v-if="stat.changeType === 'positive'" class="w-4 h-4 text-green-600" />
              <span :class="stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">{{ stat.change }}</span>
              <span class="text-xs text-stone-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card class="xl:col-span-2">
          <CardHeader class="bg-orange-50 border-b-2 border-stone-800">
            <div class="flex items-center gap-3">
              <ListChecks class="w-5 h-5" />
              <CardTitle class="text-lg font-bold uppercase">Active Tasks</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-lime-50 border-b-2 border-stone-800 text-xs font-bold uppercase tracking-wider">
              <div class="col-span-4">Task Name</div>
              <div class="col-span-4">Subject</div>
              <div class="col-span-2">Status</div>
              <div class="col-span-2 text-right">Action</div>
            </div>
            <div v-for="task in tasks" :key="task.id" class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 hover:bg-stone-50">
              <div class="md:col-span-4 flex items-center gap-3">
                <div :class="[task.iconBg, task.iconColor]" class="p-2 border-2 border-stone-800 shadow-brutal-sm">
                  <component :is="task.icon" class="w-4 h-4" />
                </div>
                <span class="font-bold uppercase text-sm">{{ task.name }}</span>
              </div>
              <div class="md:col-span-4">
                <span class="text-sm">{{ task.subject }}</span>
                <span v-if="task.subjectNote" class="text-xs text-stone-500 ml-1">{{ task.subjectNote }}</span>
              </div>
              <div class="md:col-span-2">
                <Badge :class="task.statusColor" variant="outline" class="text-[10px] font-bold uppercase">{{ task.status }}</Badge>
              </div>
              <div class="md:col-span-2 flex md:justify-end">
                <Button v-if="task.actionPrimary" size="sm" class="text-[10px] uppercase">{{ task.action }}</Button>
                <Button v-else variant="outline" size="sm" class="text-[10px] uppercase gap-1">
                  <component v-if="task.actionIcon" :is="task.actionIcon" class="w-3 h-3" />
                  {{ task.action }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="bg-stone-50 border-b-2 border-stone-800">
            <div class="flex items-center justify-between">
              <CardTitle class="text-lg font-bold uppercase">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" class="text-xs uppercase gap-1">
                View All
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <div v-for="(activity, index) in recentActivities" :key="index" class="px-6 py-4 border-b border-stone-200 last:border-0">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 bg-stone-200 border-2 border-stone-800 flex items-center justify-center text-xs font-bold">{{ activity.user.charAt(0) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm">
                    <span class="font-bold">{{ activity.user }}</span>
                    <span class="text-stone-600"> {{ activity.action }} </span>
                    <span class="font-medium">{{ activity.target }}</span>
                  </p>
                  <p class="text-xs text-stone-500 mt-1">{{ activity.time }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
    </main>
  </div>
</template>

