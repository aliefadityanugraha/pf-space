<script setup>
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import ArchiveCard from './ArchiveCard.vue'
import ArchiveSkeleton from './ArchiveSkeleton.vue'
import { Badge } from '@/components/ui/badge'
import { User, ChevronLeft, ChevronRight, Sparkles, Film } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  carouselId: {
    type: [String, Number],
    default: '1'
  }
})

const router = useRouter()
const modules = [Navigation, Autoplay]

const prevClass = computed(() => `swiper-prev-btn-${props.carouselId}`)
const nextClass = computed(() => `swiper-next-btn-${props.carouselId}`)

const goToDetail = (slug) => {
  router.push(`/archive/${slug}`)
}
</script>

<template>
  <div class="w-full relative group/swiper">
    <!-- Header Sub-Bar for Row Slider -->
    <div class="flex items-center justify-between mb-4 px-1">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse"></span>
        <h3 v-if="title" class="text-sm md:text-base font-extrabold uppercase tracking-wide text-stone-900 dark:text-stone-100 font-display flex items-center gap-2">
          {{ title }}
        </h3>
        <Badge variant="outline" class="bg-brand-red/10 dark:bg-brand-red/20 text-brand-red dark:text-red-400 border-brand-red/30 text-[10px] font-mono font-bold px-2 py-0.5">
          {{ items.length }} Karya
        </Badge>
      </div>

      <!-- Navigation Arrows -->
      <div class="flex items-center gap-2">
        <button
          :class="[prevClass, 'w-8 h-8 rounded bg-white dark:bg-stone-800 border-2 border-stone-800 dark:border-stone-100 shadow-brutal-xs flex items-center justify-center transition-all hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal text-stone-900 dark:text-stone-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed']"
          title="Sebelumnya"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          :class="[nextClass, 'w-8 h-8 rounded bg-white dark:bg-stone-800 border-2 border-stone-800 dark:border-stone-100 shadow-brutal-xs flex items-center justify-center transition-all hover:bg-brand-teal hover:text-white dark:hover:bg-brand-teal text-stone-900 dark:text-stone-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed']"
          title="Berikutnya"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Swiper Container -->
    <Swiper
      :modules="modules"
      :slides-per-view="2.1"
      :space-between="14"
      :navigation="{
        nextEl: `.${nextClass}`,
        prevEl: `.${prevClass}`,
      }"
      :breakpoints="{
        '480': {
          slidesPerView: 2.5,
          spaceBetween: 14,
        },
        '640': {
          slidesPerView: 3.2,
          spaceBetween: 16,
        },
        '768': {
          slidesPerView: 4.2,
          spaceBetween: 16,
        },
        '1024': {
          slidesPerView: 5,
          spaceBetween: 18,
        },
        '1280': {
          slidesPerView: 5,
          spaceBetween: 20,
        },
      }"
      class="!px-1.5"
    >
      <!-- Loading State -->
      <template v-if="loading">
        <SwiperSlide v-for="i in 5" :key="i" class="pb-4 pt-2">
          <ArchiveSkeleton />
        </SwiperSlide>
      </template>

      <!-- Data State -->
      <template v-else>
        <SwiperSlide v-for="item in items" :key="item.film_id" class="h-auto pb-4 pt-2">
          <ArchiveCard 
            :archive="item"
            @click="goToDetail(item.slug)"
            class="cursor-pointer h-full border-2 border-stone-800 dark:border-stone-100 shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-card text-card-foreground"
          />
        </SwiperSlide>
      </template>
    </Swiper>
  </div>
</template>
