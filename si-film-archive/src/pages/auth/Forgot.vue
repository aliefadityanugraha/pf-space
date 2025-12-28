<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Film, Mail, ArrowLeft, Send } from 'lucide-vue-next'

const email = ref('')
const submitted = ref(false)

const handleSubmit = () => {
  if (email.value) {
    submitted.value = true
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3] flex flex-col items-center justify-center px-4 py-12">
    <Card class="w-full max-w-md bg-stone-800 border-stone-700 shadow-2xl overflow-hidden">
      <div class="h-2 bg-brand-red"></div>
      
      <CardContent class="p-8 md:p-12">
        <div class="text-center mb-10">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-brand-red/20 flex items-center justify-center">
              <Film class="w-8 h-8 text-brand-red" />
            </div>
          </div>
          <h1 class="text-3xl font-display font-bold text-white mb-2">CineArchive</h1>
          <p class="text-stone-400 font-body border-t border-stone-700 pt-2 mt-2">
            Reset Access Code
          </p>
        </div>

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

          <Button variant="destructive" class="w-full" size="lg" type="submit">
            Send Reset Link
            <Send class="w-5 h-5 ml-2" />
          </Button>

          <div class="text-center">
            <router-link to="/auth/login" class="text-sm text-amber-500 font-body hover:text-amber-400 inline-flex items-center gap-2">
              <ArrowLeft class="w-4 h-4" />
              Back to Login
            </router-link>
          </div>
        </form>
      </CardContent>
    </Card>

    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © 2025 CineArchive Repository. All rights reserved.
    </p>
  </div>
</template>
