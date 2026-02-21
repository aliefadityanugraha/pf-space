<script setup>
import { computed } from 'vue'
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
})

const emit = defineEmits([
  'update:newComment',
  'submit-comment',
  'delete-comment',
])

const router = useRouter()

const localComment = computed({
  get: () => props.newComment,
  set: (val) => emit('update:newComment', val),
})
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
            :src="film.gambar_poster"
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
    <ContentSection title="Diskusi" color="red">
      <div class="flex items-center gap-2 mb-4">
        <MessageCircle class="w-5 h-5 shrink-0" />
        <span
          class="text-sm text-stone-500 font-bold font-mono tracking-tight uppercase"
          >{{ totalCommentCount }} KOMENTAR</span
        >
      </div>

      <div
        v-if="isLoggedIn"
        class="mb-6 p-3 md:p-4 bg-white border-2 border-slate-900 shadow-brutal relative"
      >
        <!-- Decoration Dots -->
        <div class="absolute top-2 right-2 flex gap-1">
          <div class="w-1.5 h-1.5 bg-stone-200 rounded-full"></div>
          <div class="w-1.5 h-1.5 bg-stone-200 rounded-full"></div>
        </div>

        <div class="flex gap-3 md:gap-4">
          <div
            class="w-9 h-9 md:w-10 md:h-10 bg-brand-orange border-2 border-slate-900 shadow-brutal-xs flex items-center justify-center text-stone-900 font-bold flex-shrink-0 rounded-full overflow-hidden"
          >
            <img v-if="user?.image" :src="user.image" class="w-full h-full object-cover" />
            <span v-else>{{ user?.name?.charAt(0) || 'U' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <textarea
              v-model="localComment"
              rows="2"
              placeholder="Apa pendapatmu tentang karya ini?"
              class="w-full p-2 md:p-3 border-2 border-slate-900 bg-stone-50 text-sm md:text-base resize-none focus:bg-white focus:ring-0 focus:outline-none mb-3 font-body transition-colors"
            ></textarea>
            <div class="flex justify-end">
              <Button
                @click="emit('submit-comment')"
                :disabled="submittingComment || !localComment.trim()"
                class="bg-brand-red hover:bg-brand-red/90 text-white rounded-none border-2 border-slate-900 shadow-brutal-sm md:shadow-brutal hover:shadow-none hover:translate-x-[1px] md:hover:translate-x-[2px] hover:translate-y-[1px] md:hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold uppercase tracking-wider h-9 md:h-10 px-5"
              >
                <Loader2
                  v-if="submittingComment"
                  class="w-4 h-4 mr-2 animate-spin"
                />
                <Send v-else class="w-4 h-4 mr-2" />
                <span class="hidden sm:inline">Kirim Komentar</span>
                <span class="sm:hidden">Kirim</span>
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
            @reply="emit('submit-comment', $event)"
            @delete="emit('delete-comment', $event)"
          />
        </div>
      </div>
    </ContentSection>
  </div>
</template>
