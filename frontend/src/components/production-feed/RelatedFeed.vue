<script setup>
import { ref, onMounted } from 'vue'
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import { assetUrl, formatDate } from '@/lib/format'
import { fetchRelatedPosts } from '@/modules/production-feed/api'
import LazyImage from '@/components/LazyImage.vue'
import Skeleton from '@/components/ui/Skeleton.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  limit: {
    type: Number,
    default: 4
  }
})

const related = ref([])
const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')

const loadRelated = async () => {
  if (!props.post?.postId) return
  isLoading.value = true
  isError.value = false
  errorMessage.value = ''
  try {
    related.value = await fetchRelatedPosts(props.post, props.limit)
  } catch (err) {
    isError.value = true
    related.value = []
    errorMessage.value = err?.message || 'Gagal memuat bacaan terkait.'
  } finally {
    isLoading.value = false
  }
}

const cover = (post) => assetUrl(post.cover)

onMounted(loadRelated)
</script>

<template>
  <section v-if="related.length || isLoading || isError" class="mt-14 md:mt-20">
    <div class="flex items-end justify-between gap-4 mb-6">
      <h2 class="font-display text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
        Bacaan Terkait
      </h2>
      <router-link
        to="/feed"
        class="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold uppercase tracking-widest text-brand-teal hover:text-brand-red transition-colors"
      >
        Semua Feed
        <ArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <!-- Error -->
    <div
      v-if="isError"
      class="flex flex-col items-center gap-3 border-2 border-stone-900 dark:border-stone-100 shadow-brutal-sm bg-white dark:bg-stone-900 p-6 text-center text-stone-900 dark:text-stone-100"
      role="alert"
    >
      <AlertTriangle class="w-6 h-6 text-brand-red" />
      <p class="font-body text-sm text-stone-600 dark:text-stone-300">
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border-2 border-stone-900 dark:border-stone-100 bg-brand-teal text-white font-body text-xs font-bold uppercase tracking-wide px-3 py-1.5 shadow-brutal-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
        @click="loadRelated"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        Coba Lagi
      </button>
    </div>

    <div v-else-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="n in Math.min(limit, 4)" :key="n" class="border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
        <Skeleton class="aspect-video w-full mb-3" />
        <Skeleton class="h-3 w-3/4 mb-2" />
        <Skeleton class="h-3 w-full mb-1" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <router-link
        v-for="post in related"
        :key="post.postId"
        :to="`/feed/${post.slug || post.postId}`"
        class="group block border-2 border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-900 shadow-brutal-xs hover:shadow-brutal-md hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all text-stone-900 dark:text-stone-100"
      >
        <div class="aspect-video w-full overflow-hidden bg-stone-200 dark:bg-stone-800 border-b-2 border-stone-900 dark:border-stone-100">
          <LazyImage
            :src="cover(post)"
            :alt="post.judul"
            wrapper-class="w-full h-full"
            img-class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          >
            <template #fallback>
              <span class="font-display font-black text-2xl text-brand-orange uppercase">
                {{ post.judul.charAt(0) }}
              </span>
            </template>
          </LazyImage>
        </div>
        <div class="p-3 md:p-4">
          <h3
            class="font-display font-bold text-sm md:text-base text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 group-hover:text-brand-teal transition-colors"
          >
            {{ post.judul }}
          </h3>
          <p class="mt-2 text-[11px] md:text-xs font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {{ post.creator?.name || 'Creator' }}
          </p>
          <p
            v-if="post.publishedAt || post.createdAt"
            class="text-[10px] md:text-[11px] text-stone-400 dark:text-stone-500 font-body"
          >
            {{ formatDate(post.publishedAt || post.createdAt) }}
          </p>
        </div>
      </router-link>
    </div>
  </section>
</template>
