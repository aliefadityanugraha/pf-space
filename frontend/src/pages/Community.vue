<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Trash2, User as UserIcon, Loader2, ArrowLeft, Flag } from 'lucide-vue-next'
import { timeAgo, assetUrl } from '@/lib/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ReportModal from '@/components/ReportModal.vue'
import { useToast } from '@/composables/useToast'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const { user, isLoggedIn, isModerator } = useAuth()
const { showToast } = useToast()
const router = useRouter()

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

// ─── Reporting ──────────────────────────────────────────
const showReportModal = ref(false)
const reportType = ref('reply')
const reportTarget = ref({ id: null, name: '' })

const openReport = (reply) => {
  if (!isLoggedIn.value) {
    showToast('Silakan login untuk melaporkan konten', 'error')
    return
  }
  reportType.value = 'reply'
  reportTarget.value = { id: reply.reply_id, name: `Balasan oleh ${reply.user?.name}` }
  showReportModal.value = true
}

onMounted(() => {
  fetchDiscussion()
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream relative overflow-hidden flex flex-col">
    <Navbar :lightTitle="false" />
    
    <!-- Background Patterns -->
    <div class="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
    <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: radial-gradient(#1c1917 2px, transparent 2px); background-size: 32px 32px;"></div>
    
    <main class="flex-grow pt-24 md:pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
      <div class="mb-4">
        <Button variant="ghost" @click="router.push('/')" class="pl-0 hover:bg-transparent hover:text-brand-red font-black uppercase tracking-widest text-xs border-none shadow-none gap-2">
           <ArrowLeft class="w-4 h-4" /> Kembali
        </Button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-stone-400" />
      </div>

      <div v-else-if="!discussion" class="text-center py-16 md:py-20 bg-white border-2 lg:border-4 border-black shadow-[6px_6px_0_rgba(28,25,23,1)]">
        <MessageCircle class="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-stone-300" />
        <h2 class="text-xl md:text-2xl font-black font-heading uppercase tracking-tight text-stone-800">Tidak ada diskusi aktif</h2>
        <p class="text-stone-500 font-medium text-sm md:text-base">Saat ini belum ada topik diskusi yang dibuka oleh moderator.</p>
      </div>

      <div v-else class="space-y-8 md:space-y-12">
        <!-- Header Panel -->
        <div class="border-2 lg:border-4 border-black bg-gradient-to-r from-brand-orange to-brand-red p-5 md:p-8 shadow-[6px_6px_0_rgba(28,25,23,1)] bg-white relative">
          <div class="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div class="w-12 h-12 md:w-16 md:h-16 bg-brand-cream border-2 border-black shadow-[3px_3px_0_rgba(28,25,23,1)] flex items-center justify-center flex-shrink-0 rotate-3">
              <MessageCircle class="w-6 h-6 md:w-8 md:h-8 text-brand-red" />
            </div>
            <div class="flex-1 min-w-0 text-center md:text-left">
              <h1 class="text-xl md:text-3xl font-heading font-black text-white leading-tight uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                {{ discussion.title }}
              </h1>
              <p v-if="discussion.description" class="text-white/95 mt-2 font-mono font-bold text-xs md:text-sm bg-black/20 p-3 border-l-2 border-yellow-400 text-left">
                {{ discussion.description }}
              </p>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 mt-3 text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                <span class="bg-black/30 px-2.5 py-1">Oleh {{ discussion.creator?.name || 'Admin' }}</span>
                <span>•</span>
                <span class="bg-black/30 px-2.5 py-1">{{ formatTime(discussion.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <!-- Replies -->
          <div class="space-y-3 md:space-y-4 mb-8">
            <div v-if="discussion.replies && discussion.replies.length > 0" class="space-y-3 md:space-y-4">
              <div 
                v-for="reply in discussion.replies" 
                :key="reply.reply_id"
                class="flex flex-col sm:flex-row gap-3 md:gap-4 p-3 md:p-5 bg-white border-2 border-black hover:border-brand-teal transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0_rgba(20,184,166,1)]"
              >
                <!-- Avatar -->
                <div class="w-8 h-8 md:w-10 md:h-10 border-2 border-black shadow-[2px_2px_0_rgba(28,25,23,1)] flex items-center justify-center flex-shrink-0 overflow-hidden bg-brand-teal">
                  <img 
                    v-if="reply.user?.image" 
                    :src="assetUrl(reply.user.image)" 
                    :alt="reply.user.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                  />
                  <UserIcon class="w-4 h-4 text-white" :style="reply.user?.image ? 'display: none;' : ''" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1.5 md:mb-2">
                    <div class="flex items-center gap-1.5 md:gap-2 flex-wrap">
                      <span class="font-black text-xs md:text-sm text-stone-900 uppercase tracking-tight">{{ reply.user?.name || 'User' }}</span>
                      <span class="text-stone-300">•</span>
                      <span class="text-stone-500 font-mono text-[9px] md:text-[10px] font-bold">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    
                    <div class="flex items-center gap-1 md:gap-2 shrink-0">
                      <!-- Report Button -->
                      <button
                        v-if="isLoggedIn && reply.user_id !== user?.id"
                        @click="openReport(reply)"
                        class="p-1 md:p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-200"
                        title="Laporkan balasan"
                      >
                        <Flag class="w-3.5 h-3.5" />
                      </button>

                      <!-- Delete button -->
                      <button
                        v-if="canDeleteReply(reply)"
                        @click="isModerator && reply.user_id !== user?.id ? askDeleteModerated(reply.reply_id) : askDelete(reply.reply_id)"
                        class="p-1 md:p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-all border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                        title="Hapus balasan"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p class="text-stone-800 text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed font-body font-medium">{{ reply.content }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-10 bg-white shadow-[4px_4px_0_rgba(28,25,23,0.1)] border-2 border-dashed border-stone-300">
              <MessageCircle class="w-12 h-12 mx-auto mb-3 text-stone-300 opacity-50" />
              <p class="text-stone-500 font-bold uppercase tracking-widest text-xs">Belum ada tanggapan</p>
              <p class="text-stone-400 font-medium text-[10px] md:text-xs mt-1">Jadilah yang pertama untuk berpendapat!</p>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="isLoggedIn" class="mt-8">
            <h4 class="font-heading font-black text-lg md:text-xl uppercase tracking-tight mb-3 md:mb-4 flex items-center gap-2">
              <Send class="w-4 h-4 md:w-5 md:h-5" /> Tulis Tanggapanmu
            </h4>
            <div class="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div class="hidden sm:flex w-10 h-10 md:w-12 md:h-12 border-2 border-black shadow-[2px_2px_0_rgba(28,25,23,1)] items-center justify-center flex-shrink-0 overflow-hidden bg-brand-orange">
                <img 
                  v-if="user?.image" 
                  :src="assetUrl(user.image)" 
                  :alt="user.name"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                />
                <UserIcon class="w-5 h-5 text-white" :style="user?.image ? 'display: none;' : ''" />
              </div>

              <div class="flex-1 bg-white p-4 border-2 border-black shadow-[4px_4px_0_rgba(28,25,23,1)]">
                <Textarea
                  v-model="replyContent"
                  placeholder="Utarakan pendapatmu yang membangun..."
                  class="min-h-[80px] text-xs md:text-sm border-2 border-stone-200 focus-visible:ring-0 focus:border-brand-teal resize-none mb-3 font-body shadow-none"
                  :disabled="submitting"
                />
                <div class="flex justify-end">
                  <Button
                    @click="submitReply"
                    :disabled="!replyContent.trim() || submitting"
                    class="bg-brand-teal text-white border-2 border-black shadow-[3px_3px_0_rgba(28,25,23,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase tracking-widest px-6 h-10 md:h-12 text-xs md:text-sm rounded-none"
                  >
                    <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                    <Send v-else class="w-4 h-4 mr-2" />
                    Kirim Sekarang
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Login prompt -->
          <div v-else class="text-center bg-yellow-400 p-6 md:p-8 border-2 border-black shadow-[4px_4px_0_rgba(28,25,23,1)] mt-6 md:mt-8">
            <h4 class="font-heading font-black text-xl uppercase tracking-tight mb-2 text-stone-900">Ingin Berpendapat?</h4>
            <p class="text-stone-800 font-bold text-sm mb-5">Kamu harus masuk (login) ke akunmu terlebih dahulu untuk ikut berdiskusi di sini.</p>
            <router-link to="/auth/login" class="inline-block">
              <Button class="bg-brand-red text-white border-2 border-black shadow-[4px_4px_0_rgba(28,25,23,1)] hover:shadow-[2px_2px_0_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase text-sm h-12 px-8 rounded-none">
                <UserIcon class="w-4 h-4 mr-2" />
                Masuk ke Akun
              </Button>
            </router-link>
          </div>
        </div>
      </div>
    </main>
    <Footer class="!bg-stone-950 !text-white !border-t-0" />

    <!-- Confirm Delete -->
    <ConfirmDialog
      :show="showConfirm"
      @update:show="showConfirm = $event"
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

    <!-- Report Modal -->
    <ReportModal 
      :show="showReportModal"
      @update:show="showReportModal = $event"
      :target-type="reportType"
      :target-id="reportTarget.id"
      :target-name="reportTarget.name"
    />
  </div>
</template>
