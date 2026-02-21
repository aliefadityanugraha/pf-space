<template>
  <!-- Floating AI Chat Button -->
  <button 
    v-if="!isOpen"
    @click="openChat"
    class="fixed bottom-6 right-6 z-50 size-14 bg-orange-600 shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8V4H8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 14H4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 14H22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15 13V15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 13V15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  <!-- Sidebar Panel -->
  <Transition name="slide">
    <div 
      v-if="isOpen"
      class="fixed top-0 right-0 z-50 w-[90%] md:w-[500px] h-screen bg-white shadow-[-10px_0px_30px_0px_rgba(0,0,0,0.15)] border-l-4 border-zinc-900 flex flex-col"
    >
      <!-- Header -->
      <div class="h-20 bg-stone-100 border-b-2 border-zinc-900 flex items-center px-6 shrink-0 justify-between">
        <div class="flex items-center">
          <div class="size-12 bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center justify-center relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V4H8" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 8H6C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8Z" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 14H4" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 14H22" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 13V15" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 13V15" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full border border-zinc-900"></div>
          </div>
          <div class="ml-4">
            <div class="text-zinc-900 text-xl font-bold font-['Space_Grotesk']">PF Space.BOT</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Clear History Button -->
          <button 
            @click="clearHistory"
            title="Clear History"
            class="size-10 flex items-center justify-center hover:bg-stone-200 transition-colors cursor-pointer rounded-full"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <button 
            @click="isOpen = false"
            class="size-10 flex items-center justify-center hover:bg-stone-200 transition-colors cursor-pointer rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 bg-stone-100/50 overflow-y-auto p-6 space-y-6" ref="messagesContainer">
        <!-- Session Start -->
        <div class="flex items-center gap-4">
          <div class="h-px flex-1 bg-zinc-900/20"></div>
          <span class="text-zinc-500 text-[10px] font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide">Session Start</span>
          <div class="h-px flex-1 bg-zinc-900/20"></div>
        </div>

        <!-- Initial Greeting -->
        <div class="flex gap-4">
          <div class="size-10 shrink-0 bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 15.8333H16.6667" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3.33301 14.1667L8.33301 9.16667L3.33301 4.16667" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-center mb-2">
              <span class="text-zinc-900 text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide">System</span>
              <span class="text-zinc-500 text-[10px] font-['IBM_Plex_Mono']">NOW</span>
            </div>
            <div class="bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 p-4">
              <p class="text-zinc-900 text-sm font-['IBM_Plex_Mono'] leading-6">Halo! Saya asisten AI PF Space. Ada yang bisa saya bantu tentang film, rekomendasi, atau arsip?</p>
            </div>
          </div>
        </div>

        <!-- Messages Loop -->
        <template v-for="(msg, index) in messages" :key="index">
          <!-- User Message -->
          <div v-if="msg.role === 'user'" class="flex gap-4 justify-end">
            <div class="flex-1 max-w-[350px]">
              <div class="flex justify-end items-center mb-2 gap-2">
                <span class="text-zinc-500 text-[10px] font-['IBM_Plex_Mono']">{{ formatTime(msg.created_at) }}</span>
                <span class="text-zinc-900 text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide">User</span>
              </div>
              <div class="bg-orange-600 shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 p-4">
                <p class="text-white text-sm font-medium font-['IBM_Plex_Mono'] leading-6 whitespace-pre-wrap">{{ msg.content }}</p>
              </div>
            </div>
            <div class="size-10 shrink-0 bg-stone-300 shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] border-2 border-zinc-900 flex items-center justify-center">
              <span class="font-bold text-lg">U</span>
            </div>
          </div>

          <!-- AI Message -->
          <div v-else class="flex gap-4">
            <div class="size-10 shrink-0 bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 15.8333H16.6667" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.33301 14.1667L8.33301 9.16666L3.33301 4.16666" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-2">
                <span class="text-zinc-900 text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide">System</span>
                <span class="text-zinc-500 text-[10px] font-['IBM_Plex_Mono']">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 overflow-hidden">
                <div class="p-4">
                  <div 
                    class="text-zinc-900 text-sm font-['IBM_Plex_Mono'] leading-6 prose prose-sm max-w-none"
                    v-html="formatMarkdown(msg.content)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex gap-4">
          <div class="size-10 shrink-0 bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 15.8333H16.6667" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3.33301 14.1667L8.33301 9.16666L3.33301 4.16666" stroke="#E85D04" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <span class="text-zinc-900 text-xs font-bold font-['IBM_Plex_Mono'] uppercase tracking-wide">System</span>
            <div class="mt-2 bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 px-4 py-3 flex gap-2">
              <div class="size-2 bg-zinc-900 opacity-20 animate-pulse"></div>
              <div class="size-2 bg-zinc-900 opacity-40 animate-pulse" style="animation-delay: 0.2s"></div>
              <div class="size-2 bg-zinc-900 opacity-60 animate-pulse" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>

        <div v-if="error" class="p-3 bg-red-100 border border-red-500 text-red-700 text-sm font-['IBM_Plex_Mono']">
          Error: {{ error }}
        </div>
      </div>

      <!-- Input Area -->
      <div class="h-auto bg-white border-t-2 border-zinc-900 p-5 shrink-0">
        <!-- Quick Actions -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button 
            v-for="action in quickActions" 
            :key="action.label"
            @click="setInput(action.text)"
            class="h-7 px-3 bg-stone-100 outline outline-1 outline-offset-[-1px] outline-zinc-900 whitespace-nowrap hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <span class="text-zinc-900 text-xs font-medium font-['IBM_Plex_Mono']">> {{ action.label }}</span>
          </button>
        </div>

        <!-- Input Box -->
        <div class="relative">
          <div class="absolute left-1 top-1 w-full h-full bg-zinc-900"></div>
          <div class="relative bg-white outline outline-2 outline-offset-[-2px] outline-zinc-900">
            <textarea 
              v-model="inputMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="// Ketik pertanyaan seputar film..."
              class="w-full h-14 px-4 py-3 text-sm font-['IBM_Plex_Mono'] text-zinc-900 placeholder:text-neutral-500 resize-none focus:outline-none"
              :disabled="isLoading"
            ></textarea>
            <div class="flex items-center justify-between px-2 py-2 bg-stone-100/30 border-t border-zinc-900/50">
              <div class="text-xs text-zinc-400 font-['IBM_Plex_Mono']">Shift+Enter untuk baris baru</div>
              <button 
                @click="sendMessage"
                :disabled="isLoading || !inputMessage.trim()"
                class="h-8 px-4 bg-orange-600 shadow-[2px_2px_0px_0px_rgba(24,24,27,1.00)] outline outline-2 outline-offset-[-2px] outline-zinc-900 flex items-center gap-2 hover:bg-orange-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="text-white text-xs font-bold font-['Space_Grotesk'] uppercase tracking-wide">Run</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.2679 10.843C7.2869 10.8904 7.31992 10.9308 7.36254 10.9588C7.40516 10.9868 7.45533 11.0012 7.50632 10.9998C7.55732 10.9985 7.60669 10.9817 7.64782 10.9515C7.68894 10.9213 7.71986 10.8793 7.7364 10.831L10.9864 1.33103C11.0024 1.28672 11.0055 1.23878 10.9952 1.19281C10.985 1.14683 10.9618 1.10472 10.9285 1.07142C10.8952 1.03811 10.8531 1.01498 10.8071 1.00472C10.7612 0.994472 10.7132 0.997526 10.6689 1.01353L1.1689 4.26353C1.12065 4.28008 1.07862 4.31099 1.04844 4.35211C1.01826 4.39324 1.00139 4.44261 1.00008 4.49361C0.998776 4.5446 1.0131 4.59477 1.04113 4.63739C1.06916 4.68001 1.10956 4.71303 1.1569 4.73203L5.1219 6.32203C5.24725 6.37221 5.36113 6.44726 5.45669 6.54264C5.55224 6.63803 5.62749 6.75178 5.6779 6.87703L7.2679 10.843Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10.927 1.07349L5.45703 6.54299" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <ConfirmDialog 
    v-model:show="showConfirm"
    title="Hapus Riwayat Chat"
    message="Apakah Anda yakin ingin menghapus semua riwayat percakapan? Tindakan ini tidak dapat dibatalkan."
    confirm-label="Hapus"
    cancel-label="Batal"
    variant="danger"
    :loading="confirmLoading"
    @confirm="handleClearConfirm"
  /></template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/ConfirmDialog.vue'


const { isLoggedIn } = useAuth()
const { showToast } = useToast()

const isOpen = ref(false)
const showConfirm = ref(false)
const confirmLoading = ref(false)

const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const error = ref(null)
const messagesContainer = ref(null)

const quickActions = [
  { label: 'Rekomendasi Film', text: 'Berikan rekomendasi film Indonesia tahun 2000an yang bertema sosial.' },
  { label: 'Analisis Sinema', text: 'Jelaskan teknik sinematografi dalam film The Raid.' },
  { label: 'Tips Filmmaking', text: 'Bagaimana cara membuat storyboard yang efektif?' }
]

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const formatMarkdown = (text) => {
  if (!text) return ''
  // Basic markdown formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-stone-200 px-1 rounded font-mono text-sm text-red-600">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-orange-600 hover:underline font-bold">$1</a>')
    .replace(/\n/g, '<br>')
}

const setInput = (text) => {
  inputMessage.value = text
}

const fetchHistory = async () => {
  if (!isLoggedIn.value) return
  
  try {
    const res = await api.get('/api/chat/history')
    if (res.success) {
      const historyMessages = []
      res.data.forEach(m => {
        // Each chat history item has both user_prompt and ai_response
        historyMessages.push({
          role: 'user',
          content: m.user_prompt,
          created_at: m.created_at
        })
        historyMessages.push({
          role: 'assistant',
          content: m.ai_response,
          created_at: m.created_at // Use same time for now
        })
      })
      messages.value = historyMessages
      scrollToBottom()
    }
  } catch (err) {
    console.error('Failed to fetch chat history:', err)
  }
}

const clearHistory = () => {
  showConfirm.value = true
}

const handleClearConfirm = async () => {
  confirmLoading.value = true
  error.value = null
  
  try {
    const res = await api.delete('/api/chat/history')
    if (res && res.success === false) {
      throw new Error(res.message || 'Gagal menghapus riwayat')
    }
    
    messages.value = []
    showToast('Riwayat chat berhasil dihapus')
    showConfirm.value = false
  } catch (err) {
    console.error('Failed to clear history:', err)
    showToast('Gagal menghapus riwayat chat', 'error')
  } finally {
    confirmLoading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  if (!isLoggedIn.value) {
    error.value = 'Silakan login untuk menggunakan chat AI.'
    setTimeout(() => error.value = null, 3000)
    return
  }

  const content = inputMessage.value.trim()
  inputMessage.value = ''
  error.value = null
  
  // Optimistic update
  messages.value.push({
    role: 'user',
    content: content,
    created_at: new Date().toISOString()
  })
  scrollToBottom()
  
  isLoading.value = true
  
  try {
    const res = await api.post('/api/chat', { message: content })
    
    if (res.success) {
      messages.value.push({
        role: 'assistant',
        content: res.data.ai_response,
        created_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('Chat error:', err)
    error.value = err.message || 'Gagal mengirim pesan'
    // Remove user message if failed? Or keep it with error?
    // For now, keep it.
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const openChat = () => {
  isOpen.value = true
  if (messages.value.length === 0) {
    fetchHistory()
  }
}

// Watch for auth changes
watch(isLoggedIn, (newVal) => {
  if (newVal && isOpen.value) {
    fetchHistory()
  } else if (!newVal) {
    messages.value = []
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
