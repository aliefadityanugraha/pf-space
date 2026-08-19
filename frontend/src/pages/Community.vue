<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Trash2, User as UserIcon, Loader2, ArrowLeft, Flag, Sparkles } from 'lucide-vue-next'
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
  <div class="min-h-screen bg-brand-cream dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-300 relative overflow-hidden flex flex-col">
    <Navbar :lightTitle="false" />
    
    <!-- Background Patterns -->
    <div class="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
    <div class="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none" style="background-image: radial-gradient(#1c1917 2px, transparent 2px); background-size: 32px 32px;"></div>
    
    <main class="flex-grow pt-24 md:pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
      <div class="mb-4">
        <Button variant="ghost" @click="router.push('/')" class="pl-0 text-stone-700 dark:text-stone-200 hover:bg-transparent hover:text-brand-red dark:hover:text-red-400 font-black uppercase tracking-widest text-xs border-none shadow-none gap-2 cursor-pointer">
           <ArrowLeft class="w-4 h-4" /> Kembali
        </Button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-brand-teal" />
      </div>

      <div v-else-if="!discussion" class="text-center py-16 md:py-20 bg-white dark:bg-stone-900 border-2 lg:border-4 border-black dark:border-stone-100 shadow-brutal text-stone-900 dark:text-stone-100">
        <MessageCircle class="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-stone-400 dark:text-stone-500" />
        <h2 class="text-xl md:text-2xl font-black font-heading uppercase tracking-tight text-stone-900 dark:text-stone-100">Tidak Ada Diskusi Aktif</h2>
        <p class="text-stone-600 dark:text-stone-400 font-medium text-sm md:text-base mt-1">Saat ini belum ada topik diskusi yang dibuka oleh moderator.</p>
      </div>

      <div v-else class="space-y-8 md:space-y-12">
        <!-- Header Panel -->
        <div class="border-2 lg:border-4 border-black dark:border-stone-100 bg-gradient-to-r from-brand-orange to-brand-red p-6 md:p-8 shadow-brutal relative text-white rounded-none overflow-hidden">
          <div class="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <div class="w-14 h-14 md:w-18 md:h-18 bg-brand-cream border-2 border-black dark:border-stone-100 shadow-brutal-sm flex items-center justify-center flex-shrink-0 rotate-3 text-brand-red">
              <MessageCircle class="w-7 h-7 md:w-9 md:h-9" />
            </div>
            <div class="flex-1 min-w-0 text-center md:text-left">
              <h1 class="text-xl md:text-3xl font-heading font-black text-white leading-tight uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)] tracking-tight">
                {{ discussion.title }}
              </h1>
              <p v-if="discussion.description" class="text-white mt-3 font-body font-medium text-xs md:text-sm bg-stone-950/40 backdrop-blur-md p-3.5 border-l-4 border-yellow-400 text-left rounded-r leading-relaxed">
                {{ discussion.description }}
              </p>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                <span class="bg-stone-950/60 text-white px-3 py-1 font-mono border border-white/20">Oleh {{ discussion.creator?.name || 'Admin' }}</span>
                <span class="bg-stone-950/60 text-white px-3 py-1 font-mono border border-white/20">{{ formatTime(discussion.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <!-- Replies List Header -->
          <div class="flex items-center justify-between mb-4 px-1">
            <h3 class="font-heading font-black text-lg md:text-xl uppercase tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-brand-teal dark:text-teal-400" />
              Tanggapan Komunitas ({{ discussion.replies?.length || 0 }})
            </h3>
          </div>

          <!-- Replies -->
          <div class="space-y-4 mb-8">
            <div v-if="discussion.replies && discussion.replies.length > 0" class="space-y-4">
              <div 
                v-for="reply in discussion.replies" 
                :key="reply.reply_id"
                class="flex flex-col sm:flex-row gap-3 md:gap-4 p-4 md:p-6 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 hover:border-brand-teal dark:hover:border-teal-400 transition-all shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <!-- Avatar -->
                <div class="w-10 h-10 md:w-12 md:h-12 border-2 border-black dark:border-stone-100 shadow-brutal-sm flex items-center justify-center flex-shrink-0 overflow-hidden bg-brand-teal">
                  <img 
                    v-if="reply.user?.image" 
                    :src="assetUrl(reply.user.image)" 
                    :alt="reply.user.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                  />
                  <UserIcon class="w-5 h-5 text-white" :style="reply.user?.image ? 'display: none;' : ''" />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-black text-xs md:text-sm text-stone-900 dark:text-stone-100 uppercase tracking-tight">{{ reply.user?.name || 'User' }}</span>
                      <span class="text-stone-400">•</span>
                      <span class="text-stone-500 dark:text-stone-400 font-mono text-[9px] md:text-[10px] font-bold">{{ formatTime(reply.created_at) }}</span>
                    </div>
                    
                    <div class="flex items-center gap-2 shrink-0">
                      <!-- Report Button -->
                      <button
                        v-if="isLoggedIn && reply.user_id !== user?.id"
                        @click="openReport(reply)"
                        class="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded cursor-pointer"
                        title="Laporkan balasan"
                      >
                        <Flag class="w-4 h-4" />
                      </button>

                      <!-- Delete button -->
                      <button
                        v-if="canDeleteReply(reply)"
                        @click="isModerator && reply.user_id !== user?.id ? askDeleteModerated(reply.reply_id) : askDelete(reply.reply_id)"
                        class="p-1.5 text-red-600 dark:text-red-400 border-2 border-stone-800 dark:border-stone-100 bg-white dark:bg-stone-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all cursor-pointer shadow-brutal-xs"
                        title="Hapus balasan"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="text-stone-800 dark:text-stone-200 text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed font-body font-medium">{{ reply.content }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12 bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 shadow-brutal text-stone-900 dark:text-stone-100">
              <MessageCircle class="w-12 h-12 mx-auto mb-3 text-stone-400 dark:text-stone-500 opacity-50" />
              <p class="text-stone-600 dark:text-stone-300 font-bold uppercase tracking-widest text-xs">Belum ada tanggapan</p>
              <p class="text-stone-500 dark:text-stone-400 font-medium text-[10px] md:text-xs mt-1">Jadilah yang pertama untuk berpendapat!</p>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="isLoggedIn" class="mt-8">
            <h4 class="font-heading font-black text-lg md:text-xl uppercase tracking-tight mb-3 md:mb-4 flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Send class="w-4 h-4 md:w-5 md:h-5 text-brand-teal dark:text-teal-400" /> Tulis Tanggapanmu
            </h4>
            <div class="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div class="hidden sm:flex w-10 h-10 md:w-12 md:h-12 border-2 border-black dark:border-stone-100 shadow-brutal-sm items-center justify-center flex-shrink-0 overflow-hidden bg-brand-orange">
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

              <div class="flex-1 bg-white dark:bg-stone-900 p-4 md:p-6 border-2 border-black dark:border-stone-100 shadow-brutal">
                <Textarea
                  v-model="replyContent"
                  placeholder="Utarakan pendapatmu yang membangun..."
                  class="min-h-[100px] text-xs md:text-sm border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus-visible:ring-0 focus:border-brand-teal resize-none mb-3 font-body shadow-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  :disabled="submitting"
                />
                <div class="flex justify-end">
                  <Button
                    @click="submitReply"
                    :disabled="!replyContent.trim() || submitting"
                    class="bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase tracking-widest px-6 h-11 md:h-12 text-xs md:text-sm rounded-none cursor-pointer"
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
          <div v-else class="text-center bg-yellow-400 dark:bg-yellow-500 p-6 md:p-8 border-2 border-black dark:border-stone-100 shadow-brutal mt-6 md:mt-8 text-stone-900">
            <h4 class="font-heading font-black text-xl uppercase tracking-tight mb-2">Ingin Berpendapat?</h4>
            <p class="font-bold text-sm mb-5 text-stone-800">Kamu harus masuk (login) ke akunmu terlebih dahulu untuk ikut berdiskusi di sini.</p>
            <router-link to="/auth/login" class="inline-block">
              <Button class="bg-brand-red text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase text-sm h-12 px-8 rounded-none cursor-pointer">
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
