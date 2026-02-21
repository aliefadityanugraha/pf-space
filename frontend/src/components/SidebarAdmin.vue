<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { 
  LayoutDashboard, Shield, Users, Film, Settings, 
  LogOut, ChevronLeft, ChevronRight, Upload, FileText,
  BarChart3, Bell, HelpCircle, FolderOpen, Vote, MessageCircle, BookOpen
} from 'lucide-vue-next'
import { assetUrl } from '@/lib/format'

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
  { name: 'Laporan', icon: FileText, path: '/admin/reports' },
]

const menuItems = computed(() => {
  if (isAdmin.value) return allMenuItems
  if (isModerator.value) {
    return allMenuItems.filter(item => 
      item.path === '/admin/archives' || item.path === '/admin/community'
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
        'h-full bg-brand-cream text-stone-900 border-r-2 border-black flex flex-col transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-14' : 'w-56'
      ]"
    >
      <!-- Logo Area -->
      <div 
        class="h-16 border-b-2 border-black flex items-center shrink-0 overflow-hidden transition-all duration-300"
        :class="isCollapsed ? 'justify-center' : 'px-4 gap-2'"
      >
        <router-link to="/" class="flex items-center gap-2 shrink-0 group">
          <div :class="[
            'bg-white border-2 border-black shadow-brutal-xs flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:rotate-3',
            isCollapsed ? 'w-9 h-9' : 'w-10 h-10'
          ]">
            <img src="/logo-perfilman.png" alt="PF" :class="isCollapsed ? 'w-7 h-7' : 'w-8 h-8'" class="object-contain" />
          </div>
          <div v-if="!isCollapsed" class="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
            <span class="font-display text-lg font-bold leading-none">PF Space</span>
            <span class="text-[8px] uppercase font-black text-brand-teal tracking-[0.1em]">Administrasi</span>
          </div>
        </router-link>
      </div>

      <!-- Toggle Button - Neobrutalist floating style -->
      <button 
        @click="isCollapsed = !isCollapsed"
        class="absolute -right-4 top-20 w-8 h-8 bg-white border-2 border-black flex items-center justify-center shadow-brutal-xs hover:bg-stone-50 transition-all z-20 group"
        aria-label="Toggle Sidebar"
      >
        <ChevronLeft v-if="!isCollapsed" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <ChevronRight v-else class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>

      <!-- Navigation Content -->
      <div class="flex-1 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <!-- Main Menu -->
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :title="isCollapsed ? item.name : ''"
          :class="[
            'flex items-center transition-all py-2 mx-1.5 border-2',
            isCollapsed ? 'justify-center px-0' : 'px-2.5',
            isActive(item.path) 
              ? 'bg-brand-teal text-white border-black shadow-brutal-xs translate-x-[1px] translate-y-[1px]' 
              : 'border-transparent text-stone-600 hover:text-black hover:bg-stone-200'
          ]"
        >
          <div :class="[
            'flex items-center justify-center shrink-0 transition-all duration-300',
            isCollapsed ? '' : 'mr-2.5'
          ]">
            <component 
              :is="item.icon" 
              class="w-5 h-5" 
            />
          </div>
          <span 
            v-if="!isCollapsed" 
            class="text-[13px] font-bold uppercase tracking-wide truncate animate-in fade-in slide-in-from-left-2 duration-300 font-body"
          >
            {{ item.name }}
          </span>
        </router-link>

        <div class="mx-4 h-[1px] bg-stone-200 my-3" v-if="!isCollapsed"></div>

        <!-- Bottom Menu -->
        <router-link
          v-for="item in visibleBottomMenuItems"
          :key="item.path"
          :to="item.path"
          :title="isCollapsed ? item.name : ''"
          :class="[
            'flex items-center transition-all py-1.5 mx-1.5 border-2',
            isCollapsed ? 'justify-center px-0' : 'px-2.5',
            isActive(item.path) 
              ? 'bg-orange-400 text-white border-black shadow-brutal-xs translate-x-[1px] translate-y-[1px]' 
              : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-200'
          ]"
        >
          <div :class="[
            'flex items-center justify-center shrink-0',
            isCollapsed ? '' : 'mr-2.5'
          ]">
            <component :is="item.icon" class="w-4 h-4" />
          </div>
          <span v-if="!isCollapsed" class="text-[11px] font-bold uppercase tracking-wide truncate font-body">
            {{ item.name }}
          </span>
        </router-link>
      </div>

      <!-- User & Footer Area -->
      <div 
        class="p-2 border-t-2 border-black bg-stone-50 transition-all duration-300"
      >
        <div :class="['flex items-center gap-2', isCollapsed ? 'flex-col' : '']">
          <div :class="[
            'bg-white border-2 border-black shadow-brutal-xs flex items-center justify-center shrink-0 text-sm font-black overflow-hidden group hover:shadow-none transition-all cursor-pointer',
            isCollapsed ? 'w-10 h-10' : 'w-10 h-10'
          ]">
            <template v-if="user?.image">
               <img :src="assetUrl(user.image)" class="w-full h-full object-cover">
            </template>
            <span v-else class="font-display text-base">{{ user?.name ? user.name.charAt(0).toUpperCase() : 'A' }}</span>
          </div>
          
          <div v-if="!isCollapsed" class="flex-1 min-w-0">
            <p class="text-xs font-black truncate text-stone-900 font-body">{{ user?.name || 'Administrator' }}</p>
            <p class="text-[8px] font-bold uppercase text-stone-500 tracking-tighter font-body">{{ user?.role?.name || 'Superuser' }}</p>
          </div>

          <button 
            @click="logout"
            :class="[
              'p-2 bg-white border-2 border-black shadow-brutal-xs hover:bg-red-50 hover:text-red-600 hover:shadow-none transition-all flex items-center justify-center',
              isCollapsed ? 'w-full' : ''
            ]"
            title="Keluar"
          >
            <LogOut class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
