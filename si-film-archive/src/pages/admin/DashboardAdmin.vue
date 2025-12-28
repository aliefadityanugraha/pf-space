<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, FileDown, ListChecks, FileEdit, Users, Grid3X3, 
  Flag, TrendingUp, Film, Eye, Clock, ChevronRight
} from 'lucide-vue-next'

const sidebarCollapsed = ref(false)

const stats = ref([
  { label: 'Total Films', value: '1,240', change: '+12%', changeType: 'positive', icon: Film },
  { label: 'Active Users', value: '3,842', change: '+8%', changeType: 'positive', icon: Users },
  { label: 'Views Today', value: '12.4K', change: '+24%', changeType: 'positive', icon: Eye },
  { label: 'Pending Tasks', value: '18', change: '-3', changeType: 'negative', icon: Clock },
])

const tasks = ref([
  { 
    id: 1, 
    name: 'Review RAB', 
    subject: 'Student Film A', 
    status: 'Pending', 
    statusColor: 'bg-amber-100',
    icon: FileEdit,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-900',
    action: 'Open'
  },
  { 
    id: 2, 
    name: 'Role Request', 
    subject: 'Jane Doe', 
    subjectNote: '(Student → Creator)',
    status: 'Review', 
    statusColor: 'bg-blue-100',
    icon: Users,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-900',
    action: 'Approve',
    actionPrimary: true
  },
  { 
    id: 3, 
    name: 'Grade Recap', 
    subject: 'Film History 101', 
    status: 'Ready', 
    statusColor: 'bg-green-100',
    icon: Grid3X3,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-900',
    action: 'CSV',
    actionIcon: FileDown
  },
  { 
    id: 4, 
    name: 'Content Flag', 
    subject: 'Short Film: "The Void"', 
    status: 'Urgent', 
    statusColor: 'bg-red-100',
    icon: Flag,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-900',
    action: 'Review'
  },
])

const recentActivities = ref([
  { user: 'John Smith', action: 'uploaded', target: 'Documentary: City Lights', time: '2 hours ago' },
  { user: 'Sarah Lee', action: 'approved', target: 'Student Film B', time: '4 hours ago' },
  { user: 'Mike Chen', action: 'flagged', target: 'Short Film: Echoes', time: '5 hours ago' },
  { user: 'Admin', action: 'updated', target: 'System Settings', time: '1 day ago' },
])
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Home</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administration</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Dashboard</Badge>
      </nav>

      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-1 h-20 bg-amber-500 rounded-full"></div>
          <div>
            <h1 class="font-display text-4xl text-stone-900">System Overview</h1>
            <p class="text-stone-600 mt-2 max-w-xl">Manage authorized personnel, role assignments, and security clearances.</p>
          </div>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="gap-2">
            <Upload class="w-4 h-4" />
            Quick Upload
          </Button>
          <Button variant="outline" class="gap-2">
            <FileDown class="w-4 h-4" />
            Report
          </Button>
        </div>
      </div>

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
    </main>
  </div>
</template>
