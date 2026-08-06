<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ZoomIn, ChevronLeft, ChevronRight, X, FileText, Download } from 'lucide-vue-next'
import VideoPlayer from '@/components/VideoPlayer.vue'
import LazyImage from '@/components/LazyImage.vue'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  media: {
    type: Array,
    default: () => []
  },
  cover: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})

const photos = computed(() =>
  props.media.filter((m) => m.mediaType === 'photo')
)
const videos = computed(() =>
  props.media.filter((m) => m.mediaType === 'video')
)
const pdfs = computed(() =>
  props.media.filter((m) => m.mediaType === 'pdf')
)

const photoUrl = (photo) => assetUrl(photo?.filePath)
const thumbnailUrl = (photo) =>
  photo?.thumbnail ? assetUrl(photo.thumbnail) : photoUrl(photo)

const posterFor = (video) => {
  if (video?.thumbnail) return assetUrl(video.thumbnail)
  if (props.cover) return assetUrl(props.cover)
  return ''
}

const fileName = (path) => {
  const parts = String(path || '').split('/')
  return parts[parts.length - 1] || path
}

// ─── Fullscreen gallery ──────────────────────────────────
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxEl = ref(null)
const closeBtn = ref(null)
let lastFocused = null

const openLightbox = (index) => {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

const closeLightbox = () => {
  lightboxOpen.value = false
}

const prevPhoto = () => {
  if (photos.value.length === 0) return
  lightboxIndex.value =
    (lightboxIndex.value - 1 + photos.value.length) % photos.value.length
}

const nextPhoto = () => {
  if (photos.value.length === 0) return
  lightboxIndex.value =
    (lightboxIndex.value + 1) % photos.value.length
}

const handleKeydown = (event) => {
  if (!lightboxOpen.value) return
  if (event.key === 'Escape') closeLightbox()
  else if (event.key === 'ArrowLeft') prevPhoto()
  else if (event.key === 'ArrowRight') nextPhoto()
  else if (event.key === 'Tab') {
    const focusables = lightboxEl.value?.querySelectorAll(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(lightboxOpen, (open) => {
  if (open) {
    lastFocused = document.activeElement
    document.body.style.overflow = 'hidden'
    nextTick(() => closeBtn.value?.focus())
  } else {
    document.body.style.overflow = ''
    lastFocused?.focus?.()
    lastFocused = null
  }
})

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <section v-if="photos.length || videos.length || pdfs.length" class="feed-post-media">
    <!-- Photo gallery -->
    <div v-if="photos.length" class="mb-10">
      <h2 class="section-label">Galeri</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <button
          v-for="(photo, index) in photos"
          :key="photo.mediaId ?? photo.filePath"
          type="button"
          class="group relative aspect-video overflow-hidden border-2 border-black shadow-brutal-xs bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
          :aria-label="`Perbesar gambar ${index + 1}`"
          @click="openLightbox(index)"
        >
          <LazyImage
            :src="thumbnailUrl(photo)"
            :alt="`Gambar ${index + 1}`"
            wrapper-class="w-full h-full"
            img-class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span
            class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
          >
            <ZoomIn class="w-6 h-6 md:w-8 md:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </span>
        </button>
      </div>
    </div>

    <!-- Videos -->
    <div v-if="videos.length" class="mb-10">
      <h2 class="section-label">Video</h2>
      <div class="space-y-6">
        <div
          v-for="(video, index) in videos"
          :key="video.mediaId ?? video.filePath"
          class="aspect-video w-full bg-black border-2 border-black shadow-brutal-md"
        >
          <VideoPlayer
            :key="`video-${index}-${video.filePath}`"
            :src="assetUrl(video.filePath)"
            :title="title || `Video ${index + 1}`"
            :poster="posterFor(video)"
            :storage-key="`feed-${title || index}-${video.filePath}`"
          />
        </div>
      </div>
    </div>

    <!-- PDFs -->
    <div v-if="pdfs.length" class="mb-10">
      <h2 class="section-label">Dokumen</h2>
      <div class="space-y-6">
        <div
          v-for="pdf in pdfs"
          :key="pdf.mediaId ?? pdf.filePath"
          class="border-2 border-black shadow-brutal bg-white overflow-hidden"
        >
          <div class="flex items-center justify-between gap-3 border-b-2 border-black bg-stone-50 px-4 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <FileText class="w-4 h-4 text-brand-red shrink-0" />
              <span class="text-xs md:text-sm font-body font-bold text-stone-800 truncate">
                {{ fileName(pdf.filePath) }}
              </span>
            </div>
            <a
              :href="assetUrl(pdf.filePath)"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-teal hover:text-brand-red transition-colors shrink-0"
            >
              <Download class="w-3.5 h-3.5" />
              Unduh PDF
            </a>
          </div>
          <div class="relative min-h-[420px] md:min-h-[560px] bg-white">
            <iframe
              :src="assetUrl(pdf.filePath) + '#toolbar=0&view=FitH'"
              :title="fileName(pdf.filePath)"
              class="w-full h-[420px] md:h-[560px] absolute inset-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen && photos.length"
        ref="lightboxEl"
        role="dialog"
        aria-modal="true"
        aria-label="Galeri gambar"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
        @click.self="closeLightbox"
      >
        <img
          :src="photoUrl(photos[lightboxIndex])"
          :alt="`Gambar ${lightboxIndex + 1}`"
          decoding="async"
          class="max-w-full max-h-[85vh] object-contain border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,0.6)]"
        />

        <button
          ref="closeBtn"
          type="button"
          class="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-stone-900 border-2 border-black shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          :aria-label="'Tutup galeri'"
          @click="closeLightbox"
        >
          <X class="w-5 h-5" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-stone-900 border-2 border-black shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-none transition-all"
          :aria-label="'Gambar sebelumnya'"
          @click="prevPhoto"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-stone-900 border-2 border-black shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          :aria-label="'Gambar berikutnya'"
          @click="nextPhoto"
        >
          <ChevronRight class="w-5 h-5" />
        </button>

        <span
          class="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white border border-white/30 px-3 py-1 font-mono text-xs md:text-sm tracking-widest"
        >
          {{ lightboxIndex + 1 }} / {{ photos.length }}
        </span>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.section-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-stone-800, #292524);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-label::before {
  content: '';
  width: 0.375rem;
  height: 1.25rem;
  background: var(--color-brand-red, #ef4444);
}
</style>
