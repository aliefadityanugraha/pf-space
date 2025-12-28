<script setup>
import { Play, Heart, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <section class="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img 
        src="/banner.jpg" 
        alt="Featured film background"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#F2EEE3] via-transparent to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-40">
      <!-- AI Summary Badge -->
      <Badge variant="outline" class="bg-white/90 text-slate-900 mb-6">
        <Sparkles class="w-4 h-4 mr-2" />
        AI Summary
      </Badge>

      <!-- Title -->
      <h1 class="text-4xl md:text-6xl lg:text-7xl font-heading text-stone-200 mb-6 max-w-4xl drop-shadow-lg tracking-wide">
        The Battleship Potemkin
      </h1>

      <!-- Quote Card -->
      <div class="max-w-2xl bg-stone-200/90 shadow-lg border-l-4 border-brand-red backdrop-blur-sm p-6 mb-8">
        <p class="text-lg md:text-xl font-accent italic text-slate-800 leading-relaxed">
          "A seminal work in montage editing technique featuring revolutionary cinematic language. Experience the 1925 silent masterpiece that defined a genre."
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4">
        <Button variant="destructive" size="lg">
          <Play class="w-5 h-5 mr-2 fill-white" />
          Watch Now
        </Button>
        <Button variant="outline" size="lg" class="bg-black/40 text-white border-white/50 hover:bg-black/60">
          <Heart class="w-5 h-5 mr-2" />
          Vote
        </Button>
      </div>
    </div>
  </section>
</template>
