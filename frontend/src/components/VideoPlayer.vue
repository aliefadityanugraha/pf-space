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
const youtubeEmbed = computed(() => {
  const url = mediaSrc.value || ''
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : ''
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
  if (isYoutubeUrl.value) return
  try {
    const [{ default: Plyr }, Hls] = await Promise.all([
      import('plyr'),
      import('hls.js')
    ])

    const src = mediaSrc.value
    const isHls = /\.m3u8($|\\?)/i.test(src)

    if (isHls) {
      if (Hls.default.isSupported()) {
        hls = new Hls.default()
        hls.loadSource(src)
        hls.attachMedia(videoEl.value)

        // Listen for when manifest is loaded to update quality menu
        hls.on(Hls.default.Events.MANIFEST_PARSED, () => {
          const availableQualities = hls.levels.map((l) => l.height)
          
          // Add 'Auto' quality
          const qualities = [0, ...availableQualities]
          
          plyr.config.quality = {
            default: 0,
            options: qualities,
            forced: true,
            onChange: (newQuality) => {
              if (newQuality === 0) {
                hls.currentLevel = -1 // Auto
              } else {
                hls.levels.forEach((level, levelIndex) => {
                  if (level.height === newQuality) {
                    hls.currentLevel = levelIndex
                  }
                })
              }
            },
          }
          
          // Update Plyr labels
          plyr.config.i18n.quality = 'Kualitas'
          const labels = { 0: 'Auto' }
          availableQualities.forEach(q => { labels[q] = `${q}p` })
          plyr.config.displayDuration = true
        })
      } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.value.src = src
      } else {
        failed.value = true
        return
      }
    } else {
      videoEl.value.src = src
    }

    plyr = new Plyr(videoEl.value, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 
        'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      invertTime: false,
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      quality: { default: 0, options: [0] } // Initial state
    })

    const key = lsKey()
    if (key) {
      const raw = localStorage.getItem(key)
      const t = raw ? parseFloat(raw) : 0
      if (!isNaN(t) && t > 5) {
        const setTime = () => {
          if (videoEl.value && videoEl.value.duration && t < videoEl.value.duration - 5) {
            videoEl.value.currentTime = t
          }
          videoEl.value.removeEventListener('loadedmetadata', setTime)
        }
        videoEl.value.addEventListener('loadedmetadata', setTime)
      }
      saveInterval = setInterval(() => {
        if (!videoEl.value || videoEl.value.paused) return
        localStorage.setItem(key, String(videoEl.value.currentTime || 0))
      }, 5000)
      videoEl.value.addEventListener('ended', () => {
        localStorage.removeItem(key)
      })
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
</script>

<template>
  <div class="w-full h-full">
    <template v-if="isYoutubeUrl">
      <iframe
        :src="youtubeEmbed"
        class="w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
      ></iframe>
    </template>
    <template v-else>
      <video
        ref="videoEl"
        :poster="poster || null"
        playsinline
        controls
        class="w-full h-full bg-black object-contain"
      ></video>
      <!-- Fallback terakhir bila inisialisasi gagal -->
      <video
        v-if="failed"
        :src="mediaSrc || null"
        controls
        class="hidden"
      ></video>
    </template>
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
