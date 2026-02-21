<script setup>
import { computed } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { Film, Clapperboard, Video, Play } from 'lucide-vue-next'

const props = defineProps({
  film: { type: Object, required: true },
  activeVideoUrl: { type: String, default: null },
  activeVideoType: { type: String, default: 'film' },
})

const emit = defineEmits(['switch-video'])

const hasActiveVideo = computed(() => !!props.activeVideoUrl)

const videoPlaylist = computed(() => {
  if (!props.film) return []
  const list = []
  if (props.film.link_video_utama) {
    list.push({
      type: 'film',
      label: 'Karya Utama',
      description: props.film.judul,
      url: props.film.link_video_utama,
      icon: 'film',
    })
  }
  if (props.film.link_trailer) {
    list.push({
      type: 'trailer',
      label: 'Trailer',
      description: `Trailer - ${props.film.judul}`,
      url: props.film.link_trailer,
      icon: 'clapperboard',
    })
  }
  if (props.film.link_bts) {
    list.push({
      type: 'bts',
      label: 'Di Balik Layar',
      description: `BTS - ${props.film.judul}`,
      url: props.film.link_bts,
      icon: 'video',
    })
  }
  return list
})

const getYoutubeThumbnail = (url) => {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
  )
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}
</script>

<template>
  <section class="pt-16 md:pt-20 bg-stone-900 min-h-[calc(100vh-30rem)]">
    <div class="flex flex-col lg:flex-row">
      <!-- Left: Video Player -->
      <div class="flex-1 flex flex-col">
        <div class="w-full bg-black">
          <div class="aspect-video">
            <VideoPlayer
              v-if="hasActiveVideo"
              :key="'vp-' + activeVideoUrl"
              :src="activeVideoUrl"
              :title="film.judul || 'Video'"
              :poster="film.gambar_poster || null"
              :storageKey="
                film?.film_id
                  ? `film-${film.film_id}`
                  : film?.slug
                    ? `film-${film.slug}`
                    : ''
              "
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-stone-900"
            >
              <div class="text-center">
                <div
                  class="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-800 flex items-center justify-center"
                >
                  <Film class="w-10 h-10 text-stone-600" />
                </div>
                <p class="text-stone-400 text-lg font-display mb-1">
                  Video Belum Tersedia
                </p>
                <p class="text-stone-500 text-sm">
                  Karya ini belum memiliki video yang dapat ditonton
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action bar slot -->
        <slot name="action-bar" />
      </div>

      <!-- Right: Sidebar - Video Playlist -->
      <div
        class="w-full lg:w-80 xl:w-96 shrink-0 bg-stone-800/50 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col"
      >
        <div class="p-3 md:p-4 border-b border-white/10">
          <h3 class="text-white font-bold text-xs md:text-sm uppercase tracking-wider">
            Daftar Video
          </h3>
          <p class="text-stone-500 text-[10px] md:text-xs mt-0.5 md:mt-1">
            {{ videoPlaylist.length }} video tersedia
          </p>
        </div>

        <div
          class="flex-1 overflow-y-auto p-3 space-y-2"
          style="max-height: calc(100vh - 5rem - 5rem)"
        >
          <div
            v-for="(item, idx) in videoPlaylist"
            :key="item.type"
            class="flex gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 group"
            :class="
              activeVideoType === item.type
                ? 'bg-brand-red/20 border border-brand-red/40'
                : 'hover:bg-white/5 border border-transparent'
            "
            @click="emit('switch-video', item)"
          >
            <!-- Thumbnail -->
            <div
              class="w-24 h-[54px] md:w-32 md:h-[72px] bg-stone-700 flex-shrink-0 overflow-hidden rounded border border-white/10 relative"
            >
              <img
                v-if="getYoutubeThumbnail(item.url)"
                :src="getYoutubeThumbnail(item.url)"
                :alt="item.label"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-stone-800"
              >
                <Film
                  v-if="item.icon === 'film'"
                  class="w-6 h-6 text-stone-500"
                />
                <Clapperboard
                  v-else-if="item.icon === 'clapperboard'"
                  class="w-6 h-6 text-stone-500"
                />
                <Video v-else class="w-6 h-6 text-stone-500" />
              </div>
              <!-- Now Playing indicator -->
              <div
                v-if="activeVideoType === item.type"
                class="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <div class="flex items-center gap-1">
                  <div
                    class="w-0.5 h-3 bg-brand-red rounded-full animate-pulse"
                  ></div>
                  <div
                    class="w-0.5 h-4 bg-brand-red rounded-full animate-pulse"
                    style="animation-delay: 150ms"
                  ></div>
                  <div
                    class="w-0.5 h-2.5 bg-brand-red rounded-full animate-pulse"
                    style="animation-delay: 300ms"
                  ></div>
                </div>
              </div>
              <!-- Play icon overlay -->
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play class="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
              </div>
              <!-- Number badge -->
              <div
                class="absolute top-1 left-1 w-5 h-5 bg-black/70 rounded flex items-center justify-center"
              >
                <span class="text-white text-[10px] font-bold">{{
                  idx + 1
                }}</span>
              </div>
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <div class="flex items-center gap-1.5 mb-0.5 md:mb-1">
                <span
                  class="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  :class="{
                    'bg-brand-red/20 text-brand-red': item.type === 'film',
                    'bg-brand-teal/20 text-brand-teal':
                      item.type === 'trailer',
                    'bg-brand-orange/20 text-brand-orange':
                      item.type === 'bts',
                  }"
                >
                  {{ item.label }}
                </span>
              </div>
              <h4
                class="text-xs md:text-sm font-medium line-clamp-2 transition-colors"
                :class="
                  activeVideoType === item.type
                    ? 'text-white'
                    : 'text-white/70 group-hover:text-white'
                "
              >
                {{ item.description }}
              </h4>
            </div>
          </div>

          <div v-if="videoPlaylist.length === 0" class="text-center py-10">
            <Film class="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <p class="text-stone-500 text-sm">Tidak ada video tersedia</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
