<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import DashboardHero from '@/components/DashboardHero.vue'
import DashboardSection from '@/components/DashboardSection.vue'
import WatchProgressCard from '@/components/WatchProgressCard.vue'
import CollectionCard from '@/components/CollectionCard.vue'
import CuratedFilmCard from '@/components/CuratedFilmCard.vue'
import UserProfileCard from '@/components/UserProfileCard.vue'
import { Clock } from 'lucide-vue-next'

const featuredFilm = ref({
  title: 'Metropolis (1927)',
  category: 'German Expressionism',
  badge: 'Featured Restoration',
  description: 'Welcome back, Anna. Continue your journey into the dystopian future. You have 24 minutes remaining in this session.',
  dueDate: 'Oct 24',
  backgroundImage: 'https://placehold.co/1028x480'
})

const recentlyProjected = ref([
  { id: 1, title: 'Bicycle Thieves', progress: 45, remaining: '54m' },
  { id: 2, title: 'The Seventh Seal', progress: 85, remaining: '12m' },
  { id: 3, title: 'Modern Times', progress: 100, completed: true, completedDate: 'Oct 20' },
  { id: 4, title: 'Seven Samurai', progress: 10, remaining: '2h' },
])

const collections = ref([
  { id: 1, title: 'French New Wave', image: 'https://placehold.co/320x208' },
  { id: 2, title: 'Italian Neorealism', image: 'https://placehold.co/320x208' },
])

const curatedFilms = ref([
  { id: 1, title: 'Citizen Kane', year: '1941', genre: 'Drama' },
  { id: 2, title: 'Breathless', year: '1960', genre: 'New Wave' },
  { id: 3, title: '2001: A Space Odyssey', year: '1968', genre: 'Sci-Fi' },
  { id: 4, title: 'The 400 Blows', year: '1959', genre: 'Drama' },
])
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-12">
      <!-- Featured Hero -->
      <DashboardHero 
        :title="featuredFilm.title"
        :category="featuredFilm.category"
        :badge="featuredFilm.badge"
        :description="featuredFilm.description"
        :due-date="featuredFilm.dueDate"
        :background-image="featuredFilm.backgroundImage"
        class="mb-12"
      />

      <!-- Recently Projected -->
      <DashboardSection title="Recently Projected">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <WatchProgressCard 
            v-for="film in recentlyProjected"
            :key="film.id"
            :title="film.title"
            :progress="film.progress"
            :remaining="film.remaining"
            :completed="film.completed"
            :completed-date="film.completedDate"
          />
        </div>
      </DashboardSection>

      <!-- From the Vault -->
      <DashboardSection title="From the Vault" link-text="View All Collections">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <CollectionCard 
            v-for="collection in collections"
            :key="collection.id"
            :title="collection.title"
            :image="collection.image"
          />
          <CollectionCard :is-create-new="true" />
        </div>
      </DashboardSection>

      <!-- User Profile Card -->
      <UserProfileCard name="Anna" class="mb-12" />

      <!-- Curated For You (Dark Section) -->
      <div class="bg-stone-900 rounded-2xl p-6 md:p-8">
        <DashboardSection title="Curated For You" :dark-mode="true">
          <template #header-right>
            <div class="flex items-center gap-2 text-stone-400">
              <Clock class="w-4 h-4" />
              <span class="text-sm font-body">Based on your history</span>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <CuratedFilmCard 
              v-for="film in curatedFilms"
              :key="film.id"
              :title="film.title"
              :year="film.year"
              :genre="film.genre"
            />
          </div>
        </DashboardSection>
      </div>
    </main>

    <Footer />
  </div>
</template>
