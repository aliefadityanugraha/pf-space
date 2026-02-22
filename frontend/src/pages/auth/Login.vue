<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthCard from '@/components/AuthCard.vue'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-vue-next'

const router = useRouter()
const { login, loginWithGoogle, loading } = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const error = ref('')

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  error.value = ''
  const result = await login(email.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    // Translate common Better Auth errors
    if (result.message === 'Unauthorized' || result.message?.toLowerCase().includes('invalid credentials')) {
      error.value = 'Email atau kata sandi salah'
    } else {
      error.value = result.message || 'Terjadi kesalahan saat masuk'
    }
  }
}

const handleGoogleLogin = () => {
  loginWithGoogle()
}
</script>

<template>
  <AuthCard>
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error Message -->
      <div v-if="error" class="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Email -->
      <div>
        <label class="block text-white font-body mb-2">Email</label>
        <div class="relative">
          <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input 
            v-model="email"
            type="email"
            placeholder="Masukkan email kamu..."
            class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
          />
        </div>
      </div>

      <!-- Password -->
      <div>
        <label class="block text-white font-body mb-2">Password</label>
        <div class="relative">
          <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input 
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••••••"
            class="pl-12 pr-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
          />
          <button 
            type="button"
            @click="togglePassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300"
          >
            <Eye v-if="!showPassword" class="w-5 h-5" />
            <EyeOff v-else class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Remember & Forgot -->
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            v-model="rememberMe"
            class="w-5 h-5 border-2 border-stone-600 bg-transparent rounded"
          />
          <span class="text-sm text-stone-400 font-body">Tetap masuk di perangkat ini</span>
        </label>
        <router-link to="/auth/forgot" class="text-sm text-amber-500 font-body hover:text-amber-400">
          Lupa kode akses?
        </router-link>
      </div>

      <!-- Submit Button -->
      <Button variant="destructive" class="w-full" size="lg" :disabled="loading">
        <span v-if="loading">Memuat...</span>
        <template v-else>
          Masuk ke Arsip
          <LogIn class="w-5 h-5 ml-2" />
        </template>
      </Button>

      <!-- Google Login -->
      <Button 
        type="button"
        variant="outline" 
        class="w-full bg-stone-900 border-stone-700 text-white hover:bg-stone-800" 
        size="lg"
        @click="handleGoogleLogin"
      >
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Lanjut dengan Google
      </Button>
    </form>

    <template #footer>
      <p class="text-stone-400 font-body mb-3">Belum punya akun?</p>
      <router-link to="/auth/register">
        <Button variant="outline" class="bg-stone-900 border-stone-700 text-white hover:bg-stone-800">
          Daftar Akun
        </Button>
      </router-link>
    </template>
  </AuthCard>
</template>
