<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText } from 'lucide-vue-next'

const filmTitle = ref('')
const mainVideoLink = ref('')
const trailerLink = ref('')
const posterPhilosophy = ref('')
const characterCount = ref(0)

const updateCharCount = () => {
  characterCount.value = posterPhilosophy.value.length
}

const documents = ref([
  { id: 'naskah', title: 'Naskah', fileType: 'PDF', file: null, disabled: false },
  { id: 'storyboard', title: 'Storyboard', fileType: 'PDF', file: null, disabled: false },
  { id: 'rab', title: 'RAB (Budget)', fileType: 'PDF', file: null, disabled: true }
])
</script>

<template>
  <div class="min-h-screen bg-brand-cream">
    <Navbar />

    <main class="max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-16">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b-2 border-stone-800/30 mb-8">
        <div>
          <h1 class="text-4xl md:text-5xl font-display text-stone-900 mb-2">Upload Your Beautiful Scene</h1>
          <p class="text-lg font-body text-stone-500">Submit your project for archival and teacher review.</p>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="bg-white">Save Draft</Button>
          <Button variant="secondary">Submit for Review</Button>
        </div>
      </div>

      <!-- Film Details Section -->
      <section class="mb-10">
        <h2 class="text-2xl font-display text-stone-900 mb-4 flex items-center gap-3">
          <span class="w-2 h-6 bg-brand-teal"></span>
          Film Details
        </h2>
        <Card>
          <CardContent class="p-6 space-y-6">
            <div>
              <label class="block text-lg font-bold font-body text-stone-900 mb-2">Film Title</label>
              <Input 
                v-model="filmTitle"
                placeholder="Enter the official title of your film"
                class="bg-stone-100"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-lg font-bold font-body text-stone-900 mb-2">Main Video Link (Embed)</label>
                <Input 
                  v-model="mainVideoLink"
                  placeholder="https://..."
                  class="bg-stone-100"
                />
              </div>
              <div>
                <label class="block text-lg font-bold font-body text-stone-900 mb-2">Trailer Link</label>
                <Input 
                  v-model="trailerLink"
                  placeholder="https://..."
                  class="bg-stone-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <!-- Document Uploads Section -->
      <section class="mb-10">
        <h2 class="text-2xl font-display text-stone-900 mb-4 flex items-center gap-3">
          <span class="w-2 h-6 bg-brand-teal"></span>
          Document Uploads
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            v-for="doc in documents" 
            :key="doc.id"
            :class="{ 'opacity-70': doc.disabled }"
          >
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-4">
                <span class="text-lg font-bold font-body" :class="doc.disabled ? 'text-gray-500' : 'text-stone-900'">
                  {{ doc.title }}
                </span>
                <Badge variant="secondary" class="text-xs">{{ doc.fileType }}</Badge>
              </div>
              <div 
                :class="[
                  'h-32 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                  doc.disabled 
                    ? 'bg-gray-50 border-gray-300' 
                    : 'bg-stone-100 border-stone-800/40 hover:border-stone-800'
                ]"
              >
                <Upload v-if="!doc.disabled" class="w-8 h-8 text-stone-400 mb-2" />
                <span 
                  class="text-sm font-bold font-body"
                  :class="doc.disabled ? 'text-gray-400' : 'text-stone-500'"
                >
                  {{ doc.disabled ? 'Upload restricted for this student tier' : 'Click to upload' }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- Visual Assets Section -->
      <section>
        <h2 class="text-2xl font-display text-stone-900 mb-4 flex items-center gap-3">
          <span class="w-2 h-6 bg-brand-teal"></span>
          Visual Assets
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Film Poster Upload -->
          <Card class="h-fit">
            <CardContent class="p-4">
              <label class="block text-lg font-bold font-body text-stone-900 mb-4">Film Poster</label>
              <div class="aspect-[2/3] border-2 border-stone-800 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors">
                <div class="w-16 h-16 rounded-full bg-stone-100 border-2 border-stone-800 shadow-brutal-sm flex items-center justify-center mb-4">
                  <Upload class="w-6 h-6 text-stone-600" />
                </div>
                <span class="text-base font-bold font-body text-stone-900">Upload Poster</span>
                <span class="text-xs font-body text-stone-500 mt-1">PNG, JPG up to 10MB</span>
              </div>
            </CardContent>
          </Card>

          <!-- Poster Philosophy -->
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-lg font-bold font-body text-stone-900">Poster Philosophy</label>
                <span class="text-xs font-bold font-body text-stone-500">{{ characterCount }} / 500 characters</span>
              </div>
              <textarea 
                v-model="posterPhilosophy"
                @input="updateCharCount"
                maxlength="500"
                rows="12"
                placeholder="Explain the artistic choices behind your poster design. What do the colors represent? How does it connect to the film's theme?"
                class="w-full p-4 bg-white border-2 border-black shadow-brutal font-body text-base text-stone-800 placeholder:text-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal"
              ></textarea>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>

    <Footer />
  </div>
</template>
