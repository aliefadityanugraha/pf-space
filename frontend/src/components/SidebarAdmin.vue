<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { 
  LayoutDashboard, Shield, Users, Film, Settings, 
  LogOut, ChevronLeft, ChevronRight, Upload, FileText,
  BarChart3, Bell, HelpCircle, FolderOpen, Vote, MessageCircle, BookOpen
} from 'lucide-vue-next'

const route = useRoute()
const { user, isAdmin, isModerator, logout } = useAuth()
const isCollapsed = ref(false)

const emit = defineEmits(['update:collapsed'])

watch(isCollapsed, (val) => {
  emit('update:collapsed', val)
})

const allMenuItems = [
  { name: 'Dasbor', icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'Arsip', icon: Film, path: '/admin/archives' },
  { name: 'Kategori', icon: FolderOpen, path: '/admin/categories' },
  { name: 'Kontrol Akses', icon: Shield, path: '/admin/rbac' },
  { name: 'Trending', icon: Vote, path: '/admin/trending' },
  { name: 'Diskusi Komunitas', icon: MessageCircle, path: '/admin/community' },
  { name: 'Materi', icon: BookOpen, path: '/admin/materi' },
  { name: 'Pengguna', icon: Users, path: '/admin/users' },
  { name: 'Unggahan', icon: Upload, path: '/admin/uploads' },
  { name: 'Laporan', icon: FileText, path: '/admin/reports' },
  { name: 'Analitik', icon: BarChart3, path: '/admin/analytics' },
]

const menuItems = computed(() => {
  if (isAdmin.value) return allMenuItems
  if (isModerator.value) {
    return allMenuItems.filter(item => 
      item.path === '/admin/archives' || item.path === '/admin/community' || item.path === '/admin/materi'
    )
  }
  return []
})

const bottomMenuItems = [
  { name: 'Notifikasi', icon: Bell, path: '/admin/notifications' },
  { name: 'Pengaturan', icon: Settings, path: '/admin/settings' },
  { name: 'Bantuan', icon: HelpCircle, path: '/admin/help' },
]

const visibleBottomMenuItems = computed(() => {
  if (isAdmin.value) return bottomMenuItems
  return [] // Hide notifications, settings, and help for moderators
})

const isActive = (path) => route.path === path
</script>

<template>
  <div class="fixed left-0 top-0 h-screen z-50">
    <aside 
      :class="[
        'h-full bg-[#F2EEE3] text-stone-900 border-r-2 border-stone-900 flex flex-col transition-all duration-300 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <!-- Logo & Toggle -->
      <div class="p-3 border-b-2 border-stone-900 flex items-center shrink-0" :class="isCollapsed ? 'justify-center' : 'justify-between'">
        <router-link to="/" class="flex items-center gap-3" v-if="!isCollapsed">
          <div class="w-10 h-10 bg-brand-red border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center">
            <Film class="w-5 h-5 text-white" />
          </div>
          <div>
            <span class="font-display text-lg leading-tight block text-stone-900">PF Space</span>
            <span class="text-[10px] uppercase tracking-wider text-stone-500 font-body font-bold">Panel Admin</span>
          </div>
        </router-link>
        
        <button 
          @click="isCollapsed = !isCollapsed"
          class="w-8 h-8 bg-white border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center hover:bg-stone-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
        >
          <ChevronLeft v-if="!isCollapsed" class="w-4 h-4 text-stone-900" />
          <ChevronRight v-else class="w-4 h-4 text-stone-900" />
        </button>
      </div>

      <!-- Main Menu -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 transition-all font-body',
          isActive(item.path) 
            ? 'bg-brand-teal text-white border-2 border-stone-900 shadow-brutal-sm' 
            : 'hover:bg-stone-200 border-2 border-transparent text-stone-700 hover:text-stone-900'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-bold uppercase tracking-wide">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- Bottom Menu -->
    <div v-if="visibleBottomMenuItems.length > 0" class="p-3 border-t-2 border-stone-900 space-y-1">
      <router-link
        v-for="item in visibleBottomMenuItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2 transition-all font-body',
          isActive(item.path) 
            ? 'bg-brand-teal text-white border-2 border-stone-900 shadow-brutal-sm' 
            : 'hover:bg-stone-200 text-stone-500 hover:text-stone-900 border-2 border-transparent'
        ]"
      >
        <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-xs font-bold uppercase tracking-wide">{{ item.name }}</span>
      </router-link>
    </div>

    <!-- User Profile -->
    <div class="p-3 border-t-2 border-stone-900">
      <div :class="['flex items-center gap-3', isCollapsed ? 'justify-center' : '']">
        <div class="w-9 h-9 bg-brand-orange border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center text-sm font-bold flex-shrink-0 text-stone-900">
          {{ user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD' }}
        </div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate font-body text-stone-900">{{ user?.name || 'Admin' }}</p>
          <p class="text-[10px] text-stone-500 uppercase font-body font-bold">{{ user?.role?.name || 'Super Admin' }}</p>
        </div>
        <button v-if="!isCollapsed" @click="logout" class="p-1.5 hover:bg-stone-200 transition-colors border-2 border-transparent hover:border-stone-900">
          <LogOut class="w-4 h-4 text-brand-red" />
        </button>
      </div>
    </div>
    </aside>
  </div>
</template>
