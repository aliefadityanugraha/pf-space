<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import AdminSidebar from '@/components/SidebarAdmin.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User as UserIcon
} from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const sidebarCollapsed = ref(false)

const discussions = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const deleting = ref(false)

// View replies modal
const showRepliesModal = ref(false)
const selectedDiscussion = ref(null)
const replies = ref([])
const loadingReplies = ref(false)

const formData = ref({
  title: '',
  description: ''
})

// Toast state
const { toast, showToast } = useToast()

// Confirm dialog state
const showConfirm = ref(false)
const confirmData = ref({ title: '', message: '', onConfirm: null })
const discussionToDelete = ref(null)

const fetchDiscussions = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/community')
    discussions.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch discussions:', error)
    showToast('error', 'Gagal memuat diskusi')
  } finally {
    loading.value = false
  }
}

const openForm = (discussion = null) => {
  if (discussion) {
    editingId.value = discussion.discussion_id
    formData.value = {
      title: discussion.title,
      description: discussion.description || ''
    }
  } else {
    editingId.value = null
    formData.value = {
      title: '',
      description: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  formData.value = {
    title: '',
    description: ''
  }
}

const saveDiscussion = async () => {
  if (!formData.value.title.trim()) {
    showToast('error', 'Judul diskusi harus diisi')
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      // Update
      await api.put(`/api/community/${editingId.value}`, formData.value)
      showToast('success', 'Diskusi berhasil diperbarui')
    } else {
      // Create
      await api.post('/api/community', formData.value)
      showToast('success', 'Diskusi berhasil dibuat')
    }
    
    await fetchDiscussions()
    closeForm()
  } catch (error) {
    console.error('Failed to save discussion:', error)
    showToast('error', 'Gagal menyimpan diskusi')
  } finally {
    saving.value = false
  }
}

const toggleDiscussion = async (discussionId, isActive) => {
  try {
    await api.patch(`/api/community/${discussionId}/toggle`, {
      is_active: !isActive
    })
    showToast('success', `Diskusi berhasil ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
    await fetchDiscussions()
  } catch (error) {
    console.error('Failed to toggle discussion:', error)
    showToast('error', 'Gagal mengubah status diskusi')
  }
}

const confirmDelete = (discussion) => {
  discussionToDelete.value = discussion
  confirmData.value = {
    title: 'Hapus Diskusi',
    message: `Apakah Anda yakin ingin menghapus diskusi "${discussion.title}"? Semua balasan akan ikut terhapus.`
  }
  showConfirm.value = true
}

const executeDelete = async () => {
  if (!discussionToDelete.value) return
  
  deleting.value = true
  try {
    await api.delete(`/api/community/${discussionToDelete.value.discussion_id}`)
    showToast('success', 'Diskusi berhasil dihapus')
    await fetchDiscussions()
  } catch (error) {
    console.error('Failed to delete discussion:', error)
    showToast('error', 'Gagal menghapus diskusi')
  } finally {
    deleting.value = false
    showConfirm.value = false
    discussionToDelete.value = null
  }
}

const formatTime = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale })
  } catch {
    return 'baru saja'
  }
}

const viewReplies = async (discussion) => {
  selectedDiscussion.value = discussion
  showRepliesModal.value = true
  loadingReplies.value = true
  
  try {
    const res = await api.get(`/api/community/${discussion.discussion_id}/replies`)
    replies.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch replies:', error)
    showToast('error', 'Gagal memuat balasan')
    replies.value = []
  } finally {
    loadingReplies.value = false
  }
}

const closeRepliesModal = () => {
  showRepliesModal.value = false
  selectedDiscussion.value = null
  replies.value = []
}

const deleteReplyFromModal = async (replyId) => {
  if (!confirm('Hapus balasan ini?')) return

  try {
    await api.delete(`/api/community/replies/${replyId}/moderate`)
    showToast('success', 'Balasan berhasil dihapus')
    replies.value = replies.value.filter(r => r.reply_id !== replyId)
    
    // Update reply count in the list
    const discussion = discussions.value.find(d => d.discussion_id === selectedDiscussion.value.discussion_id)
    if (discussion) {
      discussion.reply_count = Math.max(0, (discussion.reply_count || 0) - 1)
    }
  } catch (error) {
    console.error('Failed to delete reply:', error)
    showToast('error', 'Gagal menghapus balasan')
  }
}

onMounted(() => {
  fetchDiscussions()
})
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <AdminSidebar @update:collapsed="sidebarCollapsed = $event" />
    
    <main :class="['p-4 md:p-8 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-4">
        <a href="/" class="text-brand-teal hover:underline">Home</a>
        <span class="text-stone-400">/</span>
        <span class="text-stone-600">Administration</span>
        <span class="text-stone-400">/</span>
        <Badge variant="outline" class="bg-orange-100 text-orange-700 border-orange-300">Community</Badge>
      </nav>

      <!-- Header -->
      <PageHeader 
        title="Diskusi Komunitas" 
        description="Kelola topik diskusi umum untuk komunitas"
        :icon="MessageCircle"
        icon-color="bg-teal-500"
      >
        <template #actions>
          <Button @click="openForm()" class="gap-2">
            <Plus class="w-4 h-4" />
            Buat Diskusi Baru
          </Button>
        </template>
      </PageHeader>

      <!-- Info Card -->
      <Card class="mb-6 border-2 border-blue-300 bg-blue-50">
        <CardContent class="p-4">
          <p class="text-sm text-blue-900">
            <strong>Catatan:</strong> Hanya satu diskusi yang bisa aktif dalam satu waktu. 
            Diskusi aktif akan ditampilkan di halaman utama dan semua user bisa memberikan balasan.
          </p>
        </CardContent>
      </Card>

      <!-- Form Modal -->
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeForm"></div>
        <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-2xl mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100">
            <h2 class="font-bold text-lg">{{ editingId ? 'Edit Diskusi' : 'Buat Diskusi Baru' }}</h2>
            <button @click="closeForm" class="p-1 hover:bg-stone-200">
              <XCircle class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="saveDiscussion" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold mb-2">Judul Diskusi *</label>
              <Input
                v-model="formData.title"
                placeholder="Contoh: Apa Karya favorit kalian tahun ini?"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Deskripsi (Opsional)</label>
              <Textarea
                v-model="formData.description"
                placeholder="Tambahkan konteks atau pertanyaan lebih detail..."
                class="min-h-[100px] resize-none"
              />
            </div>
            <div class="flex gap-3 pt-4">
              <Button type="button" variant="outline" class="flex-1" @click="closeForm">Batal</Button>
              <Button type="submit" class="flex-1 gap-2" :disabled="saving">
                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckCircle v-else class="w-4 h-4" />
                {{ editingId ? 'Update' : 'Buat' }} Diskusi
              </Button>
            </div>
          </form>
        </div>
      </div>

      <!-- Discussions List -->
      <Card>
        <CardHeader class="bg-teal-50 border-b-2 border-stone-800">
          <div class="flex items-center gap-3">
            <MessageCircle class="w-5 h-5" />
            <CardTitle class="text-lg font-bold uppercase">Daftar Diskusi</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
          </div>

          <!-- Empty -->
          <div v-else-if="discussions.length === 0" class="text-center py-12 text-stone-400">
            <MessageCircle class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada diskusi komunitas</p>
          </div>

          <!-- Table -->
          <template v-else>
            <div 
              v-for="discussion in discussions" 
              :key="discussion.discussion_id" 
              class="px-6 py-4 border-b border-stone-200 hover:bg-stone-50"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-bold text-stone-900">{{ discussion.title }}</h3>
                    <Badge
                      :variant="discussion.is_active ? 'default' : 'secondary'"
                      :class="discussion.is_active ? 'bg-green-100 text-green-700' : ''"
                    >
                      {{ discussion.is_active ? 'Aktif' : 'Nonaktif' }}
                    </Badge>
                  </div>
                  
                  <p v-if="discussion.description" class="text-stone-600 text-sm mb-3">
                    {{ discussion.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-stone-500">
                    <span>Dibuat oleh {{ discussion.creator?.name }}</span>
                    <span>•</span>
                    <span>{{ formatTime(discussion.created_at) }}</span>
                    <span>•</span>
                    <button 
                      @click="viewReplies(discussion)"
                      class="text-brand-teal hover:underline font-medium"
                    >
                      {{ discussion.reply_count || 0 }} balasan
                    </button>
                  </div>
                </div>

                <div class="flex gap-2">
                  <Button
                    @click="toggleDiscussion(discussion.discussion_id, discussion.is_active)"
                    size="sm"
                    variant="outline"
                    :title="discussion.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                  >
                    <Eye v-if="!discussion.is_active" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </Button>

                  <Button
                    @click="openForm(discussion)"
                    size="sm"
                    variant="outline"
                    title="Edit"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>

                  <Button
                    @click="confirmDelete(discussion)"
                    size="sm"
                    variant="outline"
                    class="text-red-600 hover:bg-red-50"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </template>
        </CardContent>
      </Card>
    </main>

    <!-- Confirm Delete Dialog -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showConfirm = false"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 px-6 py-4 border-b-2 border-black bg-red-50">
          <AlertTriangle class="w-5 h-5 text-red-600" />
          <h2 class="font-bold text-lg text-red-800">{{ confirmData.title }}</h2>
        </div>
        <div class="p-6">
          <p class="text-stone-600 mb-6">{{ confirmData.message }}</p>
          <div class="flex gap-3">
            <Button type="button" variant="outline" class="flex-1" @click="showConfirm = false" :disabled="deleting">
              Batal
            </Button>
            <Button type="button" class="flex-1 gap-2 bg-red-600 hover:bg-red-700" @click="executeDelete" :disabled="deleting">
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
              <Trash2 v-else class="w-4 h-4" />
              Hapus
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast 
      :show="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />

    <!-- Replies Modal -->
    <div v-if="showRepliesModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeRepliesModal"></div>
      <div class="relative bg-white border-2 border-black shadow-brutal w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-stone-100">
          <div>
            <h2 class="font-bold text-lg">Balasan Diskusi</h2>
            <p class="text-sm text-stone-600 mt-1">{{ selectedDiscussion?.title }}</p>
          </div>
          <button @click="closeRepliesModal" class="p-1 hover:bg-stone-200">
            <XCircle class="w-5 h-5" />
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading -->
          <div v-if="loadingReplies" class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
          </div>

          <!-- Empty -->
          <div v-else-if="replies.length === 0" class="text-center py-12 text-stone-400">
            <MessageCircle class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada balasan</p>
          </div>

          <!-- Replies List -->
          <div v-else class="space-y-4">
            <div 
              v-for="reply in replies" 
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
                  <Button
                    @click="deleteReplyFromModal(reply.reply_id)"
                    size="sm"
                    variant="outline"
                    class="text-red-600 hover:bg-red-50"
                    title="Hapus balasan"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
                <p class="text-stone-700 text-sm whitespace-pre-wrap break-words">{{ reply.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t-2 border-black p-4 bg-stone-50">
          <Button @click="closeRepliesModal" variant="outline" class="w-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

