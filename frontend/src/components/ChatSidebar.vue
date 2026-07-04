<template>
<div class="chat-sidebar-wrapper">
  <!-- Floating AI Chat Button -->
  <button 
    v-if="!isOpen"
    @click="openChat"
    class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-orange text-white border-2 border-stone-900 shadow-brutal flex items-center justify-center hover:-translate-y-1 hover:shadow-brutal-lg transition-all cursor-pointer group rounded-none"
  >
    <Bot class="w-7 h-7 group-hover:animate-bounce" />
  </button>

  <!-- Sidebar Panel -->
  <Transition name="slide">
    <div 
      v-if="isOpen"
      class="fixed top-0 right-0 z-[100] w-full md:w-[450px] lg:w-[500px] h-screen bg-brand-cream border-l-4 border-stone-900 flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,1)]"
    >
      <!-- Header -->
      <div class="h-20 bg-white border-b-4 border-stone-900 flex items-center px-5 shrink-0 justify-between sticky top-0 z-20">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-brand-teal border-2 border-stone-900 shadow-brutal-sm flex items-center justify-center relative">
            <Bot class="w-6 h-6 text-white" />
            <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-stone-900 animate-pulse"></div>
          </div>
          <div>
            <h2 class="text-stone-900 text-xl font-black font-display uppercase tracking-widest leading-none">PF Space.BOT</h2>
            <p class="text-stone-500 font-bold font-body text-xs mt-1">Sistem Pendamping AI Aktif</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Clear History Button -->
          <button 
            @click="clearHistory"
            title="Bersihkan Riwayat"
            class="w-10 h-10 bg-stone-100 hover:bg-brand-red hover:text-white border-2 border-stone-900 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          >
            <Trash2 class="w-5 h-5" />
          </button>
          
          <!-- Close Button -->
          <button 
            @click="isOpen = false"
            class="w-10 h-10 bg-stone-100 hover:bg-stone-300 border-2 border-stone-900 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          >
            <X class="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 bg-[url('/grain.png')] bg-repeat overflow-y-auto p-5 md:p-6 space-y-6" ref="messagesContainer">
        <!-- Session Start -->
        <div class="flex items-center gap-4 py-2">
          <div class="h-1 flex-1 bg-stone-900 border-y border-stone-900"></div>
          <span class="text-stone-900 text-xs font-black font-body uppercase tracking-widest bg-white border-2 border-stone-900 px-3 py-1 shadow-[2px_2px_0_0_#000]">Mulai Sesi</span>
          <div class="h-1 flex-1 bg-stone-900 border-y border-stone-900"></div>
        </div>

        <!-- Initial Greeting -->
        <div class="flex gap-4">
          <div class="w-10 h-10 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-[2px_2px_0_0_#000] flex items-center justify-center">
             <Bot class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-stone-900 text-xs font-black font-body uppercase tracking-wider bg-brand-teal text-white px-2 py-0.5 border-2 border-stone-900">Sistem AI</span>
              <span class="text-stone-500 font-bold text-[10px]">SEKARANG</span>
            </div>
            <div class="bg-white border-2 border-stone-900 shadow-[4px_4px_0_0_#000] p-4 relative">
              <p class="text-stone-900 text-sm font-body font-medium leading-relaxed">
                Halo! Saya asisten AI PF Space. Ada yang bisa saya bantu tentang sejarah film, rekomendasi, arsip pembelajaran, atau teknis pembuatan film hari ini?
              </p>
            </div>
          </div>
        </div>

        <!-- Messages Loop -->
        <div v-for="(msg, index) in messages" :key="index" class="contents">
          <!-- User Message -->
          <div v-if="msg.role === 'user'" class="flex gap-4 justify-end">
            <div class="flex-1 max-w-[85%] md:max-w-[75%]">
              <div class="flex justify-end items-center mb-1.5 gap-2">
                <span class="text-stone-500 font-bold text-[10px]">{{ formatTime(msg.created_at) }}</span>
                <span class="text-white text-xs font-black font-body uppercase tracking-wider bg-stone-900 px-2 py-0.5 border-2 border-stone-900">Anda</span>
              </div>
              <div class="bg-brand-orange border-2 border-stone-900 shadow-[4px_4px_0_0_#000] p-4 relative">
                <p class="text-stone-900 text-sm font-bold font-body leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
              </div>
            </div>
            <div class="w-10 h-10 shrink-0 bg-stone-200 border-2 border-stone-900 shadow-[2px_2px_0_0_#000] flex items-center justify-center">
              <User class="w-5 h-5 text-stone-900" />
            </div>
          </div>

          <!-- AI Message -->
          <div v-else class="flex gap-4">
            <div class="w-10 h-10 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-[2px_2px_0_0_#000] flex items-center justify-center">
               <Bot class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 max-w-[90%] md:max-w-[85%]">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-stone-900 text-xs font-black font-body uppercase tracking-wider bg-white px-2 py-0.5 border-2 border-stone-900">Sistem AI</span>
                <span class="text-stone-500 font-bold text-[10px]">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="bg-white border-2 border-stone-900 shadow-[4px_4px_0_0_#000] p-4 relative prose prose-sm prose-stone prose-a:text-brand-orange prose-a:font-bold max-w-none font-body font-medium leading-relaxed">
                <div v-html="formatMarkdown(msg.content)"></div>
              </div>
            </div>
          </div>
        </div>


        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex gap-4">
          <div class="w-10 h-10 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-[2px_2px_0_0_#000] flex items-center justify-center">
             <Bot class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 max-w-[85%]">
            <div class="flex items-center mb-1.5">
              <span class="text-stone-900 text-xs font-black font-body uppercase tracking-wider bg-white px-2 py-0.5 border-2 border-stone-900">Memproses</span>
            </div>
            <div class="bg-white border-2 border-stone-900 shadow-[4px_4px_0_0_#000] px-5 py-4 flex gap-2 w-fit">
              <div class="w-2.5 h-2.5 bg-brand-orange border border-stone-900 animate-bounce"></div>
              <div class="w-2.5 h-2.5 bg-brand-teal border border-stone-900 animate-bounce" style="animation-delay: 0.15s"></div>
              <div class="w-2.5 h-2.5 bg-brand-red border border-stone-900 animate-bounce" style="animation-delay: 0.3s"></div>
            </div>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="p-4 bg-brand-red border-2 border-stone-900 shadow-[4px_4px_0_0_#000] text-white flex gap-3 items-center">
           <AlertTriangle class="w-6 h-6 shrink-0" />
           <span class="font-bold text-sm">{{ error }}</span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="h-auto bg-stone-100 border-t-4 border-stone-900 p-4 md:p-6 shrink-0 relative z-20">
        <!-- Quick Actions -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
          <button 
            v-for="action in quickActions" 
            :key="action.label"
            @click="setInput(action.text)"
            class="px-3 py-1.5 bg-white font-bold font-body text-xs text-stone-900 border-2 border-stone-900 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer whitespace-nowrap"
          >
            <span class="text-brand-orange mr-1">#</span>{{ action.label }}
          </button>
        </div>

        <!-- Input Box -->
        <div class="relative bg-white border-2 border-stone-900 shadow-brutal flex flex-col focus-within:-translate-y-1 focus-within:shadow-brutal-lg transition-all duration-300">
          <textarea 
            v-model="inputMessage"
            @keydown.enter.prevent="sendMessage"
            placeholder="// Ketik instruksi atau pertanyaan..."
            class="w-full h-16 md:h-20 px-4 py-3 text-sm md:text-base font-body font-bold text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none bg-transparent"
            :disabled="isLoading"
          ></textarea>
          
          <div class="flex items-center justify-between px-3 py-2 bg-stone-50 border-t-2 border-stone-900">
            <div class="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider hidden sm:block">
              [Shift + Enter] baris baru
            </div>
            <div class="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider sm:hidden">
              Tulis Pesan
            </div>
            <button 
              @click="sendMessage"
              :disabled="isLoading || !inputMessage.trim()"
              class="px-4 py-1.5 md:py-2 bg-brand-orange hover:bg-orange-500 border-2 border-stone-900 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_0_#000]"
            >
              <span class="text-stone-900 text-xs md:text-sm font-black font-display uppercase tracking-widest hidden sm:inline-block">Kirim</span>
              <Send class="w-4 h-4 text-stone-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Delete Confirmation Modal -->
  <ConfirmDialog 
    :show="showConfirm"
    @update:show="(val) => showConfirm = val"
    title="Bersihkan Riwayat?"
    message="Tindakan ini akan menghapus keseluruhan jejak riwayat obrolan Anda dengan sistem AI. Ini tidak dapat dikembalikan."
    confirm-label="Hapus Riwayat"
    cancel-label="Batalkan"
    variant="danger"
    :loading="confirmLoading"
    @confirm="handleClearConfirm"
  />
</div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { Bot, User, Send, Trash2, X, AlertTriangle } from 'lucide-vue-next'
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
  { label: 'Rekomendasi Film', text: 'Berikan rekomendasi film Indonesia tahun 2000an yang bertema sosial beserta alasannya.' },
  { label: 'Analisis Teknis', text: 'Jelaskan teknik sinematografi gerak (camera movement) dalam film aksi.' },
  { label: 'Panduan Pra-Produksi', text: 'Bagaimana langkah-langkah membuat naskah dan storyboard yang selaras?' }
]

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight + 100
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatMarkdown = (text) => {
  if (!text) return ''
  // Basic markdown formatting + brutalist flavor
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-stone-900 uppercase font-black tracking-wide">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-stone-700 italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-brand-cream border border-stone-900 px-1 py-0.5 rounded-none font-bold text-sm text-brand-red">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-orange hover:text-stone-900 underline decoration-2 font-bold transition-colors" target="_blank">$1</a>')
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
        historyMessages.push({
          role: 'user',
          content: m.user_prompt,
          created_at: m.created_at
        })
        historyMessages.push({
          role: 'assistant',
          content: m.ai_response,
          created_at: m.created_at
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
    showToast('Seluruh riwayat obrolan AI berhasil disterilkan.')
    showConfirm.value = false
  } catch (err) {
    console.error('Failed to clear history:', err)
    showToast('Gagal menghapus riwayat obrolan.', 'error')
  } finally {
    confirmLoading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  if (!isLoggedIn.value) {
    error.value = 'AKSES DITOLAK: Anda harus masuk (login) untuk memanfaatkan sistem AI.'
    setTimeout(() => error.value = null, 4000)
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
    error.value = err.message || 'Malfungsi sistem saat mengirim data.'
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
  transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  box-shadow: none;
}
</style>
