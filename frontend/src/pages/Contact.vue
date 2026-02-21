<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-vue-next'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const loading = ref(false)
const { toast, showToast } = useToast()

const submitForm = async () => {
  loading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  console.log('Form submitted:', form.value)
  showToast('success', 'Pesan Anda telah terkirim!')
  
  form.value = { name: '', email: '', subject: '', message: '' }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F2EEE3]">
    <Navbar />

    <main class="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-25">
      <SectionHeader 
        title="Hubungi Kami" 
        subtitle="Punya pertanyaan atau saran? Kami siap mendengar."
        :light-text="false"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <!-- Contact Info -->
        <div class="lg:col-span-1 space-y-6">
          <Card class="bg-stone-900 text-white border-2 border-black shadow-brutal">
            <CardContent class="p-6 md:p-8 space-y-8">
              <div>
                <h3 class="text-xl font-display font-bold mb-4 text-brand-red">Informasi Kontak</h3>
                <p class="text-stone-300 leading-relaxed">
                  Hubungi kami untuk kerjasama, pertanyaan seputar arsip, atau bantuan teknis.
                </p>
              </div>

              <div class="space-y-6">
                <div class="flex items-start gap-4">
                  <div class="p-3 bg-white/10 rounded-lg">
                    <Mail class="w-6 h-6 text-brand-yellow" />
                  </div>
                  <div>
                    <h4 class="font-bold mb-1">Email</h4>
                    <p class="text-stone-300 text-sm">hello@pfspace.id</p>
                    <p class="text-stone-300 text-sm">support@pfspace.id</p>
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div class="p-3 bg-white/10 rounded-lg">
                    <MapPin class="w-6 h-6 text-brand-teal" />
                  </div>
                  <div>
                    <h4 class="font-bold mb-1">Lokasi</h4>
                    <p class="text-stone-300 text-sm">
                      Gedung Film, Lt. 3<br>
                      Jl. Sinema Raya No. 123<br>
                      Jakarta Selatan, 12345
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-4">
                  <div class="p-3 bg-white/10 rounded-lg">
                    <Phone class="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h4 class="font-bold mb-1">Telepon</h4>
                    <p class="text-stone-300 text-sm">+62 21 5555 0123</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Contact Form -->
        <div class="lg:col-span-2">
          <Card class="bg-white border-2 border-black shadow-brutal h-full">
            <CardContent class="p-6 md:p-8">
              <h3 class="text-2xl font-display font-bold mb-6 text-stone-900">Kirim Pesan</h3>
              
              <form @submit.prevent="submitForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-sm font-bold text-stone-700">Nama Lengkap</label>
                    <Input v-model="form.name" placeholder="Nama Anda" required class="bg-stone-50" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-bold text-stone-700">Email</label>
                    <Input v-model="form.email" type="email" placeholder="email@contoh.com" required class="bg-stone-50" />
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-bold text-stone-700">Subjek</label>
                  <Input v-model="form.subject" placeholder="Perihal pesan Anda" required class="bg-stone-50" />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-bold text-stone-700">Pesan</label>
                  <textarea 
                    v-model="form.message" 
                    rows="6"
                    class="w-full p-3 bg-stone-50 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    placeholder="Tulis pesan Anda di sini..."
                    required
                  ></textarea>
                </div>

                <div class="flex justify-end">
                  <Button type="submit" size="lg" class="w-full md:w-auto gap-2" :disabled="loading">
                    <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
                    <Send v-else class="w-5 h-5" />
                    Kirim Pesan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>

    <Footer />
    <Toast v-bind="toast" @close="toast.show = false" />
  </div>
</template>
