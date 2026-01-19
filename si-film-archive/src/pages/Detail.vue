<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'

import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import ContentSection from '@/components/ContentSection.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Film, Play, User, Calendar, Loader2, Heart, MessageCircle, 
  FileText, Download, ExternalLink, Send, Bookmark, Share2, Eye
} from 'lucide-vue-next'

import CommentItem from '@/components/CommentItem.vue'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/lib/format'
import { useHead } from '@unhead/vue'

const route = useRoute()
const router = useRouter()
const filmSlug = computed(() => route.params.slug || route.params.id)

// Data
const film = ref(null)

// SEO Dynamic
useHead({
  title: () => film.value ? `${film.value.judul} - PF Space` : 'Memuat Film...',
  meta: [
    { name: 'description', content: () => film.value?.sinopsis || 'Detail arsip film.' },
    { property: 'og:title', content: () => film.value?.judul },
    { property: 'og:description', content: () => film.value?.sinopsis },
    { property: 'og:image', content: () => film.value?.gambar_poster },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
})

const { user, isLoggedIn, isAdmin, isModerator } = useAuth()
const heroRef = ref(null)
const isLightTitle = ref(true)

const loading = ref(true)
const voteData = ref({ vote_count: 0, has_voted: false })
const voting = ref(false)

// Film ID computed (after film is fetched)
const filmId = computed(() => film.value?.film_id)

// Collection - will be initialized after film is fetched
const collectionState = ref({
  isInCollection: false,
  processing: false
})

const isInCollection = computed(() => collectionState.value.isInCollection)
const processingCollection = computed(() => collectionState.value.processing)

// Comments
const comments = ref([])
const loadingComments = ref(false)
const newComment = ref('')
const submittingComment = ref(false)

const canModerate = computed(() => isAdmin.value || isModerator.value)

// Toast state
const { toast, showToast } = useToast()

const handleScroll = () => {
  if (heroRef.value) {
    const heroHeight = heroRef.value.offsetHeight || 600
    isLightTitle.value = window.scrollY < heroHeight - 80
  }
}

// Fetch film detail by slug
const fetchFilm = async () => {
  if (!filmSlug.value) {
    router.push('/')
    return
  }
  
  loading.value = true
  try {
    const res = await api.get(`/api/films/${filmSlug.value}`)
    film.value = res.data
    // Now that we have film_id, fetch related data
    fetchVoteData()
    fetchCollectionStatus()
    fetchComments()
  } catch (err) {
    console.error('Failed to fetch film:', err)
    router.push('/')
  } finally {
    loading.value = false
  }
}

// Fetch vote data
const fetchVoteData = async () => {
  if (!filmId.value) return
  try {
    const res = await api.get(`/api/votes/film/${filmId.value}`)
    voteData.value = res.data
  } catch (err) {
    console.error('Failed to fetch votes:', err)
  }
}

// Toggle vote
const toggleVote = async () => {
  if (!isLoggedIn.value) {
    router.push('/auth/login')
    return
  }
  if (!filmId.value) return
  
  voting.value = true
  try {
    const res = await api.post(`/api/votes/film/${filmId.value}/toggle`, {})
    voteData.value = {
      vote_count: res.data.vote_count,
      has_voted: res.data.voted
    }
  } catch (err) {
    console.error('Failed to vote:', err)
  } finally {
    voting.value = false
  }
}

// Fetch comments
const fetchComments = async () => {
  if (!filmId.value) return
  loadingComments.value = true
  try {
    const res = await api.get(`/api/discussions/film/${filmId.value}`)
    comments.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch comments:', err)
  } finally {
    loadingComments.value = false
  }
}

// Fetch collection status
const fetchCollectionStatus = async () => {
  if (!filmId.value || !isLoggedIn.value) return
  try {
    const res = await api.get('/api/collections/my-collections')
    const raw = res.data
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    const found = list.some(item => {
      return item.film_id === filmId.value || item.film?.film_id === filmId.value
    })
    collectionState.value.isInCollection = found
  } catch (err) {
    console.error('Failed to fetch collection status:', err)
  }
}

// Toggle collection
const handleToggleCollection = async () => {
  if (!isLoggedIn.value) {
    router.push('/auth/login')
    return
  }
  if (!filmId.value) return
  
  const previous = collectionState.value.isInCollection
  collectionState.value.processing = true
  try {
    const res = await api.post(`/api/collections/toggle/${filmId.value}`, {})
    const data = res.data
    let inCollection = !previous

    if (typeof data === 'boolean') {
      inCollection = data
    } else if (data) {
      if (typeof data.in_collection === 'boolean') {
        inCollection = data.in_collection
      } else if (typeof data.inCollection === 'boolean') {
        inCollection = data.inCollection
      } else if (typeof data.in_collection === 'number') {
        inCollection = data.in_collection === 1
      }
    }

    collectionState.value.isInCollection = inCollection
    showToast(inCollection ? 'Ditambahkan ke koleksi' : 'Dihapus dari koleksi')
  } catch (err) {
    collectionState.value.isInCollection = previous
    showToast(err.message || 'Gagal mengubah koleksi', 'error')
  } finally {
    collectionState.value.processing = false
  }
}

// Share function
const handleShare = async () => {
  const shareData = {
    title: film.value?.judul || 'PF Space Film',
    text: `Tonton film ${film.value?.judul} di PF Space`,
    url: window.location.href
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link berhasil disalin!')
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error sharing:', err)
      // Fallback to clipboard if share fails (optional, but good UX)
      try {
        await navigator.clipboard.writeText(window.location.href)
        showToast('Link berhasil disalin!')
      } catch (clipboardErr) {
        showToast('Gagal membagikan', 'error')
      }
    }
  }
}

// Submit comment
const submitComment = async (data = null) => {
  const isReply = !!data && !!data.parent_id
  const text = isReply ? data.isi_pesan : newComment.value.trim()
  const parentId = isReply ? data.parent_id : null

  if (!text || !isLoggedIn.value || !filmId.value) return
  
  submittingComment.value = !isReply
  try {
    await api.post(`/api/discussions/film/${filmId.value}`, {
      isi_pesan: text,
      parent_id: parentId
    })
    if (!isReply) newComment.value = ''
    await fetchComments()
    showToast(isReply ? 'Balasan terkirim' : 'Komentar terkirim')
  } catch (err) {
    console.error('Failed to submit comment:', err)
    showToast(err.message || 'Gagal mengirim komentar', 'error')
  } finally {
    submittingComment.value = false
  }
}

const deleteComment = async (id) => {
  if (!confirm('Hapus komentar ini? Semua balasan juga akan terhapus.')) return
  
  try {
    await api.delete(`/api/discussions/${id}`)
    await fetchComments()
    showToast('Komentar berhasil dihapus')
  } catch (err) {
    console.error('Failed to delete comment:', err)
    showToast('Gagal menghapus komentar', 'error')
  }
}

const totalCommentCount = computed(() => {
  let count = 0
  const countRecursive = (list) => {
    count += list.length
    list.forEach(c => {
      if (c.replies && c.replies.length > 0) countRecursive(c.replies)
    })
  }
  countRecursive(comments.value)
  return count
})

// Get YouTube embed URL
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return url
}

// Parse deskripsi_lengkap into sections based on H2
const parsedSections = computed(() => {
  if (!film.value?.deskripsi_lengkap) return []
  
  const content = film.value.deskripsi_lengkap
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const children = Array.from(doc.body.childNodes)
  
  const sections = []
  let currentTitle = 'Eksplorasi Karya'
  let currentContentNodes = []
  
  const pushSection = () => {
    if (currentContentNodes.length > 0) {
      // Create a temporary container to get innerHTML of accumulated nodes
      const container = document.createElement('div')
      currentContentNodes.forEach(node => container.appendChild(node.cloneNode(true)))
      
      // Only push if there's actual content (not just whitespace)
      if (container.innerHTML.trim()) {
        sections.push({
          title: currentTitle,
          content: container.innerHTML
        })
      }
    }
  }
  
  children.forEach(node => {
    // Check if node is H2
    if (node.nodeType === 1 && node.tagName === 'H2') {
      pushSection()
      // Start new section
      currentTitle = node.textContent || 'Section'
      currentContentNodes = []
    } else {
      currentContentNodes.push(node)
    }
  })
  
  // Push the last section
  pushSection()
  
  return sections
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  fetchFilm()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar :light-title="isLightTitle" />
    <Toast v-bind="toast" @close="toast.show = false" />
    
    <!-- Loading -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center pt-20">
      <Loader2 class="w-8 h-8 animate-spin text-stone-400" />
    </div>

    <template v-else-if="film">
      <!-- Hero Section - Original Design -->
      <section ref="heroRef" class="relative min-h-[500px] md:min-h-[700px]">
        <!-- Background with gradient -->
        <div class="absolute inset-0">
          <img src="/banner.webp" alt="Film background" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#F2EEE3] via-transparent/50 to-transparent"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32">
          <div class="flex flex-col md:flex-row gap-8 md:gap-12">
            <!-- Poster -->
            <div class="w-full max-w-xs mx-auto md:mx-0 flex-shrink-0 animate-scale-in group perspective-1000">
              <div class="aspect-[3/4] bg-stone-800 shadow-brutal-lg border-2 border-slate-900 overflow-hidden transition-all duration-500 ease-out transform group-hover:rotate-y-6 group-hover:scale-105 group-hover:shadow-brutal-xl">
                <img 
                  v-if="film.gambar_poster"
                  :src="film.gambar_poster" 
                  :alt="film.judul"
                  class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Film class="w-16 h-16 text-stone-600" />
                </div>
                <!-- Shine effect -->
                <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 pb-8 animate-fade-in-up" style="animation-delay: 100ms;">
              <!-- Tags -->
              <!--<div class="flex flex-wrap gap-2 mb-4">
                <Badge variant="default" class="bg-stone-800">
                  Release: {{ film.tahun_karya || '-' }}
                </Badge>
                <Badge v-if="film.category" variant="outline" class="bg-white">
                  {{ film.category.nama_kategori }}
                </Badge>
              </div> -->

              <!-- Title -->
              <h1 class="text-3xl md:text-5xl font-display font-semibold text-white mb-4 mt-15 drop-shadow-lg">
                {{ film.judul }}
              </h1>

              <!-- Creator -->
              <div class="flex flex-wrap items-center gap-2 text-sm font-body text-white mb-6">
                <User class="w-4 h-4" />
                <span>{{ film.creator?.name || 'Unknown' }}</span>
                <Badge variant="default" class="bg-stone-800">
                  Release: {{ film.tahun_karya || '-' }}
                </Badge>
                <Badge v-if="film.category" variant="outline" class="bg-white">
                  {{ film.category.nama_kategori }}
                </Badge>
              </div>

              <!-- Synopsis -->
              <div class="mb-8">
                <h3 class="text-lg font-display font-semibold text-white mb-2">Synopsis</h3>
                <p class="text-sm md:text-base text-white/90 leading-relaxed line-clamp-4">
                  {{ film.sinopsis || 'Tidak ada sinopsis.' }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap gap-3">
                <Button 
                  v-if="film.link_video_utama"
                  variant="default"
                  class="bg-brand-red hover:bg-red-600"
                  @click="router.push(`/watch/${film.slug}`)"
                >
                  <Play class="w-4 h-4 mr-2" />
                  Tonton Film
                </Button>
                <Button 
                  variant="outline" 
                  class="bg-white text-stone-800"
                  @click="handleToggleCollection"
                  :disabled="processingCollection"
                  :class="isInCollection ? 'bg-orange-50 border-brand-orange text-brand-orange' : ''"
                >
                  <Loader2 v-if="processingCollection" class="w-4 h-4 mr-2 animate-spin" />
                  <Bookmark v-else :class="['w-4 h-4 mr-2', isInCollection ? 'fill-current' : '']" />
                  {{ isInCollection ? 'Tersimpan' : 'Simpan ke Koleksi' }}
                </Button>
                <Button variant="outline" class="bg-white text-stone-800" @click="handleShare">
                  <Share2 class="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="destructive"
                  @click="toggleVote"
                  :disabled="voting"
                  :class="voteData.has_voted ? 'bg-pink-600' : ''"
                >
                  <Loader2 v-if="voting" class="w-4 h-4 mr-2 animate-spin" />
                  <Heart v-else :class="['w-4 h-4 mr-2', voteData.has_voted ? 'fill-current' : '']" />
                  {{ voteData.vote_count }} Vote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 md:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <!-- Left Column: Main Content -->
          <div class="lg:col-span-2 space-y-8 animate-fade-in-up" style="animation-delay: 300ms; opacity: 0; animation-fill-mode: forwards;">
            

            <!-- Back Story -->
            <!-- <ContentSection title="Back Story" color="red">
              <p class="whitespace-pre-line">{{ film.sinopsis || 'In a remote mountain village rapidly emptying of its youth, a young student stumbles upon a forgotten archive of 16mm films in the basement of the local town hall. Through the lens of these decayed reels, they begin to reconstruct the history of their community—uncovering a silenced protest movement from decades ago. "The Silent Echo" weaves together present-day narrative with restored archival footage, exploring the fragile nature of memory and the importance of preserving cultural heritage.' }}</p>
            </ContentSection> -->

            <!-- Informasi Tambahan (Dynamic Sections) -->
            <template v-if="film.deskripsi_lengkap">
              <ContentSection 
                v-for="(section, idx) in parsedSections" 
                :key="idx"
                :title="section.title" 
                color="red"
              >
                <div class="prose prose-sm max-w-none font-body" v-html="section.content"></div>
              </ContentSection>
            </template>

            <!-- Cast & Crew -->
            <ContentSection title="Cast & Crew" color="red">
              <div v-if="film.crew && film.crew.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(item, idx) in film.crew" :key="idx" class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">{{ item.jabatan }}</p>
                  <p class="text-sm text-stone-600">{{ item.anggota?.join(', ') }}</p>
                </div>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Director</p>
                  <p class="text-sm text-stone-600">{{ film.creator?.name || 'Unknown' }}</p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Producer</p>
                  <p class="text-sm text-stone-600">{{ film.creator?.name || 'Unknown' }}</p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Cinematographer</p>
                  <p class="text-sm text-stone-600">-</p>
                </div>
                <div class="p-3 bg-stone-100 rounded">
                  <p class="font-bold text-sm text-stone-900">Editor</p>
                  <p class="text-sm text-stone-600">-</p>
                </div>
              </div>
            </ContentSection>

            <!-- Comments Section -->
            <ContentSection title="Diskusi" color="red">
              <div class="flex items-center gap-2 mb-4">
                <MessageCircle class="w-5 h-5" />
                <span class="text-sm text-stone-500 font-bold font-mono tracking-tight uppercase">{{ totalCommentCount }} KOMENTAR</span>
              </div>

              <!-- Comment Form -->
              <div v-if="isLoggedIn" class="mb-8 p-4 bg-white border-2 border-stone-800 shadow-brutal-sm">
                <div class="flex gap-4">
                  <div class="w-10 h-10 bg-brand-orange border-2 border-stone-800 shadow-brutal-xs flex items-center justify-center text-stone-900 font-bold flex-shrink-0">
                    {{ user?.name?.charAt(0) || 'U' }}
                  </div>
                  <div class="flex-1">
                    <textarea 
                      v-model="newComment"
                      rows="3"
                      placeholder="Apa pendapatmu tentang karya ini?"
                      class="w-full p-3 border-2 border-stone-800 bg-white text-sm resize-none focus:ring-0 focus:outline-none mb-3 font-body"
                    ></textarea>
                    <div class="flex justify-end">
                      <Button 
                        @click="submitComment()"
                        :disabled="!newComment.trim() || submittingComment"
                        class="gap-2 shadow-brutal-xs"
                      >
                        <Loader2 v-if="submittingComment" class="w-4 h-4 animate-spin" />
                        <Send v-else class="w-4 h-4" />
                        Kirim Komentar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mb-8 p-6 bg-stone-100 border-2 border-dashed border-stone-400 text-center">
                <p class="text-stone-600 mb-4 font-body">Bergabung dalam diskusi untuk memberikan apresiasi atau masukan.</p>
                <Button variant="outline" class="border-2 border-stone-800 shadow-brutal-xs" @click="router.push('/auth/login')">Login Untuk Berkomentar</Button>
              </div>

              <!-- Comments List -->
              <div v-if="loadingComments" class="flex justify-center py-12">
                <Loader2 class="w-10 h-10 animate-spin text-brand-teal" />
              </div>
              <div v-else-if="comments.length === 0" class="text-center py-12 border-2 border-stone-200 bg-stone-50/50">
                <MessageCircle class="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p class="text-stone-400 font-body italic">
                  Belum ada diskusi untuk karya ini. Jadilah yang pertama!
                </p>
                <p v-if="isLoggedIn" class="text-stone-500 font-body mt-3">
                  Tulis komentar pertamamu melalui formulir di atas.
                </p>
                <p v-else class="text-stone-500 font-body mt-3">
                  Login terlebih dahulu untuk mulai berdiskusi.
                </p>
              </div>
              <div v-else class="space-y-2">
                <CommentItem 
                  v-for="comment in comments" 
                  :key="comment.diskusi_id"
                  :comment="comment"
                  :is-logged-in="isLoggedIn"
                  :current-user="user"
                  :can-moderate="canModerate"
                  @reply="submitComment"
                  @delete="deleteComment"
                />
              </div>
            </ContentSection>
          </div>

          <!-- Right Column: Learning Assets -->
          <div class="lg:col-span-1 space-y-6 animate-fade-in-up" style="animation-delay: 500ms; opacity: 0; animation-fill-mode: forwards;">
            <!-- Trailer (YouTube Embed) -->
            <Card v-if="film.link_trailer">
              <CardContent class="p-0">
                <div class="aspect-video bg-black">
                  <iframe 
                    :src="getYoutubeEmbedUrl(film.link_trailer)"
                    class="w-full h-full"
                    frameborder="0"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            <!-- Learning Assets -->
            <ContentSection title="Learning Assets" color="teal">
              <div class="space-y-3">
                <router-link 
                  v-if="film.file_naskah"
                  :to="{ name: 'LearningAsset', params: { filmSlug: film.slug, assetSlug: 'naskah-film' } }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <FileText class="w-5 h-5 text-brand-red" />
                    <div>
                      <span class="font-medium text-sm block">Naskah Film</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400" />
                </router-link>
                <router-link 
                  v-if="film.file_storyboard"
                  :to="{ name: 'LearningAsset', params: { filmSlug: film.slug, assetSlug: 'storyboard' } }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <FileText class="w-5 h-5 text-brand-teal" />
                    <div>
                      <span class="font-medium text-sm block">Storyboard</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400" />
                </router-link>
                <router-link 
                  v-if="film.file_rab"
                  :to="{ name: 'LearningAsset', params: { filmSlug: film.slug, assetSlug: 'rab' } }"
                  class="flex items-center justify-between p-3 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <FileText class="w-5 h-5 text-brand-orange" />
                    <div>
                      <span class="font-medium text-sm block">RAB (Budget)</span>
                      <span class="text-xs text-stone-500">PDF</span>
                    </div>
                  </div>
                  <Eye class="w-4 h-4 text-stone-400" />
                </router-link>
                <p v-if="!film.file_naskah && !film.file_storyboard && !film.file_rab" class="text-sm text-stone-400 text-center py-4">
                  Tidak ada dokumen
                </p>
              </div>
            </ContentSection>

            <!-- Film Info -->
            <Card>
              <CardContent class="p-4">
                <h3 class="font-bold mb-4">Informasi Film</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-stone-500">Kategori</span>
                    <span class="font-medium">{{ film.category?.nama_kategori || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-stone-500">Tahun</span>
                    <span class="font-medium">{{ film.tahun_karya || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-stone-500">Creator</span>
                    <span class="font-medium">{{ film.creator?.name || '-' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-stone-500">Dipublikasi</span>
                    <span class="font-medium">{{ formatDate(film.created_at) }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </template>

    <Footer />
  </div>
</template>
