<script setup>
import { FileText, Download } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps({
  title: { type: String, required: true },
  fileType: { type: String, default: 'PDF' },
  fileSize: { type: String, default: '2.4 MB' }
})
</script>

<template>
  <div class="flex items-center justify-between p-4 bg-white border-2 border-stone-200 hover:border-stone-300 transition-colors">
    <div class="flex items-center gap-4">
      <div class="w-12 h-14 bg-stone-100 border border-stone-200 flex items-center justify-center">
        <FileText class="w-6 h-6 text-stone-500" />
      </div>
      <div>
        <h4 class="text-base font-bold font-body text-stone-800">{{ title }}</h4>
        <p class="text-xs font-body uppercase text-stone-500">{{ fileType }} • {{ fileSize }}</p>
      </div>
    </div>
    <Button variant="ghost" size="icon" class="bg-stone-100 hover:bg-stone-200">
      <Download class="w-5 h-5 text-stone-600" />
    </Button>
  </div>
</template>
