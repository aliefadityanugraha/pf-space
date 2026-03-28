<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: 'Video' },
  poster: { type: String, default: '' },
  storageKey: { type: String, default: '' }
})

const failed = ref(false)
const mediaSrc = computed(() => props.src || '')
const isYoutubeUrl = computed(() => {
  const url = mediaSrc.value || ''
  return url.includes('youtube.com') || url.includes('youtu.be')
})
const youtubeId = computed(() => {
  const url = mediaSrc.value || ''
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : url
})

const videoEl = ref(null)
let hls = null
let plyr = null
let saveInterval = null

const emit = defineEmits(['ready'])

function lsKey() {
  const key = props.storageKey || mediaSrc.value
  return key ? `pfspace:progress:${key}` : null
}

onMounted(async () => {
  try {
    const [{ default: Plyr }, HlsModule] = await Promise.all([
      import('plyr'),
      import('hls.js')
    ])
    const Hls = HlsModule.default || HlsModule

    if (isYoutubeUrl.value) {
      plyr = new Plyr(videoEl.value, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
      })
      emit('ready')
      return
    }

    const src = mediaSrc.value
    const isHls = /\.m3u8($|\\?)/i.test(src)

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(videoEl.value)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const availableQualities = hls.levels.map((l) => l.height)
          const qualities = [0, ...availableQualities]
          plyr.config.quality = {
            default: 0,
            options: qualities,
            forced: true,
            onChange: (newQuality) => {
              if (newQuality === 0) hls.currentLevel = -1
              else {
                hls.levels.forEach((level, idx) => {
                  if (level.height === newQuality) hls.currentLevel = idx
                })
              }
            },
          }
          plyr.config.i18n.quality = 'Kualitas'
          plyr.config.displayDuration = true
        })
      } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.value.src = src
      } else {
        failed.value = true
        return
      }
    } else {
      videoEl.value.src = src || ''
    }

    plyr = new Plyr(videoEl.value, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 
        'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      invertTime: false,
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      quality: { default: 0, options: [0] }
    })

    const key = lsKey()
    if (key) {
      const raw = localStorage.getItem(key)
      const t = raw ? parseFloat(raw) : 0
      if (!isNaN(t) && t > 5) {
        const setTime = () => {
          if (plyr && plyr.duration && t < plyr.duration - 5) {
            plyr.currentTime = t
          }
          videoEl.value.removeEventListener('loadedmetadata', setTime)
        }
        videoEl.value.addEventListener('loadedmetadata', setTime)
      }
      saveInterval = setInterval(() => {
        if (!plyr || plyr.paused) return
        localStorage.setItem(key, String(plyr.currentTime || 0))
      }, 5000)
    }

    if (videoEl.value && videoEl.value.controlsList) {
      try {
        videoEl.value.controlsList.add('nodownload')
      } catch {}
    }

    emit('ready')
  } catch (e) {
    console.error('Init Plyr/HLS failed:', e)
    failed.value = true
  }
})

onBeforeUnmount(() => {
  try {
    if (plyr && typeof plyr.destroy === 'function') plyr.destroy()
    if (hls && typeof hls.destroy === 'function') hls.destroy()
    if (saveInterval) clearInterval(saveInterval)
  } catch {}
})

// Expose methods for parent components
defineExpose({
  getCurrentTime: () => {
    return plyr ? plyr.currentTime : 0
  },
  seekTo: (time) => {
    if (plyr) {
      plyr.currentTime = time
      plyr.play()
    }
  }
})

const seekIndicator = ref(null);
const handleDoubleClick = (e) => {
  if (!plyr || failed.value || isYoutubeUrl.value) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 2) {
    plyr.currentTime = Math.max(0, plyr.currentTime - 10);
    triggerIndicator('backward');
  } else {
    plyr.currentTime = Math.min(plyr.duration || plyr.currentTime + 10, plyr.currentTime + 10);
    triggerIndicator('forward');
  }
};
let lastTap = 0;
const handleTouchEnd = (e) => {
  if (!plyr || failed.value || isYoutubeUrl.value) return;
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 400 && tapLength > 0) {
    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < rect.width / 2) {
      plyr.currentTime = Math.max(0, plyr.currentTime - 10);
      triggerIndicator('backward');
    } else {
      plyr.currentTime = Math.min(plyr.duration || plyr.currentTime + 10, plyr.currentTime + 10);
      triggerIndicator('forward');
    }
  }
  lastTap = currentTime;
};
const triggerIndicator = (dir) => {
  seekIndicator.value = dir;
  setTimeout(() => seekIndicator.value = null, 500);
};
</script>

<template>
  <div class="w-full h-full bg-black relative overflow-hidden" @dblclick="handleDoubleClick" @touchend="handleTouchEnd">
    <div v-if="isYoutubeUrl" ref="videoEl" :data-plyr-provider="'youtube'" :data-plyr-embed-id="youtubeId"></div>
    <video
      v-else
      ref="videoEl"
      :poster="poster || null"
      playsinline
      controls
      class="w-full h-full bg-black object-contain"
    ></video>
    
    <div v-if="failed && !isYoutubeUrl" class="absolute inset-0 flex items-center justify-center text-white/40 text-xs uppercase font-black tracking-widest bg-stone-900">
       Gagal memuat video
    </div>

    <!-- DRM Auto-Watermark Overlay -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-[50]" v-if="user && !failed">
      <div class="absolute bottom-6 right-8 text-white/30 font-mono font-bold text-[10px] md:text-sm tracking-widest text-shadow-sm whitespace-nowrap">
        {{ user.email || user.username || 'System' }} • SI Film Archive
      </div>
    </div>
    
    <!-- Seek Indicators -->
    <transition name="seek-fade">
      <div v-if="seekIndicator === 'backward'" class="absolute left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/40 text-white w-16 h-16 rounded-full pointer-events-none z-[100]">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        <span class="text-[10px] font-bold mt-1">-10s</span>
      </div>
    </transition>
    <transition name="seek-fade">
      <div v-if="seekIndicator === 'forward'" class="absolute right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/40 text-white w-16 h-16 rounded-full pointer-events-none z-[100]">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        <span class="text-[10px] font-bold mt-1">+10s</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Ensure Plyr container and video respect the containment */
:deep(.plyr) {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
}

:deep(.plyr__video-wrapper) {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.plyr video) {
  object-fit: contain !important;
}

/* Youtube Embed Fix */
iframe {
  object-fit: contain;
}

.seek-fade-enter-active,
.seek-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.seek-fade-enter-from,
.seek-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.9);
}

.text-shadow-sm {
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}
</style>
