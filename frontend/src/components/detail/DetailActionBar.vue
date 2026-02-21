<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Calendar,
  Loader2,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  GraduationCap,
} from 'lucide-vue-next'

const props = defineProps({
  film: { type: Object, required: true },
  voteData: { type: Object, required: true },
  voting: { type: Boolean, default: false },
  isInCollection: { type: Boolean, default: false },
  processingCollection: { type: Boolean, default: false },
  hasLearningAssets: { type: Boolean, default: false },
})

const emit = defineEmits([
  'toggle-vote',
  'toggle-collection',
  'share',
  'share-to',
])

const router = useRouter()
</script>

<template>
  <div class="bg-stone-900 p-4 md:p-5 border-t border-white/5">
    <!-- Title & Meta -->
    <div
      class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3"
    >
      <div class="flex-1 min-w-0">
        <h2
          class="text-base sm:text-lg md:text-xl font-display font-bold text-white mb-1 truncate"
        >
          {{ film.judul }}
        </h2>
        <div class="flex flex-wrap items-center gap-3 text-sm text-stone-400">
          <router-link
            v-if="film.creator?.id"
            :to="`/creator/${film.creator.id}`"
            class="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
          >
            <User class="w-3.5 h-3.5" />
            {{ film.creator?.name || 'Tidak diketahui' }}
          </router-link>
          <span v-else class="flex items-center gap-1.5">
            <User class="w-3.5 h-3.5" />
            {{ film.creator?.name || 'Tidak diketahui' }}
          </span>
          <span
            v-if="film.tahun_karya"
            class="flex items-center gap-1.5"
          >
            <Calendar class="w-3.5 h-3.5" />
            {{ film.tahun_karya }}
          </span>
          <Badge
            v-if="film.category"
            variant="secondary"
            class="bg-white/10 text-stone-300 border-0 text-xs"
          >
            {{ film.category.nama_kategori }}
          </Badge>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 md:gap-2">
        <Button
          v-if="hasLearningAssets"
          variant="outline"
          size="sm"
          class="h-8 md:h-9 text-[10px] md:text-xs bg-brand-teal/20 text-brand-teal border-brand-teal/30 hover:bg-brand-teal/30 hover:text-brand-teal px-2 md:px-3"
          @click="router.push(`/archive/${film.slug}/study`)"
        >
          <GraduationCap class="w-3.5 h-3.5 mr-1" />
          <span class="sm:inline">Mode Studi</span>
        </Button>

        <Button
          :variant="voteData.has_voted ? 'default' : 'outline'"
          size="sm"
          :class="[
            'h-8 md:h-9 text-[10px] md:text-xs px-2 md:px-3',
            voteData.has_voted
              ? 'bg-pink-600 hover:bg-pink-700 border-pink-600 text-white'
              : 'border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
          ]"
          @click="emit('toggle-vote')"
          :disabled="voting"
        >
          <Loader2 v-if="voting" class="w-3.5 h-3.5 mr-1 animate-spin" />
          <Heart
            v-else
            :class="[
              'w-3.5 h-3.5 mr-1',
              voteData.has_voted ? 'fill-current' : '',
            ]"
          />
          {{ voteData.vote_count }} Vote
        </Button>

        <Button
          variant="outline"
          size="sm"
          :class="[
            'h-8 md:h-9 text-[10px] md:text-xs px-2 md:px-3 border-white/20 text-white/80 hover:bg-white/10 hover:text-white',
            isInCollection ? 'border-brand-orange text-brand-orange' : ''
          ]"
          @click="emit('toggle-collection')"
          :disabled="processingCollection"
        >
          <Loader2
            v-if="processingCollection"
            class="w-3.5 h-3.5 mr-1 animate-spin"
          />
          <Bookmark
            v-else
            :class="[
              'w-3.5 h-3.5 mr-1',
              isInCollection ? 'fill-current' : '',
            ]"
          />
          {{ isInCollection ? 'Tersimpan' : 'Simpan' }}
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 md:h-9 text-[10px] md:text-xs px-2 md:px-3 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          @click="emit('share')"
        >
          <Share2 class="w-3.5 h-3.5 mr-1" />
          Bagikan
        </Button>

        <!-- Social Share -->
        <Button
          variant="outline"
          size="sm"
          class="h-8 md:h-9 bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/30 px-2"
          @click="emit('share-to', 'whatsapp')"
          title="Bagikan ke WhatsApp"
        >
          <MessageCircle class="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 md:h-9 bg-white/10 text-white border-white/20 hover:bg-white/20 px-2"
          @click="emit('share-to', 'twitter')"
          title="Bagikan ke X"
        >
          <svg
            viewBox="0 0 24 24"
            class="w-3 h-3 fill-current"
            aria-hidden="true"
          >
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            ></path>
          </svg>
        </Button>
      </div>
    </div>
  </div>
</template>
