<script setup>
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import {
  LayoutDashboard,
  Shield,
  Users,
  Film,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  FolderOpen,
  FolderKanban,
  Vote,
  MessageCircle,
  BookOpen,
  Database,
  Sparkles,
  Cpu,
} from "lucide-vue-next";
import { assetUrl } from "@/lib/format";

const route = useRoute();
const { user, isAdmin, isModerator, logout } = useAuth();
const isCollapsed = ref(false);
const imageError = ref(false);

const emit = defineEmits(["update:collapsed"]);

watch(isCollapsed, (val) => {
  emit("update:collapsed", val);
});

const menuGroups = computed(() => {
  const groups = [
    {
      title: "UTAMA",
      items: [
        { name: "Dasbor", icon: LayoutDashboard, path: "/admin" },
        { name: "Arsip Film", icon: Film, path: "/admin/archives" },
      ]
    },
    {
      title: "KELOLA KONTEN",
      items: [
        { name: "Kelola Materi", icon: BookOpen, path: "/manage-materi" },
        { name: "Kategori Materi", icon: FolderKanban, path: "/admin/material-categories" },
        { name: "Kategori Film", icon: FolderOpen, path: "/admin/categories" },
        { name: "Manajemen File", icon: Database, path: "/admin/storage" },
      ]
    },
    {
      title: "SISTEM & MODERASI",
      items: [
        { name: "Worker & Sistem", icon: Cpu, path: "/admin/workers" },
        { name: "Log Audit", icon: Shield, path: "/admin/logs" },
        { name: "Kontrol Akses", icon: Shield, path: "/admin/rbac" },
        { name: "Trending", icon: Vote, path: "/admin/trending" },
        { name: "Diskusi Komunitas", icon: MessageCircle, path: "/admin/community" },
        { name: "Laporan", icon: FileText, path: "/admin/reports" },
      ]
    }
  ];

  if (isModerator.value && !isAdmin.value) {
    return groups.map(g => ({
      ...g,
      items: g.items.filter(item => 
        item.path === "/admin/archives" ||
        item.path === "/admin/community" ||
        item.path === "/admin/reports" ||
        item.path === "/manage-materi" ||
        item.path === "/admin/material-categories"
      )
    })).filter(g => g.items.length > 0);
  }

  return groups;
});

const bottomMenuItems = [
  { name: "Notifikasi", icon: Bell, path: "/admin/notifications" },
  { name: "Pengaturan", icon: Settings, path: "/admin/settings" },
  { name: "Bantuan", icon: HelpCircle, path: "/admin/help" },
];

const visibleBottomMenuItems = computed(() => {
  if (isAdmin.value) return bottomMenuItems;
  return [];
});

const isActive = (path) => route.path === path;
</script>

<template>
  <div class="fixed left-0 top-0 h-screen z-50">
    <aside
      :class="[
        'h-full bg-stone-900 text-stone-100 border-r-2 border-stone-800 dark:border-stone-100 flex flex-col transition-all duration-300 ease-in-out relative shadow-xl',
        isCollapsed ? 'w-16' : 'w-60',
      ]"
    >
      <!-- Logo / Header Area -->
      <div
        class="h-16 border-b-2 border-stone-800 dark:border-stone-100 flex items-center shrink-0 overflow-hidden px-3 bg-stone-950/60"
        :class="isCollapsed ? 'justify-center' : 'justify-between'"
      >
        <router-link to="/" class="flex items-center gap-3 shrink-0 group">
          <div
            :class="[
              'bg-brand-teal border-2 border-stone-100 shadow-brutal-xs flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:rotate-6',
              isCollapsed ? 'w-10 h-10' : 'w-9 h-9',
            ]"
          >
            <img
              src="/logo-perfilman.png"
              alt="PF"
              class="w-7 h-7 object-contain"
            />
          </div>
          <div
            v-if="!isCollapsed"
            class="flex flex-col animate-in fade-in slide-in-from-left-4 duration-300"
          >
            <div class="flex items-center gap-1.5">
              <span class="font-display text-base font-extrabold tracking-tight text-white"
                >PF Space</span
              >
              <span class="px-1.5 py-0.2 bg-brand-orange text-[9px] font-black uppercase tracking-wider text-stone-900 rounded">
                Admin
              </span>
            </div>
            <span
              class="text-[9px] uppercase font-bold text-stone-400 tracking-[0.15em]"
              >Panel Kontrol</span
            >
          </div>
        </router-link>
      </div>

      <!-- Toggle Button - Neobrutalist floating pill -->
      <button
        @click="isCollapsed = !isCollapsed"
        class="absolute -right-3.5 top-20 w-7 h-7 bg-stone-800 text-stone-100 border-2 border-stone-100 flex items-center justify-center shadow-brutal-xs hover:bg-brand-teal hover:text-white transition-all z-30 rounded-full group cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        <ChevronLeft
          v-if="!isCollapsed"
          class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
        />
        <ChevronRight
          v-else
          class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
        />
      </button>

      <!-- Navigation Content -->
      <div class="flex-1 py-4 px-2 space-y-6 overflow-y-auto no-scrollbar">
        <!-- Grouped Menu Sections -->
        <div v-for="(group, gIdx) in menuGroups" :key="gIdx" class="space-y-1">
          <!-- Section Title Header -->
          <div
            v-if="!isCollapsed"
            class="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2"
          >
            <span>{{ group.title }}</span>
            <span class="flex-1 h-[1px] bg-stone-800"></span>
          </div>

          <!-- Section Items -->
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :title="isCollapsed ? item.name : ''"
            :class="[
              'flex items-center transition-all py-2 rounded-lg font-body relative group text-xs font-bold uppercase tracking-wider',
              isCollapsed ? 'justify-center px-0 mx-1' : 'px-3 mx-0.5 gap-3',
              isActive(item.path)
                ? 'bg-brand-teal text-white border-2 border-stone-100 shadow-brutal-xs font-extrabold translate-x-[1px] translate-y-[1px]'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/80 border-2 border-transparent',
            ]"
          >
            <!-- Left active indicator strip for uncollapsed -->
            <div
              v-if="isActive(item.path) && !isCollapsed"
              class="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r"
            ></div>

            <div
              :class="[
                'flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110',
                isActive(item.path) ? 'text-white' : 'text-stone-400 group-hover:text-stone-100'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4" />
            </div>

            <span
              v-if="!isCollapsed"
              class="truncate animate-in fade-in slide-in-from-left-2 duration-300"
            >
              {{ item.name }}
            </span>
          </router-link>
        </div>

        <!-- Bottom Menu Group -->
        <div v-if="visibleBottomMenuItems.length > 0" class="pt-2 space-y-1 border-t border-stone-800">
          <div
            v-if="!isCollapsed"
            class="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2"
          >
            <span>PENGATURAN</span>
            <span class="flex-1 h-[1px] bg-stone-800"></span>
          </div>

          <router-link
            v-for="item in visibleBottomMenuItems"
            :key="item.path"
            :to="item.path"
            :title="isCollapsed ? item.name : ''"
            :class="[
              'flex items-center transition-all py-2 rounded-lg font-body text-xs font-bold uppercase tracking-wider',
              isCollapsed ? 'justify-center px-0 mx-1' : 'px-3 mx-0.5 gap-3',
              isActive(item.path)
                ? 'bg-brand-orange text-stone-900 border-2 border-stone-100 shadow-brutal-xs font-extrabold'
                : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 border-2 border-transparent',
            ]"
          >
            <div class="flex items-center justify-center shrink-0">
              <component :is="item.icon" class="w-4 h-4" />
            </div>
            <span v-if="!isCollapsed" class="truncate">
              {{ item.name }}
            </span>
          </router-link>
        </div>
      </div>

      <!-- User Profile Footer Area -->
      <div
        class="p-2.5 border-t-2 border-stone-800 dark:border-stone-100 bg-stone-950/80 transition-all duration-300 shrink-0"
      >
        <div
          :class="['flex items-center gap-2.5', isCollapsed ? 'flex-col' : '']"
        >
          <div
            :class="[
              'bg-stone-800 border-2 border-stone-100 shadow-brutal-xs flex items-center justify-center shrink-0 font-black overflow-hidden text-stone-100',
              isCollapsed ? 'w-10 h-10' : 'w-10 h-10',
            ]"
          >
            <template v-if="user?.image && !imageError">
              <img
                :src="assetUrl(user.image)"
                referrerpolicy="no-referrer"
                @error="imageError = true"
                class="w-full h-full object-cover"
              />
            </template>
            <span v-else class="font-display text-sm uppercase">{{
              user?.name ? user.name.charAt(0).toUpperCase() : "A"
            }}</span>
          </div>

          <div v-if="!isCollapsed" class="flex-1 min-w-0">
            <p class="text-xs font-extrabold truncate text-stone-100 font-body leading-snug">
              {{ user?.name || "Administrator" }}
            </p>
            <span class="inline-block px-1.5 py-0.5 bg-stone-800 text-[9px] font-mono font-bold uppercase text-brand-teal border border-stone-700 rounded">
              {{ user?.role?.name || "Superuser" }}
            </span>
          </div>

          <button
            @click="logout"
            :class="[
              'p-2 bg-stone-800 text-stone-300 border-2 border-stone-700 hover:border-stone-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center rounded cursor-pointer',
              isCollapsed ? 'w-full h-9' : 'w-9 h-9',
            ]"
            title="Keluar"
          >
            <LogOut class="w-4 h-4" />
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
