<script setup>
import { ref, computed, onMounted } from "vue";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader.vue";
import {
  Search,
  Shield,
  ShieldCheck,
  Users,
  UserX,
  UserCheck,
  Film,
  Edit,
  Check,
  X,
  Loader2,
  RefreshCw,
  Calendar,
  Sparkles,
  Filter,
  CheckCircle2,
  ExternalLink
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";
import { assetUrl } from "@/lib/format";

const searchQuery = ref("");
const selectedRoleFilter = ref("all");

// State
const roles = ref([]);
const users = ref([]);
const loading = ref(true);
const error = ref(null);
const updatingUserId = ref(null);
const editingUserId = ref(null);
const selectedRoleId = ref(null);
const { showToast } = useToast();

// Role design metadata
const roleMeta = {
  admin: {
    badgeClass: "bg-red-500/15 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-500/50",
    borderClass: "border-red-500 dark:border-red-400",
    iconBg: "bg-red-500/15 text-red-600 dark:text-red-400",
    icon: ShieldCheck,
    label: "Administrator",
    desc: "Akses penuh ke seluruh sistem, audit log, manajerial file, dan konfigurasi platform."
  },
  moderator: {
    badgeClass: "bg-amber-500/15 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-500/50",
    borderClass: "border-amber-500 dark:border-amber-400",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: Shield,
    label: "Moderator",
    desc: "Dapat memoderasi komentar, mengelola materi pembelajaran, dan meninjau laporan."
  },
  creator: {
    badgeClass: "bg-blue-500/15 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-500/50",
    borderClass: "border-blue-500 dark:border-blue-400",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    icon: Film,
    label: "Kreator / Siswa",
    desc: "Dapat mengunggah dan mengelola karya film sendiri, arsip, dan partisipasi festival."
  },
  user: {
    badgeClass: "bg-emerald-500/15 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-500/50",
    borderClass: "border-emerald-500 dark:border-emerald-400",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: UserCheck,
    label: "Pengguna Umum",
    desc: "Akses standar: menonton karya film, membaca materi pembelajaran, dan memberi ulasan."
  }
};

const getRoleMeta = (roleName) => {
  const key = roleName?.toLowerCase() || 'user';
  return roleMeta[key] || roleMeta.user;
};

// Fetch all data
async function fetchData() {
  loading.value = true;
  error.value = null;

  try {
    const [rolesRes, usersRes] = await Promise.all([
      api.get("/api/auth/roles"),
      api.get("/api/auth/users"),
    ]);

    roles.value = rolesRes.data || [];
    users.value = usersRes.data || [];
  } catch (err) {
    console.error("Failed to fetch RBAC data:", err);
    error.value = err.message || "Gagal memuat data hak akses";
  } finally {
    loading.value = false;
  }
}

// Filter users by search query and role
const filteredUsers = computed(() => {
  let result = users.value;
  
  if (selectedRoleFilter.value !== 'all') {
    result = result.filter(u => u.role?.name?.toLowerCase() === selectedRoleFilter.value.toLowerCase());
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.name?.toLowerCase().includes(query),
    );
  }

  return result;
});

// Toggle role filter on card click
function toggleRoleFilter(roleName) {
  const target = roleName.toLowerCase();
  if (selectedRoleFilter.value === target) {
    selectedRoleFilter.value = 'all';
  } else {
    selectedRoleFilter.value = target;
  }
}

// Get user count per role
const getRoleUserCount = (roleId) => {
  return users.value.filter((u) => u.role_id === roleId).length;
};

// Start editing user role
function startEditRole(user) {
  editingUserId.value = user.id;
  selectedRoleId.value = user.role_id;
}

// Cancel editing
function cancelEditRole() {
  editingUserId.value = null;
  selectedRoleId.value = null;
}

// Save new role for user
async function saveUserRole(userId) {
  if (!selectedRoleId.value) return;

  updatingUserId.value = userId;

  try {
    const res = await api.patch(`/api/auth/users/${userId}/role`, {
      role_id: selectedRoleId.value,
    });

    // Update local state
    const userIndex = users.value.findIndex((u) => u.id === userId);
    if (userIndex !== -1 && res.data) {
      users.value[userIndex] = res.data;
    }

    cancelEditRole();

    const newRoleName = roles.value.find(
      (r) => r.role_id === parseInt(selectedRoleId.value),
    )?.name;
    showToast(
      `Peran pengguna berhasil diubah menjadi "${newRoleName || 'Role Baru'}"`,
      'success'
    );
  } catch (err) {
    console.error("Failed to update role:", err);
    showToast(err.message || "Gagal memperbarui peran pengguna", "error");
  } finally {
    updatingUserId.value = null;
  }
}

// Get avatar initials
function getAvatarInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

onMounted(() => {
  fetchData();
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
        Kontrol Akses (RBAC)
      </Badge>
    </nav>

    <!-- Page Header -->
    <PageHeader
      title="Pengaturan Hak Akses & Peran"
      description="Kelola hierarki wewenang (Role-Based Access Control) dan distribusi hak izin pengguna pada ekosistem PF Space."
      icon-color="bg-brand-teal"
    >
      <template #actions>
        <button
          type="button"
          @click="fetchData"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>Muat Ulang Data</span>
        </button>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 class="w-8 h-8 animate-spin text-brand-teal dark:text-teal-400" />
      <p class="text-xs font-mono uppercase tracking-widest text-stone-600 dark:text-stone-300 font-bold animate-pulse">
        Memuat Struktur Hak Akses...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-950/60 border-2 border-red-500 p-6 text-center shadow-brutal-sm"
    >
      <p class="text-red-800 dark:text-red-200 font-bold text-sm mb-1 uppercase tracking-wider">
        Gagal Memuat Data Hak Akses
      </p>
      <p class="text-red-600 dark:text-red-400 text-xs mb-4">{{ error }}</p>
      <button 
        type="button"
        @click="fetchData" 
        class="px-4 py-1.5 bg-red-600 text-white font-bold text-xs border-2 border-black shadow-brutal-xs cursor-pointer hover:bg-red-700"
      >
        Coba Lagi
      </button>
    </div>

    <template v-else>
      <!-- Section 1: Interactive Role Overview Cards (Compact & Professional) -->
      <section class="space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-teal-500/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300">
              <Shield class="w-3.5 h-3.5" />
            </div>
            <h2 class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Daftar Role &amp; Wewenang Sistem
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="selectedRoleFilter !== 'all'"
              @click="selectedRoleFilter = 'all'"
              class="text-[11px] font-mono font-bold text-brand-teal hover:underline cursor-pointer flex items-center gap-1"
            >
              <X class="w-3 h-3" /> Tampilkan Semua Role
            </button>
            <span v-else class="text-[11px] font-mono text-stone-500 dark:text-stone-400 hidden sm:inline">
              Klik kartu untuk memfilter pengguna
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="role in roles"
            :key="role.role_id"
            @click="toggleRoleFilter(role.name)"
            class="bg-white dark:bg-stone-900 border-2 transition-all p-3 cursor-pointer select-none flex flex-col justify-between"
            :class="[
              selectedRoleFilter === role.name.toLowerCase()
                ? 'border-brand-teal ring-2 ring-brand-teal shadow-brutal translate-x-[-1px] translate-y-[-1px] bg-teal-50/50 dark:bg-teal-950/40'
                : 'border-black dark:border-stone-200 shadow-brutal-xs hover:shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px]'
            ]"
          >
            <!-- Top bar with Role Badge and ID -->
            <div class="flex items-center justify-between gap-1.5 mb-2">
              <span
                class="px-2 py-0.5 text-[11px] font-black uppercase tracking-wider border font-mono"
                :class="getRoleMeta(role.name).badgeClass"
              >
                {{ role.name }}
              </span>
              <div class="flex items-center gap-1">
                <span 
                  v-if="selectedRoleFilter === role.name.toLowerCase()"
                  class="text-[9px] font-mono font-bold bg-brand-teal text-white px-1.5 py-0.5 border border-black dark:border-stone-100 uppercase tracking-tighter"
                >
                  Aktif
                </span>
                <span class="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 border border-stone-300 dark:border-stone-700">
                  ID: {{ role.role_id }}
                </span>
              </div>
            </div>

            <!-- Role Description (Compact) -->
            <p class="text-[11px] text-stone-600 dark:text-stone-300 leading-snug line-clamp-1 mb-2.5" :title="role.description || getRoleMeta(role.name).desc">
              {{ role.description || getRoleMeta(role.name).desc }}
            </p>

            <!-- Bottom bar: User count & Action prompt -->
            <div class="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px]">
              <div class="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                <Users class="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>{{ getRoleUserCount(role.role_id) }} Pengguna</span>
              </div>
              <span class="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                {{ selectedRoleFilter === role.name.toLowerCase() ? 'Reset' : 'Filter' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Users Management Table -->
      <Card class="border-2 border-black dark:border-stone-200 shadow-brutal bg-white dark:bg-stone-900 overflow-hidden">
        <!-- Card Header Toolbar (Clean without duplicate pills) -->
        <CardHeader class="py-3 px-4 md:px-6 bg-stone-100/90 dark:bg-stone-800/90 border-b-2 border-black dark:border-stone-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Title & User Counts -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <div class="w-7 h-7 bg-teal-500/15 dark:bg-teal-400/20 border border-brand-teal flex items-center justify-center text-brand-teal dark:text-teal-300 flex-shrink-0">
                <Users class="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <CardTitle class="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Manajemen Pengguna &amp; Peran
              </CardTitle>
              <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold bg-teal-50 dark:bg-teal-950/80 text-brand-teal dark:text-teal-300 border border-brand-teal/40">
                {{ filteredUsers.length }} Pengguna
              </span>
              <span 
                v-if="selectedRoleFilter !== 'all'"
                class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-400 shadow-brutal-xs"
              >
                Filter: {{ selectedRoleFilter.toUpperCase() }}
                <button 
                  @click="selectedRoleFilter = 'all'" 
                  class="hover:text-red-500 cursor-pointer ml-1 font-bold"
                  title="Hapus Filter Role"
                >
                  ✕
                </button>
              </span>
            </div>

            <!-- Search Bar -->
            <div class="flex items-center gap-2">
              <!-- Role Filter Dropdown -->
              <select
                v-model="selectedRoleFilter"
                class="text-xs h-9 px-3 bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
              >
                <option value="all">Semua Peran ({{ users.length }})</option>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
                <option value="alumni">Alumni</option>
                <option value="umum">Umum</option>
              </select>

              <!-- Search Bar (Matching Archives.vue) -->
              <div class="relative w-full sm:w-72">
                <Search class="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  v-model="searchQuery"
                  placeholder="Cari nama, email, role..."
                  class="pl-9 pr-8 text-xs h-9 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-black dark:border-stone-100 shadow-brutal-xs font-mono focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1"
                />
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Hapus Pencarian"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Empty State -->
          <div v-if="filteredUsers.length === 0" class="text-center py-16 px-4">
            <div class="w-12 h-12 mx-auto mb-3 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-200 flex items-center justify-center text-stone-400">
              <UserX class="w-6 h-6 text-stone-400 dark:text-stone-500" />
            </div>
            <p class="font-bold text-sm text-stone-800 dark:text-stone-200">
              Pengguna tidak ditemukan
            </p>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
              Tidak ada pengguna yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
            </p>
            <div class="mt-3 flex items-center justify-center gap-2">
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="px-3 py-1 text-xs font-bold text-brand-teal hover:underline font-mono cursor-pointer"
              >
                Hapus Pencarian
              </button>
              <button
                v-if="selectedRoleFilter !== 'all'"
                @click="selectedRoleFilter = 'all'"
                class="px-3 py-1 text-xs font-bold text-amber-600 hover:underline font-mono cursor-pointer"
              >
                Reset Filter Role
              </button>
            </div>
          </div>

          <!-- Professional Table View -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[760px]">
              <!-- Header -->
              <thead>
                <tr class="bg-stone-200/80 dark:bg-stone-800/80 border-b-2 border-black dark:border-stone-200 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  <th class="py-3 px-4 w-72">Pengguna</th>
                  <th class="py-3 px-4 w-44">Role / Hak Akses</th>
                  <th class="py-3 px-4 w-44">Tanggal Bergabung</th>
                  <th class="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>

              <!-- Body -->
              <tbody class="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900 text-xs">
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                >
                  <!-- 1. Pengguna (Avatar, Name, Email) -> Click opens profile in new tab -->
                  <td class="py-3.5 px-4">
                    <a
                      :href="`/p/${user.id}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-3 group/user hover:opacity-95 transition-opacity inline-flex max-w-full cursor-pointer"
                      :title="`Buka profil ${user.name} di tab baru`"
                    >
                      <div class="w-10 h-10 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-200 shadow-brutal-xs flex items-center justify-center text-xs font-black overflow-hidden text-stone-900 dark:text-stone-100 shrink-0 group-hover/user:border-brand-teal transition-colors">
                        <img
                          v-if="user.image"
                          :src="assetUrl(user.image)"
                          :alt="user.name"
                          referrerpolicy="no-referrer"
                          class="w-full h-full object-cover"
                        />
                        <span v-else>{{ getAvatarInitials(user.name) }}</span>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-xs md:text-sm text-stone-900 dark:text-stone-100 truncate group-hover/user:text-brand-teal transition-colors flex items-center gap-1.5">
                          <span class="group-hover/user:underline">{{ user.name }}</span>
                          <ExternalLink class="w-3 h-3 text-stone-400 group-hover/user:text-brand-teal shrink-0 transition-colors" />
                        </div>
                        <div class="text-[11px] text-stone-500 dark:text-stone-400 font-mono truncate">
                          {{ user.email }}
                        </div>
                      </div>
                    </a>
                  </td>

                  <!-- 2. Role Badge / Role Selector -->
                  <td class="py-3.5 px-4">
                    <!-- Display Mode -->
                    <template v-if="editingUserId !== user.id">
                      <span
                        class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider border font-mono inline-flex items-center gap-1.5 shadow-brutal-xs"
                        :class="getRoleMeta(user.role?.name).badgeClass"
                      >
                        <component :is="getRoleMeta(user.role?.name).icon" class="w-3.5 h-3.5" />
                        <span>{{ user.role?.name || "Unknown" }}</span>
                      </span>
                    </template>

                    <!-- Edit Dropdown Mode -->
                    <template v-else>
                      <select
                        v-model="selectedRoleId"
                        class="h-8 px-2 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:border-brand-teal shadow-brutal-xs cursor-pointer"
                      >
                        <option
                          v-for="role in roles"
                          :key="role.role_id"
                          :value="role.role_id"
                          class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                        >
                          {{ role.name.toUpperCase() }} (ID: {{ role.role_id }})
                        </option>
                      </select>
                    </template>
                  </td>

                  <!-- 3. Tanggal Bergabung -->
                  <td class="py-3.5 px-4 text-stone-600 dark:text-stone-300 font-mono">
                    <div class="flex items-center gap-1.5 text-xs">
                      <Calendar class="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{{ formatDate(user.createdAt) }}</span>
                    </div>
                  </td>

                  <!-- 4. Aksi Buttons -->
                  <td class="py-3.5 px-4 text-right">
                    <!-- Normal State: Ubah Role -->
                    <template v-if="editingUserId !== user.id">
                      <button
                        type="button"
                        @click="startEditRole(user)"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-300 border-2 border-black dark:border-stone-200 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all text-xs font-bold cursor-pointer"
                      >
                        <Edit class="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Ubah Role</span>
                      </button>
                    </template>

                    <!-- Active Editing State: Simpan & Batal -->
                    <template v-else>
                      <div class="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          @click="saveUserRole(user.id)"
                          :disabled="updatingUserId === user.id"
                          class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-2 border-black dark:border-stone-100 shadow-brutal-xs hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          <Loader2 v-if="updatingUserId === user.id" class="w-3 h-3 animate-spin text-white" />
                          <Check v-else class="w-3 h-3 stroke-[2.5]" />
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          @click="cancelEditRole"
                          :disabled="updatingUserId === user.id"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-200 text-xs font-bold cursor-pointer"
                        >
                          <X class="w-3 h-3 stroke-[2.5]" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
