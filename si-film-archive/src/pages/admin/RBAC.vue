<script setup>
import { ref, computed } from 'vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, Plus, Shield, Users, UserX, 
  Edit, Trash2, MoreHorizontal, ChevronDown, Filter
} from 'lucide-vue-next'

const searchQuery = ref('')
const sidebarCollapsed = ref(false)

const roles = ref([
  { 
    id: 1, 
    name: 'Super Admin', 
    description: 'Full system access with all permissions',
    permissions: ['All Permissions'],
    userCount: 2,
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  { 
    id: 2, 
    name: 'Admin', 
    description: 'Manage users, content, and settings',
    permissions: ['User Management', 'Content Management', 'Settings'],
    userCount: 5,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  { 
    id: 3, 
    name: 'Creator', 
    description: 'Upload and manage own content',
    permissions: ['Upload Films', 'Edit Own Content', 'View Analytics'],
    userCount: 48,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  { 
    id: 4, 
    name: 'Student', 
    description: 'View content and submit assignments',
    permissions: ['View Films', 'Submit Assignments', 'Join Discussions'],
    userCount: 1240,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  { 
    id: 5, 
    name: 'Guest', 
    description: 'Limited view-only access',
    permissions: ['View Public Films'],
    userCount: 3500,
    color: 'bg-stone-100 text-stone-800 border-stone-300'
  },
])

const users = ref([
  { id: 1, name: 'Alex Morgan', email: 'alex.morgan@example.com', role: 'Super Admin', status: 'Active', avatar: 'AM' },
  { id: 2, name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Creator', status: 'Active', avatar: 'JD' },
  { id: 3, name: 'John Smith', email: 'john.smith@example.com', role: 'Student', status: 'Active', avatar: 'JS' },
  { id: 4, name: 'Sarah Lee', email: 'sarah.lee@example.com', role: 'Admin', status: 'Active', avatar: 'SL' },
  { id: 5, name: 'Mike Chen', email: 'mike.chen@example.com', role: 'Creator', status: 'Pending', avatar: 'MC' },
  { id: 6, name: 'Emily Brown', email: 'emily.brown@example.com', role: 'Student', status: 'Inactive', avatar: 'EB' },
])

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.name.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  )
})

const getRoleBadgeClass = (role) => {
  const roleData = roles.value.find(r => r.name === role)
  return roleData?.color || 'bg-stone-100 text-stone-800 border-stone-300'
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800'
    case 'Pending': return 'bg-amber-100 text-amber-800'
    case 'Inactive': return 'bg-stone-100 text-stone-600'
    default: return 'bg-stone-100 text-stone-600'
  }
}
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Home</a>
        <span class="text-stone-400">/</span>
        <a href="/admin/dashboard" class="text-brand-teal hover:underline">Administration</a>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">
          Access Control
        </Badge>
      </nav>

      <!-- Header -->
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-1 h-20 bg-amber-500 rounded-full"></div>
          <div>
            <h1 class="font-display text-4xl text-stone-900">Role-Based Access Control</h1>
            <p class="text-stone-600 mt-2 max-w-xl">
              Manage user roles, permissions, and access levels for the CineArchive system.
            </p>
          </div>
        </div>
        <Button class="gap-2">
          <Plus class="w-4 h-4" />
          Add New Role
        </Button>
      </div>

      <!-- Roles Section -->
      <section class="mb-8">
        <h2 class="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield class="w-5 h-5" />
          System Roles
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card v-for="role in roles" :key="role.id" class="hover:shadow-brutal transition-shadow">
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-3">
                <Badge :class="role.color" variant="outline" class="font-bold">
                  {{ role.name }}
                </Badge>
                <Button variant="ghost" size="icon" class="h-6 w-6">
                  <MoreHorizontal class="w-4 h-4" />
                </Button>
              </div>
              <p class="text-xs text-stone-600 mb-3 line-clamp-2">{{ role.description }}</p>
              <div class="flex flex-wrap gap-1 mb-3">
                <span 
                  v-for="perm in role.permissions.slice(0, 2)" 
                  :key="perm"
                  class="text-[10px] bg-stone-100 px-2 py-0.5 border border-stone-300"
                >
                  {{ perm }}
                </span>
                <span 
                  v-if="role.permissions.length > 2"
                  class="text-[10px] bg-stone-100 px-2 py-0.5 border border-stone-300"
                >
                  +{{ role.permissions.length - 2 }} more
                </span>
              </div>
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <Users class="w-3 h-3" />
                {{ role.userCount.toLocaleString() }} users
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
              <CardTitle class="text-lg font-bold uppercase">User Management</CardTitle>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input v-model="searchQuery" placeholder="Search users..." class="pl-10 w-full sm:w-64" />
              </div>
              <Button variant="outline" class="gap-2">
                <Filter class="w-4 h-4" />
                Filter
                <ChevronDown class="w-4 h-4" />
              </Button>
              <Button class="gap-2">
                <Plus class="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-lime-50 border-b-2 border-stone-800 text-xs font-bold uppercase tracking-wider">
            <div class="col-span-4">User</div>
            <div class="col-span-3">Role</div>
            <div class="col-span-2">Status</div>
            <div class="col-span-3 text-right">Actions</div>
          </div>
          
          <div 
            v-for="user in filteredUsers" 
            :key="user.id" 
            class="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-stone-200 hover:bg-stone-50"
          >
            <div class="lg:col-span-4 flex items-center gap-3">
              <div class="w-10 h-10 bg-stone-200 border-2 border-stone-800 shadow-brutal-sm flex items-center justify-center text-sm font-bold">
                {{ user.avatar }}
              </div>
              <div>
                <p class="font-bold text-sm">{{ user.name }}</p>
                <p class="text-xs text-stone-500">{{ user.email }}</p>
              </div>
            </div>
            
            <div class="lg:col-span-3">
              <span class="lg:hidden text-xs text-stone-500 uppercase mr-2">Role:</span>
              <Badge :class="getRoleBadgeClass(user.role)" variant="outline" class="font-bold">
                {{ user.role }}
              </Badge>
            </div>
            
            <div class="lg:col-span-2">
              <span class="lg:hidden text-xs text-stone-500 uppercase mr-2">Status:</span>
              <Badge :class="getStatusClass(user.status)" variant="outline" class="text-[10px] font-bold uppercase">
                {{ user.status }}
              </Badge>
            </div>
            
            <div class="lg:col-span-3 flex justify-start lg:justify-end gap-2">
              <Button variant="outline" size="sm" class="gap-1 text-xs">
                <Edit class="w-3 h-3" />
                Edit
              </Button>
              <Button variant="outline" size="sm" class="gap-1 text-xs text-red-600 hover:bg-red-50">
                <Trash2 class="w-3 h-3" />
                Remove
              </Button>
            </div>
          </div>

          <div v-if="filteredUsers.length === 0" class="px-6 py-12 text-center">
            <UserX class="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p class="text-stone-500">No users found matching your search.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
