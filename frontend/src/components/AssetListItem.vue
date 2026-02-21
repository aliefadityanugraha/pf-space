<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FileText, Download, ExternalLink } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps({
  title: { type: String, required: true },
  fileType: { type: String, default: 'PDF' },
  fileSize: { type: String, default: '2.4 MB' },
  filmSlug: { type: String, default: '' }
})

const route = useRoute()

// Generate slug from title
const assetSlug = computed(() => {
  return props.title.toLowerCase().replace(/\s+/g, '-')
})

// Get filmSlug from props or route
const currentFilmSlug = computed(() => {
  return props.filmSlug || route.params.slug || ''
})
</script>

<template>
  <router-link 
    :to="{ name: 'LearningAsset', params: { filmSlug: currentFilmSlug, assetSlug: assetSlug } }"
    class="block"
  >
    <div class="flex items-center justify-between p-4 bg-white border-2 border-stone-200 hover:border-stone-400 hover:shadow-md transition-all cursor-pointer group">
      <div class="flex items-center gap-4">
        <div class="w-12 h-14 bg-stone-100 border border-stone-200 flex items-center justify-center group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
          <FileText class="w-6 h-6 text-stone-500 group-hover:text-teal-600 transition-colors" />
        </div>
        <div>
          <h4 class="text-base font-bold font-body text-stone-800 group-hover:text-teal-700 transition-colors">{{ title }}</h4>
          <p class="text-xs font-body uppercase text-stone-500">{{ fileType }} • {{ fileSize }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          class="bg-stone-100 hover:bg-stone-200"
          @click.prevent.stop
        >
          <Download class="w-5 h-5 text-stone-600" />
        </Button>
        <ExternalLink class="w-4 h-4 text-stone-400 group-hover:text-teal-600 transition-colors" />
      </div>
    </div>
  </router-link>
</template>
