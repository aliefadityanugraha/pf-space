<script setup>
import { Film, Home, ArrowLeft, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-12">
    <!-- Film Reel Decoration -->
    <div class="relative mb-8">
      <div class="w-32 h-32 bg-stone-900 border-4 border-stone-900 shadow-brutal-lg flex items-center justify-center">
        <Film class="w-16 h-16 text-brand-cream" />
      </div>
      <!-- Film strip holes -->
      <div class="absolute -left-4 top-0 bottom-0 flex flex-col justify-around">
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
      </div>
      <div class="absolute -right-4 top-0 bottom-0 flex flex-col justify-around">
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
        <div class="w-3 h-3 bg-brand-cream border-2 border-stone-900"></div>
      </div>
    </div>

    <!-- Error Code -->
    <div class="text-center mb-8">
      <h1 class="font-heading text-[120px] md:text-[180px] leading-none text-stone-900 tracking-wider">
        404
      </h1>
      <div class="bg-brand-red border-2 border-stone-900 shadow-brutal px-6 py-2 -mt-4 inline-block">
        <span class="font-body text-white text-sm md:text-base font-bold uppercase tracking-widest">
          Scene Not Found
        </span>
      </div>
    </div>

    <!-- Message -->
    <div class="max-w-lg text-center mb-10">
      <h2 class="font-display text-2xl md:text-3xl text-stone-900 mb-4">
        Looks like this reel got lost in the archive...
      </h2>
      <p class="font-body text-stone-600 text-base md:text-lg">
        The page you're looking for might have been moved, deleted, or perhaps it never existed in our collection. 
        Let's get you back to the main feature.
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-4">
      <router-link to="/">
        <Button class="bg-brand-teal text-white border-2 border-stone-900 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all px-6 py-3 h-auto">
          <Home class="w-5 h-5 mr-2" />
          <span class="font-body font-bold uppercase tracking-wide">Back to Home</span>
        </Button>
      </router-link>
      
      <Button 
        @click="$router.back()" 
        variant="outline"
        class="bg-white text-stone-900 border-2 border-stone-900 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all px-6 py-3 h-auto"
      >
        <ArrowLeft class="w-5 h-5 mr-2" />
        <span class="font-body font-bold uppercase tracking-wide">Go Back</span>
      </Button>
    </div>

    <!-- Fun Quote -->
    <div class="mt-16 max-w-md text-center">
      <div class="bg-brand-orange/30 border-2 border-stone-900 p-4">
        <p class="font-accent text-lg italic text-stone-700">
          "In the world of cinema, every lost frame tells a story. But this one? It's just... gone."
        </p>
        <p class="font-body text-xs text-stone-500 mt-2 uppercase tracking-wide">— The Projectionist</p>
      </div>
    </div>
  </div>
</template>
