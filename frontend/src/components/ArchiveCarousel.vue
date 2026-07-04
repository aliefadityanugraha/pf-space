<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import ArchiveCard from './ArchiveCard.vue'
import ArchiveSkeleton from './ArchiveSkeleton.vue'
import { Badge } from '@/components/ui/badge'
import { User, ChevronLeft, ChevronRight } from 'lucide-vue-next'
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
  }
})

const router = useRouter()
const modules = [Navigation, Autoplay]

const goToDetail = (slug) => {
  router.push(`/archive/${slug}`)
}
</script>

<template>
  <div class="w-full relative group/swiper">
    <Swiper
      :modules="modules"
      :slides-per-view="2.1"
      :space-between="12"
      :navigation="{
        nextEl: '.swiper-button-next-custom',
        prevEl: '.swiper-button-prev-custom',
      }"
      :breakpoints="{
        '480': {
          slidesPerView: 2.5,
          spaceBetween: 16,
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
          spaceBetween: 20,
        },
        '1280': {
          slidesPerView: 5,
          spaceBetween: 24,
        },
      }"
      class="pb-12 !px-1"
    >
      <!-- Loading State -->
      <template v-if="loading">
        <SwiperSlide v-for="i in 5" :key="i">
          <ArchiveSkeleton />
        </SwiperSlide>
      </template>

      <!-- Data State -->
      <template v-else>
        <SwiperSlide v-for="item in items" :key="item.film_id" class="h-auto">
          <ArchiveCard 
            :archive="item"
            @click="goToDetail(item.slug)"
            class="cursor-pointer h-full"
          >
            <template #overlay>
              <Badge v-if="item.tahun_karya" class="absolute top-2 left-2 bg-black/70 text-white text-xs">
                {{ item.tahun_karya }}
              </Badge>
            </template>
            <template #subtitle-icon>
              <User class="w-3 h-3" />
            </template>
          </ArchiveCard>
        </SwiperSlide>
      </template>
    </Swiper>

    <!-- Custom Navigation Buttons -->
    <button class="swiper-button-prev-custom absolute top-1/2 -left-4 md:-left-15 z-10 -translate-y-1/2 w-10 h-10 bg-white border-2 border-black shadow-brutal flex items-center justify-center opacity-0 group-hover/swiper:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer hover:bg-stone-50">
      <ChevronLeft class="w-6 h-6" />
    </button>
    <button class="swiper-button-next-custom absolute top-1/2 -right-4 md:-right-15 z-10 -translate-y-1/2 w-10 h-10 bg-white border-2 border-black shadow-brutal flex items-center justify-center opacity-0 group-hover/swiper:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer hover:bg-stone-50">
      <ChevronRight class="w-6 h-6" />
    </button>
  </div>
</template>
