<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { PencilRuler } from 'lucide-vue-next'
import PageLayout from '@/components/PageLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import FeedEditor from '@/components/production-feed/FeedEditor.vue'

import { useToast } from '@/composables/useToast'

useHead({
  title: 'Edit Post - Feed Produksi | PF Space',
  meta: [
    {
      name: 'description',
      content: 'Perbarui post produksi Anda di feed produksi PF Space.'
    },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const postId = route.params.id

const goToFeed = () => router.push('/feed')
const handlePublished = () => goToFeed()
const handleDeleted = () => {
  showToast('Postingan berhasil dihapus', 'success')
  goToFeed()
}
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-10 mb-16">
      <PageHeader
        title="Edit Post Produksi"
        description="Perbarui konten, media, cover, atau atur publikasi post produksimu."
      >
        <template #extra>
          <span class="mt-3 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400">
            <PencilRuler class="w-3.5 h-3.5" />
            Creator Mode
          </span>
        </template>
      </PageHeader>

      <FeedEditor
        mode="edit"
        :post-id="postId"
        @published="handlePublished"
        @deleted="handleDeleted"
        @cancel="goToFeed"
      />
    </div>
  </PageLayout>
</template>
