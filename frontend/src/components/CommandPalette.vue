<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Film, Rss, User, X, Loader2, CornerDownLeft, Sparkles } from 'lucide-vue-next'
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

const films = ref([])
const posts = ref([])
const users = ref([])

let debounceTimer = null

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const allResults = computed(() => {
  const list = []
  
  films.value.forEach((film) => {
    list.push({
      id: `film-${film.film_id}`,
      type: 'film',
      title: film.judul,
      subtitle: film.category?.nama_kategori || 'Film',
      image: film.gambar_poster,
      url: `/archive/${film.slug}`
    })
  })
  
  posts.value.forEach((post) => {
    list.push({
      id: `post-${post.post_id || post.postId}`,
      type: 'post',
      title: post.judul || post.title,
      subtitle: post.creator?.name ? `Oleh ${post.creator.name}` : 'Feed Produksi',
      image: post.cover_image || post.cover,
      url: `/feed/${post.slug}`
    })
  })
  
  users.value.forEach((u) => {
    list.push({
      id: `user-${u.user_id || u.id}`,
      type: 'user',
      title: u.name,
      subtitle: u.bio || (u.role_id === 2 ? 'Official Creator' : 'Member'),
      image: u.image,
      url: `/p/${u.user_id || u.id}`
    })
  })
  
  return list
})

const searchAll = async () => {
  const q = query.value.trim()
  if (!q) {
    films.value = []
    posts.value = []
    users.value = []
    loading.value = false
    return
  }
  
  loading.value = true
  try {
    const [resFilms, resPosts, resUsers] = await Promise.allSettled([
      api.get('/api/films', { params: { search: q, limit: 5 } }),
      api.get('/api/feed/posts', { params: { search: q, limit: 5 } }),
      api.get('/api/users', { params: { search: q, limit: 5 } })
    ])
    
    films.value = resFilms.status === 'fulfilled' ? (resFilms.value.data || []) : []
    posts.value = resPosts.status === 'fulfilled' ? (resPosts.value.data || resPosts.value.posts || []) : []
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
  }, 250)
}

const close = () => {
  isOpen.value = false
  query.value = ''
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
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (allResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + allResults.value.length) % allResults.value.length
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
    nextTick(() => inputRef.value?.focus())
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
        class="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-12 md:pt-20 px-4"
        @click.self="close"
      >
        <div 
          class="w-full max-w-2xl bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-100 shadow-brutal overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Search Header -->
          <div class="relative flex items-center border-b-2 border-black dark:border-stone-800 px-4 bg-stone-50 dark:bg-stone-800/80">
            <Search v-if="!loading" class="w-5 h-5 text-stone-400 shrink-0" />
            <Loader2 v-else class="w-5 h-5 text-brand-teal animate-spin shrink-0" />
            
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Cari film, postingan feed, atau profil kreator..."
              class="w-full py-3.5 px-3 bg-transparent text-sm md:text-base font-body text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
              @input="onInput"
            />
            
            <div class="flex items-center gap-2 shrink-0">
              <button 
                v-if="query" 
                @click="query = ''; onInput()"
                class="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors rounded"
                title="Hapus pencarian"
              >
                <X class="w-4 h-4" />
              </button>
              <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-600">
                ESC
              </kbd>
            </div>
          </div>
          
          <!-- Results Container -->
          <div class="overflow-y-auto flex-1 p-2 space-y-1">
            <!-- Empty query guidance -->
            <div v-if="!query.trim()" class="p-6 text-center text-stone-400 dark:text-stone-500">
              <Sparkles class="w-8 h-8 mx-auto mb-2 text-brand-orange opacity-80" />
              <p class="text-sm font-body">Ketik kata kunci untuk mencari di seluruh arsip PF Space.</p>
              <div class="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
                <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300">🎬 Film</span>
                <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300">📝 Feed Produksi</span>
                <span class="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300">👤 Profile Creator</span>
              </div>
            </div>
            
            <!-- Searching spinner -->
            <div v-else-if="loading && allResults.length === 0" class="p-8 text-center text-stone-400">
              <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2 text-brand-teal" />
              <p class="text-sm font-body">Mencari arsip...</p>
            </div>
            
            <!-- No results state -->
            <div v-else-if="!loading && allResults.length === 0" class="p-8 text-center text-stone-400 dark:text-stone-500">
              <Search class="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p class="text-sm font-body">Tidak ditemukan hasil untuk "{{ query }}"</p>
            </div>
            
            <!-- Results list -->
            <template v-else>
              <button
                v-for="(item, index) in allResults"
                :key="item.id"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = index"
                class="w-full flex items-center gap-3 p-2.5 text-left border-2 transition-all cursor-pointer"
                :class="[
                  selectedIndex === index
                    ? 'bg-brand-teal/10 dark:bg-brand-teal/20 border-brand-teal shadow-brutal-xs translate-x-[-1px]'
                    : 'bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60'
                ]"
              >
                <!-- Thumbnail / Icon -->
                <div class="w-10 h-10 shrink-0 border-2 border-black dark:border-stone-100 overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                  <img 
                    v-if="item.image" 
                    :src="assetUrl(item.image)" 
                    :alt="item.title"
                    class="w-full h-full object-cover" 
                  />
                  <Film v-else-if="item.type === 'film'" class="w-5 h-5 text-stone-500" />
                  <Rss v-else-if="item.type === 'post'" class="w-5 h-5 text-brand-teal" />
                  <User v-else class="w-5 h-5 text-brand-orange" />
                </div>
                
                <!-- Content info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {{ item.title }}
                    </h4>
                    <!-- Badge Type -->
                    <span 
                      class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-black dark:border-stone-200 shrink-0"
                      :class="[
                        item.type === 'film' ? 'bg-brand-orange text-stone-900' :
                        item.type === 'post' ? 'bg-brand-teal text-white' :
                        'bg-yellow-400 text-stone-900'
                      ]"
                    >
                      {{ item.type === 'film' ? 'Film' : item.type === 'post' ? 'Feed' : 'Kreator' }}
                    </span>
                  </div>
                  <p class="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {{ item.subtitle }}
                  </p>
                </div>
                
                <!-- Enter Hint on hover/active -->
                <CornerDownLeft 
                  v-if="selectedIndex === index" 
                  class="w-4 h-4 text-brand-teal shrink-0" 
                />
              </button>
            </template>
          </div>
          
          <!-- Footer keyboard shortcuts -->
          <div class="p-2.5 border-t-2 border-black dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-body">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1"><kbd class="px-1 bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 font-mono">↑</kbd><kbd class="px-1 bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 font-mono">↓</kbd> Navigasi</span>
              <span class="flex items-center gap-1"><kbd class="px-1 bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 font-mono">↵</kbd> Pilih</span>
            </div>
            <span>PF Space Quick Search</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
