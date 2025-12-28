<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, Eye, EyeOff, Camera, Save, Film } from 'lucide-vue-next'

const user = ref({
  name: 'Anna Wijaya',
  email: 'anna.wijaya@student.edu',
  role: 'Student',
  joinDate: 'October 2024',
  avatar: 'https://placehold.co/120x120'
})

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const stats = ref([
  { label: 'Films Uploaded', value: 3 },
  { label: 'Films Watched', value: 24 },
  { label: 'Collections', value: 5 },
  { label: 'Comments', value: 18 }
])
</script>

<template>
  <div class="min-h-screen bg-brand-cream">
    <Navbar />

    <main class="max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-16">
      <!-- Profile Header -->
      <Card class="mb-8">
        <CardContent class="p-6 md:p-8">
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
            <!-- Avatar -->
            <div class="relative">
              <img 
                :src="user.avatar" 
                :alt="user.name"
                class="w-28 h-28 border-2 border-black shadow-brutal object-cover"
              />
              <button class="absolute bottom-0 right-0 w-8 h-8 bg-brand-teal border-2 border-black flex items-center justify-center hover:bg-brand-teal/80 transition-colors">
                <Camera class="w-4 h-4 text-white" />
              </button>
            </div>

            <!-- Info -->
            <div class="flex-1 text-center md:text-left">
              <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 class="text-3xl font-display font-semibold text-stone-900">{{ user.name }}</h1>
                <Badge variant="secondary">{{ user.role }}</Badge>
              </div>
              <p class="text-stone-500 font-body mb-1">{{ user.email }}</p>
              <p class="text-sm text-stone-400 font-body">Member since {{ user.joinDate }}</p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-4">
              <div v-for="stat in stats" :key="stat.label" class="text-center px-4 py-2 bg-stone-100 border border-stone-200">
                <div class="text-2xl font-display font-bold text-stone-900">{{ stat.value }}</div>
                <div class="text-xs font-body text-stone-500">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Personal Information -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="w-5 h-5 text-brand-teal" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-bold font-body text-stone-700 mb-2">Full Name</label>
              <Input v-model="user.name" placeholder="Enter your name" />
            </div>
            <div>
              <label class="block text-sm font-bold font-body text-stone-700 mb-2">Email Address</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input v-model="user.email" type="email" class="pl-10" placeholder="Enter your email" />
              </div>
            </div>
            <Button class="w-full">
              <Save class="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <!-- Change Password -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Lock class="w-5 h-5 text-brand-teal" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-bold font-body text-stone-700 mb-2">Current Password</label>
              <div class="relative">
                <Input 
                  v-model="currentPassword" 
                  :type="showCurrentPassword ? 'text' : 'password'" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <Eye v-if="!showCurrentPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold font-body text-stone-700 mb-2">New Password</label>
              <div class="relative">
                <Input 
                  v-model="newPassword" 
                  :type="showNewPassword ? 'text' : 'password'" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <Eye v-if="!showNewPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold font-body text-stone-700 mb-2">Confirm New Password</label>
              <div class="relative">
                <Input 
                  v-model="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button variant="secondary" class="w-full">
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Activity -->
      <Card class="mt-6">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Film class="w-5 h-5 text-brand-teal" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center gap-4 p-3 bg-stone-50 border border-stone-200">
              <div class="w-10 h-10 bg-brand-teal/20 flex items-center justify-center">
                <Film class="w-5 h-5 text-brand-teal" />
              </div>
              <div class="flex-1">
                <p class="font-body font-medium text-stone-900">Uploaded "The Silent Echo"</p>
                <p class="text-sm text-stone-500">2 days ago</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 bg-stone-50 border border-stone-200">
              <div class="w-10 h-10 bg-brand-orange/20 flex items-center justify-center">
                <Film class="w-5 h-5 text-brand-orange" />
              </div>
              <div class="flex-1">
                <p class="font-body font-medium text-stone-900">Watched "Metropolis (1927)"</p>
                <p class="text-sm text-stone-500">5 days ago</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 bg-stone-50 border border-stone-200">
              <div class="w-10 h-10 bg-brand-red/20 flex items-center justify-center">
                <Film class="w-5 h-5 text-brand-red" />
              </div>
              <div class="flex-1">
                <p class="font-body font-medium text-stone-900">Added "Citizen Kane" to collection</p>
                <p class="text-sm text-stone-500">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>

    <Footer />
  </div>
</template>
