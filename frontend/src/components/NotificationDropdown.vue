<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Check, Loader2 } from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'
import { useAuth } from '@/composables/useAuth'
import { timeAgo } from '@/lib/format'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from 'radix-vue'
import { Button } from '@/components/ui/button'

const router = useRouter()
const { isLoggedIn } = useAuth()
const { 
  notifications, 
  unreadCount, 
  loading, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead 
} = useNotifications()

const open = ref(false)

// Fetch notifications when logged in or component mounts
onMounted(() => {
  if (isLoggedIn.value) {
    fetchNotifications()
  }
})

// Poll for notifications every minute
setInterval(() => {
  if (isLoggedIn.value) {
    fetchNotifications()
  }
}, 60000)

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  
  open.value = false
  
  if (notification.data?.film_id) {
    // If it's a comment/reply, we might want to scroll to discussion
    // For now just go to film detail
    const route = { name: 'Detail', params: { slug: notification.data.film_id } } // Assuming slug or ID works
    // Better to fetch slug if we only have ID, but router usually handles ID if configured or we rely on redirect
    // Our Detail page handles ID or Slug.
    router.push(`/archive/${notification.data.film_id}`)
  }
}

const formatTime = (date) => {
  return timeAgo(date)
}
</script>

<template>
  <DropdownMenuRoot v-model:open="open" :modal="false">
    <DropdownMenuTrigger as-child>
      <button 
        type="button"
        class="w-9 h-9 md:w-11 md:h-11 bg-white border-2 border-black shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all cursor-pointer relative"
      >
        <Bell class="w-4 h-4 md:w-5 md:h-5 text-stone-900" />
        <span 
          v-if="unreadCount > 0" 
          class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold p-0.5 border-2 border-black min-w-[20px]"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </DropdownMenuTrigger>
    
    <DropdownMenuPortal>
      <DropdownMenuContent 
        :side-offset="8" 
        align="end"
        class="z-[100] w-[320px] md:w-[380px] bg-white border-2 border-black shadow-brutal p-0 overflow-hidden"
      >
        <div class="p-3 border-b-2 border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 class="font-bold text-sm text-stone-900">Notifikasi</h3>
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-xs text-brand-teal hover:underline font-medium flex items-center gap-1"
          >
            <Check class="w-3 h-3" />
            Tandai semua dibaca
          </button>
        </div>
        
        <div class="max-h-[400px] overflow-y-auto">
          <div v-if="loading && notifications.length === 0" class="p-8 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto text-stone-400" />
          </div>
          
          <div v-else-if="notifications.length === 0" class="p-8 text-center text-stone-500 text-sm">
            <Bell class="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>Belum ada notifikasi.</p>
          </div>
          
          <div v-else>
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              class="p-4 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors relative group"
              :class="{ 'bg-orange-50/50': !notification.is_read }"
            >
              <div class="flex gap-3">
                <div class="flex-shrink-0 mt-1">
                  <div class="w-2 h-2 rounded-full" :class="notification.is_read ? 'bg-transparent' : 'bg-brand-red'"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-stone-900 mb-0.5">{{ notification.title }}</p>
                  <p class="text-xs text-stone-600 line-clamp-2 mb-1.5">{{ notification.message }}</p>
                  <p class="text-[10px] text-stone-400 font-mono">{{ formatTime(notification.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="notifications.length > 0" class="p-2 border-t-2 border-stone-100 text-center">
          <button @click="fetchNotifications(Math.ceil(notifications.length / 10) + 1)" class="text-xs text-stone-500 hover:text-stone-900 font-medium w-full py-1">
            Muat lebih banyak
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
