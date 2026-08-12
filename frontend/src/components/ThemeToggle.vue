<script setup>
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';
import { Moon, Sun, Laptop } from 'lucide-vue-next';

const { themeMode, isDark, setTheme, THEME_MODES } = useTheme();

const nextTheme = computed(() => {
  if (themeMode.value === THEME_MODES.LIGHT) return THEME_MODES.DARK;
  if (themeMode.value === THEME_MODES.DARK) return THEME_MODES.SYSTEM;
  return THEME_MODES.LIGHT;
});

const labelText = computed(() => {
  if (themeMode.value === THEME_MODES.LIGHT) return 'Mode Terang (Klik untuk Mode Gelap)';
  if (themeMode.value === THEME_MODES.DARK) return 'Mode Gelap (Klik untuk Mode Sistem)';
  return 'Mode Otomatis Sistem (Klik untuk Mode Terang)';
});

const cycleTheme = () => {
  setTheme(nextTheme.value);
};
</script>

<template>
  <button
    type="button"
    @click="cycleTheme"
    class="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-900 dark:text-white border-2 border-black dark:border-white shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal shrink-0"
    :aria-label="labelText"
    :title="labelText"
  >
    <Sun v-if="themeMode === THEME_MODES.LIGHT" class="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-900" />
    <Moon v-else-if="themeMode === THEME_MODES.DARK" class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
    <Laptop v-else class="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-900 dark:text-white" />
  </button>
</template>
