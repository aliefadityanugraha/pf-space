import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from './useAuth'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const initialized = ref(false)

export function useNotifications() {
  const { isLoggedIn } = useAuth()

  const fetchNotifications = async (page = 1) => {
    if (!isLoggedIn.value) return
    
    loading.value = true
    try {
      const res = await api.get('/api/notifications', {
        params: { page, limit: 10 }
      })
      
      if (page === 1) {
        notifications.value = res.data.notifications
      } else {
        notifications.value = [...notifications.value, ...res.data.notifications]
      }
      
      unreadCount.value = res.data.unreadCount
      initialized.value = true
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {})
      
      const notif = notifications.value.find(n => n.id === id)
      if (notif && !notif.is_read) {
        notif.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all')
      
      notifications.value.forEach(n => n.is_read = true)
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const hasUnread = computed(() => unreadCount.value > 0)

  return {
    notifications,
    unreadCount,
    loading,
    initialized,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    hasUnread
  }
}
