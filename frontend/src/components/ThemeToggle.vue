<script setup>
import { useDark, useToggle } from '@vueuse/core'
import { Moon, Sun } from 'lucide-vue-next'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button
    @click="toggleDark()"
    class="w-9 h-9 md:w-11 md:h-11 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-900 dark:text-white border-2 border-black dark:border-white shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all cursor-pointer z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
    aria-label="Toggle theme"
    title="Toggle dark mode"
  >
    <Sun v-if="isDark" class="w-4 h-4 md:w-5 md:h-5 text-white" />
    <Moon v-else class="w-4 h-4 md:w-5 md:h-5 text-black" />
  </button>
</template>
