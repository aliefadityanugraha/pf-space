<script setup>
import { ref, watch } from 'vue'
import { Flag, Loader2, X, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  targetType: {
    type: String,
    required: true, // 'film', 'comment', 'discussion', 'reply', 'material'
    validator: (v) => ['film', 'comment', 'discussion', 'reply', 'material'].includes(v)
  },
  targetId: {
    type: [Number, String],
    required: true
  },
  targetName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:show', 'success'])
const { showToast } = useToast()

const reason = ref('')
const description = ref('')
const submitting = ref(false)

const reasons = [
  { value: 'spam', label: 'Spam, iklan tidak relevan' },
  { value: 'harassment', label: 'Pelecehan, ujaran kebencian' },
  { value: 'inappropriate', label: 'Konten tidak pantas, vulgar' },
  { value: 'copyright', label: 'Pelanggaran hak cipta' },
  { value: 'other', label: 'Lainnya (jelaskan di bawah)' }
]

const close = () => {
  if (submitting.value) return
  emit('update:show', false)
  // Reset form
  reason.value = ''
  description.value = ''
}

const handleSubmit = async () => {
  if (!reason.value) {
    showToast('Pilih alasan pelaporan', 'error')
    return
  }

  submitting.value = true
  try {
    const res = await api.post('/api/reports', {
      target_type: props.targetType,
      target_id: props.targetId,
      reason: reason.value,
      description: description.value
    })

    if (res.success) {
      showToast('Laporan Anda telah dikirim. Terima kasih.')
      emit('success')
      close()
    }
  } catch (err) {
    showToast(err.message || 'Gagal mengirim laporan', 'error')
  } finally {
    submitting.value = false
  }
}

// Reset when target changed
watch(() => props.targetId, () => {
  reason.value = ''
  description.value = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>
        
        <!-- Dialog -->
        <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-4 border-b-2 border-black bg-stone-50">
            <Flag class="w-5 h-5 text-red-600" />
            <h2 class="font-bold text-lg flex-1 text-stone-900">
              Laporkan Konten
            </h2>
            <button @click="close" class="p-1 hover:bg-stone-200 transition-colors rounded">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6">
            <div class="mb-4 bg-red-50 border border-red-100 p-3 flex gap-3">
              <AlertCircle class="w-5 h-5 text-red-600 shrink-0" />
              <div class="text-xs text-red-800 leading-relaxed">
                Anda melaporkan: <span class="font-bold">{{ targetName || 'Karya/Komentar ini' }}</span>
                <p class="mt-1">Laporan yang disalahgunakan dapat berakibat pada pembatasan akun Anda.</p>
              </div>
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="space-y-3 mb-6">
                <label class="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Alasan Pelaporan</label>
                <div v-for="r in reasons" :key="r.value" class="flex items-center">
                  <input 
                    type="radio" 
                    :id="'reason-' + r.value" 
                    v-model="reason" 
                    :value="r.value"
                    name="report_reason"
                    class="w-4 h-4 border-2 border-black text-red-600 focus:ring-red-600 focus:ring-offset-0"
                  />
                  <label :for="'reason-' + r.value" class="ml-3 text-sm font-medium text-stone-700 cursor-pointer select-none">
                    {{ r.label }}
                  </label>
                </div>
              </div>

              <div class="mb-6">
                <label 
                  for="report-desc" 
                  class="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2"
                >
                  Detail Tambahan (Opsional)
                </label>
                <textarea 
                  id="report-desc"
                  v-model="description"
                  rows="3"
                  class="w-full p-3 border-2 border-black focus:outline-none focus:ring-0 text-sm placeholder:text-stone-300"
                  placeholder="Berikan info lebih lanjut untuk membantu admin meninjau..."
                ></textarea>
              </div>
              
              <!-- Actions -->
              <div class="flex gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  class="flex-1 border-2 border-black" 
                  @click="close" 
                  :disabled="submitting"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  class="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all" 
                  :disabled="submitting"
                >
                  <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                  Kirim Laporan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.shadow-brutal-sm {
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
}
.shadow-brutal {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}
</style>
