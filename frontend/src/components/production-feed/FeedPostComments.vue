<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Loader2, Send } from 'lucide-vue-next'
import ContentSection from '@/components/ContentSection.vue'
import CommentItem from '@/components/CommentItem.vue'
import ReportModal from '@/components/ReportModal.vue'
import { Button } from '@/components/ui/button'
import { assetUrl } from '@/lib/format'
import { useToast } from '@/composables/useToast'
import {
  fetchPostComments,
  submitPostComment,
  deletePostComment
} from '@/modules/production-feed/api'

const props = defineProps({
  postId: {
    type: [Number, String],
    required: true
  },
  postOwnerId: {
    type: String,
    default: null
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  canModerate: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const { showToast } = useToast()

const comments = ref([])
const loadingComments = ref(false)
const newComment = ref('')
const submittingComment = ref(false)
const deletingCommentIds = ref(new Set())
const imageError = ref(false)

const fetchComments = async () => {
  if (!props.postId) return
  loadingComments.value = true
  try {
    comments.value = await fetchPostComments(props.postId)
  } catch (err) {
    console.error('Failed to fetch post comments:', err)
    showToast('Gagal memuat komentar', 'error')
  } finally {
    loadingComments.value = false
  }
}

const submitComment = async (data = null) => {
  const isReply = !!data && !!data.parent_id
  const text = isReply ? data.isi_pesan : newComment.value.trim()
  const parentId = isReply ? data.parent_id : null

  if (!text || !props.isLoggedIn || !props.postId) return

  submittingComment.value = !isReply
  try {
    await submitPostComment(props.postId, { isi_pesan: text, parent_id: parentId })
    if (!isReply) newComment.value = ''
    await fetchComments()
    showToast(isReply ? 'Balasan terkirim' : 'Komentar terkirim')
  } catch (err) {
    console.error('Failed to submit comment:', err)
    showToast(err.message || 'Gagal mengirim komentar', 'error')
  } finally {
    submittingComment.value = false
  }
}

const deleteComment = async (id) => {
  if (deletingCommentIds.value.has(id)) return

  if (!confirm('Hapus komentar ini?')) return

  deletingCommentIds.value.add(id)
  try {
    await deletePostComment(id)
    await fetchComments()
    showToast('Komentar berhasil dihapus')
  } catch (err) {
    console.error('Failed to delete comment:', err)
    showToast('Gagal menghapus komentar', 'error')
  } finally {
    deletingCommentIds.value.delete(id)
  }
}

const totalCommentCount = computed(() => {
  let count = 0
  const countRecursive = (list) => {
    count += list.length
    list.forEach((c) => {
      if (c.replies && c.replies.length > 0) countRecursive(c.replies)
    })
  }
  countRecursive(comments.value)
  return count
})

// ─── Reporting ───────────────────────────────────────────
const showReportModal = ref(false)
const reportTarget = ref({ id: null, name: '' })

const handleReportContent = (target) => {
  if (!props.isLoggedIn) {
    showToast('Silakan login untuk melaporkan konten', 'error')
    return
  }
  reportTarget.value = {
    id: target.diskusi_id,
    name: `Komentar oleh ${target.user?.name || 'pengguna'}`
  }
  showReportModal.value = true
}

fetchComments()
</script>

<template>
  <ContentSection :title="`Ruang Diskusi (${totalCommentCount} Komentar)`" color="red">
    <!-- Comment form -->
    <div
      v-if="isLoggedIn"
      class="mb-6 md:mb-10 p-3 md:p-6 bg-white border-2 md:border-4 border-black shadow-[4px_4px_0_0_#000] md:shadow-brutal relative group"
    >
      <div
        class="absolute -z-10 inset-0 bg-stone-50 translate-x-1 translate-y-1 md:translate-x-2 md:translate-y-2 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform"
      ></div>

      <div class="flex gap-3 md:gap-6">
        <div
          class="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-brand-orange border-2 border-black shadow-brutal-xs items-center justify-center text-stone-900 font-bold flex-shrink-0 rounded-full overflow-hidden"
        >
          <img
            v-if="user?.image && !imageError"
            :src="assetUrl(user.image)"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover"
            @error="imageError = true"
          />
          <span v-else class="text-xs md:text-base">{{ user?.name?.charAt(0) || 'U' }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="relative">
            <textarea
              v-model="newComment"
              rows="3"
              placeholder="Apa pendapatmu?..."
              aria-label="Komentar baru"
              @keydown.ctrl.enter="submitComment()"
              @keydown.meta.enter="submitComment()"
              class="w-full p-3 md:p-4 border-2 border-black bg-white text-stone-900 text-sm md:text-base resize-none focus:ring-0 focus:outline-none mb-3 md:mb-4 font-body transition-all placeholder:text-stone-400"
            ></textarea>
            <div
              class="absolute bottom-5 right-3 md:bottom-6 md:right-4 text-[8px] md:text-[10px] font-black text-stone-300 uppercase tracking-tighter pointer-events-none hidden sm:block"
            >
              CTRL + ENTER: KIRIM · SHIFT + ENTER: BARIS BARU
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              @click="submitComment()"
              :disabled="submittingComment || !newComment.trim()"
              class="bg-brand-red hover:bg-brand-red/90 text-white rounded-none border-2 border-black shadow-[3px_3px_0_0_#000] md:shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-display font-black uppercase tracking-wider text-xs md:text-sm h-10 px-5 md:h-12 md:px-8 flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto"
            >
              <Loader2 v-if="submittingComment" class="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              <Send v-else class="w-4 h-4 md:w-5 md:h-5" />
              Kirim Komentar
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Login CTA -->
    <div
      v-else
      class="mb-8 p-4 md:p-6 bg-stone-100 border-2 border-dashed border-stone-400 text-center"
    >
      <p class="text-stone-600 mb-4 font-body text-sm md:text-base">
        Bergabung dalam diskusi untuk memberikan apresiasi atau masukan.
      </p>
      <Button
        variant="outline"
        class="border-2 border-stone-800 shadow-brutal-xs text-sm"
        @click="router.push('/auth/login')"
        >Login Untuk Berkomentar</Button
      >
    </div>

    <!-- Comments list -->
    <div class="space-y-6">
      <div v-if="loadingComments" class="text-center py-8">
        <Loader2 class="w-8 h-8 animate-spin mx-auto text-stone-400" />
      </div>
      <div
        v-else-if="comments.length === 0"
        class="text-center py-8 bg-stone-100 rounded border-2 border-stone-200 border-dashed"
      >
        <MessageCircle class="w-12 h-12 text-stone-300 mx-auto mb-2" />
        <p class="text-stone-500 font-body text-sm md:text-base">
          Belum ada diskusi. Jadilah yang pertama berkomentar!
        </p>
      </div>
      <div v-else class="space-y-6">
        <CommentItem
          v-for="comment in comments"
          :key="comment.diskusi_id"
          :comment="comment"
          :is-logged-in="isLoggedIn"
          :current-user="user"
          :can-moderate="canModerate"
          :deleting-comment-ids="deletingCommentIds"
          :film-owner-id="postOwnerId"
          @reply="submitComment($event)"
          @delete="deleteComment($event)"
          @report="handleReportContent($event)"
        />
      </div>
    </div>

    <ReportModal
      :show="showReportModal"
      :target-type="'comment'"
      :target-id="reportTarget.id"
      :target-name="reportTarget.name"
      @update:show="showReportModal = $event"
    />
  </ContentSection>
</template>
