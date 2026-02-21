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
  <div class="min-h-screen flex flex-col bg-brand-cream">
    <Navbar :light-title="lightNavbar" />

    <main class="flex-1 pt-28 pb-16">
      <slot></slot>
    </main>

    <Footer />
  </div>
</template>
