<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  Upload, X, Plus, ChevronLeft, ChevronRight, Loader2, CloudUpload,
  AlertCircle, Save, Send, Image as ImageIcon, Film, FileText, Eye, Trash2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useProductionFeedEditor } from '@/modules/production-feed/useProductionFeedEditor'
import { TIPE_OPTIONS, VISIBILITY_OPTIONS } from '@/modules/production-feed/editor'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  mode: {
    type: String,
    default: 'create', // 'create' | 'edit'
    validator: (value) => ['create', 'edit'].includes(value)
  },
  postId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['saved', 'published', 'deleted', 'cancel'])

const {
  form,
  currentStatus,
  isEdit,
  categories,
  tags,
  films,
  lookupsLoading,
  isLoading,
  loadError,
  formError,
  errors,
  submitting,
  uploading,
  uploadProgress,
  activeUpload,
  submitAction,
  isDirty,
  canSubmit,
  initEdit,
  loadLookups,
  addTags,
  removeTag,
  moveMedia,
  removeMedia,
  selectFile,
  startActiveUpload,
  cancelActiveUpload,
  saveDraft,
  publish,
  deletePost
} = useProductionFeedEditor({ mode: props.mode })

const newTagInput = ref('')
const mediaName = (path) => String(path || '').split('/').pop()

// --- Unsaved changes guard ---
const showLeaveConfirm = ref(false)
let pendingLeave = null

const handleBeforeUnload = (e) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  if (props.mode === 'edit' && props.postId) {
    initEdit(props.postId)
  } else {
    loadLookups()
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave((to, from, next) => {
  if (!isDirty.value) return next()
  showLeaveConfirm.value = true
  pendingLeave = next
})

const leaveConfirmed = () => {
  const next = pendingLeave
  pendingLeave = null
  showLeaveConfirm.value = false
  if (next) next()
}

const leaveCancelled = () => {
  const next = pendingLeave
  pendingLeave = null
  showLeaveConfirm.value = false
  if (next) next(false)
}

// --- Submit handlers ---
const showDeleteConfirm = ref(false)

const handleSaveDraft = async () => {
  const post = await saveDraft()
  if (post) emit('saved', post)
}

const handlePublish = async () => {
  const post = await publish()
  if (post) emit('published', post)
}

const handleDeletePost = async () => {
  const success = await deletePost()
  if (success) {
    showDeleteConfirm.value = false
    emit('deleted')
  }
}

const handleAddTag = () => {
  addTags(newTagInput.value)
  newTagInput.value = ''
}

const addSuggestedTag = (name) => {
  addTags(name)
}

const suggestedTags = computed(() => {
  const q = newTagInput.value.trim().toLowerCase()
  const used = new Set(form.value.tags.map((t) => t.toLowerCase()))
  return (Array.isArray(tags.value) ? tags.value : [])
    .map((tag) => tag?.nama_tag || tag?.name || '')
    .filter(Boolean)
    .filter((name) => !used.has(name.toLowerCase()))
    .filter((name) => !q || name.toLowerCase().includes(q))
    .slice(0, 6)
})

const coverImage = computed(() => assetUrl(form.value.gambar_cover))
const coverFailed = ref(false)
</script>

<template>
  <div>
    <!-- Initial loading (edit mode) -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 class="w-8 h-8 animate-spin text-brand-teal" />
      <p class="text-sm font-body text-stone-500">Memuat post...</p>
    </div>

    <!-- Initial load error -->
    <div v-else-if="loadError" class="max-w-xl mx-auto py-16">
      <div class="bg-white border-2 border-black shadow-brutal p-8 text-center">
        <AlertCircle class="w-10 h-10 text-brand-red mx-auto mb-3" />
        <h2 class="font-display text-xl font-bold mb-2">Gagal Memuat Post</h2>
        <p class="text-sm text-stone-600 mb-6">{{ loadError }}</p>
        <Button variant="outline" @click="$emit('cancel')">Kembali ke Feed</Button>
      </div>
    </div>

    <form v-else @submit.prevent="handlePublish" class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 md:gap-8 items-start">
      <!-- ============ LEFT: content ============ -->
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-bold uppercase tracking-widest mb-2 text-stone-900 dark:text-stone-100">Judul *</label>
          <Input
            v-model="form.judul"
            placeholder="Tulis judul post produksi..."
            maxlength="255"
            class="text-xl md:text-2xl font-display font-bold border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-brutal-sm h-14 px-4"
            :class="errors.judul ? 'border-brand-red dark:border-brand-red' : ''"
          />
          <p v-if="errors.judul" class="mt-1.5 text-xs font-bold text-brand-red dark:text-red-400 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" /> {{ errors.judul }}
          </p>
        </div>

        <!-- Body (TipTap) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100">Isi Konten</label>
            <span class="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">TipTap Editor</span>
          </div>
          <RichTextEditor v-model="form.isi_konten" placeholder="Tulis perkembangan produksi, proses kreatif, pengumuman, atau cerita di balik layar..." />
          <p v-if="errors.content" class="mt-1.5 text-xs font-bold text-brand-red dark:text-red-400 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" /> {{ errors.content }}
          </p>
        </div>

        <!-- Gallery -->
        <Card>
          <CardContent class="p-5 md:p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-display font-bold uppercase tracking-wide flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <ImageIcon class="w-4 h-4 text-brand-teal" /> Gallery Media
              </h2>
              <span class="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
                {{ form.media.length }}/20
              </span>
            </div>

            <!-- Gallery grid -->
            <div v-if="form.media.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div
                v-for="(item, index) in form.media"
                :key="item.localId"
                class="relative border-2 border-black dark:border-stone-100 bg-stone-100 dark:bg-stone-800 overflow-hidden group"
                data-testid="media-item"
              >
                <!-- Photo -->
                <template v-if="item.media_type === 'photo'">
                  <img
                    :src="assetUrl(item.file_path)"
                    :alt="`Media ${index + 1}`"
                    class="w-full aspect-square object-cover"
                  />
                </template>

                <!-- Video -->
                <template v-else-if="item.media_type === 'video'">
                  <video
                    :src="assetUrl(item.file_path)"
                    class="w-full aspect-square object-cover"
                    preload="metadata"
                  ></video>
                  <span class="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-mono uppercase px-1.5 py-0.5 flex items-center gap-1">
                    <Film class="w-3 h-3" /> Video
                  </span>
                </template>

                <!-- PDF -->
                <template v-else>
                  <div class="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 p-3">
                    <FileText class="w-10 h-10 text-brand-red" />
                    <span class="text-[10px] font-mono text-stone-600 dark:text-stone-300 truncate w-full text-center">{{ mediaName(item.file_path) }}</span>
                  </div>
                </template>

                <!-- Reorder + remove -->
                <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/60 backdrop-blur-sm px-1.5 py-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="p-1 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                      :disabled="index === 0"
                      title="Geser ke kiri"
                      @click="moveMedia(item.localId, -1)"
                    >
                      <ChevronLeft class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      class="p-1 text-white hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                      :disabled="index === form.media.length - 1"
                      title="Geser ke kanan"
                      @click="moveMedia(item.localId, 1)"
                    >
                      <ChevronRight class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    :href="assetUrl(item.file_path)"
                    target="_blank"
                    rel="noopener"
                    class="p-1 text-white hover:bg-white/20"
                    title="Lihat media"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    class="p-1 text-white hover:bg-brand-red cursor-pointer"
                    title="Hapus"
                    @click="removeMedia(item.localId)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Upload progress overlay -->
            <div
              v-if="uploading && !activeUpload"
              class="mb-4 p-3 bg-stone-50 dark:bg-stone-800 border-2 border-black dark:border-stone-100"
            >
              <div class="flex items-center gap-2 text-xs font-bold text-brand-teal mb-2">
                <Loader2 class="w-4 h-4 animate-spin" /> Mengunggah... {{ uploadProgress }}%
              </div>
              <div class="w-full h-3 bg-stone-100 dark:bg-stone-900 border-2 border-black dark:border-stone-100 overflow-hidden">
                <div class="h-full bg-brand-teal transition-all duration-300" :style="{ width: `${uploadProgress}%` }"></div>
              </div>
            </div>

            <!-- Upload buttons -->
            <div class="grid grid-cols-3 gap-3">
              <label
                class="border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-brand-teal hover:bg-teal-50 dark:hover:bg-stone-700/50 flex flex-col items-center justify-center gap-1.5 p-4 cursor-pointer text-center transition-colors"
                :class="{ 'opacity-50 pointer-events-none': uploading || form.media.length >= 20 }"
              >
                <ImageIcon class="w-6 h-6 text-stone-400 dark:text-stone-500" />
                <span class="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="selectFile($event.target.files[0], 'gallery'); $event.target.value = ''"
                />
              </label>
              <label
                class="border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-brand-teal hover:bg-teal-50 dark:hover:bg-stone-700/50 flex flex-col items-center justify-center gap-1.5 p-4 cursor-pointer text-center transition-colors"
                :class="{ 'opacity-50 pointer-events-none': uploading || form.media.length >= 20 }"
              >
                <Film class="w-6 h-6 text-stone-400 dark:text-stone-500" />
                <span class="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Video</span>
                <input
                  type="file"
                  accept="video/*"
                  class="hidden"
                  @change="selectFile($event.target.files[0], 'gallery'); $event.target.value = ''"
                />
              </label>
              <label
                class="border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-brand-teal hover:bg-teal-50 dark:hover:bg-stone-700/50 flex flex-col items-center justify-center gap-1.5 p-4 cursor-pointer text-center transition-colors"
                :class="{ 'opacity-50 pointer-events-none': uploading || form.media.length >= 20 }"
              >
                <FileText class="w-6 h-6 text-stone-400 dark:text-stone-500" />
                <span class="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  class="hidden"
                  @change="selectFile($event.target.files[0], 'gallery'); $event.target.value = ''"
                />
              </label>
            </div>
            <p class="text-[10px] text-stone-400 dark:text-stone-500 mt-3">Foto &amp; PDF maks 10MB • Video maks 4GB (MP4/WebM). Maks 20 media.</p>
          </CardContent>
        </Card>
      </div>

      <!-- ============ RIGHT: settings ============ -->
      <aside class="space-y-6 lg:sticky lg:top-24">
        <!-- Cover -->
        <Card>
          <CardContent class="p-5">
            <h2 class="text-base font-display font-bold uppercase tracking-wide mb-4 text-stone-900 dark:text-stone-100">Cover</h2>

            <div v-if="form.gambar_cover" class="relative border-2 border-black dark:border-stone-100 overflow-hidden mb-3">
              <div class="aspect-video w-full bg-stone-200 dark:bg-stone-800">
                <img
                  v-if="!coverFailed"
                  :src="coverImage"
                  alt="Cover post"
                  class="w-full h-full object-cover"
                  @error="coverFailed = true"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-stone-200 dark:bg-stone-800">
                  <ImageIcon class="w-10 h-10 text-stone-400 dark:text-stone-500" />
                </div>
              </div>
              <button
                type="button"
                class="absolute top-2 right-2 bg-brand-red text-white border-2 border-black dark:border-stone-100 p-1.5 hover:bg-red-600 transition-colors cursor-pointer"
                title="Hapus cover"
                @click="form.gambar_cover = ''; coverFailed = false"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <label
              class="border-2 border-dashed border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/80 hover:border-brand-teal hover:bg-teal-50 dark:hover:bg-stone-700/50 flex items-center justify-center gap-2 p-4 cursor-pointer text-center transition-colors"
              :class="{ 'opacity-50 pointer-events-none': uploading }"
            >
              <Upload class="w-5 h-5 text-stone-400 dark:text-stone-500" />
              <span class="text-xs font-bold uppercase text-stone-600 dark:text-stone-300">Unggah Cover</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="selectFile($event.target.files[0], 'cover'); $event.target.value = ''"
              />
            </label>
            <p class="text-[10px] text-stone-400 dark:text-stone-500 mt-2">Foto cover (JPG/PNG/WebP). Maks 10MB.</p>
          </CardContent>
        </Card>

        <!-- Film -->
        <Card>
          <CardContent class="p-5 space-y-4">
            <h2 class="text-base font-display font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">Keterkaitan</h2>

            <div>
              <label class="block text-sm font-bold mb-2 text-stone-900 dark:text-stone-100">Film (Opsional)</label>
              <select
                v-model="form.film_id"
                class="w-full h-10 px-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm shadow-brutal-xs focus:outline-none disabled:opacity-50"
                :disabled="lookupsLoading"
              >
                <option :value="null" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">Pilih film...</option>
                <option
                  v-for="film in films"
                  :key="film.film_id"
                  :value="film.film_id"
                  class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  {{ film.judul }}{{ film.status && film.status !== 'published' ? ` (${film.status})` : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2 text-stone-900 dark:text-stone-100">Tipe (Opsional)</label>
              <select
                v-model="form.tipe"
                class="w-full h-10 px-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm shadow-brutal-xs focus:outline-none"
              >
                <option value="" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">Pilih tipe...</option>
                <option v-for="opt in TIPE_OPTIONS" :key="opt.value" :value="opt.value" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold mb-2 text-stone-900 dark:text-stone-100">Kategori (Opsional)</label>
              <select
                v-model="form.category_id"
                class="w-full h-10 px-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm shadow-brutal-xs focus:outline-none disabled:opacity-50"
                :disabled="lookupsLoading"
              >
                <option :value="null" class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100">Pilih kategori...</option>
                <option
                  v-for="cat in categories"
                  :key="cat.category_id"
                  :value="cat.category_id"
                  class="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  {{ cat.nama_kategori }}
                </option>
              </select>
            </div>
          </CardContent>
        </Card>

        <!-- Tags -->
        <Card>
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-base font-display font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">Tag</h2>
              <span class="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">{{ form.tags.length }}/10</span>
            </div>

            <div v-if="form.tags.length" class="flex flex-wrap gap-1.5 mb-3">
              <Badge v-for="tag in form.tags" :key="tag" variant="outline" class="gap-1.5 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-[11px] py-1 shadow-brutal-xs">
                #{{ tag }}
                <button type="button" class="text-stone-400 dark:text-stone-400 hover:text-brand-red cursor-pointer" @click="removeTag(tag)">
                  <X class="w-3 h-3" />
                </button>
              </Badge>
            </div>

            <div class="flex gap-2">
              <Input
                v-model="newTagInput"
                placeholder="Tambah tag lalu Enter"
                class="border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 flex-1"
                :disabled="form.tags.length >= 10"
                @keydown.enter.prevent="handleAddTag"
              />
              <Button
                type="button"
                variant="outline"
                class="border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 h-10 w-10 p-0 shrink-0 shadow-brutal-xs hover:shadow-none cursor-pointer"
                :disabled="!newTagInput.trim() || form.tags.length >= 10"
                @click="handleAddTag"
              >
                <Plus class="w-4 h-4" />
              </Button>
            </div>

            <div v-if="suggestedTags.length" class="mt-3 space-y-1">
              <p class="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Tag yang sudah ada</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="sug in suggestedTags"
                  :key="sug"
                  type="button"
                  class="text-[11px] border-2 border-black dark:border-stone-100 px-2 py-0.5 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal transition-colors cursor-pointer"
                  @click="addSuggestedTag(sug)"
                >
                  #{{ sug }}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Visibility -->
        <Card>
          <CardContent class="p-5">
            <h2 class="text-base font-display font-bold uppercase tracking-wide mb-3 text-stone-900 dark:text-stone-100">Visibilitas</h2>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in VISIBILITY_OPTIONS"
                :key="opt.value"
                type="button"
                class="border-2 px-3 py-2.5 text-sm font-bold uppercase transition-all text-left cursor-pointer"
                :class="form.visibility === opt.value
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-stone-100 shadow-brutal-sm'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-black dark:hover:border-stone-100'"
                @click="form.visibility = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-[10px] text-stone-400 dark:text-stone-500 mt-2">
              {{ form.visibility === 'private' ? 'Hanya Anda dan moderator yang dapat melihat.' : 'Terlihat oleh semua pengguna.' }}
            </p>
          </CardContent>
        </Card>

        <!-- Status + Actions -->
        <Card>
          <CardContent class="p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Status</span>
              <Badge
                :variant="currentStatus === 'published' ? 'default' : 'outline'"
                class="border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                {{ currentStatus === 'published' ? 'Published' : currentStatus === 'archived' ? 'Archived' : 'Draft' }}
              </Badge>
            </div>

            <div v-if="formError" class="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border-2 border-brand-red dark:border-red-800 text-sm text-brand-red dark:text-red-400 flex gap-2">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ formError }}</span>
            </div>

            <div class="space-y-3">
              <Button
                type="button"
                variant="outline"
                class="w-full border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-xs hover:shadow-none cursor-pointer gap-2"
                :disabled="!canSubmit"
                @click="handleSaveDraft"
              >
                <Loader2 v-if="submitting && submitAction === 'draft'" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ isEdit ? 'Simpan Perubahan' : 'Simpan Draft' }}
              </Button>

              <Button
                type="submit"
                class="w-full bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer gap-2"
                :disabled="!canSubmit"
              >
                <Loader2 v-if="submitting && submitAction === 'publish'" class="w-4 h-4 animate-spin" />
                <Send v-else class="w-4 h-4" />
                {{ isEdit && currentStatus === 'published' ? 'Perbarui & Publish' : 'Publikasikan' }}
              </Button>

              <Button type="button" variant="ghost" class="w-full text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer" @click="$emit('cancel')">
                Batal
              </Button>

              <Button
                v-if="isEdit"
                type="button"
                variant="destructive"
                class="w-full bg-brand-red text-white border-2 border-black dark:border-stone-100 shadow-brutal gap-2 mt-4 hover:bg-red-700 cursor-pointer"
                :disabled="submitting"
                @click="showDeleteConfirm = true"
              >
                <Trash2 class="w-4 h-4" />
                Hapus Postingan
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <!-- Video upload modal -->
      <div v-if="activeUpload" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="!uploading ? cancelActiveUpload() : null"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold font-display uppercase tracking-tight text-stone-900 dark:text-stone-100">Upload Video</h3>
              <button v-if="!uploading" type="button" class="text-stone-400 hover:text-black dark:hover:text-white cursor-pointer" @click="cancelActiveUpload">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-6">
              <div class="p-4 bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 flex items-center gap-4">
                <div class="w-12 h-12 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 flex items-center justify-center">
                  <Film class="w-6 h-6 text-brand-teal" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-sm truncate text-stone-900 dark:text-stone-100">{{ activeUpload.file?.name }}</p>
                  <p class="text-[10px] text-stone-500 dark:text-stone-400 font-mono uppercase">
                    {{ ((activeUpload.file?.size || 0) / (1024 * 1024)).toFixed(2) }} MB
                  </p>
                </div>
              </div>

              <div v-if="uploading" class="space-y-2">
                <div class="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span class="text-brand-teal">Mengunggah...</span>
                  <span class="text-stone-900 dark:text-stone-100">{{ uploadProgress }}%</span>
                </div>
                <div class="w-full h-4 bg-stone-100 dark:bg-stone-800 border-2 border-black dark:border-stone-100 overflow-hidden relative">
                  <div class="h-full bg-brand-teal transition-all duration-300 ease-out" :style="{ width: `${uploadProgress}%` }"></div>
                </div>
                <p class="text-[10px] text-stone-400 dark:text-stone-500 italic text-center">Jangan tutup halaman ini hingga proses selesai.</p>
              </div>

              <div class="flex gap-3 pt-2">
                <Button
                  v-if="!uploading"
                  type="button"
                  variant="outline"
                  class="flex-1 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-sm hover:shadow-none cursor-pointer"
                  @click="cancelActiveUpload"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  class="flex-1 bg-brand-teal text-white border-2 border-black dark:border-stone-100 shadow-brutal cursor-pointer"
                  @click="startActiveUpload"
                  :disabled="uploading"
                >
                  <Loader2 v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
                  <CloudUpload v-else class="w-4 h-4 mr-2" />
                  {{ uploading ? 'Mengunggah...' : 'Mulai Upload' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unsaved changes confirm modal -->
      <div v-if="showLeaveConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="leaveCancelled"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
          <div class="p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-11 h-11 shrink-0 bg-amber-100 dark:bg-amber-950/60 border-2 border-black dark:border-stone-100 flex items-center justify-center">
                <AlertCircle class="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 class="font-display text-xl font-bold mb-1 text-stone-900 dark:text-stone-100">Perubahan Belum Disimpan</h3>
                <p class="text-sm text-stone-600 dark:text-stone-300">
                  Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?
                </p>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-sm hover:shadow-none cursor-pointer"
                @click="leaveCancelled"
              >
                Tetap di Sini
              </Button>
              <Button
                type="button"
                class="flex-1 bg-brand-red text-white border-2 border-black dark:border-stone-100 shadow-brutal cursor-pointer"
                @click="leaveConfirmed"
              >
                Tinggalkan
              </Button>
            </div>
          </div>
        </div>
      </div>
      <!-- Delete post confirm modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal animate-in fade-in zoom-in duration-200 text-stone-900 dark:text-stone-100">
          <div class="p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-11 h-11 shrink-0 bg-red-100 dark:bg-red-950/60 border-2 border-black dark:border-stone-100 flex items-center justify-center">
                <Trash2 class="w-6 h-6 text-brand-red dark:text-red-400" />
              </div>
              <div>
                <h3 class="font-display text-xl font-bold mb-1 text-stone-900 dark:text-stone-100">Hapus Postingan</h3>
                <p class="text-sm text-stone-600 dark:text-stone-300">
                  Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1 border-2 border-black dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-brutal-sm hover:shadow-none cursor-pointer"
                @click="showDeleteConfirm = false"
                :disabled="submitting"
              >
                Batal
              </Button>
              <Button
                type="button"
                class="flex-1 bg-brand-red text-white border-2 border-black dark:border-stone-100 shadow-brutal hover:bg-red-700 cursor-pointer"
                @click="handleDeletePost"
                :disabled="submitting"
              >
                <Loader2 v-if="submitting && submitAction === 'delete'" class="w-4 h-4 mr-2 animate-spin" />
                <Trash2 v-else class="w-4 h-4 mr-2" />
                {{ submitting && submitAction === 'delete' ? 'Menghapus...' : 'Ya, Hapus' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
