<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ContentSection from '@/components/ContentSection.vue'
import CommentItem from '@/components/CommentItem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Film,
  User,
  MessageCircle,
  Loader2,
  Send,
} from 'lucide-vue-next'
import { assetUrl } from '@/lib/format'

const props = defineProps({
  film: { type: Object, required: true },
  parsedSections: { type: Array, default: () => [] },
  comments: { type: Array, default: () => [] },
  loadingComments: { type: Boolean, default: false },
  newComment: { type: String, default: '' },
  submittingComment: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  user: { type: Object, default: null },
  canModerate: { type: Boolean, default: false },
  totalCommentCount: { type: Number, default: 0 },
  deletingCommentIds: { type: Object, default: () => new Set() },
})

const emit = defineEmits([
  'update:newComment',
  'submit-comment',
  'delete-comment',
  'report-content'
])

const router = useRouter()

const localComment = computed({
  get: () => props.newComment,
  set: (val) => emit('update:newComment', val),
})

const imageError = ref(false)
</script>

<template>
  <div
    class="lg:col-span-2 space-y-8 animate-fade-in-up"
    style="animation-delay: 200ms; opacity: 0; animation-fill-mode: forwards"
  >
    <!-- Poster + Synopsis Card -->
    <div class="flex flex-col sm:flex-row gap-6">
      <!-- Poster -->
      <div class="w-full max-w-[180px] mx-auto sm:mx-0 shrink-0">
        <div
          class="aspect-[3/4] bg-stone-800 border-2 border-slate-900 overflow-hidden shadow-brutal-sm"
        >
          <img
            v-if="film.gambar_poster"
            :src="assetUrl(film.gambar_poster)"
            :alt="film.judul"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
          >
            <Film class="w-12 h-12 text-stone-600" />
          </div>
        </div>
      </div>
      <!-- Details -->
      <div class="flex-1 min-w-0">
        <h2
          class="text-xl md:text-3xl font-display font-bold text-stone-900 mb-2 md:mb-3 break-words"
        >
          {{ film.judul }}
        </h2>
        <div
          class="flex flex-wrap items-center gap-2 text-sm font-body text-stone-600 mb-4"
        >
          <User class="w-4 h-4 shrink-0" />
          <router-link
            v-if="film.creator?.id"
            :to="`/creator/${film.creator.id}`"
            class="hover:text-brand-red hover:underline font-medium truncate"
          >
            {{ film.creator?.name || 'Tidak diketahui' }}
          </router-link>
          <span v-else class="truncate">{{
            film.creator?.name || 'Tidak diketahui'
          }}</span>
          <Badge variant="default" class="bg-stone-800 shrink-0">
            {{ film.tahun_karya || '-' }}
          </Badge>
          <Badge
            v-if="film.category"
            variant="outline"
            class="bg-white shrink-0"
          >
            {{ film.category.nama_kategori }}
          </Badge>
        </div>
        <h3 class="font-display font-semibold text-stone-900 text-lg mb-2">Sinopsis</h3>
        <p class="text-sm md:text-base text-stone-600 break-words leading-normal md:leading-relaxed">
          {{ film.sinopsis || 'Tidak ada sinopsis.' }}
        </p>
      </div>
    </div>

    <!-- Dynamic Sections from deskripsi_lengkap -->
    <template v-if="film.deskripsi_lengkap">
      <ContentSection
        v-for="(section, idx) in parsedSections"
        :key="idx"
        :title="section.title"
        color="red"
      >
        <div
          class="prose prose-sm max-w-none font-body"
          v-html="section.content"
        ></div>
      </ContentSection>
    </template>

    <!-- Cast & Crew -->
    <ContentSection title="Kru & Pemeran" color="red">
      <div
        v-if="film.crew && film.crew.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div
          v-for="(item, idx) in film.crew"
          :key="idx"
          class="p-3 bg-stone-100 rounded"
        >
          <p class="font-bold text-sm text-stone-900">
            {{ item.jabatan }}
          </p>
          <p class="text-sm text-stone-600">
            {{ item.anggota?.join(', ') }}
          </p>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-3 bg-stone-100 rounded">
          <p class="font-bold text-sm text-stone-900">Sutradara</p>
          <p class="text-sm text-stone-600">
            {{ film.creator?.name || 'Tidak diketahui' }}
          </p>
        </div>
        <div class="p-3 bg-stone-100 rounded">
          <p class="font-bold text-sm text-stone-900">Produser</p>
          <p class="text-sm text-stone-600">
            {{ film.creator?.name || 'Tidak diketahui' }}
          </p>
        </div>
        <div class="p-3 bg-stone-100 rounded">
          <p class="font-bold text-sm text-stone-900">Penata Sinematografi</p>
          <p class="text-sm text-stone-600">-</p>
        </div>
        <div class="p-3 bg-stone-100 rounded">
          <p class="font-bold text-sm text-stone-900">Penyunting</p>
          <p class="text-sm text-stone-600">-</p>
        </div>
      </div>
    </ContentSection>

    <!-- Comments Section -->
    <ContentSection :title="`Ruang Diskusi (${totalCommentCount} Komentar)`" color="red">
      
      <div
        v-if="isLoggedIn"
        class="mb-6 md:mb-10 p-3 md:p-6 bg-white border-2 md:border-4 border-black shadow-[4px_4px_0_0_#000] md:shadow-brutal relative group"
      >
        <!-- Background Accent -->
        <div class="absolute -z-10 inset-0 bg-stone-50 translate-x-1 translate-y-1 md:translate-x-2 md:translate-y-2 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform"></div>

        <div class="flex gap-3 md:gap-6">
          <div
            class="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-brand-orange border-2 border-black shadow-brutal-xs items-center justify-center text-stone-900 font-bold flex-shrink-0 rounded-full overflow-hidden"
          >
            <img v-if="user?.image && !imageError" :src="assetUrl(user.image)" referrerpolicy="no-referrer" class="w-full h-full object-cover" @error="imageError = true" />
            <span v-else class="text-xs md:text-base">{{ user?.name?.charAt(0) || 'U' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="relative">
              <textarea
                v-model="localComment"
                rows="3"
                placeholder="Apa pendapatmu?..."
                class="w-full p-3 md:p-4 border-2 border-black bg-white text-stone-900 text-sm md:text-base resize-none focus:ring-0 focus:outline-none mb-3 md:mb-4 font-body transition-all placeholder:text-stone-400"
              ></textarea>
              <!-- Indicator -->
              <div class="absolute bottom-5 right-3 md:bottom-6 md:right-4 text-[8px] md:text-[10px] font-black text-stone-300 uppercase tracking-tighter pointer-events-none hidden sm:block">
                SHIFT + ENTER: BARIS BARU
              </div>
            </div>
            
            <div class="flex justify-end">
              <Button
                @click="emit('submit-comment')"
                :disabled="submittingComment || !localComment.trim()"
                class="bg-brand-red hover:bg-brand-red/90 text-white rounded-none border-2 border-black shadow-[3px_3px_0_0_#000] md:shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-display font-black uppercase tracking-wider text-xs md:text-sm h-10 px-5 md:h-12 md:px-8 flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto"
              >
                <Loader2 v-if="submittingComment" class="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <Send v-else class="w-4 h-4 md:w-5 md:h-5" />
                Kirim Komentar
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="mb-8 p-4 md:p-6 bg-stone-100 border-2 border-dashed border-stone-400 text-center"
      >
        <p class="text-stone-600 mb-4 font-body text-sm md:text-base">
          Bergabung dalam diskusi untuk memberikan apresiasi atau masukan.
        </p>
        <Button
          variant="outline"
          class="border-2 border-stone-800 shadow-brutal-xs text-sm"
          @click="router.push('/auth/login')"
          >Login Untuk Berkomentar</Button
        >
      </div>

      <!-- Comments List -->
      <div class="space-y-6">
        <div v-if="loadingComments" class="text-center py-8">
          <Loader2
            class="w-8 h-8 animate-spin mx-auto text-stone-400"
          />
        </div>
        <div
          v-else-if="comments.length === 0"
          class="text-center py-8 bg-stone-100 rounded border-2 border-stone-200 border-dashed"
        >
          <MessageCircle
            class="w-12 h-12 text-stone-300 mx-auto mb-2"
          />
          <p class="text-stone-500 font-body text-sm md:text-base">
            Belum ada diskusi. Jadilah yang pertama berkomentar!
          </p>
        </div>
        <div v-else class="space-y-6">
          <CommentItem
            v-for="comment in comments"
            :key="comment.diskusi_id"
            :comment="comment"
            :is-logged-in="isLoggedIn"
            :current-user="user"
            :can-moderate="canModerate"
            :deleting-comment-ids="deletingCommentIds"
            :film-owner-id="film.user_id"
            @reply="emit('submit-comment', $event)"
            @delete="emit('delete-comment', $event)"
            @report="emit('report-content', $event)"
          />
        </div>
      </div>
    </ContentSection>
  </div>
</template>
