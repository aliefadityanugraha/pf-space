<template>
  <div class="chat-sidebar-wrapper">
    <!-- Floating AI Chat Button -->
    <button
      v-if="!isOpen"
      @click="openChat"
      aria-label="Buka Asisten AI"
      class="fixed bottom-5 right-5 z-50 w-12 h-12 md:w-14 md:h-14 bg-brand-orange text-stone-900 border-2 border-stone-900 shadow-brutal flex items-center justify-center hover:-translate-y-1 hover:shadow-brutal-lg transition-all cursor-pointer group rounded-none"
    >
      <Bot class="w-6 h-6 md:w-7 md:h-7 group-hover:animate-bounce" />
    </button>

    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[95] bg-stone-900/50 backdrop-blur-xs"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Sidebar Panel -->
    <Transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 right-0 z-[100] w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-[100dvh] bg-brand-cream border-l-2 sm:border-l-4 border-stone-900 flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,1)] font-body"
      >
        <!-- Header -->
        <div
          class="h-16 md:h-18 bg-white border-b-2 md:border-b-4 border-stone-900 flex items-center px-4 md:px-5 shrink-0 justify-between sticky top-0 z-20"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-9 h-9 md:w-10 md:h-10 bg-brand-teal border-2 border-stone-900 shadow-brutal-xs flex items-center justify-center shrink-0 relative"
            >
              <Bot class="w-5 h-5 text-white" />
              <div
                class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-stone-900 animate-pulse"
              ></div>
            </div>
            <div class="min-w-0">
              <h2
                class="text-stone-900 text-sm md:text-base font-black font-display uppercase tracking-widest leading-tight truncate"
              >
                PF Space.BOT
              </h2>
              <p
                class="text-stone-500 font-bold text-[10px] md:text-xs truncate"
              >
                Asisten AI Sinematik
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Clear History Button -->
            <button
              @click="clearHistory"
              title="Bersihkan Riwayat"
              aria-label="Bersihkan Riwayat Chat"
              class="w-8 h-8 md:w-9 md:h-9 bg-stone-100 hover:bg-brand-red hover:text-white border-2 border-stone-900 shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>

            <!-- Close Button -->
            <button
              @click="isOpen = false"
              aria-label="Tutup Asisten AI"
              class="w-8 h-8 md:w-9 md:h-9 bg-stone-100 hover:bg-stone-300 border-2 border-stone-900 shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer"
            >
              <X class="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        <!-- Chat Messages Area -->
        <div
          class="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 scrollbar-none"
          ref="messagesContainer"
        >
          <!-- Session Start -->
          <div class="flex items-center gap-3 py-1">
            <div class="h-0.5 flex-1 bg-stone-900"></div>
            <span
              class="text-stone-900 text-[10px] md:text-xs font-black uppercase tracking-widest bg-white border border-stone-900 px-2.5 py-0.5 shadow-brutal-xs"
            >
              Mulai Sesi
            </span>
            <div class="h-0.5 flex-1 bg-stone-900"></div>
          </div>

          <!-- Initial Greeting -->
          <div class="flex gap-3">
            <div
              class="w-8 h-8 md:w-9 md:h-9 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-brutal-xs flex items-center justify-center"
            >
              <Bot class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1 gap-2">
                <span
                  class="text-stone-900 text-[10px] font-black uppercase tracking-wider bg-brand-teal text-white px-1.5 py-0.5 border border-stone-900"
                >
                  Sistem AI
                </span>
                <span class="text-stone-400 font-bold text-[9px]"
                  >SEKARANG</span
                >
              </div>
              <div
                class="bg-white border-2 border-stone-900 shadow-brutal-xs p-3.5 relative"
              >
                <p
                  class="text-stone-900 text-xs md:text-sm font-medium leading-relaxed"
                >
                  Halo! Saya asisten AI PF Space. Ada yang bisa saya bantu
                  tentang sinematografi, analisis film, naskah, atau materi
                  pembelajaran?
                </p>
              </div>
            </div>
          </div>

          <!-- Messages Loop -->
          <div v-for="(msg, index) in messages" :key="index" class="contents">
            <!-- User Message -->
            <div v-if="msg.role === 'user'" class="flex gap-3 justify-end">
              <div class="flex-1 max-w-[88%] sm:max-w-[82%]">
                <div class="flex justify-end items-center mb-1 gap-2">
                  <span class="text-stone-400 font-bold text-[9px]">{{
                    formatTime(msg.created_at)
                  }}</span>
                  <span
                    class="text-white text-[10px] font-black uppercase tracking-wider bg-stone-900 px-1.5 py-0.5 border border-stone-900"
                  >
                    Anda
                  </span>
                </div>
                <div
                  class="bg-brand-orange border-2 border-stone-900 shadow-brutal-xs p-3.5 relative"
                >
                  <p
                    class="text-stone-900 text-xs md:text-sm font-bold leading-relaxed whitespace-pre-wrap"
                  >
                    {{ msg.content }}
                  </p>
                </div>
              </div>
              <div
                class="w-8 h-8 md:w-9 md:h-9 shrink-0 bg-stone-200 border-2 border-stone-900 shadow-brutal-xs flex items-center justify-center"
              >
                <User class="w-4 h-4 text-stone-900" />
              </div>
            </div>

            <!-- AI Message -->
            <div v-else class="flex gap-3">
              <div
                class="w-8 h-8 md:w-9 md:h-9 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-brutal-xs flex items-center justify-center"
              >
                <Bot class="w-4 h-4 text-white" />
              </div>
              <div class="flex-1 max-w-[92%] sm:max-w-[88%] min-w-0">
                <div class="flex justify-between items-center mb-1 gap-2">
                  <span
                    class="text-stone-900 text-[10px] font-black uppercase tracking-wider bg-white px-1.5 py-0.5 border border-stone-900"
                  >
                    Sistem AI
                  </span>
                  <span class="text-stone-400 font-bold text-[9px]">{{
                    formatTime(msg.created_at)
                  }}</span>
                </div>
                <div
                  class="bg-white border-2 border-stone-900 shadow-brutal-xs p-3.5 relative prose prose-xs md:prose-sm prose-stone prose-a:text-brand-orange prose-a:font-bold max-w-none font-medium leading-relaxed break-words"
                >
                  <div v-html="formatMarkdown(msg.content)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex gap-3">
            <div
              class="w-8 h-8 md:w-9 md:h-9 shrink-0 bg-brand-teal border-2 border-stone-900 shadow-brutal-xs flex items-center justify-center"
            >
              <Bot class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 max-w-[85%]">
              <div class="flex items-center mb-1">
                <span
                  class="text-stone-900 text-[10px] font-black uppercase tracking-wider bg-white px-1.5 py-0.5 border border-stone-900"
                >
                  Memproses
                </span>
              </div>
              <div
                class="bg-white border-2 border-stone-900 shadow-brutal-xs px-4 py-3 flex gap-2 w-fit"
              >
                <div
                  class="w-2 h-2 bg-brand-orange border border-stone-900 animate-bounce"
                ></div>
                <div
                  class="w-2 h-2 bg-brand-teal border border-stone-900 animate-bounce"
                  style="animation-delay: 0.15s"
                ></div>
                <div
                  class="w-2 h-2 bg-brand-red border border-stone-900 animate-bounce"
                  style="animation-delay: 0.3s"
                ></div>
              </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            v-if="error"
            class="p-3 bg-red-100 border-2 border-red-500 shadow-brutal-xs text-red-900 flex gap-2.5 items-center"
          >
            <AlertTriangle class="w-5 h-5 shrink-0 text-red-600" />
            <span class="font-bold text-xs leading-snug">{{ error }}</span>
          </div>
        </div>

        <!-- Input Area -->
        <div
          class="bg-stone-100 border-t-2 md:border-t-4 border-stone-900 p-3 md:p-4 shrink-0 relative z-20"
        >
          <!-- Quick Actions -->
          <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              v-for="action in quickActions"
              :key="action.label"
              @click="setInput(action.text)"
              class="px-2.5 py-1 bg-white font-bold text-[11px] text-stone-900 border border-stone-900 hover:-translate-y-0.5 hover:shadow-brutal-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span class="text-brand-orange mr-1">#</span>{{ action.label }}
            </button>
          </div>

          <!-- Input Box -->
          <div
            class="bg-white border-2 border-stone-900 shadow-brutal-xs flex flex-col focus-within:-translate-y-0.5 focus-within:shadow-brutal-sm transition-all duration-200"
          >
            <textarea
              v-model="inputMessage"
              @keydown.enter.exact.prevent="sendMessage"
              placeholder="Tulis pertanyaan atau perintah ke AI..."
              rows="2"
              class="w-full px-3 py-2 text-xs md:text-sm font-bold text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none bg-transparent"
              :disabled="isLoading"
            ></textarea>

            <div
              class="flex items-center justify-between px-2.5 py-1.5 bg-stone-50 border-t border-stone-900"
            >
              <div
                class="text-[10px] text-stone-400 font-bold uppercase tracking-wider hidden sm:block"
              >
                [Shift + Enter] baris baru
              </div>
              <div
                class="text-[10px] text-stone-400 font-bold uppercase tracking-wider sm:hidden"
              >
                Pesan
              </div>
              <button
                @click="sendMessage"
                :disabled="isLoading || !inputMessage.trim()"
                class="px-3 py-1 md:py-1.5 bg-brand-orange hover:bg-orange-500 border border-stone-900 shadow-brutal-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span
                  class="text-stone-900 text-xs font-black font-display uppercase tracking-widest hidden sm:inline-block"
                  >Kirim</span
                >
                <Send class="w-3.5 h-3.5 text-stone-900" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      :show="showConfirm"
      @update:show="(val) => (showConfirm = val)"
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
import { ref, nextTick, watch } from "vue";
import { Bot, User, Send, Trash2, X, AlertTriangle } from "lucide-vue-next";
import { api } from "@/lib/api";
import { useAuth } from "@/composables/useAuth";
import { useToast } from "@/composables/useToast";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const { isLoggedIn } = useAuth();
const { showToast } = useToast();

const isOpen = ref(false);
const showConfirm = ref(false);
const confirmLoading = ref(false);

const inputMessage = ref("");
const messages = ref([]);
const isLoading = ref(false);
const error = ref(null);
const messagesContainer = ref(null);

const quickActions = [
  {
    label: "Rekomendasi Film",
    text: "Berikan rekomendasi film Indonesia tahun 2000an yang bertema sosial beserta alasannya.",
  },
  {
    label: "Analisis Teknis",
    text: "Jelaskan teknik sinematografi gerak (camera movement) dalam film aksi.",
  },
  {
    label: "Panduan Pra-Produksi",
    text: "Bagaimana langkah-langkah membuat naskah dan storyboard yang selaras?",
  },
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop =
      messagesContainer.value.scrollHeight + 100;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr)
    return new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-stone-900 uppercase font-black tracking-wide">$1</strong>',
    )
    .replace(/\*(.*?)\*/g, '<em class="text-stone-700 italic">$1</em>')
    .replace(
      /`(.*?)`/g,
      '<code class="bg-stone-100 border border-stone-900 px-1 py-0.5 font-mono text-xs text-brand-red">$1</code>',
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-brand-orange hover:text-stone-900 underline font-bold transition-colors" target="_blank">$1</a>',
    )
    .replace(/\n/g, "<br>");
};

const setInput = (text) => {
  inputMessage.value = text;
};

const fetchHistory = async () => {
  if (!isLoggedIn.value) return;

  try {
    const res = await api.get("/api/chat/history");
    if (res.success) {
      const historyMessages = [];
      res.data.forEach((m) => {
        historyMessages.push({
          role: "user",
          content: m.user_prompt,
          created_at: m.created_at,
        });
        historyMessages.push({
          role: "assistant",
          content: m.ai_response,
          created_at: m.created_at,
        });
      });
      messages.value = historyMessages;
      scrollToBottom();
    }
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
  }
};

const clearHistory = () => {
  showConfirm.value = true;
};

const handleClearConfirm = async () => {
  confirmLoading.value = true;
  error.value = null;

  try {
    const res = await api.delete("/api/chat/history");
    if (res && res.success === false) {
      throw new Error(res.message || "Gagal menghapus riwayat");
    }

    messages.value = [];
    showToast("Seluruh riwayat obrolan AI berhasil disterilkan.");
    showConfirm.value = false;
  } catch (err) {
    console.error("Failed to clear history:", err);
    showToast("Gagal menghapus riwayat obrolan.", "error");
  } finally {
    confirmLoading.value = false;
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  if (!isLoggedIn.value) {
    error.value =
      "AKSES DITOLAK: Anda harus masuk (login) untuk memanfaatkan sistem AI.";
    setTimeout(() => (error.value = null), 4000);
    return;
  }

  const content = inputMessage.value.trim();
  inputMessage.value = "";
  error.value = null;

  messages.value.push({
    role: "user",
    content: content,
    created_at: new Date().toISOString(),
  });
  scrollToBottom();

  isLoading.value = true;

  try {
    const res = await api.post("/api/chat", { message: content });

    if (res.success) {
      messages.value.push({
        role: "assistant",
        content: res.data.ai_response,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Chat error:", err);
    error.value = err.message || "Malfungsi sistem saat mengirim data.";
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const openChat = () => {
  isOpen.value = true;
  if (messages.value.length === 0) {
    fetchHistory();
  }
};

watch(isLoggedIn, (newVal) => {
  if (newVal && isOpen.value) {
    fetchHistory();
  } else if (!newVal) {
    messages.value = [];
  }
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
