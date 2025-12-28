<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import HeroSection from '@/components/HeroSection.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieListItem from '@/components/MovieListItem.vue'
import FilmInfoCard from '@/components/FilmInfoCard.vue'
import Footer from '@/components/Footer.vue'

const studentWorks = ref([
  { id: 1, image: 'https://placehold.co/252x380', rating: 4.8 },
  { id: 2, image: 'https://placehold.co/252x380', rating: null },
  { id: 3, image: 'https://placehold.co/252x380', rating: null },
  { id: 4, image: 'https://placehold.co/252x380', rating: null },
  { id: 5, image: 'https://placehold.co/252x380', rating: null },
  { id: 6, image: 'https://placehold.co/252x380', rating: null },
])

const movieList = ref([
  { id: 1, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
  { id: 2, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
  { id: 3, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
  { id: 4, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
  { id: 5, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
  { id: 6, title: 'Echoes of Jakarta', director: 'Andi Wijaya', votes: '1.2k' },
])

const featuredFilms = ref([
  {
    id: 1,
    image: 'https://placehold.co/252x380',
    title: 'The Silent Echo',
    year: '2024',
    duration: '1h 45m',
    genres: ['Drama', 'Education', 'Archival'],
    description: 'Explain the artistic choices behind your poster design. What do the colors represent? How does it connect to the film\'s theme?'
  },
  {
    id: 2,
    image: 'https://placehold.co/252x380',
    title: 'The Silent Echo',
    year: '2024',
    duration: '1h 45m',
    genres: ['Drama', 'Education', 'Archival'],
    description: 'Explain the artistic choices behind your poster design. What do the colors represent? How does it connect to the film\'s theme?'
  },
])
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3]">
    <Navbar />
    <HeroSection />

    <!-- Student Works Section -->
    <section class="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <SectionHeader 
        title="Student Works" 
        subtitle="Vote for the monthly showcase selection"
        :light-text="false"
      />
      
      <!-- Movie Cards Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <MovieCard 
          v-for="movie in studentWorks" 
          :key="movie.id"
          :image="movie.image"
          :rating="movie.rating"
        />
      </div>

      <!-- Movie List Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <MovieListItem 
          v-for="item in movieList" 
          :key="item.id"
          :title="item.title"
          :director="item.director"
          :votes="item.votes"
        />
      </div>
    </section>

    <!-- Featured Films Section -->
    <section class="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <SectionHeader 
        title="Featured Films" 
        subtitle="Curated selection from our archive"
      />
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div v-for="film in featuredFilms" :key="film.id" class="flex flex-col md:flex-row gap-4">
          <div class="w-full md:w-64 flex-shrink-0">
            <MovieCard :image="film.image" />
          </div>
          <FilmInfoCard 
            :title="film.title"
            :year="film.year"
            :duration="film.duration"
            :genres="film.genres"
            :description="film.description"
            class="flex-1"
          />
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>
