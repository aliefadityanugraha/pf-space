<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ContentSection from '@/components/ContentSection.vue'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Eye } from 'lucide-vue-next'
import { formatDate } from '@/lib/format'

const props = defineProps({
  film: { type: Object, required: true },
})

const router = useRouter()

const hasLearningAssets = computed(
  () =>
    props.film?.file_naskah ||
    props.film?.file_storyboard ||
    props.film?.file_rab,
)
</script>

<template>
  <div
    class="lg:col-span-1 space-y-6 animate-fade-in-up"
    style="animation-delay: 400ms; opacity: 0; animation-fill-mode: forwards"
  >
    <!-- Learning Assets -->
    <ContentSection title="Aset Pembelajaran" color="teal">
      <div class="space-y-3">
        <router-link
          v-if="film.file_naskah"
          :to="{
            name: 'AssetDetail',
            params: { archiveSlug: film.slug, assetSlug: 'naskah-film' },
          }"
          class="flex items-center justify-between p-2.5 md:p-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 transition-colors group"
        >
          <div class="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
            <FileText class="w-4 h-4 md:w-5 md:h-5 text-brand-red shrink-0" />
            <div class="min-w-0 flex-1">
              <span class="font-medium text-xs md:text-sm block truncate text-stone-900 dark:text-stone-100"
                >Naskah Karya</span
              >
              <span class="text-[10px] md:text-xs text-stone-500 dark:text-stone-400">PDF</span>
            </div>
          </div>
          <Eye
            class="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400 group-hover:text-brand-red transition-colors shrink-0 ml-2"
          />
        </router-link>
        <router-link
          v-if="film.file_storyboard"
          :to="{
            name: 'AssetDetail',
            params: { archiveSlug: film.slug, assetSlug: 'storyboard' },
          }"
          class="flex items-center justify-between p-2.5 md:p-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 transition-colors group"
        >
          <div class="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
            <FileText class="w-4 h-4 md:w-5 md:h-5 text-brand-teal shrink-0" />
            <div class="min-w-0 flex-1">
              <span class="font-medium text-xs md:text-sm block truncate text-stone-900 dark:text-stone-100"
                >Storyboard</span
              >
              <span class="text-[10px] md:text-xs text-stone-500 dark:text-stone-400">PDF</span>
            </div>
          </div>
          <Eye
            class="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400 group-hover:text-brand-teal transition-colors shrink-0 ml-2"
          />
        </router-link>
        <router-link
          v-if="film.file_rab"
          :to="{
            name: 'AssetDetail',
            params: { archiveSlug: film.slug, assetSlug: 'rab' },
          }"
          class="flex items-center justify-between p-2.5 md:p-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 transition-colors group"
        >
          <div class="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
            <FileText class="w-4 h-4 md:w-5 md:h-5 text-brand-orange shrink-0" />
            <div class="min-w-0 flex-1">
              <span class="font-medium text-xs md:text-sm block truncate text-stone-900 dark:text-stone-100"
                >RAB (Anggaran)</span
              >
              <span class="text-[10px] md:text-xs text-stone-500 dark:text-stone-400">PDF</span>
            </div>
          </div>
          <Eye
            class="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400 group-hover:text-brand-orange transition-colors shrink-0 ml-2"
          />
        </router-link>
        <p
          v-if="!film.file_naskah && !film.file_storyboard && !film.file_rab"
          class="text-sm text-stone-400 text-center py-4"
        >
          Tidak ada dokumen
        </p>
      </div>
    </ContentSection>

    <!-- Film Info Card -->
    <Card class="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 text-stone-900 dark:text-stone-100 shadow-brutal">
      <CardContent class="p-3 md:p-4">
        <h3 class="font-bold mb-3 md:mb-4 text-sm md:text-base text-stone-900 dark:text-stone-100">Informasi Karya</h3>
        <div class="space-y-2.5 md:space-y-3 text-xs md:text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-stone-500 dark:text-stone-400 shrink-0">Kategori</span>
            <router-link
              v-if="film.category"
              :to="{ path: '/films', query: { category_id: film.category.category_id } }"
              class="font-medium text-right truncate text-brand-teal hover:underline"
              :aria-label="`Lihat semua karya kategori ${film.category.nama_kategori}`"
            >
              {{ film.category.nama_kategori }}
            </router-link>
            <span v-else class="font-medium text-right truncate text-stone-900 dark:text-stone-100">-</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-stone-500 dark:text-stone-400 shrink-0">Tahun</span>
            <span class="font-medium text-right text-stone-900 dark:text-stone-100">{{
              film.tahun_karya || '-'
            }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-stone-500 dark:text-stone-400 shrink-0">Pembuat</span>
            <span class="font-medium text-right truncate text-stone-900 dark:text-stone-100">{{
              film.creator?.name || '-'
            }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-stone-500 dark:text-stone-400 shrink-0">Dipublikasi</span>
            <span class="font-medium text-right text-stone-900 dark:text-stone-100">{{
              formatDate(film.created_at)
            }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
