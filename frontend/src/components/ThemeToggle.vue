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
    class="w-11 h-11 md:w-11 md:h-11 bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-100 shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-brutal-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal shrink-0"
    :aria-label="labelText"
    :title="labelText"
  >
    <Sun v-if="themeMode === THEME_MODES.LIGHT" class="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-400 stroke-[2.5]" />
    <Moon v-else-if="themeMode === THEME_MODES.DARK" class="w-4 h-4 md:w-5 md:h-5 text-amber-300 fill-amber-300 stroke-[2.5]" />
    <Laptop v-else class="w-4 h-4 md:w-5 md:h-5 text-stone-900 dark:text-amber-300 stroke-[2.5]" />
  </button>
</template>
