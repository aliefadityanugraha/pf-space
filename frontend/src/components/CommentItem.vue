<script setup>
import { ref, computed } from 'vue'
import { MessageCircle, Trash2, CornerDownRight, Loader2, Send } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'

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
  }
})

const emit = defineEmits(['reply', 'delete'])

const isReplyOpen = ref(false)
const replyText = ref('')
const isSubmittingReply = ref(false)

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
  
  // If IDs match, it's the owner
  const isOwner = props.currentUser.id && props.comment.user_id && props.currentUser.id === props.comment.user_id;
  
  // Or if the user has moderation privileges
  return !!(isOwner || props.canModerate);
})
</script>

<template>
  <div class="comment-item relative" :class="depth > 0 ? 'mt-4 ml-6 md:ml-10' : 'mt-6 border-b-2 border-stone-200 pb-6 last:border-0'">
    <!-- Reply Line for nested items -->
    <div v-if="depth > 0" class="absolute -left-6 md:-left-10 top-0 bottom-0 border-l-2 border-stone-300">
      <div class="absolute top-5 left-0 w-4 md:w-8 border-t-2 border-stone-300"></div>
    </div>

    <div class="flex gap-3">
      <!-- Avatar -->
      <div 
        class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-stone-800 shadow-brutal-sm flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0"
        :class="depth % 2 === 0 ? 'bg-brand-orange' : 'bg-brand-teal text-white'"
      >
        {{ comment.user?.name?.charAt(0) || 'U' }}
      </div>

      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center flex-wrap gap-2 mb-1">
          <span class="font-bold text-sm text-stone-900 capitalize">{{ comment.user?.name || 'Unknown User' }}</span>
          <span class="text-[10px] md:text-xs text-stone-500 font-mono">{{ formatDate(comment.created_at, true) }}</span>
          <Badge v-if="depth > 0" variant="outline" class="text-[8px] h-4 py-0 bg-stone-100 italic">Level {{ depth }}</Badge>
        </div>

        <!-- Body -->
        <p class="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mb-3">{{ comment.isi_pesan }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <button 
            v-if="isLoggedIn && depth < maxDepth"
            @click="isReplyOpen = !isReplyOpen"
            class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-brand-teal transition-colors"
          >
            <CornerDownRight class="w-3.5 h-3.5" />
            {{ isReplyOpen ? 'Batal' : 'Balas' }}
          </button>
          
          <button 
            v-if="canDelete"
            @click="emit('delete', comment.diskusi_id)"
            class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-brand-red transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>

        <!-- Reply Form with Transition -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="isReplyOpen" class="mt-4 p-4 bg-stone-100 border-l-4 border-brand-teal shadow-brutal-sm">
            <textarea 
              v-model="replyText"
              rows="2"
              placeholder="Tulis balasan..."
              class="w-full p-2 border-2 border-stone-800 bg-white text-sm resize-none focus:ring-0 focus:outline-none mb-2 font-body"
            ></textarea>
            <div class="flex justify-end">
              <Button size="sm" class="shadow-brutal-xs" @click="handleReplySubmit" :disabled="!replyText.trim() || isSubmittingReply">
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
            @reply="$emit('reply', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
