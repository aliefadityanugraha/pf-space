<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Trash2, User as UserIcon, Loader2 } from 'lucide-vue-next'
import { timeAgo } from '@/lib/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const { user, isLoggedIn, isModerator } = useAuth()
const { showToast } = useToast()

const discussion = ref(null)
const loading = ref(true)
const replyContent = ref('')
const submitting = ref(false)

// Confirm modal state
const showConfirm = ref(false)
const confirmLoading = ref(false)
const confirmData = ref({
  title: 'Hapus Balasan',
  message: 'Apakah Anda yakin ingin menghapus balasan ini?'
})
const pendingDelete = ref({ id: null, moderated: false })

const fetchDiscussion = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/community/active')
    if (res.success && res.data) {
      discussion.value = res.data
    } else {
      discussion.value = null
    }
  } catch (error) {
    console.error('Failed to fetch community discussion:', error)
    discussion.value = null
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  if (!replyContent.value.trim() || !discussion.value) return

  submitting.value = true
  try {
    const res = await api.post(`/api/community/${discussion.value.discussion_id}/replies`, {
      content: replyContent.value.trim()
    })

    if (res.success) {
      // Add new reply to the list
      if (!discussion.value.replies) {
        discussion.value.replies = []
      }
      discussion.value.replies.push(res.data)
      replyContent.value = ''
    } else {
      console.error('Failed to submit reply:', res)
      showToast(res.message || 'Gagal mengirim balasan. Silakan coba lagi.', 'error')
    }
  } catch (error) {
    console.error('Failed to submit reply:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim balasan. Silakan coba lagi.'
    showToast(errorMessage, 'error')
  } finally {
    submitting.value = false
  }
}

const askDelete = (replyId) => {
  pendingDelete.value = { id: replyId, moderated: false }
  confirmData.value = {
    title: 'Hapus Balasan',
    message: 'Hapus balasan ini? Tindakan ini tidak dapat dibatalkan.'
  }
  showConfirm.value = true
}

const askDeleteModerated = (replyId) => {
  pendingDelete.value = { id: replyId, moderated: true }
  confirmData.value = {
    title: 'Moderasi: Hapus Balasan',
    message: 'Hapus balasan ini sebagai moderator?'
  }
  showConfirm.value = true
}

const executeDelete = async () => {
  const id = pendingDelete.value.id
  if (!id) return

  try {
    confirmLoading.value = true
    const url = pendingDelete.value.moderated
      ? `/api/community/replies/${id}/moderate`
      : `/api/community/replies/${id}`
    const res = await api.delete(url)
    if (res && res.success === false) {
      throw new Error(res.message || 'Gagal menghapus balasan')
    }
    discussion.value.replies = (discussion.value.replies || []).filter(r => r.reply_id !== id)
    showToast('Balasan berhasil dihapus')
  } catch (error) {
    console.error('Failed to delete reply:', error)
    showToast('Gagal menghapus balasan.', 'error')
  } finally {
    confirmLoading.value = false
    showConfirm.value = false
    pendingDelete.value = { id: null, moderated: false }
  }
}

const formatTime = (date) => {
  try {
    return timeAgo(date)
  } catch {
    return 'baru saja'
  }
}

const canDeleteReply = (reply) => {
  return reply.user_id === user.value?.id || isModerator.value
}

onMounted(() => {
  fetchDiscussion()
})
</script>

<template>
  <section v-if="!loading && discussion" class="py-12 md:py-16">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <Card class="border-2 border-black shadow-brutal bg-white">
        <CardHeader class="border-b-2 border-black bg-gradient-to-r from-brand-orange to-brand-red p-3 md:p-6">
          <div class="flex items-center gap-2.5 md:gap-4">
            <div class="w-8 h-8 md:w-12 md:h-12 bg-white border-2 border-black shadow-brutal flex items-center justify-center flex-shrink-0">
              <MessageCircle class="w-4 h-4 md:w-6 md:h-6 text-brand-red" />
            </div>
            <div class="flex-1 min-w-0">
              <CardTitle class="text-base md:text-3xl font-display font-bold text-white leading-tight truncate">
                {{ discussion.title }}
              </CardTitle>
              <p v-if="discussion.description" class="text-white/90 font-body text-[10px] md:text-base line-clamp-1">
                {{ discussion.description }}
              </p>
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[9px] md:text-xs text-white/80 leading-tight">
                <span class="truncate">Oleh {{ discussion.creator?.name }}</span>
                <span class="hidden md:inline">•</span>
                <span>{{ formatTime(discussion.created_at) }}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent class="p-3 md:p-6">
          <!-- Replies -->
          <div class="space-y-2 md:space-y-3 mb-4">
            <div v-if="discussion.replies && discussion.replies.length > 0">
              <div 
                v-for="reply in discussion.replies" 
                :key="reply.reply_id"
                class="flex gap-3 p-2.5 md:p-3.5 bg-stone-50 border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <!-- Avatar -->
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-black shadow-brutal-xs flex items-center justify-center flex-shrink-0 overflow-hidden bg-brand-teal">
                  <img 
                    v-if="reply.user?.image" 
                    :src="reply.user.image" 
                    :alt="reply.user.name"
                    class="w-full h-full object-cover"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <UserIcon v-else class="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1.5 mb-1">
                    <div class="flex items-center gap-1.5 text-[11px] md:text-sm">
                      <span class="font-bold text-stone-900 truncate max-w-[120px]">{{ reply.user?.name || 'User' }}</span>
                      <span class="text-stone-300">•</span>
                      <span class="text-stone-400 text-[10px]">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    
                    <!-- Delete button -->
                    <button
                      v-if="canDeleteReply(reply)"
                      @click="isModerator && reply.user_id !== user?.id ? askDeleteModerated(reply.reply_id) : askDelete(reply.reply_id)"
                      class="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Hapus balasan"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                  <p class="text-stone-700 text-[11px] md:text-sm whitespace-pre-wrap break-words leading-snug md:leading-relaxed font-body">{{ reply.content }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-stone-400">
              <MessageCircle class="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm font-body">Belum ada balasan. Jadilah yang pertama!</p>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="isLoggedIn" class="border-t-2 border-stone-200 pt-4 md:pt-5">
            <div class="flex gap-2.5 md:gap-3">
              <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-orange border-2 border-black shadow-brutal-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  v-if="user?.image" 
                  :src="user.image" 
                  :alt="user.name"
                  class="w-full h-full object-cover"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <UserIcon v-else class="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <div class="flex-1">
                <Textarea
                  v-model="replyContent"
                  placeholder="Tulis balasan Anda..."
                  class="min-h-[70px] md:min-h-[85px] text-xs md:text-sm border-2 border-black shadow-brutal-xs focus-visible:ring-0 focus:border-brand-teal resize-none mb-2"
                  :disabled="submitting"
                />
                <Button
                  @click="submitReply"
                  :disabled="!replyContent.trim() || submitting"
                  class="bg-brand-teal text-white border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold uppercase h-9 md:h-10 text-[11px] md:text-sm"
                >
                  <Loader2 v-if="submitting" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <Send v-else class="w-3.5 h-3.5 mr-1.5" />
                  Kirim Balasan
                </Button>
              </div>
            </div>
          </div>

          <!-- Login prompt -->
          <div v-else class="border-t-2 border-stone-200 pt-6 text-center">
            <p class="text-stone-600 mb-4">Login untuk ikut berdiskusi</p>
            <router-link to="/auth/login">
              <Button class="bg-brand-red text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold uppercase">
                Login Sekarang
              </Button>
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Confirm Delete -->
    <ConfirmDialog
      v-model:show="showConfirm"
      :title="confirmData.title"
      :message="confirmData.message"
      confirm-label="Hapus"
      cancel-label="Batal"
      variant="danger"
      :loading="confirmLoading"
      @confirm="executeDelete"
    >
      <template #confirm-icon>
        <Trash2 class="w-4 h-4" />
      </template>
    </ConfirmDialog>

  </section>
</template>
