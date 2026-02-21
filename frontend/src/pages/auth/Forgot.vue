<script setup>
import { ref } from 'vue'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthCard from '@/components/AuthCard.vue'
import { Mail, ArrowLeft, Send, Loader2 } from 'lucide-vue-next'

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
  <div class="min-h-screen bg-[#F2EEE3] flex flex-col items-center justify-center px-4 py-12">
    <AuthCard 
      title="PF Space" 
      subtitle="Reset Access Code"
    >
      <!-- Success State -->
      <div v-if="submitted" class="text-center py-8">
        <div class="w-16 h-16 bg-brand-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send class="w-8 h-8 text-brand-teal" />
        </div>
        <h2 class="text-xl font-display text-white mb-2">Check Your Email</h2>
        <p class="text-stone-400 font-body mb-6">
          We've sent a password reset link to<br />
          <span class="text-white">{{ email }}</span>
        </p>
        <router-link to="/auth/login">
          <Button variant="outline" class="bg-stone-900 border-stone-700 text-white hover:bg-stone-800">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </router-link>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <p class="text-stone-400 font-body text-center mb-6">
          Enter your email address and we'll send you a link to reset your access code.
        </p>

        <div>
          <label class="block text-white font-body mb-2">Email</label>
          <div class="relative">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input 
              v-model="email"
              type="email"
              placeholder="Enter your email..."
              class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
              required
            />
          </div>
        </div>

        <Button variant="destructive" class="w-full" size="lg" type="submit" :disabled="loading">
          <Loader2 v-if="loading" class="w-5 h-5 mr-2 animate-spin" />
          <span v-else>Send Reset Link</span>
          <Send v-if="!loading" class="w-5 h-5 ml-2" />
        </Button>
      </form>

      <template #footer>
        <div v-if="!submitted">
          <router-link to="/auth/login" class="text-sm text-amber-500 font-body hover:text-amber-400 inline-flex items-center gap-2">
            <ArrowLeft class="w-4 h-4" />
            Back to Login
          </router-link>
        </div>
      </template>
    </AuthCard>

    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © 2025 PF Space Repository. All rights reserved.
    </p>
  </div>
</template>
