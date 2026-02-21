<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Trash2, User as UserIcon, Loader2 } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const { user, isLoggedIn, isModerator } = useAuth()

const discussion = ref(null)
const loading = ref(true)
const replyContent = ref('')
const submitting = ref(false)

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
      alert(res.message || 'Gagal mengirim balasan. Silakan coba lagi.')
    }
  } catch (error) {
    console.error('Failed to submit reply:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim balasan. Silakan coba lagi.'
    alert(errorMessage)
  } finally {
    submitting.value = false
  }
}

const deleteReply = async (replyId) => {
  if (!confirm('Hapus balasan ini?')) return

  try {
    const res = await api.delete(`/api/community/replies/${replyId}`)
    if (res.success) {
      // Remove reply from list
      discussion.value.replies = discussion.value.replies.filter(r => r.reply_id !== replyId)
    }
  } catch (error) {
    console.error('Failed to delete reply:', error)
    alert('Gagal menghapus balasan.')
  }
}

const deleteReplyByModerator = async (replyId) => {
  if (!confirm('Hapus balasan ini sebagai moderator?')) return

  try {
    const res = await api.delete(`/api/community/replies/${replyId}/moderate`)
    if (res.success) {
      discussion.value.replies = discussion.value.replies.filter(r => r.reply_id !== replyId)
    }
  } catch (error) {
    console.error('Failed to delete reply:', error)
    alert('Gagal menghapus balasan.')
  }
}

const formatTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale })
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
  <section v-if="!loading && discussion" class="py-12 md:py-16 bg-gradient-to-br from-brand-orange/10 via-white to-brand-teal/10">
    <div class="max-w-7xl mx-auto px-4 md:px-8">
      <Card class="border-2 border-black shadow-brutal bg-white">
        <CardHeader class="border-b-2 border-black bg-gradient-to-r from-brand-orange to-brand-red p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-white border-2 border-black shadow-brutal flex items-center justify-center flex-shrink-0">
              <MessageCircle class="w-6 h-6 text-brand-red" />
            </div>
            <div class="flex-1">
              <CardTitle class="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                {{ discussion.title }}
              </CardTitle>
              <p v-if="discussion.description" class="text-white/90 font-body text-sm md:text-base">
                {{ discussion.description }}
              </p>
              <div class="flex items-center gap-2 mt-3 text-xs text-white/80">
                <span>Dibuat oleh {{ discussion.creator?.name }}</span>
                <span>•</span>
                <span>{{ formatTime(discussion.created_at) }}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent class="p-6">
          <!-- Replies -->
          <div class="space-y-4 mb-6">
            <div v-if="discussion.replies && discussion.replies.length > 0">
              <div 
                v-for="reply in discussion.replies" 
                :key="reply.reply_id"
                class="flex gap-3 p-4 bg-stone-50 border-2 border-stone-200 hover:border-stone-300 transition-colors"
              >
                <!-- Avatar -->
                <div class="w-10 h-10 bg-brand-teal border-2 border-black shadow-brutal-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img 
                    v-if="reply.user?.image" 
                    :src="reply.user.image" 
                    :alt="reply.user.name"
                    class="w-full h-full object-cover"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <UserIcon v-else class="w-5 h-5 text-white" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="font-bold text-stone-900">{{ reply.user?.name || 'User' }}</span>
                      <span class="text-stone-400">•</span>
                      <span class="text-stone-500 text-xs">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    
                    <!-- Delete button -->
                    <button
                      v-if="canDeleteReply(reply)"
                      @click="isModerator && reply.user_id !== user?.id ? deleteReplyByModerator(reply.reply_id) : deleteReply(reply.reply_id)"
                      class="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Hapus balasan"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                  <p class="text-stone-700 text-sm md:text-base whitespace-pre-wrap break-words">{{ reply.content }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-stone-400">
              <MessageCircle class="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm font-body">Belum ada balasan. Jadilah yang pertama!</p>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="isLoggedIn" class="border-t-2 border-stone-200 pt-6">
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-brand-orange border-2 border-black shadow-brutal-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  v-if="user?.image" 
                  :src="user.image" 
                  :alt="user.name"
                  class="w-full h-full object-cover"
                  @error="(e) => e.target.style.display = 'none'"
                />
                <UserIcon v-else class="w-5 h-5 text-white" />
              </div>

              <div class="flex-1">
                <Textarea
                  v-model="replyContent"
                  placeholder="Tulis balasan Anda..."
                  class="min-h-[100px] border-2 border-black shadow-brutal focus-visible:ring-0 focus:border-brand-teal resize-none mb-3"
                  :disabled="submitting"
                />
                <Button
                  @click="submitReply"
                  :disabled="!replyContent.trim() || submitting"
                  class="bg-brand-teal text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold uppercase"
                >
                  <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                  <Send v-else class="w-4 h-4 mr-2" />
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
  </section>
</template>
