<script setup>
import  { ref } from 'vue'
import { Bookmark, Share2, Heart } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ContentSection from '@/components/ContentSection.vue'
import TagList from '@/components/TagList.vue'

defineProps({
  title: { type: String, required: true },
  year: { type: String, default: '2024' },
  duration: { type: String, default: '1h 45m' },
  genres: { type: Array, default: () => ['Drama', 'Education', 'Archival'] },
  posterImage: { type: String, default: 'https://lumiere-a.akamaihd.net/v1/images/24_coral3_payoff_1sht_indonesia_2_34326e52.jpeg?region=0%2C0%2C734%2C1100' }
})

const tags = ref(['Action'])

const synopsis = `In a remote mountain village rapidly emptying of its youth, a young student stumbles upon a forgotten archive of 16mm films in the basement of the local town hall. Through the lens of these decayed reels, they begin to reconstruct the history of their community—uncovering a silenced protest movement from decades ago. "The Silent Echo" weaves together present-day narrative with restored archival footage, exploring the fragile nature of memory and the importance of preserving cultural heritage.`

</script>

<template>
  <section class="relative min-h-[500px] md:min-h-[700px]">
    <!-- Background -->
    <div class="absolute inset-0">
      <img src="/banner.jpg" alt="Film background" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-[#F2EEE3] via-transparent/50 to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32">
      <div class="flex flex-col md:flex-row gap-8 md:gap-12">
        <!-- Poster -->
        <div class="w-full max-w-xs mx-auto md:mx-0 flex-shrink-0">
          <img 
            :src="posterImage" 
            :alt="title"
            class="w-full aspect-[3/4] object-cover shadow-brutal-lg border-2 border-slate-900"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 pb-8">
          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mb-4">
            <Badge variant="default" class="bg-stone-800">
              Release: {{ year }}
            </Badge>
            <Badge variant="outline" class="bg-white">
              {{ duration }}
            </Badge>
          </div>

          <!-- Title -->
          <h1 class="text-3xl md:text-5xl font-display font-semibold text-white mb-4 drop-shadow-lg">
            {{ title }}
          </h1>

          <!-- Genres -->
          <div class="flex flex-wrap items-center gap-2 text-sm font-body text-white mb-6">
            <template v-for="(genre, index) in genres" :key="genre">
              <span>{{ genre }}</span>
              <span v-if="index < genres.length - 1" class="text-white/50">//</span>
            </template>
          </div>

          <!-- Synopsis -->
          <div class="mb-8">
            <h3 class="text-lg font-display font-semibold text-white mb-2">Synopsis</h3>
            <p class="text-sm md:text-base text-white/90 leading-relaxed line-clamp-4">
              {{ synopsis }}
            </p>
            <TagList :tags="tags" class="mt-3" />
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-3">
            <Button variant="outline" class="bg-white text-stone-800">
              <Bookmark class="w-4 h-4 mr-2" />
              Simpan ke Koleksi
            </Button>
            <Button variant="outline" class="bg-white text-stone-800">
              <Share2 class="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive">
              <Heart class="w-4 h-4 mr-2" />
              Vote Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
