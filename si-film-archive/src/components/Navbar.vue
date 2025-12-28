<script setup>
import { ref } from 'vue'
import { Search, User, Film, LogOut, Settings, LayoutDashboard, Upload } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from 'radix-vue'

const open = ref(false)
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 h-20 bg-transparent backdrop-blur-md border-b-2 border-stone-300/50">
    <div class="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-red shadow-brutal-sm border-2 border-slate-900 flex items-center justify-center">
          <Film class="w-5 h-5 text-white" />
        </div>
        <span class="text-2xl font-bold font-display text-[#000] hidden sm:block">CineArchive</span>
      </router-link>

      <!-- Search Bar -->
      <div class="flex-1 max-w-xl mx-4 md:mx-8">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 z-10" />
          <Input 
            type="text" 
            placeholder="Search film archives..."
            class="pl-10 pr-28 bg-orange-100 border-orange-100 shadow-none"
          />
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="ghost" size="sm" class="h-7 px-3 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-wide">
              Titles
            </Button>
            <Button variant="ghost" size="sm" class="h-7 px-2 text-slate-500 text-xs font-bold uppercase tracking-wide">
              Docs
            </Button>
          </div>
        </div>
      </div>

      <!-- Profile Dropdown -->
      <DropdownMenuRoot v-model:open="open" :modal="false">
        <DropdownMenuTrigger as-child>
          <button 
            type="button"
            class="w-11 h-11 bg-white border-2 border-black shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all cursor-pointer"
          >
            <User class="w-5 h-5 text-slate-700" />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuPortal>
          <DropdownMenuContent 
            :side-offset="8" 
            align="end"
            class="z-[100] min-w-[180px] bg-white border-2 border-black shadow-brutal p-1"
          >
            <DropdownMenuLabel class="px-3 py-2 font-body text-sm font-semibold text-stone-900 hover:bg-stone-100">
              <router-link to="/profile">
                My Account
              </router-link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator class="-mx-1 my-1 h-px bg-stone-200" />
            
            <DropdownMenuItem as-child>
              <router-link to="/dashboard" class="flex items-center gap-2 w-full px-3 py-2 text-sm font-body hover:bg-stone-100 cursor-pointer">
                <LayoutDashboard class="w-4 h-4" />
                Dashboard
              </router-link>
            </DropdownMenuItem>
            
            <DropdownMenuItem as-child>
              <router-link to="/upload" class="flex items-center gap-2 w-full px-3 py-2 text-sm font-body hover:bg-stone-100 cursor-pointer">
                <Upload class="w-4 h-4" />
                Upload Film
              </router-link>
            </DropdownMenuItem>
            
            <DropdownMenuItem class="flex items-center gap-2 w-full px-3 py-2 text-sm font-body hover:bg-stone-100 cursor-pointer">
              <Settings class="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator class="-mx-1 my-1 h-px bg-stone-200" />
            
            <DropdownMenuItem as-child>
              <router-link to="/auth/login" class="flex items-center gap-2 w-full px-3 py-2 text-sm font-body text-brand-red hover:bg-stone-100 cursor-pointer">
                <LogOut class="w-4 h-4" />
                Logout
              </router-link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </nav>
</template>
