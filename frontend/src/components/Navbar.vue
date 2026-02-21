<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Search, User, Film, LogOut, Settings, LayoutDashboard, Upload, LogIn, Shield, Loader2, X, Bookmark, Info, BookOpen } from 'lucide-vue-next'
import NotificationDropdown from './NotificationDropdown.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

defineProps({
  lightTitle: {
    type: Boolean,
    default: false
  }
})

import { useLiveSearch } from '@/composables/useLiveSearch'
import { computed } from 'vue'

const router = useRouter()
const { user, isLoggedIn, isCreator, isModerator, isAdmin, logout } = useAuth()
const open = ref(false)

// Reactive status based on user role
const searchStatus = computed(() => (isAdmin.value || isModerator.value) ? 'all' : 'published')

// Live Search with Composable
const {
  searchQuery,
  searchResults,
  isSearching,
  showResults,
  clearSearch
} = useLiveSearch({
  limit: 10,
  status: searchStatus
})

const goToArchive = (slug) => {
  router.push(`/archive/${slug}`)
  clearSearch()
}

const handleLogout = async () => {
  await logout()
  open.value = false
  router.push('/')
}
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 h-16 md:h-20 bg-transparent backdrop-blur-sm border-b-2 border-stone-300/50">
    <div class="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 md:gap-3">
        <!-- <img src="/logo-smkn-ngasem.png" alt="SMK Ngasem" class="w-8 h-8 md:w-10 md:h-10 object-contain" />
        <span class="font-display text-lg md:text-xl font-bold" :class="lightTitle ? 'text-white' : 'text-stone-900'">|</span> -->
        <img src="/logo-perfilman.png" alt="Perfilman" class="w-8 h-8 md:w-10 md:h-10 object-contain" />
        <span 
          class="text-lg md:text-2xl font-bold font-display block md:block transition-colors duration-300"
          :class="lightTitle ? 'text-white' : 'text-[#000]'"
        >PF Space</span>
      </router-link>

      <!-- Search Bar -->
      <div class="hidden md:block flex-1 max-w-md mx-4 md:mx-8 relative group">
        <div class="relative z-50">
          <Search v-if="!isSearching" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 z-10" />
          <Loader2 v-else class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-teal animate-spin z-10" />
          
          <Input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari di arsip…"
            class="h-11 pl-12 pr-36 bg-orange-100 border-2 border-black shadow-brutal focus-visible:ring-0 focus:border-black"
            @focus="showResults = searchQuery.length > 0"
          />

          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''; showResults = false"
              class="p-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Search Results Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div 
            v-if="showResults && searchQuery" 
            class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-stone-800 shadow-brutal z-40 overflow-hidden"
          >
            <div v-if="isSearching && searchResults.length === 0" class="p-4 text-center text-stone-500 text-sm font-body italic">
              Mencari...
            </div>
            
            <template v-else-if="searchResults.length > 0">
              <div class="p-2 border-b-2 border-stone-100 bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4">
                Hasil Pencarian
              </div>
              <div class="max-h-[400px] overflow-y-auto">
                <button
                  v-for="res in searchResults"
                  :key="res.film_id"
                  @click="goToArchive(res.slug)"
                  class="w-full flex items-center gap-4 p-3 hover:bg-orange-50 transition-colors border-b last:border-0 border-stone-100 text-left group/item"
                >
                  <div class="w-12 h-16 bg-stone-200 flex-shrink-0 border border-stone-800 overflow-hidden">
                    <img v-if="res.gambar_poster" :src="res.gambar_poster" class="w-full h-full object-cover group-hover/item:scale-110 transition-transform" />
                    <Film v-else class="w-full h-full p-3 text-stone-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-sm text-stone-900 truncate">{{ res.judul }}</h4>
                      <Badge v-if="res.status !== 'published' && (isAdmin || isModerator || res.user_id === user?.id)" variant="outline" 
                        :class="[
                          'text-[8px] h-4 px-1 uppercase font-bold',
                          res.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'
                        ]"
                      >
                        {{ res.status }}
                      </Badge>
                    </div>
                    <p class="text-xs text-stone-500 font-mono">{{ res.tahun_karya || '-' }} • {{ res.category?.nama_kategori }}</p>
                  </div>
                </button>
              </div>
              <div class="p-3 bg-stone-800 text-white text-center text-[10px] font-bold uppercase tracking-widest hover:bg-stone-700 transition-colors cursor-pointer">
                Lihat Semua Hasil
              </div>
            </template>
            
            <div v-else-if="!isSearching && searchQuery" class="p-8 text-center text-stone-400">
              <Film class="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p class="text-sm font-body italic">Arsip tidak ditemukan.</p>
            </div>
          </div>
        </Transition>

        <!-- Overlay for closing -->
        <div v-if="showResults" class="fixed inset-0 z-30" @click="showResults = false"></div>
      </div>

      <!-- Right Side Actions -->
      <div class="flex items-center gap-1.5">
        <router-link to="/materi">
          <Button 
            class="bg-brand-orange text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm flex items-center gap-2"
          >
            <BookOpen class="w-3 h-3 md:w-4 md:h-4 text-stone-900" />
            <span class="hidden sm:inline">Materi</span>
          </Button>
        </router-link>
         <!-- About Button -->
        <router-link to="/about">
          <Button 
            class="bg-teal-900 text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm flex items-center gap-2"
          >
            <Info class="w-3 h-3 md:w-4 md:h-4" />
            <span class="hidden sm:inline">About Us</span>
          </Button>
        </router-link>

        <!-- Auth Buttons (Not Logged In) -->
        <div v-if="!isLoggedIn" class="flex items-center gap-1.5 md:gap-2">
          <router-link to="/auth/login">
            <Button class="bg-white text-stone-900 border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-8 px-4 text-xs md:h-10 md:px-6 md:text-sm">
              Login
            </Button>
          </router-link>
          <router-link to="/auth/register">
            <Button class="bg-brand-red text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] font-bold uppercase rounded-none transition-all h-8 px-4 text-xs md:h-10 md:px-6 md:text-sm">
              Register
            </Button>
          </router-link>
        </div>

        <!-- Profile Dropdown (Logged In) -->
        <template v-else>
          <NotificationDropdown />
          
          <DropdownMenu v-model:open="open">
            <DropdownMenuTrigger as-child>
              <button 
                type="button"
                class="w-9 h-9 md:w-11 md:h-11 bg-white border-2 border-black shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all cursor-pointer overflow-hidden"
              >
                <img 
                  v-if="user?.image" 
                  :src="user.image" 
                  :alt="user.name" 
                  class="w-full h-full object-cover"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <User v-else class="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" class="w-56">
                <DropdownMenuLabel>
                  <div class="font-semibold">{{ user?.name || 'User' }}</div>
                  <div class="text-xs text-stone-500">{{ user?.email }}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem as-child>
                  <router-link to="/profile" class="flex items-center gap-2 cursor-pointer">
                    <User class="w-4 h-4" />
                    <span>Profile</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuItem as-child>
                  <router-link to="/collections" class="flex items-center gap-2 cursor-pointer">
                    <Bookmark class="w-4 h-4" />
                    <span>Koleksi Saya</span>
                  </router-link>
                </DropdownMenuItem>
                
                <DropdownMenuItem v-if="isCreator" as-child>
                  <router-link to="/my-archive" class="flex items-center gap-2 cursor-pointer">
                    <Film class="w-4 h-4" />
                    <span>Karya Saya</span>
                  </router-link>
                </DropdownMenuItem>
                
                <DropdownMenuItem v-if="isAdmin" as-child>
                  <router-link to="/admin/dashboard" class="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard class="w-4 h-4" />
                    <span>Dashboard</span>
                  </router-link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem @click="handleLogout" class="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2 font-bold">
                  <LogOut class="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </div>
    </div>
  </nav>
</template>
