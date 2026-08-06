<script setup>
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { PenLine } from 'lucide-vue-next'
import PageLayout from '@/components/PageLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import FeedEditor from '@/components/production-feed/FeedEditor.vue'

useHead({
  title: 'Buat Post - Feed Produksi | PF Space',
  meta: [
    {
      name: 'description',
      content: 'Bagikan perkembangan produksi film Anda ke feed produksi PF Space.'
    },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const router = useRouter()

const goToFeed = () => router.push('/feed')

const handleSaved = (post) => {
  if (post?.post_id) {
    router.push(`/feed/${post.post_id}/edit`)
  } else {
    goToFeed()
  }
}

const handlePublished = () => goToFeed()
</script>

<template>
  <PageLayout>
    <div class="max-w-7xl mx-auto px-4 md:px-8 mt-4 md:mt-10 mb-16">
      <PageHeader
        title="Buat Post Produksi"
        description="Bagikan progress, behind the scenes, casting, pengumuman, atau momen wrap produksimu."
      >
        <template #extra>
          <span class="mt-3 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-400">
            <PenLine class="w-3.5 h-3.5" />
            Creator Mode
          </span>
        </template>
      </PageHeader>

      <FeedEditor
        mode="create"
        @saved="handleSaved"
        @published="handlePublished"
        @cancel="goToFeed"
      />
    </div>
  </PageLayout>
</template>
