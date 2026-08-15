<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
const pollInterval = setInterval(() => {
  if (isLoggedIn.value) {
    fetchNotifications()
  }
}, 60000)

onUnmounted(() => {
  clearInterval(pollInterval)
})

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  
  open.value = false
  
  if (notification.type === 'community_reply') {
    router.push('/community')
  } else if (notification.data?.slug) {
    router.push(`/archive/${notification.data.slug}`)
  } else if (notification.data?.film_id) {
    router.push(`/archive/${notification.data.film_id}`)
  } else if (['approval', 'rejection'].includes(notification.type)) {
    router.push('/my-archive')
  }
}

const formatTime = (date) => {
  return timeAgo(date)
}
</script>

<template>
  <DropdownMenuRoot :open="open" @update:open="open = $event" :modal="false">
    <DropdownMenuTrigger as-child>
      <button 
        type="button"
        aria-label="Notifikasi"
        title="Notifikasi"
        class="w-11 h-11 md:w-11 md:h-11 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-brutal-sm transition-all cursor-pointer relative shrink-0"
      >
        <Bell class="w-4 h-4 md:w-5 md:h-5 text-stone-900 dark:text-stone-100" />
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
        :collision-padding="12"
        align="end"
        class="z-[100] w-[calc(100vw-1.5rem)] sm:w-[350px] md:w-[380px] max-w-[380px] bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal p-0 overflow-hidden"
      >
        <div class="p-3 border-b-2 border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800">
          <h3 class="font-bold text-sm text-stone-900 dark:text-stone-100">Notifikasi</h3>
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-xs text-brand-teal hover:underline font-medium flex items-center gap-1 shrink-0"
          >
            <Check class="w-3 h-3" />
            <span>Tandai semua dibaca</span>
          </button>
        </div>
        
        <div class="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
          <div v-if="loading && notifications.length === 0" class="p-8 text-center">
            <Loader2 class="w-6 h-6 animate-spin mx-auto text-stone-400" />
          </div>
          
          <div v-else-if="notifications.length === 0" class="p-8 text-center text-stone-500 dark:text-stone-400 text-sm">
            <Bell class="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>Belum ada notifikasi.</p>
          </div>
          
          <div v-else>
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              class="p-4 border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors relative group"
              :class="{ 'bg-orange-50/50 dark:bg-orange-950/30': !notification.is_read }"
            >
              <div class="flex gap-3">
                <div class="flex-shrink-0 mt-1">
                  <div class="w-2 h-2 rounded-full" :class="notification.is_read ? 'bg-transparent' : 'bg-brand-red'"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-stone-900 dark:text-stone-100 mb-0.5">{{ notification.title }}</p>
                  <p class="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mb-1.5">{{ notification.message }}</p>
                  <p class="text-[10px] text-stone-400 font-mono">{{ formatTime(notification.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="notifications.length > 0" class="p-2 border-t-2 border-stone-100 dark:border-stone-800 text-center">
          <button @click="fetchNotifications(Math.ceil(notifications.length / 10) + 1)" class="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium w-full py-1">
            Muat lebih banyak
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
