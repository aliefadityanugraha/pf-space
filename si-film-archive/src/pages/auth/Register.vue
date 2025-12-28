<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Film, Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-vue-next'

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
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
            Request Repository Access
          </p>
        </div>

        <form @submit.prevent class="space-y-5">
          <div>
            <label class="block text-white font-body mb-2">Full Name</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input v-model="fullName" type="text" placeholder="Enter your full name..."
                class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500" />
            </div>
          </div>

          <div>
            <label class="block text-white font-body mb-2">Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input v-model="email" type="email" placeholder="Enter your email..."
                class="pl-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500" />
            </div>
          </div>

          <div>
            <label class="block text-white font-body mb-2">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Create a password..."
                class="pl-12 pr-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-white font-body mb-2">Confirm Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" 
                placeholder="Confirm your password..."
                class="pl-12 pr-12 bg-stone-800 border-stone-700 text-white placeholder:text-stone-500" />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300">
                <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" v-model="agreeTerms"
              class="w-5 h-5 mt-0.5 border-2 border-stone-600 bg-transparent rounded" />
            <span class="text-sm text-stone-400 font-body">
              I agree to the <a href="#" class="text-amber-500 hover:text-amber-400">Terms</a> 
              and <a href="#" class="text-amber-500 hover:text-amber-400">Privacy Policy</a>
            </span>
          </label>

          <Button variant="destructive" class="w-full" size="lg">
            Request Access
            <UserPlus class="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div class="mt-8 pt-6 border-t border-stone-700 text-center">
          <p class="text-stone-400 font-body mb-3">Already have access?</p>
          <router-link to="/auth/login">
            <Button variant="outline" class="bg-stone-900 border-stone-700 text-white hover:bg-stone-800">
              Enter Archive
            </Button>
          </router-link>
        </div>
      </CardContent>
    </Card>

    <p class="mt-8 text-xs text-stone-600 font-body uppercase tracking-wide">
      © 2025 CineArchive Repository. All rights reserved.
    </p>
  </div>
</template>
