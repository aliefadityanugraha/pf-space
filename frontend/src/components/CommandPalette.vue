  <script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Film, Rss, User, Users, X, Loader2, CornerDownLeft, Sparkles, Clapperboard, ArrowLeft } from 'lucide-vue-next'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const query = ref('')
const loading = ref(false)
const inputRef = ref(null)
const selectedIndex = ref(0)
const activeFilter = ref('all') // 'all' | 'film' | 'post' | 'user'
const hasExplored = ref(false)
const imageErrors = ref({})
const itemRefs = ref([])

const films = ref([])
const posts = ref([])
const users = ref([])

let debounceTimer = null

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const scrollToSelected = () => {
  nextTick(() => {
    const el = itemRefs.value[selectedIndex.value]
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

const allResults = computed(() => {
  const list = []
  
  if (activeFilter.value === 'all' || activeFilter.value === 'film') {
    films.value.forEach((film) => {
      const creatorName = film.creator?.name || 'Kreator'
      list.push({
        id: `film-${film.film_id}`,
        type: 'film',
        title: film.judul,
        categoryName: film.category?.nama_kategori || 'Film',
        year: film.tahun_karya || (film.created_at ? new Date(film.created_at).getFullYear() : null),
        subtitle: creatorName,
        image: film.gambar_poster,
        url: `/archive/${film.slug}`
      })
    })
  }
  
  if (activeFilter.value === 'all' || activeFilter.value === 'post') {
    posts.value.forEach((post) => {
      list.push({
        id: `post-${post.id || post.post_id}`,
        type: 'post',
        title: post.title || post.judul,
        subtitle: post.creator?.name || 'Kreator',
        image: post.cover_image || post.media?.[0]?.url,
        url: `/feed/${post.slug || post.id || post.post_id}`
      })
    })
  }
  
  if (activeFilter.value === 'all' || activeFilter.value === 'user') {
    users.value.forEach((u) => {
      list.push({
        id: `user-${u.id || u.user_id}`,
        type: 'user',
        title: u.name,
        subtitle: u.role_name ? `${u.role_name} • ${u.activity_label || 'User Aktif'}` : (u.bio || 'User Komunitas'),
        image: u.image,
        url: `/p/${u.id || u.user_id}`
      })
    })
  }
  
  return list
})

// Load All content (Films, Feed, and Users simultaneously)
const loadAll = async () => {
  activeFilter.value = 'all'
  hasExplored.value = true
  loading.value = true
  itemRefs.value = []
  try {
    const [resFilms, resPosts, resUsers] = await Promise.allSettled([
      api.get('/api/films', { params: { limit: 20 } }),
      api.get('/api/production-feed', { params: { limit: 20 } }),
      api.get('/api/users/top-curators')
    ])
    
    films.value = resFilms.status === 'fulfilled' ? (resFilms.value.data || []) : []
    posts.value = resPosts.status === 'fulfilled' ? (resPosts.value.data?.items || resPosts.value.data || []) : []
    const payload = resUsers.status === 'fulfilled' ? (resUsers.value.data || resUsers.value) : {}
    users.value = payload.curators || payload || []
  } catch (err) {
    console.error('[CommandPalette] loadAll error:', err)
  } finally {
    loading.value = false
    selectedIndex.value = 0
  }
}

// Load All Films directly
const loadAllFilms = async () => {
  activeFilter.value = 'film'
  hasExplored.value = true
  loading.value = true
  itemRefs.value = []
  posts.value = []
  users.value = []
  try {
    const res = await api.get('/api/films', { params: { limit: 30 } })
    films.value = res.data || []
  } catch (err) {
    console.error('[CommandPalette] loadAllFilms error:', err)
  } finally {
    loading.value = false
    selectedIndex.value = 0
  }
}

// Load All Feed Posts directly
const loadAllFeed = async () => {
  activeFilter.value = 'post'
  hasExplored.value = true
  loading.value = true
  itemRefs.value = []
  films.value = []
  users.value = []
  try {
    const res = await api.get('/api/production-feed', { params: { limit: 30 } })
    posts.value = res.data?.items || res.data || []
  } catch (err) {
    console.error('[CommandPalette] loadAllFeed error:', err)
  } finally {
    loading.value = false
    selectedIndex.value = 0
  }
}

// Load All User Profiles directly
const loadAllProfiles = async () => {
  activeFilter.value = 'user'
  hasExplored.value = true
  loading.value = true
  itemRefs.value = []
  films.value = []
  posts.value = []
  try {
    const res = await api.get('/api/users/top-curators')
    const payload = res.data || res
    users.value = payload.curators || []
  } catch (err) {
    console.error('[CommandPalette] loadAllProfiles error:', err)
  } finally {
    loading.value = false
    selectedIndex.value = 0
  }
}

const searchAll = async () => {
  const q = query.value.trim()
  if (!q) {
    if (activeFilter.value === 'film') return loadAllFilms()
    if (activeFilter.value === 'post') return loadAllFeed()
    if (activeFilter.value === 'user') return loadAllProfiles()
    return loadAll()
  }
  
  hasExplored.value = true
  loading.value = true
  try {
    const [resFilms, resPosts, resUsers] = await Promise.allSettled([
      api.get('/api/films', { params: { search: q, limit: 10 } }),
      api.get('/api/production-feed', { params: { search: q, limit: 10 } }),
      api.get('/api/users/search', { params: { q, limit: 10 } })
    ])
    
    films.value = resFilms.status === 'fulfilled' ? (resFilms.value.data || []) : []
    posts.value = resPosts.status === 'fulfilled' ? (resPosts.value.data?.items || resPosts.value.data || []) : []
    users.value = resUsers.status === 'fulfilled' ? (resUsers.value.data || []) : []
  } catch (err) {
    console.error('[CommandPalette] search error:', err)
  } finally {
    loading.value = false
    selectedIndex.value = 0
  }
}

const onInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchAll()
  }, 200)
}

const resetView = () => {
  query.value = ''
  activeFilter.value = 'all'
  hasExplored.value = false
  films.value = []
  posts.value = []
  users.value = []
  nextTick(() => inputRef.value?.focus())
}

const close = () => {
  isOpen.value = false
  query.value = ''
  activeFilter.value = 'all'
  hasExplored.value = false
  films.value = []
  posts.value = []
  users.value = []
}

const selectItem = (item) => {
  if (!item) return
  router.push(item.url)
  close()
}

const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      nextTick(() => inputRef.value?.focus())
    }
    return
  }
  
  if (!isOpen.value) return
  
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (allResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % allResults.value.length
      scrollToSelected()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (allResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + allResults.value.length) % allResults.value.length
      scrollToSelected()
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (allResults.value.length > 0 && allResults.value[selectedIndex.value]) {
      selectItem(allResults.value[selectedIndex.value])
    }
  }
}

watch(isOpen, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    query.value = ''
    hasExplored.value = false
    films.value = []
    posts.value = []
    users.value = []
    activeFilter.value = 'all'
    selectedIndex.value = 0
    itemRefs.value = []
    nextTick(() => inputRef.value?.focus())
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 select-none overscroll-contain"
        @click.self="close"
        @wheel.stop
      >
        <div 
          class="w-full max-w-2xl bg-white dark:bg-[#1a1816] border-2 border-stone-900 dark:border-stone-700 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[78vh] animate-in fade-in zoom-in-95 duration-150 rounded-none transition-colors overscroll-contain"
        >
          <!-- Full-Width Search Header (Adaptive Dark/Light Theme with Zero Green Tint) -->
          <div class="relative flex items-center w-full bg-stone-50 dark:bg-[#161413] border-b-2 border-stone-300 dark:border-stone-800 px-4 py-1 text-stone-900 dark:text-white transition-colors">
            <Search v-if="!loading" class="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" />
            <Loader2 v-else class="w-5 h-5 text-red-600 dark:text-red-400 animate-spin shrink-0" />
            
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Cari film, postingan feed, atau profil user..."
              class="w-full py-3.5 px-3 bg-transparent text-sm md:text-base font-body text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-none shadow-none"
              style="outline: none !important; border: none !important; box-shadow: none !important;"
              @input="onInput"
            />
            
            <div class="flex items-center gap-2 shrink-0">
              <button 
                v-if="query" 
                @click="query = ''; onInput()"
                class="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                title="Hapus pencarian"
              >
                <X class="w-4 h-4" />
              </button>
              <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
                ESC
              </kbd>
            </div>
          </div>

          <!-- Category Tabs Bar (Visible when search is active or category explored) -->
          <div 
            v-if="hasExplored || query.trim()"
            class="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-[#141211] border-b border-stone-200 dark:border-stone-800 text-xs overflow-x-auto select-none custom-scrollbar shrink-0"
          >
            <span class="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mr-1.5 shrink-0">KATEGORI:</span>
            
            <!-- Button: Semua -->
            <button
              @click="loadAll"
              :class="[
                'px-3.5 py-1.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all rounded-none border cursor-pointer shrink-0',
                activeFilter === 'all' 
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-white shadow-[2px_2px_0px_#000]' 
                  : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:border-stone-400'
              ]"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              <span>Semua</span>
            </button>

            <!-- Button: Film -->
            <button
              @click="loadAllFilms"
              :class="[
                'px-3.5 py-1.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all rounded-none border cursor-pointer shrink-0',
                activeFilter === 'film' 
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-white shadow-[2px_2px_0px_#000]' 
                  : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:border-stone-400'
              ]"
            >
              <Film class="w-3.5 h-3.5 text-red-500" />
              <span>Film</span>
            </button>

            <!-- Button: Feed Produksi -->
            <button
              @click="loadAllFeed"
              :class="[
                'px-3.5 py-1.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all rounded-none border cursor-pointer shrink-0',
                activeFilter === 'post' 
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-white shadow-[2px_2px_0px_#000]' 
                  : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:border-stone-400'
              ]"
            >
              <Rss class="w-3.5 h-3.5 text-amber-500" />
              <span>Feed Produksi</span>
            </button>

            <!-- Button: Profile User -->
            <button
              @click="loadAllProfiles"
              :class="[
                'px-3.5 py-1.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all rounded-none border cursor-pointer shrink-0',
                activeFilter === 'user' 
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-black dark:border-white shadow-[2px_2px_0px_#000]' 
                  : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:border-stone-400'
              ]"
            >
              <Users class="w-3.5 h-3.5 text-emerald-500" />
              <span>Profile User</span>
            </button>
          </div>
          
          <!-- Results Container with Sleek Custom Scrollbar -->
          <div class="overflow-y-auto flex-1 p-3 space-y-1.5 bg-[#faf9f6] dark:bg-[#1c1a18] custom-scrollbar overscroll-contain">
            <!-- Initial Empty Guidance (When user first opens modal) -->
            <div v-if="!query.trim() && !hasExplored" class="py-12 px-4 text-center">
              <div class="w-14 h-14 bg-red-600/10 dark:bg-red-600/20 border-2 border-red-600/40 shadow-[4px_4px_0px_#000] mx-auto mb-4 flex items-center justify-center relative">
                <Clapperboard class="w-7 h-7 text-red-600 dark:text-red-500" />
                <div class="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-amber-400 border border-black flex items-center justify-center shadow-xs">
                  <Sparkles class="w-3 h-3 text-stone-950" />
                </div>
              </div>

              <h3 class="text-base sm:text-lg font-display font-bold text-stone-900 dark:text-white mb-1.5">
                Eksplorasi Arsip Sinema PF Space
              </h3>
              <p class="text-xs sm:text-sm font-body text-stone-600 dark:text-stone-400 max-w-md mx-auto mb-6 leading-relaxed">
                Ketik kata kunci untuk mencari atau klik kategori di bawah untuk melihat seluruh daftar konten.
              </p>
              
              <!-- Category Exploration Quick Buttons Matching Design Screenshot -->
              <div class="flex flex-col items-center justify-center gap-3 max-w-lg mx-auto">
                <div class="flex flex-wrap items-center justify-center gap-3 w-full">
                  <button 
                    @click="loadAllFilms"
                    class="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-[#1f1c1a] border-2 border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white hover:border-red-600 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 transition-all cursor-pointer shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] text-xs font-bold uppercase tracking-wider"
                  >
                    <Film class="w-4 h-4 text-red-600 dark:text-red-500" />
                    <span>SEMUA FILM</span>
                  </button>
                  <button 
                    @click="loadAllFeed"
                    class="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-[#1f1c1a] border-2 border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-all cursor-pointer shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] text-xs font-bold uppercase tracking-wider"
                  >
                    <Rss class="w-4 h-4 text-amber-500" />
                    <span>FEED PRODUKSI</span>
                  </button>
                </div>
                <button 
                  @click="loadAllProfiles"
                  class="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-[#1f1c1a] border-2 border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] text-xs font-bold uppercase tracking-wider"
                >
                  <Users class="w-4 h-4 text-emerald-500" />
                  <span>PROFILE CREATOR</span>
                </button>
              </div>
            </div>
            
            <!-- Loading Spinner State -->
            <div v-else-if="loading && allResults.length === 0" class="p-8 text-center text-stone-400">
              <Loader2 class="w-7 h-7 animate-spin mx-auto mb-2 text-red-600 dark:text-red-400" />
              <p class="text-xs sm:text-sm font-body font-medium text-stone-600 dark:text-stone-300">Memuat data arsip...</p>
            </div>
            
            <!-- Specific Empty State When Category/Search has 0 Items -->
            <div v-else-if="!loading && allResults.length === 0" class="py-10 px-4 text-center">
              <!-- Feed Empty -->
              <template v-if="activeFilter === 'post'">
                <div class="w-12 h-12 bg-amber-500/10 border-2 border-amber-500/30 mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <Rss class="w-6 h-6 text-amber-500" />
                </div>
                <h4 class="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Belum Ada Postingan Feed Produksi
                </h4>
                <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
                  Saat ini belum ada update atau catatan proses produksi film yang dipublikasikan.
                </p>
              </template>

              <!-- Film Empty -->
              <template v-else-if="activeFilter === 'film'">
                <div class="w-12 h-12 bg-red-600/10 border-2 border-red-600/30 mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <Film class="w-6 h-6 text-red-600" />
                </div>
                <h4 class="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Belum Ada Arsip Film
                </h4>
                <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
                  Belum ada karya film yang tersimpan dalam arsip saat ini.
                </p>
              </template>

              <!-- User Empty -->
              <template v-else-if="activeFilter === 'user'">
                <div class="w-12 h-12 bg-stone-500/10 border-2 border-stone-500/30 mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <Users class="w-6 h-6 text-stone-400" />
                </div>
                <h4 class="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Belum Ada Profil User
                </h4>
                <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
                  Data profil user komunitas belum tersedia.
                </p>
              </template>

              <!-- General Search No Results -->
              <template v-else>
                <div class="w-12 h-12 bg-stone-500/10 border-2 border-stone-500/30 mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <Search class="w-6 h-6 text-stone-400" />
                </div>
                <h4 class="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Tidak Ditemukan Hasil
                </h4>
                <p class="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
                  Tidak ditemukan konten yang cocok dengan kata kunci "<span class="font-bold text-stone-800 dark:text-stone-200">{{ query }}</span>".
                </p>
              </template>

              <!-- Back to Home Search Button -->
              <button 
                @click="resetView"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors shadow-xs cursor-pointer"
              >
                <ArrowLeft class="w-3.5 h-3.5" />
                <span>Kembali ke Menu Awal</span>
              </button>
            </div>
            
            <!-- Results List -->
            <template v-else>
              <button
                v-for="(item, index) in allResults"
                :key="item.id"
                :ref="(el) => { if (el) itemRefs[index] = el }"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = index"
                class="w-full flex items-center gap-3.5 p-2.5 text-left border-2 cursor-pointer rounded-none !transition-none select-none"
                :class="[
                  selectedIndex === index
                    ? 'bg-red-500/15 dark:bg-red-500/20 border-red-600/80 shadow-[3px_3px_0px_#000] translate-x-[-1px]'
                    : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                ]"
              >
                <!-- Poster / Thumbnail Container (Film is Vertical Poster, User & Feed are Square) -->
                <div 
                  :class="[
                    'shrink-0 border-2 border-stone-900 dark:border-stone-700 overflow-hidden bg-stone-200 dark:bg-stone-800 flex flex-col items-center justify-center relative shadow-xs !transition-none',
                    item.type === 'film' 
                      ? 'w-12 h-16 sm:w-13 sm:h-18' 
                      : 'w-12 h-12 sm:w-13 sm:h-13'
                  ]"
                >
                  <!-- Loaded Image -->
                  <img 
                    v-if="item.image && !imageErrors[item.id]" 
                    :src="assetUrl(item.image)" 
                    :alt="item.title"
                    @error="imageErrors[item.id] = true"
                    class="w-full h-full object-cover !transition-none" 
                    loading="lazy"
                  />
                  <!-- Fallback: Film Poster Not Available -->
                  <div 
                    v-else-if="item.type === 'film'" 
                    class="w-full h-full bg-stone-200 dark:bg-stone-850 flex flex-col items-center justify-center p-0.5 text-center select-none !transition-none"
                  >
                    <Film class="w-5 h-5 text-stone-500 dark:text-stone-400 mb-0.5" />
                    <span class="text-[7.5px] font-black text-stone-600 dark:text-stone-400 uppercase leading-none tracking-tighter">
                      No Poster
                    </span>
                  </div>
                  <!-- Fallback: Feed Post Image Not Available -->
                  <div 
                    v-else-if="item.type === 'post'" 
                    class="w-full h-full bg-stone-200 dark:bg-stone-850 flex flex-col items-center justify-center p-0.5 text-center select-none !transition-none"
                  >
                    <Rss class="w-5 h-5 text-amber-500 mb-0.5" />
                    <span class="text-[7.5px] font-black text-stone-600 dark:text-stone-400 uppercase leading-none tracking-tighter">
                      Feed
                    </span>
                  </div>
                  <!-- Fallback: User Initial Avatar -->
                  <div 
                    v-else 
                    class="w-full h-full bg-stone-800 flex items-center justify-center text-amber-300 text-sm font-black uppercase !transition-none"
                  >
                    {{ item.title ? item.title.substring(0, 2).toUpperCase() : 'U' }}
                  </div>
                </div>
                
                <!-- Content Info -->
                <div class="flex-1 min-w-0 !transition-none">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-bold text-sm text-stone-900 dark:text-white truncate">
                      {{ item.title }}
                    </h4>
                    
                    <!-- Film Category Badge (Green/Emerald Theme) & Year -->
                    <template v-if="item.type === 'film'">
                      <span 
                        class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                      >
                        {{ item.categoryName || 'Film' }}
                      </span>
                      <span 
                        v-if="item.year" 
                        class="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 shrink-0"
                      >
                        {{ item.year }}
                      </span>
                    </template>

                    <!-- Feed Badge -->
                    <template v-else-if="item.type === 'post'">
                      <span 
                        class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                      >
                        Feed Produksi
                      </span>
                    </template>

                    <!-- User Badge -->
                    <template v-else>
                      <span 
                        class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border shrink-0 bg-stone-500/20 text-stone-700 dark:text-stone-300 border-stone-500/40"
                      >
                        Profile User
                      </span>
                    </template>
                  </div>

                  <!-- Subtitle: Creator / Uploader info -->
                  <p class="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5 font-medium">
                    {{ item.subtitle }}
                  </p>
                </div>
                
                <!-- Enter Hint on hover/active (Synchronized instantly) -->
                <CornerDownLeft 
                  v-if="selectedIndex === index" 
                  class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 !transition-none animate-in fade-in duration-75" 
                />
              </button>
            </template>
          </div>
          
          <!-- Footer Keyboard Shortcuts -->
          <div class="p-2.5 border-t-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#141211] flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-body transition-colors">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">↑</kbd><kbd class="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">↓</kbd> Navigasi</span>
              <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[10px]">↵</kbd> Buka</span>
            </div>
            <span class="font-bold text-[10px] uppercase tracking-wider text-stone-400">PF Space Quick Search</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
