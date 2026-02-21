<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, Shield, Users, UserX, 
  Edit, Check, X, Loader2, RefreshCw, ChevronDown, Filter
} from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const searchQuery = ref('')
const sidebarCollapsed = ref(false)

// State
const roles = ref([])
const users = ref([])
const loading = ref(true)
const error = ref(null)
const updatingUserId = ref(null)
const editingUserId = ref(null)
const selectedRoleId = ref(null)
const { toast, showToast } = useToast()

// Role color mapping based on role name
const roleColors = {
  admin: 'bg-red-100 text-red-800 border-red-300',
  moderator: 'bg-orange-100 text-orange-800 border-orange-300',
  creator: 'bg-blue-100 text-blue-800 border-blue-300',
  user: 'bg-green-100 text-green-800 border-green-300'
}

// Fetch all data
async function fetchData() {
  loading.value = true
  error.value = null
  
  try {
    const [rolesRes, usersRes] = await Promise.all([
      api.get('/api/auth/roles'),
      api.get('/api/auth/users')
    ])
    
    roles.value = rolesRes.data || []
    users.value = usersRes.data || []
  } catch (err) {
    console.error('Failed to fetch RBAC data:', err)
    error.value = err.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

// Filter users by search query
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name?.toLowerCase().includes(query) || 
    user.email?.toLowerCase().includes(query) ||
    user.role?.name?.toLowerCase().includes(query)
  )
})

// Get role badge color
const getRoleBadgeClass = (roleName) => {
  return roleColors[roleName] || 'bg-stone-100 text-stone-800 border-stone-300'
}

// Get user count per role
const getRoleUserCount = (roleId) => {
  return users.value.filter(u => u.role_id === roleId).length
}

// Start editing user role
function startEditRole(user) {
  editingUserId.value = user.id
  selectedRoleId.value = user.role_id
}

// Cancel editing
function cancelEditRole() {
  editingUserId.value = null
  selectedRoleId.value = null
}

// Save new role for user
async function saveUserRole(userId) {
  if (!selectedRoleId.value) return
  
  updatingUserId.value = userId
  
  try {
    const res = await api.patch(`/api/auth/users/${userId}/role`, {
      role_id: selectedRoleId.value
    })
    
    // Update local state
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex !== -1 && res.data) {
      users.value[userIndex] = res.data
    }
    
    cancelEditRole()
    
    // Show success message
    const newRoleName = roles.value.find(r => r.role_id === parseInt(selectedRoleId.value))?.name
    showToast('success', `Peran pengguna diperbarui menjadi ${newRoleName || 'role baru'}`)

  } catch (err) {
    console.error('Failed to update role:', err)
    showToast('error', err.message || 'Gagal memperbarui peran')
  } finally {
    updatingUserId.value = null
  }
}

// Get avatar initials
function getAvatarInitials(name) {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Beranda</a>
        <span class="text-stone-400">/</span>
        <a href="/admin/dashboard" class="text-brand-teal hover:underline">Administrasi</a>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">
          Kontrol Akses
        </Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Pengaturan Hak Akses" 
        description="Kelola role dan izin pengguna untuk sistem PF Space."
        :icon="Shield"
        icon-color="bg-amber-500"
      >
        <template #actions>
          <Button @click="fetchData" :disabled="loading" class="gap-2">
            <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
            Refresh
          </Button>
        </template>
      </PageHeader>

      <!-- Toast Component -->
      <Toast 
        :show="toast.show" 
        :type="toast.type" 
        :message="toast.message" 
        @close="toast.show = false" 
      />

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 animate-spin text-brand-teal" />
        <span class="ml-3 text-stone-600">Memuat data...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border-2 border-red-300 p-6 text-center">
        <p class="text-red-800 font-bold mb-2">Gagal Memuat Data</p>
        <p class="text-red-600 text-sm mb-4">{{ error }}</p>
        <Button @click="fetchData" variant="outline">Coba Lagi</Button>
      </div>

      <template v-else>
        <!-- Roles Section -->
        <section class="mb-8">
          <h2 class="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5" />
            Daftar Role
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card v-for="role in roles" :key="role.role_id" class="hover:shadow-brutal transition-shadow">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <Badge :class="getRoleBadgeClass(role.name)" variant="outline" class="font-bold capitalize">
                    {{ role.name }}
                  </Badge>
                  <span class="text-xs text-stone-500 bg-stone-100 px-2 py-1 border border-stone-300">
                    ID: {{ role.role_id }}
                  </span>
                </div>
                <p class="text-xs text-stone-600 mb-3">{{ role.description || 'Tidak ada deskripsi' }}</p>
                <div class="flex items-center gap-1 text-xs text-stone-500">
                  <Users class="w-3 h-3" />
                  {{ getRoleUserCount(role.role_id) }} pengguna
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <!-- Users Section -->
        <Card>
          <CardHeader class="bg-stone-50 border-b-2 border-stone-800">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div class="flex items-center gap-3">
                <Users class="w-5 h-5" />
                <CardTitle class="text-lg font-bold uppercase">
                  Manajemen Pengguna ({{ users.length }} pengguna)
                </CardTitle>
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input v-model="searchQuery" placeholder="Cari pengguna..." class="pl-10 w-full sm:w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent class="p-0">
            <!-- Table Header -->
            <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-lime-50 border-b-2 border-stone-800 text-xs font-bold uppercase tracking-wider">
              <div class="col-span-4">Pengguna</div>
              <div class="col-span-2">Role</div>
              <div class="col-span-3">Bergabung</div>
              <div class="col-span-3 text-right">Aksi</div>
            </div>
            
            <!-- Users List -->
            <div 
              v-for="user in filteredUsers" 
              :key="user.id" 
              class="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 hover:bg-stone-50"
            >
              <!-- User Info -->
              <div class="lg:col-span-4 flex items-center gap-3">
                <div class="w-10 h-10 bg-stone-200 border-2 border-stone-800 shadow-brutal-sm flex items-center justify-center text-sm font-bold">
                  <img v-if="user.image" :src="user.image" :alt="user.name" class="w-full h-full object-cover" />
                  <span v-else>{{ getAvatarInitials(user.name) }}</span>
                </div>
                <div>
                  <p class="font-bold text-sm">{{ user.name }}</p>
                  <p class="text-xs text-stone-500">{{ user.email }}</p>
                </div>
              </div>
              
              <!-- Role -->
              <div class="lg:col-span-2">
                <span class="lg:hidden text-xs text-stone-500 uppercase mr-2">Role:</span>
                
                <!-- Normal View -->
                <template v-if="editingUserId !== user.id">
                  <Badge :class="getRoleBadgeClass(user.role?.name)" variant="outline" class="font-bold capitalize">
                    {{ user.role?.name || 'Unknown' }}
                  </Badge>
                </template>
                
                <!-- Editing View -->
                <template v-else>
                  <select 
                    v-model="selectedRoleId"
                    class="text-xs border-2 border-stone-800 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    <option v-for="role in roles" :key="role.role_id" :value="role.role_id">
                      {{ role.name }}
                    </option>
                  </select>
                </template>
              </div>
              
              <!-- Joined Date -->
              <div class="lg:col-span-3">
                <span class="lg:hidden text-xs text-stone-500 uppercase mr-2">Joined:</span>
                <span class="text-sm text-stone-600">{{ formatDate(user.createdAt) }}</span>
              </div>
              
              <!-- Actions -->
              <div class="lg:col-span-3 flex justify-start lg:justify-end gap-2">
                <!-- Normal Actions -->
                <template v-if="editingUserId !== user.id">
                  <Button 
                    @click="startEditRole(user)"
                    variant="outline" 
                    size="sm" 
                    class="gap-1 text-xs"
                  >
                    <Edit class="w-3 h-3" />
                    Change Role
                  </Button>
                </template>
                
                <!-- Editing Actions -->
                <template v-else>
                  <Button 
                    @click="saveUserRole(user.id)"
                    :disabled="updatingUserId === user.id"
                    size="sm" 
                    class="gap-1 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <Loader2 v-if="updatingUserId === user.id" class="w-3 h-3 animate-spin" />
                    <Check v-else class="w-3 h-3" />
                    Save
                  </Button>
                  <Button 
                    @click="cancelEditRole"
                    :disabled="updatingUserId === user.id"
                    variant="outline"
                    size="sm" 
                    class="gap-1 text-xs"
                  >
                    <X class="w-3 h-3" />
                    Cancel
                  </Button>
                </template>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredUsers.length === 0" class="px-6 py-12 text-center">
              <UserX class="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p class="text-stone-500">No users found matching your search.</p>
            </div>
          </CardContent>
        </Card>
      </template>
    </main>
  </div>
</template>

