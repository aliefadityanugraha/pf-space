<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthCard from '@/components/AuthCard.vue'
import { Lock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const token = route.query.token

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleSubmit = async () => {
  if (!password.value || !confirmPassword.value) return
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Password tidak sama'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await api.post('/api/auth/reset-password', {
      token,
      password: password.value
    })
    success.value = true
    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Gagal mereset password. Token mungkin sudah kadaluarsa.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3] flex flex-col items-center justify-center px-4 py-12">
    <AuthCard 
      title="Reset Password" 
      subtitle="Buat password baru anda"
    >
      <div v-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle class="w-8 h-8 text-green-500" />
        </div>
        <h2 class="text-xl font-display text-white mb-2">Password Berhasil Direset</h2>
        <p class="text-stone-400 font-body mb-6">
          Anda akan dialihkan ke halaman login dalam beberapa detik...
        </p>
        <router-link to="/auth/login">
          <Button variant="outline" class="bg-stone-900 border-stone-700 text-white hover:bg-stone-800">
            Login Sekarang
          </Button>
        </router-link>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <label class="block text-white font-body mb-2">Password Baru</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input 
              v-model="password"
              type="password"
              placeholder="Minimal 8 karakter"
              class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              required
              minlength="8"
            />
          </div>
        </div>

        <div>
          <label class="block text-white font-body mb-2">Konfirmasi Password</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input 
              v-model="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
              class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              required
            />
          </div>
        </div>

        <Button variant="destructive" class="w-full" size="lg" type="submit" :disabled="loading">
          <Loader2 v-if="loading" class="w-5 h-5 mr-2 animate-spin" />
          <span v-else>Reset Password</span>
        </Button>
      </form>

      <template #footer>
        <div v-if="!success">
          <router-link to="/auth/login" class="text-sm text-amber-500 font-body hover:text-amber-400 inline-flex items-center gap-2">
            <ArrowLeft class="w-4 h-4" />
            Kembali ke Login
          </router-link>
        </div>
      </template>
    </AuthCard>

    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © {{ new Date().getFullYear() }} PF Space Repository. All rights reserved.
    </p>
  </div>
</template>
