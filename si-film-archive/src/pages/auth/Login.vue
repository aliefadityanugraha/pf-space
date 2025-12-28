<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Film, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="min-h-screen bg-[#F2EEE3] flex flex-col items-center justify-center px-4 py-12">
    <!-- Auth Card -->
    <Card class="w-full max-w-md bg-stone-800 border-stone-700 shadow-2xl overflow-hidden">
      <!-- Red accent bar -->
      <div class="h-2 bg-brand-red"></div>
      
      <CardContent class="p-8 md:p-12">
        <!-- Logo & Header -->
        <div class="text-center mb-10">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-brand-red/20 flex items-center justify-center">
              <Film class="w-8 h-8 text-brand-red" />
            </div>
          </div>
          <h1 class="text-3xl font-display font-bold text-white mb-2">CineArchive</h1>
          <p class="text-stone-400 font-body border-t border-stone-700 pt-2 mt-2">
            Educational Film Repository
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent class="space-y-6">
          <!-- Email -->
          <div>
            <label class="block text-white font-body mb-2">Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input 
                v-model="email"
                type="email"
                placeholder="Enter your ID..."
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
              <span class="text-sm text-stone-400 font-body">Keep me signed in</span>
            </label>
            <router-link to="/auth/forgot" class="text-sm text-amber-500 font-body hover:text-amber-400">
              Lost access code?
            </router-link>
          </div>

          <!-- Submit Button -->
          <Button variant="destructive" class="w-full" size="lg">
            Enter Archive
            <LogIn class="w-5 h-5 ml-2" />
          </Button>
        </form>

        <!-- Register Link -->
        <div class="mt-8 pt-6 border-t border-stone-700 text-center">
          <p class="text-stone-400 font-body mb-3">New to the repository?</p>
          <router-link to="/auth/register">
            <Button variant="outline" class="bg-stone-900 border-stone-700 text-white hover:bg-stone-800">
              Request Access
            </Button>
          </router-link>
        </div>
      </CardContent>
    </Card>

    <!-- Footer -->
    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © 2025 CineArchive Repository. All rights reserved.
    </p>
  </div>
</template>
