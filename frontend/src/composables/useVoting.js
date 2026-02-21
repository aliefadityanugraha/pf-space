import { ref } from 'vue'
import { api } from '@/lib/api'
import { useAuth } from './useAuth'

// Singleton state to share across components if needed
const films = ref([])
const categories = ref([])
const initialized = ref(false)

export function useVoting() {
  const isLoading = ref(false)
  const { isLoggedIn } = useAuth()

  const fetchFilms = async () => {
    // Optional: caching strategy. For now, fetch every time if not initialized or forced?
    // Let's fetch every time for fresh data, but use initialized to show loading state only once if we wanted.
    // But since votes change, we should probably fetch.
    
    isLoading.value = true
    try {
      // 1. Fetch Categories
      const catRes = await api.get('/api/categories')
      if (catRes.success) {
        categories.value = [
            { id: 'all', name: 'Semua Karya' },
            ...catRes.data.map(c => ({
                id: c.category_id,
                name: c.nama_kategori
            }))
        ]
      } else {
        // Fallback or empty
        categories.value = [{ id: 'all', name: 'Semua Karya' }]
      }

      // 2. Fetch Films (Trending/All)
      const filmsRes = await api.get('/api/votes/trending?period=all&limit=100')
      let filmData = []
      if (filmsRes.success) {
        filmData = filmsRes.data
      }

      // 3. Fetch User Votes if logged in
      let myVotes = []
      if (isLoggedIn.value) {
        try {
            const votesRes = await api.get('/api/votes/my-votes')
            if (votesRes.success) {
                myVotes = votesRes.data.map(v => v.film_id)
            }
        } catch (e) {
            console.error('Failed to fetch user votes', e)
        }
      }

      // 4. Merge Data
      films.value = filmData.map(f => ({
        id: f.film_id,
        slug: f.slug,
        title: f.judul,
        year: f.tahun_karya,
        director: f.creator?.name || f.creator?.username || 'Unknown',
        votes: parseInt(f.vote_count || 0),
        category: f.category?.category_id,
        categoryName: f.category?.nama_kategori || 'Uncategorized',
        image: f.gambar_poster || 'https://placehold.co/300x450/1c1917/f5f5f4?text=No+Image',
        hasVoted: myVotes.includes(f.film_id)
      }))

      initialized.value = true
    } catch (error) {
      console.error('Failed to fetch voting data:', error)
    } finally {
      isLoading.value = false
    }
  }

  const voteFilm = async (filmId) => {
    if (!isLoggedIn.value) {
        return { success: false, error: 'unauthorized', message: 'Please login to vote' }
    }

    try {
      const res = await api.post(`/api/votes/film/${filmId}`)
      if (res.success) {
        // Update local state
        const film = films.value.find(f => f.id === filmId)
        if (film) {
          film.votes = res.data.vote_count
          film.hasVoted = true
        }
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, error, message: error.message || 'Failed to vote' }
    }
  }

  return {
    films,
    categories,
    isLoading,
    fetchFilms,
    voteFilm
  }
}
