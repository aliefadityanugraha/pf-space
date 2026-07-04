<script setup>
import { ref } from 'vue'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthCard from '@/components/AuthCard.vue'
import { Mail, ArrowLeft, Send, Loader2 } from 'lucide-vue-next'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Lupa Kata Sandi - PF Space',
  meta: [
    { name: 'description', content: 'Pulihkan kata sandi akun PF Space Anda.' }
  ]
})

const email = ref('')
const submitted = ref(false)
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!email.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Call actual API endpoint
    await api.post('/api/auth/forgot-password', { email: email.value })
    submitted.value = true
  } catch (err) {
    // If 404 or other error, show message
    error.value = err.message || 'Gagal mengirim link reset. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard 
    split
    title="Lupa Kata Sandi?"
    subtitle="Jangan khawatir, masukkan email kamu dan kami akan mengirimkan link untuk mengatur ulang akses."
  >
    <!-- Success State -->
    <div v-if="submitted" class="text-center py-8">
      <div class="w-16 h-16 bg-brand-teal/20 mx-auto mb-6 border-2 border-brand-teal shadow-brutal flex items-center justify-center">
        <Send class="w-8 h-8 text-brand-teal" />
      </div>
      <h2 class="text-xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Periksa Email Kamu</h2>
      <p class="text-stone-400 font-body mb-8 text-sm">
        Kami telah mengirimkan instruksi pemulihan ke:<br />
        <span class="text-white font-bold">{{ email }}</span>
      </p>
      <router-link to="/auth/login">
        <Button class="bg-stone-700 border-2 border-stone-600 text-white hover:bg-stone-600 w-full font-bold uppercase tracking-wider text-xs h-12">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Kembali ke Login
        </Button>
      </router-link>
    </div>

    <!-- Form State -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <div v-if="error" class="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
        {{ error }}
      </div>

      <div>
        <label class="block text-white font-body mb-2 text-sm">Alamat Email</label>
        <div class="relative">
          <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input 
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 h-12"
            required
          />
        </div>
      </div>

      <Button variant="destructive" class="w-full shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all h-12 text-sm font-bold uppercase tracking-wider" type="submit" :disabled="loading">
        <Loader2 v-if="loading" class="w-5 h-5 mr-2 animate-spin" />
        <span v-else>Kirim Link Pemulihan</span>
        <Send v-if="!loading" class="w-5 h-5 ml-2" />
      </Button>
    </form>

    <template #footer>
      <div v-if="!submitted">
        <router-link to="/auth/login" class="text-sm text-amber-500 font-body hover:text-amber-400 inline-flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
          <ArrowLeft class="w-4 h-4" />
          Sudah ingat? Kembali ke Login
        </router-link>
      </div>
    </template>
  </AuthCard>
</template>
