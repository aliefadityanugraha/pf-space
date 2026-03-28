<script setup>
import { ref, computed } from 'vue'
import { MessageCircle, Trash2, CornerDownRight, Loader2, Send, Flag } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, assetUrl } from '@/lib/format'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  maxDepth: {
    type: Number,
    default: 5
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: () => ({})
  },
  canModerate: {
    type: Boolean,
    default: false
  },
  deletingCommentIds: {
    type: Object,
    default: () => new Set()
  },
  filmOwnerId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['reply', 'delete', 'report'])

const isReplyOpen = ref(false)
const replyText = ref('')
const isSubmittingReply = ref(false)
const imageError = ref(false)

const handleReplySubmit = async () => {
  if (!replyText.value.trim()) return
  
  isSubmittingReply.value = true
  try {
    emit('reply', {
      parent_id: props.comment.diskusi_id,
      isi_pesan: replyText.value.trim()
    })
    replyText.value = ''
    isReplyOpen.value = false
  } finally {
    isSubmittingReply.value = false
  }
}

const canDelete = computed(() => {
  if (!props.isLoggedIn || !props.currentUser || !props.comment) return false;
  const isOwner = props.currentUser.id && props.comment.user_id && props.currentUser.id === props.comment.user_id;
  return !!(isOwner || props.canModerate);
})

const isCreator = computed(() => props.filmOwnerId && props.comment.user_id === props.filmOwnerId)
const isModerator = computed(() => props.comment.user?.role_id >= 3) // Assume 3 is moderator, 4 is admin
</script>

<template>
  <div class="comment-item relative group" :class="depth > 0 ? 'mt-3 ml-6 md:ml-10' : 'mt-2 border-b-2 border-stone-50 pb-3 last:border-0 last:pb-0'">
    <!-- Reply Line for nested items -->
    <div v-if="depth > 0" class="absolute -left-6 md:-left-10 top-0 bottom-0 border-l-2 border-stone-200">
      <div class="absolute top-5 left-0 w-4 md:w-8 border-t-2 border-stone-200"></div>
    </div>

    <div class="flex gap-3 md:gap-4">
      <!-- Avatar -->
      <div 
        class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-black shadow-brutal-xs flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0 overflow-hidden bg-stone-100 relative"
      >
        <img 
          v-if="comment.user?.image && !imageError" 
          :src="assetUrl(comment.user.image)" 
          :alt="comment.user.name"
          referrerpolicy="no-referrer"
          class="w-full h-full object-cover"
          @error="imageError = true"
        />
        <div 
          v-else 
          class="w-full h-full flex items-center justify-center"
          :class="depth % 2 === 0 ? 'bg-brand-orange text-stone-900' : 'bg-brand-teal text-white'"
        >
          {{ comment.user?.name?.charAt(0) || 'U' }}
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
          <div class="flex items-center gap-2">
            <span class="font-display font-black text-sm md:text-base text-stone-900 capitalize tracking-tight">{{ comment.user?.name || 'Pengguna tidak dikenal' }}</span>
            
            <!-- Badges -->
            <div v-if="isCreator" class="px-1.5 py-[3px] bg-brand-red text-white text-[8px] md:text-[9px] font-bold leading-none uppercase tracking-wider border border-black shadow-[1px_1px_0px_#000]">Kreator</div>
            <div v-if="isModerator && !isCreator" class="px-1.5 py-[3px] bg-stone-900 text-white text-[8px] md:text-[9px] font-bold leading-none uppercase tracking-wider border border-black shadow-[1px_1px_0px_#000]">Moderator</div>
          </div>
          
          <span class="text-[10px] md:text-xs text-stone-400 font-mono font-medium">{{ formatDate(comment.created_at, true) }}</span>
        </div>

        <!-- Body -->
        <div class="relative">
           <p class="text-[13px] md:text-[15px] text-stone-800 leading-relaxed whitespace-pre-wrap mb-3 font-body font-medium">{{ comment.isi_pesan }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-5">
          <button 
            v-if="isLoggedIn && depth < maxDepth"
            @click="isReplyOpen = !isReplyOpen"
            class="group/btn flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-brand-teal transition-colors"
          >
            <CornerDownRight class="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            <span>{{ isReplyOpen ? 'Batal' : 'Balas' }}</span>
          </button>
          
          <button 
            v-if="canDelete"
            @click="emit('delete', comment.diskusi_id)"
            :disabled="deletingCommentIds.has(comment.diskusi_id)"
            class="group/btn flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-brand-red transition-colors disabled:opacity-50"
          >
            <Loader2 v-if="deletingCommentIds.has(comment.diskusi_id)" class="w-3.5 h-3.5 animate-spin" />
            <Trash2 v-else class="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
            <span>{{ deletingCommentIds.has(comment.diskusi_id) ? 'Menghapus...' : 'Hapus' }}</span>
          </button>

          <button 
            v-if="isLoggedIn && comment.user_id !== currentUser?.id"
            @click="emit('report', comment)"
            class="group/btn flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors"
          >
            <Flag class="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
            <span>Laporkan</span>
          </button>
        </div>

        <!-- Reply Form with Transition -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="isReplyOpen" class="mt-4 p-3 md:p-4 bg-white border-2 border-black shadow-brutal-xs md:shadow-brutal relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-brand-teal"></div>
            <textarea 
              v-model="replyText"
              rows="2"
              placeholder="Tulis balasan..."
              class="w-full p-2 md:p-3 border-2 border-black bg-stone-50 text-stone-900 text-xs md:text-sm resize-none focus:bg-white focus:ring-0 focus:outline-none mb-2 font-body transition-colors placeholder:text-stone-400"
            ></textarea>
            <div class="flex justify-end">
              <Button 
                size="sm" 
                class="bg-brand-teal hover:bg-brand-teal/90 text-white rounded-none border-2 border-black shadow-brutal-xs hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold uppercase tracking-wider h-8 md:h-9" 
                @click="handleReplySubmit" 
                :disabled="!replyText.trim() || isSubmittingReply"
              >
                <Loader2 v-if="isSubmittingReply" class="w-3 h-3 animate-spin mr-2" />
                <Send v-else class="w-3 h-3 mr-2" />
                Kirim Balasan
              </Button>
            </div>
          </div>
        </Transition>

        <!-- Nested Replies -->
        <div v-if="comment.replies && comment.replies.length > 0">
          <CommentItem 
            v-for="reply in comment.replies" 
            :key="reply.diskusi_id"
            :comment="reply"
            :depth="depth + 1"
            :max-depth="maxDepth"
            :is-logged-in="isLoggedIn"
            :current-user="currentUser"
            :can-moderate="canModerate"
            :deleting-comment-ids="deletingCommentIds"
            :film-owner-id="filmOwnerId"
            @reply="$emit('reply', $event)"
            @delete="$emit('delete', $event)"
            @report="$emit('report', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  animation: slide-up 0.4s ease-out forwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
