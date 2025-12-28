<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import DetailHero from '@/components/DetailHero.vue'
import ContentSection from '@/components/ContentSection.vue'
import TagList from '@/components/TagList.vue'
import LearningAssetItem from '@/components/LearningAssetItem.vue'
import DiscussionForum from '@/components/DiscussionForum.vue'

const film = ref({
  title: 'The Silent Echo',
  year: '2024',
  duration: '1h 45m',
  genres: ['Drama', 'Education', 'Archival'],
  posterImage: 'https://lumiere-a.akamaihd.net/v1/images/24_coral3_payoff_1sht_indonesia_2_34326e52.jpeg?region=0%2C0%2C734%2C1100',
  backgroundImage: 'https://placehold.co/1920x860'
})

const synopsis = `In a remote mountain village rapidly emptying of its youth, a young student stumbles upon a forgotten archive of 16mm films in the basement of the local town hall. Through the lens of these decayed reels, they begin to reconstruct the history of their community—uncovering a silenced protest movement from decades ago. "The Silent Echo" weaves together present-day narrative with restored archival footage, exploring the fragile nature of memory and the importance of preserving cultural heritage.`

const tags = ref(['Cinematography', 'ArchiveRestoration', 'DigitalHistory'])

const learningAssets = ref([
  { title: 'Naskah Film', fileType: 'PDF', fileSize: '2.4 MB' },
  { title: 'Storyboard', fileType: 'PDF', fileSize: '15 MB' },
  { title: 'RAB', fileType: 'PDF', fileSize: '1.2 MB' }
])
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />
    
    <DetailHero 
      :title="film.title"
      :year="film.year"
      :duration="film.duration"
      :genres="film.genres"
      :poster-image="film.posterImage"
      :background-image="film.backgroundImage"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <!-- Left Column: Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- <ContentSection title="Synopsis" color="red">
            <p>{{ synopsis }}</p>
            <TagList :tags="tags" />
          </ContentSection> -->

          <ContentSection title="Back Story" color="red">
            <p>{{ synopsis }}</p>
          </ContentSection>

          <ContentSection title="Director Statement" color="red">
            <p>{{ synopsis }}</p>
          </ContentSection>

          <ContentSection title="Cast & Crew" color="red">
            <p>{{ synopsis }}</p>
          </ContentSection>
        </div>

        <!-- Right Column: Learning Assets -->
        <div class="lg:col-span-1">
          <ContentSection title="Learning Assets" color="teal">
            <div class="space-y-3">
              <LearningAssetItem 
                v-for="asset in learningAssets" 
                :key="asset.title"
                :title="asset.title"
                :file-type="asset.fileType"
                :file-size="asset.fileSize"
              />
            </div>
          </ContentSection>
        </div>
      </div>

      <!-- Discussion Forum -->
      <div class="mt-12">
        <DiscussionForum :comment-count="12" />
      </div>
    </main>

    <Footer />
  </div>
</template>
