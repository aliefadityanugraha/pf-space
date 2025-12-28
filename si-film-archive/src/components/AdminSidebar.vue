<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, Shield, Users, Film, Settings, 
  LogOut, ChevronLeft, ChevronRight, Upload, FileText,
  BarChart3, Bell, HelpCircle
} from 'lucide-vue-next'

const route = useRoute()
const isCollapsed = ref(false)

const emit = defineEmits(['update:collapsed'])

watch(isCollapsed, (val) => {
  emit('update:collapsed', val)
})

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'Access Control', icon: Shield, path: '/admin/rbac' },
  { name: 'Users', icon: Users, path: '/admin/users' },
  { name: 'Films', icon: Film, path: '/admin/films' },
  { name: 'Uploads', icon: Upload, path: '/admin/uploads' },
  { name: 'Reports', icon: FileText, path: '/admin/reports' },
  { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
]

const bottomMenuItems = [
  { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
  { name: 'Help', icon: HelpCircle, path: '/admin/help' },
]

const isActive = (path) => route.path === path
</script>

<template>
  <div class="fixed left-0 top-0 h-screen z-50">
    <!-- Toggle Button (outside sidebar) -->
    <button 
      @click="isCollapsed = !isCollapsed"
      :class="[
        'absolute top-20 z-50 w-7 h-7 bg-white border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center hover:bg-stone-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all',
        isCollapsed ? 'left-[52px]' : 'left-[252px]'
      ]"
    >
      <ChevronLeft v-if="!isCollapsed" class="w-4 h-4 text-stone-900" />
      <ChevronRight v-else class="w-4 h-4 text-stone-900" />
    </button>

    <aside 
      :class="[
        'h-full bg-[#F2EEE3] text-stone-900 border-r-2 border-stone-900 flex flex-col transition-all duration-300 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="p-4 border-b-2 border-stone-900 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-3" v-if="!isCollapsed">
          <div class="w-10 h-10 bg-brand-red border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center">
            <Film class="w-5 h-5 text-white" />
          </div>
          <div>
            <span class="font-display text-lg leading-tight block text-stone-900">CineArchive</span>
            <span class="text-[10px] uppercase tracking-wider text-stone-500 font-body font-bold">Admin Panel</span>
          </div>
        </router-link>
        <router-link to="/" v-else class="w-10 h-10 bg-brand-red border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center mx-auto">
          <Film class="w-5 h-5 text-white" />
        </router-link>
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
    <div class="p-3 border-t-2 border-stone-900 space-y-1">
      <router-link
        v-for="item in bottomMenuItems"
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
          AM
        </div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate font-body text-stone-900">Alex Morgan</p>
          <p class="text-[10px] text-stone-500 uppercase font-body font-bold">Super Admin</p>
        </div>
        <button v-if="!isCollapsed" class="p-1.5 hover:bg-stone-200 transition-colors border-2 border-transparent hover:border-stone-900">
          <LogOut class="w-4 h-4 text-brand-red" />
        </button>
      </div>
    </div>
    </aside>
  </div>
</template>
