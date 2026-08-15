<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

defineProps({
  lightNavbar: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-x-hidden max-w-full">
    <Navbar :light-title="lightNavbar" />

    <main class="flex-1 pt-20 md:pt-28 pb-16 w-full max-w-full overflow-x-hidden">
      <slot></slot>
    </main>

    <Footer />
  </div>
</template>
