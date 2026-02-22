<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

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
</script>

<template>
  <div class="w-full h-full bg-black">
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
</style>
